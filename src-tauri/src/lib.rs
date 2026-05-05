use std::collections::HashMap;
use std::process::Stdio;
use std::sync::Arc;
use tauri::{Emitter, State};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::Command;
use tokio::sync::Mutex;

struct AppState {
    processes: Arc<Mutex<HashMap<String, tokio::process::ChildStdin>>>,
}

#[tauri::command]
async fn run_command(
    id: String,
    command: String,
    cwd: Option<String>,
    env: Option<HashMap<String, String>>,
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let mut processes = state.processes.lock().await;

    // If process exists, send command to stdin
    if let Some(stdin) = processes.get_mut(&id) {
        let mut cmd_with_newline = command.clone();
        cmd_with_newline.push('\n');
        let _ = stdin.write_all(cmd_with_newline.as_bytes()).await;
        let _ = stdin.flush().await;
        return Ok(());
    }

    // Otherwise, spawn a new shell/process
    let mut cmd = if cfg!(target_os = "windows") {
        let mut c = Command::new("cmd");
        c.args(["/C", &command]);
        c
    } else {
        let mut c = Command::new("sh");
        c.args(["-c", &command]);
        c
    };

    if let Some(path) = cwd {
        cmd.current_dir(path);
    }

    if let Some(env_vars) = env {
        for (k, v) in env_vars {
            cmd.env(k, v);
        }
    }

    cmd.stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .stdin(Stdio::piped());

    let mut child = cmd.spawn().map_err(|e| e.to_string())?;

    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();
    let stdin = child.stdin.take().unwrap();

    let app_clone = app.clone();
    let id_clone = id.clone();
    tokio::spawn(async move {
        let mut reader = stdout;
        let mut buf = [0u8; 1024];
        loop {
            match tokio::io::AsyncReadExt::read(&mut reader, &mut buf).await {
                Ok(0) => break, // EOF
                Ok(n) => {
                    let output = String::from_utf8_lossy(&buf[..n]).to_string();
                    let _ = app_clone.emit(&format!("term-out-{}", id_clone), output);
                }
                Err(_) => break,
            }
        }
    });

    let app_clone = app.clone();
    let id_clone = id.clone();
    tokio::spawn(async move {
        let mut reader = stderr;
        let mut buf = [0u8; 1024];
        loop {
            match tokio::io::AsyncReadExt::read(&mut reader, &mut buf).await {
                Ok(0) => break,
                Ok(n) => {
                    let output = String::from_utf8_lossy(&buf[..n]).to_string();
                    let _ = app_clone.emit(&format!("term-out-{}", id_clone), output);
                }
                Err(_) => break,
            }
        }
    });

    processes.insert(id, stdin);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            processes: Arc::new(Mutex::new(HashMap::new())),
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![run_command])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
