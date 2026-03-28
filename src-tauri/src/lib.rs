use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::net::{SocketAddr, TcpStream};
use std::path::{Path, PathBuf};
use std::process::{Command as StdCommand, Stdio};
use std::sync::Mutex;
use std::thread;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager, State, Url};
use tauri_plugin_updater::{Update, UpdaterExt};
use tokio::io::AsyncReadExt;
use tokio::process::Command as TokioCommand;
use tokio::time::timeout;

#[path = "../../niyah-core/forensics.rs"]
mod forensics;
#[path = "../../niyah-core/gateway.rs"]
mod gateway;
#[path = "../../niyah-core/reviewer.rs"]
mod reviewer;

use forensics::{ForensicReport, ProcessGuard};
use gateway::GratechGateway;
use reviewer::SovereignCodeReview;

struct PendingUpdate(Mutex<Option<Update>>);

#[derive(Serialize)]
struct IpcResponse {
  status: &'static str,
  code: String,
  timestamp: u64,
  #[serde(skip_serializing_if = "Option::is_none")]
  payload: Option<Value>,
}

#[derive(Clone)]
struct RuntimeUpdaterConfig {
  channel: String,
  endpoints: Vec<String>,
  pubkey: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct UpdaterStatus {
  configured: bool,
  current_version: String,
  channel: String,
  endpoints: Vec<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct UpdateMetadata {
  configured: bool,
  available: bool,
  current_version: String,
  version: Option<String>,
  notes: Option<String>,
  pub_date: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct UpdateInstallResult {
  installed: bool,
  restarted: bool,
  detail: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct EnsureLocalOllamaResult {
  available: bool,
  started: bool,
  detail: String,
  #[serde(skip_serializing_if = "Option::is_none")]
  path: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct OllamaProxyRequest {
  path: String,
  #[serde(default)]
  body: Option<Value>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct TerminalToolStatus {
  name: String,
  category: String,
  available: bool,
  launchable: bool,
  interactive: bool,
  #[serde(skip_serializing_if = "Option::is_none")]
  path: Option<String>,
  note: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct TerminalCommandRequest {
  command: String,
  #[serde(default)]
  args: Vec<String>,
  #[serde(default)]
  cwd: Option<String>,
  #[serde(default)]
  timeout_ms: Option<u64>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct TerminalCommandResult {
  ok: bool,
  command: String,
  exit_code: Option<i32>,
  stdout: String,
  stderr: String,
  cwd: String,
  duration_ms: u64,
}

fn timestamp_ms() -> u64 {
  SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .map(|duration| duration.as_millis() as u64)
    .unwrap_or(0)
}

fn env_value(keys: &[&str]) -> Option<String> {
  keys.iter().find_map(|key| {
    std::env::var(key)
      .ok()
      .map(|value| value.trim().to_string())
      .filter(|value| !value.is_empty())
  })
}

fn runtime_updater_config() -> Option<RuntimeUpdaterConfig> {
  let endpoints_raw = env_value(&["HAVEN_UPDATER_ENDPOINTS", "HAVEN_UPDATER_ENDPOINT"])?;
  let pubkey = env_value(&["HAVEN_UPDATER_PUBKEY", "TAURI_UPDATER_PUBKEY"])?;
  let endpoints = endpoints_raw
    .split([',', ';', '\n'])
    .map(str::trim)
    .filter(|value| !value.is_empty())
    .map(|value| value.to_string())
    .collect::<Vec<_>>();

  if endpoints.is_empty() {
    return None;
  }

  Some(RuntimeUpdaterConfig {
    channel: env_value(&["HAVEN_UPDATER_CHANNEL"]).unwrap_or_else(|| "stable".to_string()),
    endpoints,
    pubkey,
  })
}

fn updater_status_for(app: &AppHandle) -> UpdaterStatus {
  let version = app.package_info().version.to_string();
  match runtime_updater_config() {
    Some(config) => UpdaterStatus {
      configured: true,
      current_version: version,
      channel: config.channel,
      endpoints: config.endpoints,
    },
    None => UpdaterStatus {
      configured: false,
      current_version: version,
      channel: "stable".to_string(),
      endpoints: Vec::new(),
    },
  }
}

fn ok_response(code: impl Into<String>, payload: Option<Value>) -> IpcResponse {
  IpcResponse {
    status: "OK",
    code: code.into(),
    timestamp: timestamp_ms(),
    payload,
  }
}

fn error_response(code: impl Into<String>, payload: Option<Value>) -> IpcResponse {
  IpcResponse {
    status: "ERROR",
    code: code.into(),
    timestamp: timestamp_ms(),
    payload,
  }
}

fn ollama_socket_addr() -> SocketAddr {
  SocketAddr::from(([127, 0, 0, 1], 11434))
}

fn ollama_is_available() -> bool {
  TcpStream::connect_timeout(&ollama_socket_addr(), Duration::from_millis(400)).is_ok()
}

fn push_candidate(candidates: &mut Vec<PathBuf>, path: PathBuf) {
  if path.exists() && !candidates.iter().any(|candidate| candidate == &path) {
    candidates.push(path);
  }
}

fn ollama_candidate_paths() -> Vec<PathBuf> {
  let mut candidates = Vec::new();

  if let Some(local_app_data) = std::env::var_os("LOCALAPPDATA") {
    push_candidate(
      &mut candidates,
      PathBuf::from(local_app_data)
        .join("Programs")
        .join("Ollama")
        .join("ollama.exe"),
    );
  }

  push_candidate(
    &mut candidates,
    PathBuf::from(r"C:\Users\Iqd20\AppData\Local\Programs\Ollama\ollama.exe"),
  );
  push_candidate(&mut candidates, PathBuf::from(r"D:\AI_LAB\ollama\ollama.exe"));

  candidates
}

fn terminal_tool_names() -> [&'static str; 8] {
  [
    "python",
    "py",
    "node",
    "npm",
    "git",
    "ollama",
    "gemini",
    "msfconsole",
  ]
}

fn terminal_tool_category(name: &str) -> &'static str {
  match name {
    "python" | "py" => "Python",
    "node" | "npm" => "Node.js",
    "git" => "VCS",
    "ollama" => "Local AI",
    "gemini" => "Assistant CLI",
    "msfconsole" => "External Security Tool",
    _ => "Desktop Tool",
  }
}

fn terminal_tool_interactive(name: &str) -> bool {
  matches!(name, "gemini" | "msfconsole")
}

fn candidate_priority(path: &Path) -> usize {
  match path
    .extension()
    .and_then(|ext| ext.to_str())
    .map(|ext| ext.to_ascii_lowercase())
    .as_deref()
  {
    Some("exe") => 0,
    Some("cmd") => 1,
    Some("bat") => 2,
    Some("com") => 3,
    Some("ps1") => 4,
    _ => 5,
  }
}

fn push_unique_candidate(candidates: &mut Vec<PathBuf>, path: PathBuf) {
  if path.exists() && !candidates.iter().any(|candidate| candidate == &path) {
    candidates.push(path);
  }
}

fn discover_terminal_tool(name: &str) -> Option<PathBuf> {
  let mut candidates = Vec::new();

  if name == "ollama" {
    for candidate in ollama_candidate_paths() {
      push_unique_candidate(&mut candidates, candidate);
    }
  }

  if let Ok(output) = StdCommand::new("where").arg(name).output() {
    if output.status.success() {
      for line in String::from_utf8_lossy(&output.stdout).lines() {
        let candidate = PathBuf::from(line.trim());
        push_unique_candidate(&mut candidates, candidate);
      }
    }
  }

  candidates.sort_by_key(|candidate| candidate_priority(candidate));
  candidates.into_iter().next()
}

fn normalize_terminal_cwd(raw_cwd: Option<&str>) -> Result<PathBuf, String> {
  if let Some(cwd) = raw_cwd.map(str::trim).filter(|value| !value.is_empty()) {
    let path = PathBuf::from(cwd);
    if path.is_absolute() && path.exists() && path.is_dir() {
      return Ok(path);
    }
  }

  std::env::current_dir().map_err(|error| format!("Failed to resolve desktop cwd: {}", error))
}

fn build_terminal_command(
  executable: &Path,
  args: &[String],
  cwd: &Path,
) -> Result<TokioCommand, String> {
  let mut command = match executable
    .extension()
    .and_then(|ext| ext.to_str())
    .map(|ext| ext.to_ascii_lowercase())
    .as_deref()
  {
    Some("ps1") => {
      let mut command = TokioCommand::new("powershell");
      command.arg("-NoProfile");
      command.arg("-ExecutionPolicy");
      command.arg("Bypass");
      command.arg("-File");
      command.arg(executable);
      command
    }
    Some("cmd") | Some("bat") => {
      let mut command = TokioCommand::new("cmd");
      command.arg("/c");
      command.arg(executable);
      command
    }
    _ => TokioCommand::new(executable),
  };

  command.args(args);
  command.current_dir(cwd);
  command.stdin(Stdio::null());
  command.stdout(Stdio::piped());
  command.stderr(Stdio::piped());
  command.env("NO_COLOR", "1");
  command.env("FORCE_COLOR", "0");
  Ok(command)
}

#[cfg(target_os = "windows")]
fn spawn_ollama_process(path: &Path) -> Result<(), String> {
  use std::os::windows::process::CommandExt;

  const CREATE_NO_WINDOW: u32 = 0x0800_0000;

  StdCommand::new(path)
    .arg("serve")
    .stdin(Stdio::null())
    .stdout(Stdio::null())
    .stderr(Stdio::null())
    .creation_flags(CREATE_NO_WINDOW)
    .spawn()
    .map(|_| ())
    .map_err(|error| format!("Failed to launch {}: {}", path.display(), error))
}

#[cfg(not(target_os = "windows"))]
fn spawn_ollama_process(path: &Path) -> Result<(), String> {
  StdCommand::new(path)
    .arg("serve")
    .stdin(Stdio::null())
    .stdout(Stdio::null())
    .stderr(Stdio::null())
    .spawn()
    .map(|_| ())
    .map_err(|error| format!("Failed to launch {}: {}", path.display(), error))
}

fn wait_for_ollama(timeout: Duration) -> bool {
  let deadline = Instant::now() + timeout;
  while Instant::now() < deadline {
    if ollama_is_available() {
      return true;
    }
    thread::sleep(Duration::from_millis(400));
  }
  false
}

fn ollama_http_post(path: &str, body: &Value) -> Result<Value, String> {
  let client = reqwest::blocking::Client::builder()
    .timeout(Duration::from_secs(120))
    .build()
    .map_err(|error| error.to_string())?;

  client
    .post(format!("http://127.0.0.1:11434{}", path))
    .json(body)
    .send()
    .map_err(|error| error.to_string())?
    .error_for_status()
    .map_err(|error| error.to_string())?
    .json::<Value>()
    .map_err(|error| error.to_string())
}

fn ollama_http_get(path: &str) -> Result<Value, String> {
  let client = reqwest::blocking::Client::builder()
    .timeout(Duration::from_secs(30))
    .build()
    .map_err(|error| error.to_string())?;

  client
    .get(format!("http://127.0.0.1:11434{}", path))
    .send()
    .map_err(|error| error.to_string())?
    .error_for_status()
    .map_err(|error| error.to_string())?
    .json::<Value>()
    .map_err(|error| error.to_string())
}

#[tauri::command]
fn gratech_route(target: String, payload: String) -> IpcResponse {
  let gateway = GratechGateway::new();
  let payload_len = payload.len();

  match gateway.route_payload(&target, payload.into_bytes()) {
    Ok(route_status) => ok_response(
      route_status,
      Some(json!({
        "target": target,
        "bytes": payload_len,
        "networkStatus": gateway.get_network_status(),
      })),
    ),
    Err(error) => error_response(
      error,
      Some(json!({
        "target": target,
        "bytes": payload_len,
      })),
    ),
  }
}

#[tauri::command]
fn phalanx_health_check() -> bool {
  ProcessGuard::new()
    .scan_report()
    .map(|report| report.is_clean())
    .unwrap_or(false)
}

#[tauri::command]
fn forensics_scan() -> Result<ForensicReport, String> {
  ProcessGuard::new().scan_report()
}

#[tauri::command]
fn ensure_local_ollama() -> EnsureLocalOllamaResult {
  if ollama_is_available() {
    return EnsureLocalOllamaResult {
      available: true,
      started: false,
      detail: "Ollama is already running on 127.0.0.1:11434.".to_string(),
      path: None,
    };
  }

  let candidates = ollama_candidate_paths();
  if candidates.is_empty() {
    return EnsureLocalOllamaResult {
      available: false,
      started: false,
      detail: "No local Ollama installation was found for the desktop shell.".to_string(),
      path: None,
    };
  }

  let mut last_error = None;

  for candidate in candidates {
    match spawn_ollama_process(&candidate) {
      Ok(()) => {
        if wait_for_ollama(Duration::from_secs(12)) {
          return EnsureLocalOllamaResult {
            available: true,
            started: true,
            detail: format!("Started Ollama from {}.", candidate.display()),
            path: Some(candidate.display().to_string()),
          };
        }
        last_error = Some(format!(
          "Launched {} but 127.0.0.1:11434 did not become ready in time.",
          candidate.display()
        ));
      }
      Err(error) => {
        last_error = Some(error);
      }
    }
  }

  EnsureLocalOllamaResult {
    available: false,
    started: false,
    detail: last_error.unwrap_or_else(|| "Failed to start local Ollama.".to_string()),
    path: None,
  }
}

#[tauri::command]
fn ollama_proxy(request: OllamaProxyRequest) -> Result<Value, String> {
  if !ollama_is_available() {
    let started = ensure_local_ollama();
    if !started.available {
      return Err(started.detail);
    }
  }

  match request.path.as_str() {
    "/api/tags" => ollama_http_get("/api/tags"),
    "/api/ps" => ollama_http_get("/api/ps"),
    "/api/show" => ollama_http_post("/api/show", &request.body.unwrap_or_else(|| json!({}))),
    "/api/chat" => ollama_http_post("/api/chat", &request.body.unwrap_or_else(|| json!({}))),
    "/api/generate" => ollama_http_post("/api/generate", &request.body.unwrap_or_else(|| json!({}))),
    _ => Err(format!("Unsupported Ollama proxy path: {}", request.path)),
  }
}

#[tauri::command]
fn list_terminal_tools() -> Vec<TerminalToolStatus> {
  terminal_tool_names()
    .into_iter()
    .map(|name| {
      let path = discover_terminal_tool(name);
      let available = path.is_some();
      let note = match name {
        "gemini" if available => {
          "Gemini CLI detected. Best for one-shot flags here; full interactive sessions still work better in an external console.".to_string()
        }
        "msfconsole" if available => {
          "Metasploit is installed, but embedded PTY sessions are not wired yet. Use the terminal as a detector, not a fake shell.".to_string()
        }
        "msfconsole" => "Metasploit was not found on PATH.".to_string(),
        "ollama" if available => "Local Ollama bridge is available for desktop AI commands.".to_string(),
        _ if available => format!("{} is ready inside the desktop shell.", name),
        _ => format!("{} was not found on PATH.", name),
      };

      TerminalToolStatus {
        name: name.to_string(),
        category: terminal_tool_category(name).to_string(),
        available,
        launchable: available && !terminal_tool_interactive(name),
        interactive: terminal_tool_interactive(name),
        path: path.map(|value| value.display().to_string()),
        note,
      }
    })
    .collect()
}

#[tauri::command]
async fn run_terminal_command(request: TerminalCommandRequest) -> Result<TerminalCommandResult, String> {
  let command_name = request.command.trim().to_ascii_lowercase();
  if !terminal_tool_names().contains(&command_name.as_str()) {
    return Err(format!(
      "Desktop terminal blocks `{}`. Allowed commands: {}",
      command_name,
      terminal_tool_names().join(", ")
    ));
  }

  if command_name == "msfconsole" {
    return Err(
      "msfconsole is treated as an external detected tool only. Embedded interactive MSF sessions are intentionally not automated here."
        .to_string(),
    );
  }

  let executable = discover_terminal_tool(&command_name)
    .ok_or_else(|| format!("{} is not installed on this machine.", command_name))?;
  let cwd = normalize_terminal_cwd(request.cwd.as_deref())?;
  let timeout_ms = request.timeout_ms.unwrap_or(15000).clamp(1000, 60000);
  let started_at = Instant::now();

  let mut command = build_terminal_command(&executable, &request.args, &cwd)?;
  let mut child = command
    .spawn()
    .map_err(|error| format!("Failed to start {}: {}", command_name, error))?;

  let stdout_reader = child.stdout.take();
  let stderr_reader = child.stderr.take();

  let stdout_task = tauri::async_runtime::spawn(async move {
    if let Some(mut stdout) = stdout_reader {
      let mut buffer = String::new();
      let _ = stdout.read_to_string(&mut buffer).await;
      buffer
    } else {
      String::new()
    }
  });

  let stderr_task = tauri::async_runtime::spawn(async move {
    if let Some(mut stderr) = stderr_reader {
      let mut buffer = String::new();
      let _ = stderr.read_to_string(&mut buffer).await;
      buffer
    } else {
      String::new()
    }
  });

  let wait_result = timeout(Duration::from_millis(timeout_ms), child.wait()).await;

  let (ok, exit_code, extra_stderr) = match wait_result {
    Ok(Ok(status)) => (status.success(), status.code(), String::new()),
    Ok(Err(error)) => (
      false,
      None,
      format!("{} terminated with a desktop shell error: {}", command_name, error),
    ),
    Err(_) => {
      let _ = child.kill().await;
      let _ = child.wait().await;
      (
        false,
        None,
        format!("{} timed out after {} ms and was stopped.", command_name, timeout_ms),
      )
    }
  };

  let stdout = stdout_task.await.unwrap_or_default();
  let stderr = stderr_task.await.unwrap_or_default();
  let merged_stderr = if extra_stderr.is_empty() {
    stderr
  } else if stderr.trim().is_empty() {
    extra_stderr
  } else {
    format!("{}\n{}", stderr.trim_end(), extra_stderr)
  };

  Ok(TerminalCommandResult {
    ok,
    command: if request.args.is_empty() {
      command_name
    } else {
      format!("{} {}", command_name, request.args.join(" "))
    },
    exit_code,
    stdout,
    stderr: merged_stderr,
    cwd: cwd.display().to_string(),
    duration_ms: started_at.elapsed().as_millis() as u64,
  })
}

#[tauri::command]
fn updater_status(app: AppHandle) -> UpdaterStatus {
  updater_status_for(&app)
}

#[tauri::command]
async fn fetch_app_update(
  app: AppHandle,
  pending_update: State<'_, PendingUpdate>,
) -> Result<UpdateMetadata, String> {
  let status = updater_status_for(&app);
  if !status.configured {
    return Ok(UpdateMetadata {
      configured: false,
      available: false,
      current_version: status.current_version,
      version: None,
      notes: Some(
        "Desktop updates are disabled until HAVEN_UPDATER_ENDPOINTS and HAVEN_UPDATER_PUBKEY are configured."
          .to_string(),
      ),
      pub_date: None,
    });
  }

  let config = runtime_updater_config().expect("updater config should exist when status is configured");
  let endpoints = config
    .endpoints
    .into_iter()
    .map(|endpoint| Url::parse(&endpoint).map_err(|error| error.to_string()))
    .collect::<Result<Vec<_>, _>>()?;
  let update = app
    .updater_builder()
    .pubkey(config.pubkey)
    .endpoints(endpoints)
    .map_err(|error| error.to_string())?
    .build()
    .map_err(|error| error.to_string())?
    .check()
    .await
    .map_err(|error| error.to_string())?;

  let metadata = UpdateMetadata {
    configured: true,
    available: update.is_some(),
    current_version: status.current_version,
    version: update.as_ref().map(|item| item.version.clone()),
    notes: update.as_ref().and_then(|item| item.body.clone()),
    pub_date: update.as_ref().and_then(|item| item.date.map(|date| date.to_string())),
  };

  *pending_update.0.lock().unwrap() = update;
  Ok(metadata)
}

#[tauri::command]
async fn install_app_update(
  _app: AppHandle,
  pending_update: State<'_, PendingUpdate>,
) -> Result<UpdateInstallResult, String> {
  let update = pending_update
    .0
    .lock()
    .unwrap()
    .take()
    .ok_or_else(|| "There is no pending desktop update to install.".to_string())?;

  update
    .download_and_install(|_, _| {}, || {})
    .await
    .map_err(|error| error.to_string())?;

  #[cfg(not(target_os = "windows"))]
  _app.restart();

  Ok(UpdateInstallResult {
    installed: true,
    restarted: !cfg!(target_os = "windows"),
    detail: if cfg!(target_os = "windows") {
      "The installer has been prepared. Windows may close the app to finish the update."
        .to_string()
    } else {
      "The update was installed and the app is restarting.".to_string()
    },
  })
}

#[tauri::command]
fn sovereign_code_review(
  code: String,
  file_path: String,
  language: Option<String>,
) -> SovereignCodeReview {
  reviewer::review_code(&code, &file_path, language.as_deref())
}

#[tauri::command]
fn emergency_shred(reason: String) -> IpcResponse {
  ok_response(
    "DRY_RUN_ONLY",
    Some(json!({
      "reason": reason,
      "mode": "dry-run",
      "plannedTargets": [
        "message_for_ahmed.bin",
        "session.key"
      ],
      "note": "Destructive shredding is disabled until the policy layer is implemented."
    })),
  )
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      app.manage(PendingUpdate(Mutex::new(None)));
      if runtime_updater_config().is_some() {
        app
          .handle()
          .plugin(tauri_plugin_updater::Builder::new().build())?;
      }

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      gratech_route,
      phalanx_health_check,
      forensics_scan,
      ensure_local_ollama,
      ollama_proxy,
      list_terminal_tools,
      run_terminal_command,
      updater_status,
      fetch_app_update,
      install_app_update,
      sovereign_code_review,
      emergency_shred
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
