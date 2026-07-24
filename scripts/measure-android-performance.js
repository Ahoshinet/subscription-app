#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_PACKAGE = 'com.darui3018823.subscriptionapp';
const DEFAULT_ACTIVITY = '.MainActivity';
const DEFAULT_SAMPLES = 5;

function usage() {
  console.log(`Usage:
  pnpm perf:android -- --label <baseline|candidate> [options]

Options:
  --package <id>       Android package (default: ${DEFAULT_PACKAGE})
  --activity <name>    Launch activity (default: ${DEFAULT_ACTIVITY})
  --samples <count>    Cold/warm samples, minimum 5 (default: ${DEFAULT_SAMPLES})
  --output <path>      Also write the JSON result to this path
  --allow-emulator     Permit an emulator (does not satisfy the v1 device gate)
  --help               Show this help

The device must already have a release build installed, a valid signed-in
session, and the seeded test account. This script records Android activity
launch timing and dashboard PSS proxies; it does not replace screen-recorded
"dashboard usable" timings or profiler peak-memory measurements.`);
}

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const options = {
    packageId: DEFAULT_PACKAGE,
    activity: DEFAULT_ACTIVITY,
    samples: DEFAULT_SAMPLES,
    allowEmulator: false,
    label: '',
    output: '',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help') {
      usage();
      process.exit(0);
    }
    if (argument === '--allow-emulator') {
      options.allowEmulator = true;
      continue;
    }

    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      fail(`${argument} requires a value`);
    }
    index += 1;
    switch (argument) {
      case '--package':
        options.packageId = value;
        break;
      case '--activity':
        options.activity = value;
        break;
      case '--samples':
        options.samples = Number(value);
        break;
      case '--label':
        options.label = value;
        break;
      case '--output':
        options.output = value;
        break;
      default:
        fail(`unknown option ${argument}`);
    }
  }

  if (!options.label) fail('--label is required');
  if (!Number.isInteger(options.samples) || options.samples < 5) {
    fail('--samples must be an integer of at least 5');
  }
  return options;
}

function run(command, args, { allowFailure = false } = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.error) {
    fail(`${command} could not be started: ${result.error.message}`);
  }
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
  if (!allowFailure && result.status !== 0) {
    fail(`${command} ${args.join(' ')} failed\n${output}`);
  }
  return output;
}

function runAdb(serial, args, options) {
  return run('adb', ['-s', serial, ...args], options);
}

function wait(milliseconds) {
  Atomics.wait(
    new Int32Array(new SharedArrayBuffer(4)),
    0,
    0,
    milliseconds,
  );
}

function connectedDevice(allowEmulator) {
  const output = run('adb', ['devices', '-l']);
  const devices = output
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const fields = line.split(/\s+/);
      return { serial: fields[0], state: fields[1], description: line };
    })
    .filter(({ state }) => state === 'device');

  if (devices.length !== 1) {
    fail(`expected exactly one authorized device, found ${devices.length}`);
  }

  const device = devices[0];
  const isEmulator = device.serial.startsWith('emulator-')
    || /\bmodel:sdk_/i.test(device.description)
    || /\bproduct:sdk_/i.test(device.description);
  if (isEmulator && !allowEmulator) {
    fail('an emulator is connected; pass --allow-emulator only for dry runs');
  }
  return { ...device, isEmulator };
}

function property(serial, name) {
  return runAdb(serial, ['shell', 'getprop', name]).trim();
}

function parseLaunch(output) {
  const metric = (name) => {
    const match = output.match(new RegExp(`${name}:\\s*(\\d+)`));
    return match ? Number(match[1]) : null;
  };
  const totalTimeMs = metric('TotalTime');
  if (totalTimeMs === null) {
    fail(`adb did not report TotalTime\n${output}`);
  }
  return {
    totalTimeMs,
    waitTimeMs: metric('WaitTime'),
    launchState: output.match(/LaunchState:\s*(\S+)/)?.[1] ?? null,
  };
}

function launch(serial, component, cold) {
  if (cold) {
    runAdb(serial, ['shell', 'am', 'force-stop', component.split('/')[0]]);
  } else {
    runAdb(serial, ['shell', 'input', 'keyevent', 'KEYCODE_HOME']);
    wait(750);
  }
  const output = runAdb(serial, [
    'shell',
    'am',
    'start',
    '-W',
    '-n',
    component,
  ]);
  return parseLaunch(output);
}

function parseTotalPssKiB(output) {
  const summary = output.match(/TOTAL PSS:\s*(\d+)/);
  if (summary) return Number(summary[1]);

  const totalRow = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => /^TOTAL\s+\d+/.test(line));
  return totalRow ? Number(totalRow.split(/\s+/)[1]) : null;
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function summarize(samples, key) {
  const values = samples.map((sample) => sample[key]);
  return {
    samples: values,
    median: median(values),
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const device = connectedDevice(options.allowEmulator);
  const component = `${options.packageId}/${options.activity}`;

  const packagePath = runAdb(
    device.serial,
    ['shell', 'pm', 'path', options.packageId],
    { allowFailure: true },
  );
  if (!packagePath.includes('package:')) {
    fail(`${options.packageId} is not installed on ${device.serial}`);
  }

  const coldLaunches = [];
  const warmLaunches = [];
  for (let index = 0; index < options.samples; index += 1) {
    coldLaunches.push(launch(device.serial, component, true));
    wait(1500);
  }

  launch(device.serial, component, false);
  wait(1500);
  for (let index = 0; index < options.samples; index += 1) {
    warmLaunches.push(launch(device.serial, component, false));
    wait(1000);
  }

  const pssSamplesKiB = [];
  for (let index = 0; index < options.samples; index += 1) {
    const meminfo = runAdb(
      device.serial,
      ['shell', 'dumpsys', 'meminfo', options.packageId],
    );
    const totalPssKiB = parseTotalPssKiB(meminfo);
    if (totalPssKiB === null) fail('could not parse TOTAL PSS from meminfo');
    pssSamplesKiB.push(totalPssKiB);
    wait(500);
  }

  const result = {
    schemaVersion: 1,
    recordedAt: new Date().toISOString(),
    label: options.label,
    packageId: options.packageId,
    activity: options.activity,
    sampleCount: options.samples,
    device: {
      serial: device.serial,
      physical: !device.isEmulator,
      manufacturer: property(device.serial, 'ro.product.manufacturer'),
      model: property(device.serial, 'ro.product.model'),
      androidVersion: property(device.serial, 'ro.build.version.release'),
      sdk: property(device.serial, 'ro.build.version.sdk'),
      buildFingerprint: property(device.serial, 'ro.build.fingerprint'),
    },
    activityLaunchProxy: {
      coldTotalTimeMs: summarize(coldLaunches, 'totalTimeMs'),
      warmTotalTimeMs: summarize(warmLaunches, 'totalTimeMs'),
      note: 'OS activity timing only; not dashboard-usable timing.',
    },
    dashboardPssProxyKiB: {
      samples: pssSamplesKiB,
      median: median(pssSamplesKiB),
      maxObserved: Math.max(...pssSamplesKiB),
      note: 'Point-in-time PSS samples; not profiler peak memory.',
    },
  };

  const json = `${JSON.stringify(result, null, 2)}\n`;
  process.stdout.write(json);
  if (options.output) {
    const outputPath = path.resolve(options.output);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, json);
    console.error(`Wrote ${outputPath}`);
  }
}

main();
