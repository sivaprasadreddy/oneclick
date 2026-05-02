use crate::db::DbState;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Contact {
    pub id: Option<i64>,
    pub first_name: String,
    pub last_name: Option<String>,
    pub email: Option<String>,
    pub mobile: Option<String>,
}

pub fn init_db(db_path: &std::path::Path) -> Result<Connection, rusqlite::Error> {
    let conn = Connection::open(db_path)?;
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS contacts (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name  TEXT,
            email      TEXT,
            mobile     TEXT
        );",
    )?;
    Ok(conn)
}

#[tauri::command]
pub fn get_contacts(state: State<DbState>) -> Result<Vec<Contact>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, first_name, last_name, email, mobile
             FROM contacts ORDER BY first_name ASC",
        )
        .map_err(|e| e.to_string())?;

    let contacts = stmt
        .query_map([], |row| {
            Ok(Contact {
                id: row.get(0)?,
                first_name: row.get(1)?,
                last_name: row.get(2)?,
                email: row.get(3)?,
                mobile: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(contacts)
}

#[tauri::command]
pub fn create_contact(state: State<DbState>, contact: Contact) -> Result<Contact, String> {
    if contact.first_name.trim().is_empty() {
        return Err("First name is required".to_string());
    }
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO contacts (first_name, last_name, email, mobile)
         VALUES (?1, ?2, ?3, ?4)",
        params![
            contact.first_name.trim(),
            contact.last_name.as_deref().filter(|s| !s.trim().is_empty()),
            contact.email.as_deref().filter(|s| !s.trim().is_empty()),
            contact.mobile.as_deref().filter(|s| !s.trim().is_empty()),
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(Contact {
        id: Some(conn.last_insert_rowid()),
        ..contact
    })
}

#[tauri::command]
pub fn update_contact(state: State<DbState>, contact: Contact) -> Result<(), String> {
    let id = contact.id.ok_or("Contact id is required for update")?;
    if contact.first_name.trim().is_empty() {
        return Err("First name is required".to_string());
    }
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE contacts
         SET first_name=?1, last_name=?2, email=?3, mobile=?4
         WHERE id=?5",
        params![
            contact.first_name.trim(),
            contact.last_name.as_deref().filter(|s| !s.trim().is_empty()),
            contact.email.as_deref().filter(|s| !s.trim().is_empty()),
            contact.mobile.as_deref().filter(|s| !s.trim().is_empty()),
            id,
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_contact(state: State<DbState>, id: i64) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM contacts WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
