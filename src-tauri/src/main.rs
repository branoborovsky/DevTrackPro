
// Prevencia otvárania konzoly na Windowse v produkcii
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::{Manager, State};

struct DbState(Mutex<Connection>);
struct DbMetadata {
    is_new: bool,
}

#[derive(Serialize, Deserialize, Clone)]
struct AppConfig {
    db_path: Option<String>,
}

impl AppConfig {
    fn load(app_handle: &tauri::AppHandle) -> Self {
        let config_dir = app_handle.path().app_config_dir().unwrap_or_else(|_| PathBuf::from("."));
        let config_file = config_dir.join("config.json");
        
        if config_file.exists() {
            if let Ok(content) = fs::read_to_string(config_file) {
                if let Ok(config) = serde_json::from_str(&content) {
                    return config;
                }
            }
        }
        AppConfig { db_path: None }
    }

    fn save(&self, app_handle: &tauri::AppHandle) -> Result<(), String> {
        let config_dir = app_handle.path().app_config_dir().unwrap_or_else(|_| PathBuf::from("."));
        if !config_dir.exists() {
            fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;
        }
        let config_file = config_dir.join("config.json");
        let content = serde_json::to_string_pretty(self).map_err(|e| e.to_string())?;
        fs::write(config_file, content).map_err(|e| e.to_string())?;
        Ok(())
    }
}

#[tauri::command]
fn get_db_path(app_handle: tauri::AppHandle) -> String {
    let config = AppConfig::load(&app_handle);
    if let Some(path) = config.db_path {
        path
    } else {
        let exe_path = std::env::current_exe().unwrap();
        let db_dir = exe_path.parent().unwrap();
        db_dir.join("devtrack_data.db").to_string_lossy().to_string()
    }
}

#[tauri::command]
fn is_new_database(metadata: State<'_, DbMetadata>) -> bool {
    metadata.is_new
}

#[tauri::command]
fn set_db_path(app_handle: tauri::AppHandle, new_path: String) -> Result<(), String> {
    let mut config = AppConfig::load(&app_handle);
    let old_path_str = get_db_path(app_handle.clone());
    let old_path = Path::new(&old_path_str);
    let new_path_buf = PathBuf::from(&new_path);

    if old_path.exists() && old_path_str != new_path {
        let final_new_path = if new_path_buf.is_dir() {
            new_path_buf.join("devtrack_data.db")
        } else {
            new_path_buf
        };

        if let Some(parent) = final_new_path.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }

        fs::copy(old_path, &final_new_path).map_err(|e| e.to_string())?;
        config.db_path = Some(final_new_path.to_string_lossy().to_string());
    } else {
        config.db_path = Some(new_path);
    }

    config.save(&app_handle)?;
    Ok(())
}

#[tauri::command]
fn db_get_all(state: State<'_, DbState>, table: String) -> Result<Vec<Value>, String> {
    let db = state.0.lock().unwrap();
    let mut stmt = db.prepare(&format!("SELECT * FROM {}", table)).map_err(|e| e.to_string())?;
    
    let column_names: Vec<String> = stmt.column_names().iter().map(|s| s.to_string()).collect();
    
    let rows = stmt.query_map([], |row| {
        let mut map = serde_json::Map::new();
        for (i, name) in column_names.iter().enumerate() {
            let val: Value = match row.get_ref(i).unwrap() {
                rusqlite::types::ValueRef::Null => Value::Null,
                rusqlite::types::ValueRef::Integer(val) => Value::from(val),
                rusqlite::types::ValueRef::Real(val) => Value::from(val),
                rusqlite::types::ValueRef::Text(val) => {
                    let text = std::str::from_utf8(val).unwrap_or("");
                    Value::from(text)
                },
                rusqlite::types::ValueRef::Blob(val) => Value::from(val),
            };
            map.insert(name.clone(), val);
        }
        Ok(Value::Object(map))
    }).map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    for row in rows {
        results.push(row.map_err(|e| e.to_string())?);
    }
    Ok(results)
}

#[tauri::command]
fn db_put(state: State<'_, DbState>, table: String, item: Value) -> Result<(), String> {
    let db = state.0.lock().unwrap();
    let obj = item.as_object().ok_or("Item must be an object")?;
    
    let columns: Vec<String> = obj.keys().cloned().collect();
    let placeholders: Vec<String> = columns.iter().map(|_| "?".to_string()).collect();
    
    let sql = format!(
        "INSERT OR REPLACE INTO {} ({}) VALUES ({})",
        table,
        columns.join(", "),
        placeholders.join(", ")
    );

    let mut stmt = db.prepare(&sql).map_err(|e| e.to_string())?;
    
    let params_vec: Vec<Box<dyn rusqlite::ToSql>> = obj.values().map(|v| {
        if v.is_string() {
            Box::new(v.as_str().unwrap().to_string()) as Box<dyn rusqlite::ToSql>
        } else if v.is_boolean() {
            Box::new(if v.as_bool().unwrap() { 1 } else { 0 }) as Box<dyn rusqlite::ToSql>
        } else if v.is_number() {
            if v.is_i64() {
                Box::new(v.as_i64().unwrap()) as Box<dyn rusqlite::ToSql>
            } else {
                Box::new(v.as_f64().unwrap()) as Box<dyn rusqlite::ToSql>
            }
        } else if v.is_null() {
            Box::new(rusqlite::types::Null) as Box<dyn rusqlite::ToSql>
        } else {
            Box::new(v.to_string()) as Box<dyn rusqlite::ToSql>
        }
    }).collect();

    let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|b| b.as_ref()).collect();
    stmt.execute(params_refs.as_slice()).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
