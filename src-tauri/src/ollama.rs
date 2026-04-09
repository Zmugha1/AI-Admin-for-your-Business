use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct OllamaResponse {
    pub response: String,
}

#[tauri::command]
pub async fn ollama_generate(
    prompt: String,
    system: String,
) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(600))
        .build()
        .map_err(|e| e.to_string())?;

    let body = serde_json::json!({
        "model": "qwen2.5:7b-instruct-q4_k_m",
        "prompt": prompt,
        "system": system,
        "stream": false,
        "options": {
            "num_ctx": 32768,
            "num_predict": 2048,
            "temperature": 0.1
        }
    });

    let response = client
        .post("http://127.0.0.1:11434/api/generate")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Ollama connection failed: {}", e))?;

    let result: OllamaResponse = response
        .json()
        .await
        .map_err(|e| format!("Ollama parse failed: {}", e))?;

    Ok(result.response)
}

#[tauri::command]
pub async fn ollama_health_check() -> Result<bool, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| e.to_string())?;

    match client
        .get("http://127.0.0.1:11434/api/tags")
        .send()
        .await
    {
        Ok(r) => Ok(r.status().is_success()),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
pub async fn ollama_embed(text: String) -> Result<Vec<f32>, String> {
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "model": "nomic-embed-text",
        "prompt": text
    });
    let response = client
        .post("http://127.0.0.1:11434/api/embeddings")
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let result: serde_json::Value = response
        .json()
        .await
        .map_err(|e| e.to_string())?;
    let embedding: Vec<f32> = result["embedding"]
        .as_array()
        .map(|arr| {
            arr.iter()
                .filter_map(|v| v.as_f64().map(|f| f as f32))
                .collect()
        })
        .unwrap_or_default();
    Ok(embedding)
}
