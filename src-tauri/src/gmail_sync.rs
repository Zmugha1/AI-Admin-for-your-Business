use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct GmailMessage {
    pub id: String,
    #[serde(rename = "threadId")]
    pub thread_id: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GmailMessageDetail {
    pub id: String,
    pub snippet: Option<String>,
    pub payload: Option<GmailPayload>,
    #[serde(rename = "internalDate")]
    pub internal_date: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GmailPayload {
    pub headers: Option<Vec<GmailHeader>>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GmailHeader {
    pub name: String,
    pub value: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GmailListResponse {
    pub messages: Option<Vec<GmailMessage>>,
    #[serde(rename = "nextPageToken")]
    pub next_page_token: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct EmailNotification {
    pub notification_id: String,
    pub subject: String,
    pub sender: String,
    pub sender_email: String,
    pub snippet: String,
    pub google_message_id: String,
    pub received_at: String,
}

#[tauri::command]
pub async fn gmail_sync(
    access_token: String,
    contact_emails: Vec<String>,
) -> Result<Vec<EmailNotification>, String> {
    let client = reqwest::Client::new();
    let mut notifications = Vec::new();

    let query = if contact_emails.is_empty() {
        "is:unread newer_than:1d".to_string()
    } else {
        let from_query = contact_emails
            .iter()
            .map(|e| format!("from:{}", e))
            .collect::<Vec<_>>()
            .join(" OR ");
        format!("({}) newer_than:7d", from_query)
    };

    let list_resp = client
        .get("https://gmail.googleapis.com/gmail/v1/users/me/messages")
        .bearer_auth(&access_token)
        .query(&[
            ("q", query.as_str()),
            ("maxResults", "20"),
        ])
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !list_resp.status().is_success() {
        let body = list_resp.text().await.unwrap_or_default();
        return Err(format!("Gmail list error: {}", body));
    }

    let list: GmailListResponse = list_resp
        .json()
        .await
        .map_err(|e| format!("Gmail list parse: {}", e))?;

    let messages = list.messages.unwrap_or_default();

    for msg in messages.iter().take(20) {
        let detail_resp = client
            .get(format!(
                "https://gmail.googleapis.com/gmail/v1/users/me/messages/{}",
                msg.id
            ))
            .bearer_auth(&access_token)
            .query(&[
                ("format", "metadata"),
                ("metadataHeaders", "Subject"),
                ("metadataHeaders", "From"),
            ])
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !detail_resp.status().is_success() {
            continue;
        }

        let detail: GmailMessageDetail = detail_resp
            .json()
            .await
            .map_err(|e| e.to_string())?;

        let headers = detail
            .payload
            .as_ref()
            .and_then(|p| p.headers.as_ref())
            .cloned()
            .unwrap_or_default();

        let subject = headers
            .iter()
            .find(|h| h.name.eq_ignore_ascii_case("Subject"))
            .map(|h| h.value.clone())
            .unwrap_or_else(|| "(no subject)".to_string());

        let from = headers
            .iter()
            .find(|h| h.name.eq_ignore_ascii_case("From"))
            .map(|h| h.value.clone())
            .unwrap_or_default();

        let sender_email = if from.contains('<') {
            from.split('<')
                .nth(1)
                .unwrap_or("")
                .trim_end_matches('>')
                .to_string()
        } else {
            from.clone()
        };

        let sender_name = if from.contains('<') {
            from.split('<')
                .next()
                .unwrap_or("")
                .trim()
                .trim_matches('"')
                .to_string()
        } else {
            from.clone()
        };

        let received_at = detail
            .internal_date
            .as_deref()
            .unwrap_or("0")
            .parse::<i64>()
            .map(|ms| {
                let secs = ms / 1000;
                chrono::DateTime::<chrono::Utc>::from_timestamp(secs, 0)
                    .map(|dt| dt.format("%Y-%m-%d %H:%M:%S").to_string())
                    .unwrap_or_default()
            })
            .unwrap_or_default();

        notifications.push(EmailNotification {
            notification_id: uuid::Uuid::new_v4().to_string(),
            subject,
            sender: sender_name,
            sender_email,
            snippet: detail.snippet.unwrap_or_default(),
            google_message_id: msg.id.clone(),
            received_at,
        });
    }

    Ok(notifications)
}