fn db_bulk_put(state: State<'_, DbState>, table: String, items: Vec<Value>) -> Result<(), String> {
    if items.is_empty() { return Ok(()); }
    
    let mut db = state.0.lock().unwrap();
    let tx = db.transaction().map_err(|e| e.to_string())?;

    for item in items {
        let obj = item.as_object().ok_or("Item must be an object")?;
        let columns: Vec<String> = obj.keys().cloned().collect();
        let placeholders: Vec<String> = columns.iter().map(|_| "?".to_string()).collect();
        let sql = format!("INSERT OR REPLACE INTO {} ({}) VALUES ({})", table, columns.join(", "), placeholders.join(", "));
        
        let params_vec: Vec<Box<dyn rusqlite::ToSql>> = obj.values().map(|v| {
            if v.is_string() { Box::new(v.as_str().unwrap().to_string()) as Box<dyn rusqlite::ToSql> }
            else if v.is_boolean() { Box::new(if v.as_bool().unwrap() { 1 } else { 0 }) as Box<dyn rusqlite::ToSql> }
            else if v.is_number() { if v.is_i64() { Box::new(v.as_i64().unwrap()) as Box<dyn rusqlite::ToSql> } else { Box::new(v.as_f64().unwrap()) as Box<dyn rusqlite::ToSql> } }
            else if v.is_null() { Box::new(rusqlite::types::Null) as Box<dyn rusqlite::ToSql> }
            else { Box::new(v.to_string()) as Box<dyn rusqlite::ToSql> }
        }).collect();
        let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|b| b.as_ref()).collect();
        tx.execute(&sql, params_refs.as_slice()).map_err(|e| e.to_string())?;
    }
    
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn db_delete(state: State<'_, DbState>, table: String, id: String) -> Result<(), String> {
    let db = state.0.lock().unwrap();
    db.execute(&format!("DELETE FROM {} WHERE id = ?", table), params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn db_clear_all(state: State<'_, DbState>) -> Result<(), String> {
    let mut db = state.0.lock().unwrap();
    let tx = db.transaction().map_err(|e| e.to_string())?;
    
    tx.execute("DELETE FROM clients", []).map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM customers", []).map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM tickets", []).map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM worklogs", []).map_err(|e| e.to_string())?;
    
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle();
            let db_path_str = get_db_path(handle.clone());
            let db_path = Path::new(&db_path_str);
            
            // Kontrola, či databáza už existuje pred jej otvorením
            let is_new = !db_path.exists();
            
            if let Some(parent) = db_path.parent() {
                fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
            
            let conn = Connection::open(db_path).map_err(|e| e.to_string())?;
            
            conn.execute("CREATE TABLE IF NOT EXISTS clients (id TEXT PRIMARY KEY, name TEXT, code TEXT, address TEXT)", []).map_err(|e| e.to_string())?;
            conn.execute("CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, clientId TEXT, name TEXT, address TEXT, isInactive INTEGER DEFAULT 0)", []).map_err(|e| e.to_string())?;
            conn.execute("CREATE TABLE IF NOT EXISTS tickets (id TEXT PRIMARY KEY, clientId TEXT, customerId TEXT, sapId TEXT, sapModule TEXT, title TEXT, description TEXT, priority TEXT, status TEXT, budget INTEGER, estimation INTEGER, date TEXT, createdAt TEXT, startDate TEXT)", []).map_err(|e| e.to_string())?;
            conn.execute("CREATE TABLE IF NOT EXISTS worklogs (id TEXT PRIMARY KEY, clientId TEXT, customerId TEXT, ticketId TEXT, manualTicketId TEXT, manualModule TEXT, date TEXT, hours REAL, description TEXT, invoiceNumber TEXT, billingDate TEXT)", []).map_err(|e| e.to_string())?;
            
            app.manage(DbState(Mutex::new(conn)));
            app.manage(DbMetadata { is_new });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            db_get_all, 
            db_put, 
            db_bulk_put, 
            db_delete,
            db_clear_all,
            get_db_path,
            set_db_path,
            is_new_database
        ])
        .run(tauri::generate_context!())
        .expect("Chyba pri spúšťaní Tauri aplikácie");
}
