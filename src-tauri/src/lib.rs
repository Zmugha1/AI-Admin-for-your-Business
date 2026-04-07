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
