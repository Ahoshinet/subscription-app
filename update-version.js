const fs = require('fs');
const path = require('path');

function calculateNextRelease(appJson, packageJson, increment = 'patch') {
  const currentVersion = appJson.expo?.version;
  const versionMatch = typeof currentVersion === 'string'
    ? currentVersion.match(/^(\d+)\.(\d+)\.(\d+)$/)
    : null;
  if (!versionMatch) {
    throw new Error(`Invalid app version: ${currentVersion}`);
  }

  const currentVersionCode = appJson.expo.android?.versionCode ?? 1;
  const currentBuildNumber = Number(appJson.expo.ios?.buildNumber ?? '1');
  if (
    !Number.isInteger(currentVersionCode)
    || currentVersionCode < 1
    || !Number.isInteger(currentBuildNumber)
    || currentBuildNumber < 1
  ) {
    throw new Error('Native build numbers must be positive integers');
  }

  let major = Number(versionMatch[1]);
  let minor = Number(versionMatch[2]);
  let patch = Number(versionMatch[3]);
  switch (increment) {
    case 'build':
      break;
    case 'major':
      major += 1;
      minor = 0;
      patch = 0;
      break;
    case 'minor':
      minor += 1;
      patch = 0;
      break;
    case 'patch':
      patch += 1;
      break;
    default:
      throw new Error(`Unknown version increment: ${increment}`);
  }

  const newVersion = `${major}.${minor}.${patch}`;
  const newVersionCode = currentVersionCode + 1;
  const newBuildNumber = String(currentBuildNumber + 1);
  const nextAppJson = structuredClone(appJson);
  const nextPackageJson = structuredClone(packageJson);

  nextAppJson.expo.version = newVersion;
  nextAppJson.expo.android.versionCode = newVersionCode;
  nextAppJson.expo.ios.buildNumber = newBuildNumber;
  nextPackageJson.version = newVersion;

  return {
    appJson: nextAppJson,
    buildNumber: newBuildNumber,
    packageJson: nextPackageJson,
    previousBuildNumber: String(currentBuildNumber),
    previousVersion: currentVersion,
    previousVersionCode: currentVersionCode,
    version: newVersion,
    versionCode: newVersionCode,
  };
}

function updateVersionFiles(increment = 'patch') {
  const appJsonPath = path.join(__dirname, 'app.json');
  const packageJsonPath = path.join(__dirname, 'package.json');
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const result = calculateNextRelease(appJson, packageJson, increment);

  fs.writeFileSync(
    appJsonPath,
    `${JSON.stringify(result.appJson, null, 2)}\n`,
  );
  fs.writeFileSync(
    packageJsonPath,
    `${JSON.stringify(result.packageJson, null, 2)}\n`,
  );

  return result;
}

if (require.main === module) {
  try {
    const result = updateVersionFiles(process.argv[2] ?? 'patch');
    console.log(
      `✅ Version updated: ${result.previousVersion} → ${result.version}`,
    );
    console.log(
      `🤖 Android versionCode: ${result.previousVersionCode} → ${result.versionCode}`,
    );
    console.log(
      `🍎 iOS buildNumber: ${result.previousBuildNumber} → ${result.buildNumber}`,
    );
    console.log('📝 Updated app.json & package.json');
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

module.exports = { calculateNextRelease, updateVersionFiles };
