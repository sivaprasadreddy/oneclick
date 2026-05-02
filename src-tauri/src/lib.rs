mod contacts;

use contacts::DbState;
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
            let conn =
                contacts::init_db(&db_path).expect("failed to initialize database");
            app.manage(DbState(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            contacts::get_contacts,
            contacts::create_contact,
            contacts::update_contact,
            contacts::delete_contact,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
