//  script that takes a version number as an argument and updates the version number in the following files:
//    - package.json
//    - src-tauri/Cargo.toml
//    - src-tauri/tauri.conf.json

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let version = process.argv[2];
const packageJsonPath = path.join(__dirname, 'package.json');
const cargoTomlPath = path.join(__dirname, 'src-tauri', 'Cargo.toml');
const tauriConfPath = path.join(__dirname, 'src-tauri', 'tauri.conf.json');

if (!version) {
	console.error('No version provided');
	process.exit(1);
}

// argument can also be patch | minor | major
if (['patch', 'minor', 'major'].includes(version)) {
	const currentVersion = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).version;
	const [major, minor, patch] = currentVersion.split('.').map(Number);
	const newVersion = {
		patch: `${major}.${minor}.${patch + 1}`,
		minor: `${major}.${minor + 1}.${patch}`,
		major: `${major + 1}.${minor}.${patch}`,
	}[version];
	if (!newVersion) {
		console.error('Invalid version provided');
		process.exit(1);
	}
	version = newVersion;
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));

const newPackageJson = {
	...packageJson,
	version,
};

const newCargoToml = cargoToml.replace(
	/version = ".*"/,
	`version = "${version}"`
);

const newTauriConf = {
	...tauriConf,
	package: {
		...tauriConf.package,
		version,
	},
};

// write new files
fs.writeFileSync(packageJsonPath, JSON.stringify(newPackageJson, null, 2));
fs.writeFileSync(cargoTomlPath, newCargoToml);
fs.writeFileSync(tauriConfPath, JSON.stringify(newTauriConf, null, 2));

// commit changes
execSync(`git add ${packageJsonPath} ${cargoTomlPath} ${tauriConfPath}`);