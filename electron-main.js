import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import initSqlJs from 'sql.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = app.isPackaged;

// Určenie cesty k databáze pre Portable režim
let dbDir;
if (process.env.PORTABLE_EXECUTABLE_DIR) {
    dbDir = process.env.PORTABLE_EXECUTABLE_DIR;
} else if (isProd) {
    dbDir = path.dirname(app.getPath('exe'));
} else {
    dbDir = app.getPath('userData');
}

if (!existsSync(dbDir)) {
    try { mkdirSync(dbDir, { recursive: true }); } catch (e) {}
}

const dbPath = path.join(dbDir, 'devtrack_data.db');

let db;
let dbReady = false;
let splashWindow;
let mainWindow;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 420,
    height: 320,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    show: true, // Zobraziť OKAMŽITE bez čakania
    backgroundColor: '#0f172a',
    webPreferences: { 
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  
  // Načítanie lokálneho súboru je extrémne rýchle
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
}

async function startDb() {
  try {
    const SQL = await initSqlJs();
    if (existsSync(dbPath)) {
      const fileBuffer = readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
    } else {
      db = new SQL.Database();
      db.run(`
        CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, name TEXT, address TEXT);
        CREATE TABLE IF NOT EXISTS tickets (id TEXT PRIMARY KEY, customerId TEXT, sapId TEXT, sapModule TEXT, title TEXT, description TEXT, priority TEXT, status TEXT, budget INTEGER, estimation INTEGER, date TEXT, createdAt TEXT);
        CREATE TABLE IF NOT EXISTS worklogs (id TEXT PRIMARY KEY, customerId TEXT, ticketId TEXT, manualTicketId TEXT, manualModule TEXT, date TEXT, hours REAL, description TEXT);
      `);
      persistDb();
    }
    dbReady = true;
  } catch (err) {
    console.error('Kritická chyba DB:', err);
  }
}

function persistDb() {
  if (!db) return;
  try {
    const data = db.export();
    writeFileSync(dbPath, Buffer.from(data));
  } catch (err) {
    console.error('Chyba pri zápise DB:', err);
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false, // Skryté, kým React nie je ready
    title: "DevTrack Pro",
    backgroundColor: '#f8fafc',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    autoHideMenuBar: true,
  });

  if (isProd) {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }
}

// Signál z Reactu (index.tsx), že všetko je načítané
ipcMain.on('renderer-ready', () => {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
  }
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

// IPC handlery pre DB
ipcMain.handle('db-get-all', async (e, table) => {
  while (!dbReady) await new Promise(r => setTimeout(r, 20));
  try {
    const res = db.exec(`SELECT * FROM ${table}`);
    if (res.length === 0) return [];
    const columns = res[0].columns;
    return res[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => obj[col] = row[i]);
      return obj;
    });
  } catch (err) { return []; }
});

ipcMain.handle('db-put', async (e, { table, item }) => {
  while (!dbReady) await new Promise(r => setTimeout(r, 20));
  const cols = Object.keys(item);
  const placeholders = cols.map(() => '?').join(',');
  db.run(`INSERT OR REPLACE INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`, Object.values(item));
  persistDb();
  return true;
});

ipcMain.handle('db-bulk-put', async (e, { table, items }) => {
  while (!dbReady) await new Promise(r => setTimeout(r, 20));
  if (!items?.length) return true;
  db.run("BEGIN TRANSACTION");
  const cols = Object.keys(items[0]);
  const placeholders = cols.map(() => '?').join(',');
  const sql = `INSERT OR REPLACE INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`;
  items.forEach(item => db.run(sql, Object.values(item)));
  db.run("COMMIT");
  persistDb();
  return true;
});

ipcMain.handle('db-delete', async (e, { table, id }) => {
  while (!dbReady) await new Promise(r => setTimeout(r, 20));
  db.run(`DELETE FROM ${table} WHERE id = ?`, [id]);
  persistDb();
  return true;
});

app.whenReady().then(() => {
  createSplashWindow(); // 1. Zobraziť Splash (show: true zabezpečí bleskový štart)
  startDb();            // 2. Inicializovať DB
  createMainWindow();   // 3. Pripraviť hlavné okno
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});