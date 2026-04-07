use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CalendarEvent {
    pub id: String,
    pub summary: Option<String>,
    pub start: Option<EventDateTime>,
    pub end: Option<EventDateTime>,
    pub attendees: Option<Vec<Attendee>>,
    pub description: Option<String>,
    pub location: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct EventDateTime {
    #[serde(rename = "dateTime")]
    pub date_time: Option<String>,
    pub date: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Attendee {
    pub email: Option<String>,
    #[serde(rename = "displayName")]
    pub display_name: Option<String>,
    #[serde(rename = "responseStatus")]
    pub response_status: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CalendarListResponse {
    pub items: Option<Vec<CalendarEvent>>,
    #[serde(rename = "nextPageToken")]
    pub next_page_token: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SyncedEvent {
    pub event_id: String,
    pub title: String,
    pub start_time: String,
    pub end_time: String,
    pub attendees: String,
    pub google_event_id: String,
}

#[tauri::command]
pub async fn calendar_sync(
    access_token: String,
    days_ahead: Option<u32>,
) -> Result<Vec<SyncedEvent>, String> {
    let client = reqwest::Client::new();
    let days = days_ahead.unwrap_or(7);

    let now = chrono::Utc::now();
    let time_min = now.format("%Y-%m-%dT%H:%M:%SZ").to_string();
    let time_max = (now + chrono::Duration::days(days as i64))
        .format("%Y-%m-%dT%H:%M:%SZ")
        .to_string();

    let response = client
        .get("https://www.googleapis.com/calendar/v3/calendars/primary/events")
        .bearer_auth(&access_token)
        .query(&[
            ("timeMin", time_min.as_str()),
            ("timeMax", time_max.as_str()),
            ("singleEvents", "true"),
            ("orderBy", "startTime"),
            ("maxResults", "20"),
        ])
        .send()
        .await
        .map_err(|e| format!("Calendar API error: {}", e))?;

    if !response.status().is_success() {
        let body = response.text().await.unwrap_or_default();
        return Err(format!("Calendar API error: {}", body));
    }

    let list: CalendarListResponse = response
        .json()
        .await
        .map_err(|e| format!("Calendar parse: {}", e))?;

    let events = list.items.unwrap_or_default();
    let mut synced = Vec::new();

    for event in events {
        let title = event
            .summary
            .clone()
            .unwrap_or_else(|| "Untitled Meeting".to_string());

        let start_time = event
            .start
            .as_ref()
            .and_then(|s| s.date_time.as_ref().or(s.date.as_ref()))
            .cloned()
            .unwrap_or_default();

        let end_time = event
            .end
            .as_ref()
            .and_then(|e| e.date_time.as_ref().or(e.date.as_ref()))
            .cloned()
            .unwrap_or_default();

        let attendees_str = event
            .attendees
            .as_ref()
            .map(|att| {
                att.iter()
                    .filter_map(|a| a.email.as_ref())
                    .cloned()
                    .collect::<Vec<_>>()
                    .join(", ")
            })
            .unwrap_or_default();

        synced.push(SyncedEvent {
            event_id: uuid::Uuid::new_v4().to_string(),
            title,
            start_time,
            end_time,
            attendees: attendees_str,
            google_event_id: event.id,
        });
    }

    Ok(synced)
}
