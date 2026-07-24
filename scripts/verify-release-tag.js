#!/usr/bin/env node

const appConfig = require('../app.json');
const packageConfig = require('../package.json');

function verifyReleaseTag(tag) {
  const appVersion = appConfig.expo?.version;
  const packageVersion = packageConfig.version;
  if (typeof appVersion !== 'string' || !/^\d+\.\d+\.\d+$/.test(appVersion)) {
    throw new Error(`app.json has an invalid native version: ${appVersion}`);
  }
  if (packageVersion !== appVersion) {
    throw new Error(
      `package.json (${packageVersion}) and app.json (${appVersion}) differ`,
    );
  }

  const stableTag = `v${appVersion}`;
  const isStable = tag === stableTag;
  const isReleaseCandidate = new RegExp(
    `^${stableTag.replace(/\./g, '\\.')}-rc\\.[1-9]\\d*$`,
  ).test(tag);
  if (!isStable && !isReleaseCandidate) {
    throw new Error(
      `tag ${tag} does not match ${stableTag} or ${stableTag}-rc.N`,
    );
  }

  const versionCode = appConfig.expo?.android?.versionCode;
  const buildNumber = appConfig.expo?.ios?.buildNumber;
  if (!Number.isInteger(versionCode) || versionCode < 2) {
    throw new Error('android.versionCode must be an integer of at least 2');
  }
  if (
    typeof buildNumber !== 'string'
    || !/^[1-9]\d*$/.test(buildNumber)
    || Number(buildNumber) < 2
  ) {
    throw new Error('ios.buildNumber must be an integer string of at least 2');
  }

  return {
    appVersion,
    buildNumber,
    isReleaseCandidate,
    isStable,
    versionCode,
  };
}

if (require.main === module) {
  const tag = process.argv[2];
  if (!tag) {
    console.error('Usage: node scripts/verify-release-tag.js <tag>');
    process.exit(1);
  }

  try {
    const result = verifyReleaseTag(tag);
    console.log(JSON.stringify({ tag, ...result }));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

module.exports = { verifyReleaseTag };
