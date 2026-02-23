
import { invoke } from '@tauri-apps/api/core';

/**
 * DatabaseService zabezpečuje natívny prístup k SQLite cez Tauri Rust backend.
 * Obsahuje "fallback" do LocalStorage, ak aplikácia beží v čistom prehliadači (pre testovacie účely).
 */
export class DatabaseService {
  // Kontrola, či bežíme v prostredí Tauri (vtedy je definovaný __TAURI_INTERNALS__)
  private isTauri = !!(window as any).__TAURI_INTERNALS__;

  async init(): Promise<void> {
    if (!this.isTauri) {
      console.warn("DevTrack: Režim simulácie (LocalStorage). Pre SQLite použi 'npm run tauri dev'.");
    }
  }

  /**
   * Získa všetky záznamy z danej tabuľky.
   */
  async getAll<T>(table: string): Promise<T[]> {
    if (this.isTauri) {
      try {
        // Volanie Rust funkcie definovanej v src-tauri/src/main.rs
        return await invoke<T[]>('db_get_all', { table });
      } catch (err) {
        console.error(`Chyba pri čítaní z tabuľky ${table}:`, err);
        return [];
      }
    }
    const data = localStorage.getItem(`dt_${table}`);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Uloží jeden záznam (Insert alebo Replace).
   */
  async put<T>(table: string, item: any): Promise<void> {
    if (this.isTauri) {
      try {
        await invoke('db_put', { table, item });
        return;
      } catch (err) {
        console.error(`Chyba pri zápise do tabuľky ${table}:`, err);
      }
    }
    const items = await this.getAll<any>(table);
    const index = items.findIndex((i: any) => i.id === item.id);
    if (index !== -1) items[index] = item; else items.push(item);
    localStorage.setItem(`dt_${table}`, JSON.stringify(items));
  }

  /**
   * Hromadný zápis dát (používa transakciu v SQLite pre výkon).
   */
  async bulkPut<T>(table: string, items: T[]): Promise<void> {
    if (this.isTauri) {
      if (items.length === 0) return;
      try {
        await invoke('db_bulk_put', { table, items });
        return;
      } catch (err) {
        console.error(`Chyba pri hromadnom zápise do ${table}:`, err);
      }
    }
    localStorage.setItem(`dt_${table}`, JSON.stringify(items));
  }

  /**
   * Odstráni záznam podľa ID.
   */
  async delete(table: string, id: string): Promise<void> {
    if (this.isTauri) {
      try {
        await invoke('db_delete', { table, id });
        return;
      } catch (err) {
        console.error(`Chyba pri mazaní z ${table}:`, err);
      }
    }
    const items = await this.getAll<any>(table);
    localStorage.setItem(`dt_${table}`, JSON.stringify(items.filter((i: any) => i.id !== id)));
  }

  /**
   * Vymaže všetky záznamy zo všetkých tabuliek.
   */
  async clearAll(): Promise<void> {
    if (this.isTauri) {
      try {
        await invoke('db_clear_all');
        return;
      } catch (err) {
        console.error(`Chyba pri mazaní databázy:`, err);
      }
    } else {
      ['clients', 'customers', 'tickets', 'worklogs'].forEach(t => localStorage.removeItem(`dt_${t}`));
    }
  }
}

// Export jediného singletonu služby
export const dbService = new DatabaseService();
