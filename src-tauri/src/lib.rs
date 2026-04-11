mod ollama;
mod google_auth;
mod gmail_sync;
mod calendar_sync;

use calendar_sync::calendar_sync;
use gmail_sync::gmail_sync;
use google_auth::{
    google_auth_exchange, google_auth_listen, google_auth_start,
    google_refresh_token, google_revoke_token,
};
use ollama::{ollama_embed, ollama_generate, ollama_health_check};
use std::process::Command;

#[tauri::command]
async fn start_ollama() -> Result<String, String> {
    let check = Command::new("ollama").arg("list").output();

    match check {
        Ok(output) if output.status.success() => {
            return Ok("Ollama is already running".to_string());
        }
        _ => {}
    }

    let result = Command::new("ollama").arg("serve").spawn();

    match result {
        Ok(child) => {
            std::mem::forget(child);
            tokio::time::sleep(std::time::Duration::from_secs(2)).await;
            Ok("Ollama started successfully".to_string())
        }
        Err(e) => Err(format!("Failed to start Ollama: {}", e)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:zubia_pulse.db", vec![])
                .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            start_ollama,
            ollama_generate,
            ollama_health_check,
            ollama_embed,
            google_auth_start,
            google_auth_listen,
            google_auth_exchange,
            google_refresh_token,
            google_revoke_token,
            gmail_sync,
            calendar_sync,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
