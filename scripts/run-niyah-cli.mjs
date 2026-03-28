import { accessSync, constants } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

function isExecutable(filePath) {
  try {
    accessSync(filePath, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function pathCandidates() {
  const envPath = process.env.PATH || "";
  const pathEntries = envPath
    .split(path.delimiter)
    .filter(Boolean)
    .map((entry) => path.join(entry, process.platform === "win32" ? "cargo.exe" : "cargo"));

  const home = process.env.USERPROFILE || homedir();
  const localCargo = path.join(
    home,
    ".cargo",
    "bin",
    process.platform === "win32" ? "cargo.exe" : "cargo"
  );

  return [localCargo, ...pathEntries];
}

function findCargo() {
  return pathCandidates().find(isExecutable);
}

const cargoPath = findCargo();

if (!cargoPath) {
  console.error("Unable to find cargo. Install Rust or add cargo to PATH.");
  process.exit(1);
}

const manifestPath = path.resolve("niyah-core", "Cargo.toml");
const args = ["run", "--quiet", "--manifest-path", manifestPath, "--bin", "niyah", "--", ...process.argv.slice(2)];
const result = spawnSync(cargoPath, args, {
  stdio: "inherit",
  shell: false,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
