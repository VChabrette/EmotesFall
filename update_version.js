//  script that takes a version number as an argument and updates the version number in the following files:
//    - package.json
//    - src-tauri/Cargo.toml
//    - src-tauri/tauri.conf.json

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const version = process.argv[2];
const packageJsonPath = path.join(__dirname, 'package.json');
const cargoTomlPath = path.join(__dirname, 'src-tauri', 'Cargo.toml');
const tauriConfPath = path.join(__dirname, 'src-tauri', 'tauri.conf.json');

if (!version) {
	console.error('No version provided');
	process.exit(1);
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