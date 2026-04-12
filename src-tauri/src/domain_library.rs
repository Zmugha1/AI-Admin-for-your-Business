use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct ChunkResult {
    pub chunk_index: usize,
    pub text: String,
    pub token_count: usize,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct EmbeddingResult {
    pub chunk_index: usize,
    pub embedding: Vec<f32>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct OllamaEmbedRequest {
    pub model: String,
    pub prompt: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct OllamaEmbedResponse {
    pub embedding: Vec<f32>,
}

/// Split text into chunks of approximately
/// chunk_size tokens with overlap.
/// Uses word-based splitting as approximation.
/// 1 token approximately equals 0.75 words.
#[tauri::command]
pub async fn chunk_text(
    text: String,
    chunk_size: Option<usize>,
    overlap: Option<usize>,
) -> Result<Vec<ChunkResult>, String> {
    let size = chunk_size.unwrap_or(400);
    let overlap_tokens = overlap.unwrap_or(50);

    // Convert token counts to word counts
    // 1 token ~ 0.75 words
    let words_per_chunk =
        (size as f64 * 0.75) as usize;
    let overlap_words =
        (overlap_tokens as f64 * 0.75) as usize;

    let words: Vec<&str> =
        text.split_whitespace().collect();

    if words.is_empty() {
        return Ok(vec![]);
    }

    let mut chunks = Vec::new();
    let mut start = 0;
    let mut chunk_index = 0;

    while start < words.len() {
        let end = (start + words_per_chunk)
            .min(words.len());
        let chunk_words = &words[start..end];
        let chunk_text =
            chunk_words.join(" ");
        let token_count =
            (chunk_words.len() as f64 / 0.75)
                as usize;

        chunks.push(ChunkResult {
            chunk_index,
            text: chunk_text,
            token_count,
        });

        chunk_index += 1;

        if end >= words.len() {
            break;
        }

        // Move forward by chunk size minus overlap
        let step = if words_per_chunk > overlap_words {
            words_per_chunk - overlap_words
        } else {
            words_per_chunk
        };
        start += step;
    }

    Ok(chunks)
}

/// Generate embedding for a single text
/// chunk using nomic-embed-text via Ollama.
/// Calls Ollama HTTP API directly from Rust
/// because this is a background service
/// not a user-facing invoke call.
#[tauri::command]
pub async fn embed_chunk(
    chunk_text: String,
) -> Result<Vec<f32>, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;

    let request = OllamaEmbedRequest {
        model: "nomic-embed-text:latest"
            .to_string(),
        prompt: chunk_text,
    };

    let response = client
        .post("http://127.0.0.1:11434/api/embeddings")
        .json(&request)
        .send()
        .await
        .map_err(|e| format!(
            "Ollama embed request failed: {}", e
        ))?;

    let result: OllamaEmbedResponse = response
        .json()
        .await
        .map_err(|e| format!(
            "Embed response parse failed: {}", e
        ))?;

    Ok(result.embedding)
}

/// Compute cosine similarity between
/// two embedding vectors.
#[tauri::command]
pub async fn cosine_similarity(
    vec_a: Vec<f32>,
    vec_b: Vec<f32>,
) -> Result<f32, String> {
    if vec_a.len() != vec_b.len() {
        return Err(
            "Vector dimensions do not match"
                .to_string()
        );
    }

    let dot: f32 = vec_a.iter()
        .zip(vec_b.iter())
        .map(|(a, b)| a * b)
        .sum();

    let mag_a: f32 = vec_a.iter()
        .map(|x| x * x)
        .sum::<f32>()
        .sqrt();

    let mag_b: f32 = vec_b.iter()
        .map(|x| x * x)
        .sum::<f32>()
        .sqrt();

    if mag_a == 0.0 || mag_b == 0.0 {
        return Ok(0.0);
    }

    Ok(dot / (mag_a * mag_b))
}

/// Read a text file from the filesystem.
/// Used to ingest documents into the
/// domain library.
#[tauri::command]
pub async fn read_text_file(
    file_path: String,
) -> Result<String, String> {
    tokio::fs::read_to_string(&file_path)
        .await
        .map_err(|e| format!(
            "File read failed: {}", e
        ))
}
