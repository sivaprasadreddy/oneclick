use crate::db::DbState;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Reminder {
    pub id: Option<i64>,
    pub title: String,
    pub content: Option<String>,
    pub scheduled_on: String,
    pub created_on: Option<String>,
}

pub fn init_table(conn: &rusqlite::Connection) -> Result<(), rusqlite::Error> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS reminders (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            title        TEXT NOT NULL,
            content      TEXT,
            scheduled_on TEXT NOT NULL,
            created_on   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );",
    )?;
    Ok(())
}

#[tauri::command]
pub fn get_reminders(state: State<DbState>) -> Result<Vec<Reminder>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, title, content, scheduled_on, created_on
             FROM reminders ORDER BY scheduled_on ASC",
        )
        .map_err(|e| e.to_string())?;

    let reminders = stmt
        .query_map([], |row| {
            Ok(Reminder {
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                scheduled_on: row.get(3)?,
                created_on: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(reminders)
}

#[tauri::command]
pub fn create_reminder(state: State<DbState>, reminder: Reminder) -> Result<Reminder, String> {
    if reminder.title.trim().is_empty() {
        return Err("Title is required".to_string());
    }
    if reminder.scheduled_on.trim().is_empty() {
        return Err("Scheduled date/time is required".to_string());
    }
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO reminders (title, content, scheduled_on) VALUES (?1, ?2, ?3)",
        params![
            reminder.title.trim(),
            reminder.content.as_deref().filter(|s| !s.trim().is_empty()),
            reminder.scheduled_on.trim(),
        ],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    let created = conn
        .query_row(
            "SELECT id, title, content, scheduled_on, created_on FROM reminders WHERE id = ?1",
            params![id],
            |row| {
                Ok(Reminder {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    content: row.get(2)?,
                    scheduled_on: row.get(3)?,
                    created_on: row.get(4)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(created)
}

#[tauri::command]
pub fn update_reminder(state: State<DbState>, reminder: Reminder) -> Result<(), String> {
    let id = reminder.id.ok_or("Reminder id is required for update")?;
    if reminder.title.trim().is_empty() {
        return Err("Title is required".to_string());
    }
    if reminder.scheduled_on.trim().is_empty() {
        return Err("Scheduled date/time is required".to_string());
    }
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE reminders SET title=?1, content=?2, scheduled_on=?3 WHERE id=?4",
        params![
            reminder.title.trim(),
            reminder.content.as_deref().filter(|s| !s.trim().is_empty()),
            reminder.scheduled_on.trim(),
            id,
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_reminder(state: State<DbState>, id: i64) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM reminders WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
