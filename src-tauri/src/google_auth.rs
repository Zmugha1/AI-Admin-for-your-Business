use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Debug)]
pub struct TokenResponse {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_in: Option<u64>,
    pub token_type: Option<String>,
    pub scope: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GoogleCredentials {
    pub client_id: String,
    pub client_secret: String,
}

fn load_credentials() -> Result<GoogleCredentials, String> {
    let creds_path = std::path::PathBuf::from(
        std::env::var("CARGO_MANIFEST_DIR")
            .unwrap_or_else(|_| ".".to_string()),
    )
    .parent()
    .unwrap_or(std::path::Path::new("."))
    .join("google_credentials.json");

    let content = std::fs::read_to_string(&creds_path).map_err(|e| {
        format!("Cannot read google_credentials.json: {}", e)
    })?;

    let json: serde_json::Value =
        serde_json::from_str(&content).map_err(|e| e.to_string())?;

    let installed = json
        .get("installed")
        .or_else(|| json.get("web"))
        .ok_or_else(|| "Invalid credentials format".to_string())?;

    Ok(GoogleCredentials {
        client_id: installed["client_id"]
            .as_str()
            .unwrap_or("")
            .to_string(),
        client_secret: installed["client_secret"]
            .as_str()
            .unwrap_or("")
            .to_string(),
    })
}

#[tauri::command]
pub async fn google_auth_start() -> Result<String, String> {
    let creds = load_credentials()?;

    let scopes = vec![
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
    ];

    let scope_str = scopes.join(" ");
    let redirect_uri = "http://localhost:8765/callback";

    let state: String = (0..16)
        .map(|_| format!("{:02x}", rand::random::<u8>()))
        .collect();

    let auth_url = format!(
        "https://accounts.google.com/o/oauth2/v2/auth\
        ?client_id={}\
        &redirect_uri={}\
        &response_type=code\
        &scope={}\
        &access_type=offline\
        &prompt=consent\
        &state={}",
        urlencoding::encode(&creds.client_id),
        urlencoding::encode(redirect_uri),
        urlencoding::encode(&scope_str),
        state
    );

    open::that(&auth_url).map_err(|e| format!("Cannot open browser: {}", e))?;

    Ok(auth_url)
}

#[tauri::command]
pub async fn google_auth_exchange(code: String) -> Result<TokenResponse, String> {
    let creds = load_credentials()?;
    let redirect_uri = "http://localhost:8765/callback";

    let client = reqwest::Client::new();
    let mut params = HashMap::new();
    params.insert("code", code.as_str());
    params.insert("client_id", creds.client_id.as_str());
    params.insert("client_secret", creds.client_secret.as_str());
    params.insert("redirect_uri", redirect_uri);
    params.insert("grant_type", "authorization_code");

    let response = client
        .post("https://oauth2.googleapis.com/token")
        .form(&params)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let body = response.text().await.unwrap_or_default();
        return Err(format!("Token exchange failed: {}", body));
    }

    let token: TokenResponse = response
        .json()
        .await
        .map_err(|e| format!("Token parse failed: {}", e))?;

    Ok(token)
}

#[tauri::command]
pub async fn google_refresh_token(refresh_token: String) -> Result<TokenResponse, String> {
    let creds = load_credentials()?;

    let client = reqwest::Client::new();
    let mut params = HashMap::new();
    params.insert("refresh_token", refresh_token.as_str());
    params.insert("client_id", creds.client_id.as_str());
    params.insert("client_secret", creds.client_secret.as_str());
    params.insert("grant_type", "refresh_token");

    let response = client
        .post("https://oauth2.googleapis.com/token")
        .form(&params)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let body = response.text().await.unwrap_or_default();
        return Err(format!("Refresh failed: {}", body));
    }

    let token: TokenResponse = response
        .json()
        .await
        .map_err(|e| format!("Refresh failed: {}", e))?;

    Ok(token)
}

#[tauri::command]
pub async fn google_revoke_token(access_token: String) -> Result<bool, String> {
    let client = reqwest::Client::new();
    let response = client
        .post("https://oauth2.googleapis.com/revoke")
        .query(&[("token", &access_token)])
        .send()
        .await
        .map_err(|e| e.to_string())?;

    Ok(response.status().is_success())
}
