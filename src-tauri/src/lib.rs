mod contacts;
mod db;
mod notes;
mod reminders;

use db::DbState;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&app_data_dir)?;
            let db_path = app_data_dir.join("oneclick.db");
            let conn = contacts::init_db(&db_path).expect("failed to initialize database");
            notes::init_table(&conn).expect("failed to initialize notes table");
            reminders::init_table(&conn).expect("failed to initialize reminders table");
            app.manage(DbState(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            contacts::get_contacts,
            contacts::create_contact,
            contacts::update_contact,
            contacts::delete_contact,
            notes::get_notes,
            notes::create_note,
            notes::update_note,
            notes::delete_note,
            reminders::get_reminders,
            reminders::create_reminder,
            reminders::update_reminder,
            reminders::delete_reminder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
