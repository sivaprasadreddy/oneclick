use crate::db::DbState;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Expense {
    pub id: Option<i64>,
    pub description: String,
    pub amount: f64,
    pub expense_date_time: Option<String>,
    pub created_on: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ExpensePage {
    pub items: Vec<Expense>,
    pub total: i64,
    pub page: u32,
    pub page_size: u32,
}

pub fn init_table(conn: &rusqlite::Connection) -> Result<(), rusqlite::Error> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS expenses (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            description       TEXT NOT NULL,
            amount            REAL NOT NULL,
            expense_date_time TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            created_on        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );",
    )?;
    Ok(())
}

#[tauri::command]
pub fn get_expenses(
    state: State<DbState>,
    page: u32,
    page_size: u32,
    search: Option<String>,
) -> Result<ExpensePage, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let pattern = format!("%{}%", search.as_deref().unwrap_or("").trim());
    let offset = (page.saturating_sub(1) as i64) * page_size as i64;

    let total: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM expenses WHERE description LIKE ?1",
            params![pattern],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, description, amount, expense_date_time, created_on
             FROM expenses
             WHERE description LIKE ?1
             ORDER BY expense_date_time DESC
             LIMIT ?2 OFFSET ?3",
        )
        .map_err(|e| e.to_string())?;

    let items = stmt
        .query_map(params![pattern, page_size as i64, offset], |row| {
            Ok(Expense {
                id: row.get(0)?,
                description: row.get(1)?,
                amount: row.get(2)?,
                expense_date_time: row.get(3)?,
                created_on: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(ExpensePage { items, total, page, page_size })
}

#[tauri::command]
pub fn create_expense(state: State<DbState>, expense: Expense) -> Result<Expense, String> {
    if expense.description.trim().is_empty() {
        return Err("Description is required".to_string());
    }
    if expense.amount <= 0.0 {
        return Err("Amount must be greater than zero".to_string());
    }
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    let edt = expense
        .expense_date_time
        .as_deref()
        .filter(|s| !s.trim().is_empty());

    if let Some(edt) = edt {
        conn.execute(
            "INSERT INTO expenses (description, amount, expense_date_time)
             VALUES (?1, ?2, ?3)",
            params![expense.description.trim(), expense.amount, edt],
        )
        .map_err(|e| e.to_string())?;
    } else {
        conn.execute(
            "INSERT INTO expenses (description, amount) VALUES (?1, ?2)",
            params![expense.description.trim(), expense.amount],
        )
        .map_err(|e| e.to_string())?;
    }

    let id = conn.last_insert_rowid();
    let created = conn
        .query_row(
            "SELECT id, description, amount, expense_date_time, created_on
             FROM expenses WHERE id = ?1",
            params![id],
            |row| {
                Ok(Expense {
                    id: row.get(0)?,
                    description: row.get(1)?,
                    amount: row.get(2)?,
                    expense_date_time: row.get(3)?,
                    created_on: row.get(4)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(created)
}

#[tauri::command]
pub fn update_expense(state: State<DbState>, expense: Expense) -> Result<(), String> {
    let id = expense.id.ok_or("Expense id is required for update")?;
    if expense.description.trim().is_empty() {
        return Err("Description is required".to_string());
    }
    if expense.amount <= 0.0 {
        return Err("Amount must be greater than zero".to_string());
    }
    let edt = expense
        .expense_date_time
        .as_deref()
        .filter(|s| !s.trim().is_empty())
        .ok_or("Expense date/time is required")?;

    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE expenses SET description=?1, amount=?2, expense_date_time=?3 WHERE id=?4",
        params![expense.description.trim(), expense.amount, edt, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_expense(state: State<DbState>, id: i64) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM expenses WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
