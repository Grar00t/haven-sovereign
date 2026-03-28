import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJsonPath = path.join(repoRoot, 'package.json');
const tauriConfigPath = path.join(repoRoot, 'src-tauri', 'tauri.conf.json');
const cargoTomlPath = path.join(repoRoot, 'src-tauri', 'Cargo.toml');

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

if (!version) {
  throw new Error('package.json does not contain a version field.');
}

const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8'));
tauriConfig.version = version;
fs.writeFileSync(tauriConfigPath, `${JSON.stringify(tauriConfig, null, 2)}\n`, 'utf8');

const cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
if (!/^version = ".*"$/m.test(cargoToml)) {
  throw new Error('src-tauri/Cargo.toml does not contain a package version.');
}

const nextCargoToml = cargoToml.replace(
  /^version = ".*"$/m,
  `version = "${version}"`
);

fs.writeFileSync(cargoTomlPath, nextCargoToml, 'utf8');
console.log(`Synchronized desktop version to ${version}`);
