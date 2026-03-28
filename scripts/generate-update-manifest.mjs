import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundleRoot = path.join(repoRoot, 'src-tauri', 'target', 'release', 'bundle');
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

const baseUrl = process.env.HAVEN_UPDATE_BASE_URL;
if (!baseUrl) {
  throw new Error('HAVEN_UPDATE_BASE_URL is required to generate latest.json');
}

const notes = process.env.HAVEN_UPDATE_NOTES || `HAVEN Sovereign ${packageJson.version}`;

function collectFiles(dir, extension) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((file) => file.toLowerCase().endsWith(extension))
    .map((file) => path.join(dir, file));
}

function detectPlatformKey(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes('arm64') || lower.includes('aarch64')) return 'windows-aarch64';
  if (lower.includes('x64') || lower.includes('x86_64')) return 'windows-x86_64';
  if (lower.includes('x86') || lower.includes('i686')) return 'windows-i686';

  switch (process.arch) {
    case 'arm64':
      return 'windows-aarch64';
    case 'x64':
      return 'windows-x86_64';
    case 'ia32':
      return 'windows-i686';
    default:
      throw new Error(`Unable to infer platform key from filename: ${filename}`);
  }
}

function buildPlatformEntry(artifactPath) {
  const signaturePath = `${artifactPath}.sig`;
  if (!fs.existsSync(signaturePath)) {
    throw new Error(`Missing signature file for updater artifact: ${signaturePath}`);
  }

  const filename = path.basename(artifactPath);
  const signature = fs.readFileSync(signaturePath, 'utf8').trim();

  return {
    key: detectPlatformKey(filename),
    value: {
      signature,
      url: `${baseUrl.replace(/\/$/, '')}/${filename}`,
    },
  };
}

const nsisArtifacts = collectFiles(path.join(bundleRoot, 'nsis'), '.exe');
const msiArtifacts = collectFiles(path.join(bundleRoot, 'msi'), '.msi');
const preferredArtifacts = nsisArtifacts.length > 0 ? nsisArtifacts : msiArtifacts;

if (preferredArtifacts.length === 0) {
  throw new Error('No updater-compatible bundle artifacts were found in src-tauri/target/release/bundle');
}

const platforms = Object.fromEntries(preferredArtifacts.map((artifact) => {
  const { key, value } = buildPlatformEntry(artifact);
  return [key, value];
}));

const manifest = {
  version: packageJson.version,
  notes,
  pub_date: new Date().toISOString(),
  platforms,
};

const releaseDir = path.join(repoRoot, 'releases');
fs.mkdirSync(releaseDir, { recursive: true });
const manifestPath = path.join(releaseDir, 'latest.json');
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(`Generated updater manifest at ${manifestPath}`);
