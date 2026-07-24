#!/usr/bin/env node

const appConfig = require('../app.json');
const packageConfig = require('../package.json');

function verifyReleaseTag(tag) {
  const nativeVersion = appConfig.expo?.version;
  const releaseVersion = appConfig.expo?.extra?.releaseVersion;
  const packageVersion = packageConfig.version;
  if (
    typeof nativeVersion !== 'string'
    || !/^\d+\.\d+\.\d+$/.test(nativeVersion)
  ) {
    throw new Error(`app.json has an invalid native version: ${nativeVersion}`);
  }
  if (
    typeof releaseVersion !== 'string'
    || !/^\d+\.\d+\.\d+(?:-rc\.[1-9]\d*)?$/.test(releaseVersion)
  ) {
    throw new Error(
      `app.json has an invalid release version: ${releaseVersion}`,
    );
  }
  if (packageVersion !== releaseVersion) {
    throw new Error(
      `package.json (${packageVersion}) and app.json release version (${releaseVersion}) differ`,
    );
  }
  const releaseNativeVersion = releaseVersion.replace(/-rc\.[1-9]\d*$/, '');
  if (releaseNativeVersion !== nativeVersion) {
    throw new Error(
      `release version ${releaseVersion} does not map to native version ${nativeVersion}`,
    );
  }

  const expectedTag = `v${releaseVersion}`;
  if (tag !== expectedTag) {
    throw new Error(`tag ${tag} does not match ${expectedTag}`);
  }
  const isReleaseCandidate = /-rc\.[1-9]\d*$/.test(releaseVersion);
  const isStable = !isReleaseCandidate;

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
    nativeVersion,
    releaseVersion,
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
