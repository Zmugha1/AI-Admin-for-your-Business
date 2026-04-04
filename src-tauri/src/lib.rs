mod ollama;
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
