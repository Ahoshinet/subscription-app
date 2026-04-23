const fs = require('fs');
const path = require('path');

const appJsonPath = path.join(__dirname, 'app.json');
const packageJsonPath = path.join(__dirname, 'package.json');

const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const currentVersion = appJson.expo.version;
const [major, minor, patch] = currentVersion.split('.').map(Number);

const arg = process.argv[2];
let newMajor = major, newMinor = minor, newPatch = patch;

switch (arg) {
  case 'major':
    newMajor++;
    newMinor = 0;
    newPatch = 0;
    break;
  case 'minor':
    newMinor++;
    newPatch = 0;
    break;
  case 'patch':
  default:
    newPatch++;
    break;
}

const newVersion = `${newMajor}.${newMinor}.${newPatch}`;

appJson.expo.version = newVersion;
packageJson.version = newVersion;

fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`✅ Version updated: ${currentVersion} → ${newVersion}`);
console.log(`📝 Updated app.json & package.json`);
