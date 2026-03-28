# HAVEN Desktop Updates

This project now includes a Tauri v2 desktop update workflow with runtime configuration.

## Versioning

The desktop version is sourced from `package.json`.

Run one of these commands before desktop releases:

```powershell
npm version patch
npm version minor
npm version major
```

The `version` script automatically syncs the same value into:

- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`

You can also force synchronization manually:

```powershell
npm run version:sync
```

## Updater runtime configuration

The desktop shell reads updater values from environment variables at runtime:

- `HAVEN_UPDATER_ENDPOINTS`
- `HAVEN_UPDATER_PUBKEY`
- `HAVEN_UPDATER_CHANNEL` (optional, defaults to `stable`)

Example:

```powershell
setx HAVEN_UPDATER_ENDPOINTS "https://downloads.khawrizm.sa/haven/latest.json"
setx HAVEN_UPDATER_PUBKEY "PASTE_THE_PUBLIC_KEY_CONTENT_HERE"
setx HAVEN_UPDATER_CHANNEL "stable"
```

`HAVEN_UPDATER_ENDPOINTS` may contain one or more comma-separated or semicolon-separated URLs.

## Signing updater artifacts

Generate a Tauri updater key pair once:

```powershell
npm run tauri signer generate -- -w %USERPROFILE%\\.tauri\\haven-updater.key
```

At release time set:

```powershell
setx TAURI_SIGNING_PRIVATE_KEY "%USERPROFILE%\\.tauri\\haven-updater.key"
setx TAURI_SIGNING_PRIVATE_KEY_PASSWORD "YOUR_PASSWORD"
```

`src-tauri/tauri.conf.json` already enables:

- `bundle.createUpdaterArtifacts = true`
- Windows updater install mode = `passive`

## Release flow

1. Bump the version:

```powershell
npm version patch
```

2. Build the desktop app:

```powershell
npm run tauri:build
```

3. Generate `latest.json` for your static update endpoint:

```powershell
set HAVEN_UPDATE_BASE_URL=https://downloads.khawrizm.sa/haven
set HAVEN_UPDATE_NOTES=HAVEN Sovereign desktop update
npm run updates:manifest
```

4. Upload these files to your release host:

- `releases/latest.json`
- the chosen bundle artifact from `src-tauri/target/release/bundle/`
- its matching `.sig` file

The manifest generator prefers NSIS executables when present and falls back to MSI.
