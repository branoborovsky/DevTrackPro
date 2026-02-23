
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Ticket, WorkLog, Customer, Client } from '../types';
import { dbService } from '../services/databaseService';
import { INITIAL_TICKETS, INITIAL_LOGS, INITIAL_CUSTOMERS, INITIAL_CLIENTS } from '../constants';
import { invoke } from '@tauri-apps/api/core';

export const useAppData = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [dbPath, setDbPath] = useState<string>('Nezistená');
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  useEffect(() => {
    const initData = async () => {
      try {
        await dbService.init();
        
        let isNewDb = false;
        try {
          const path = await invoke<string>('get_db_path');
          setDbPath(path);
          isNewDb = await invoke<boolean>('is_new_database');
        } catch (e) {
          setDbPath('LocalStorage (Prehliadač)');
          // Pre prehliadač simulujeme "novú DB" pomocou localStorage vlajky
          isNewDb = !localStorage.getItem('dt_initialized');
        }

        const [t, l, c, cl] = await Promise.all([
          dbService.getAll<Ticket>('tickets'),
          dbService.getAll<WorkLog>('worklogs'),
          dbService.getAll<Customer>('customers'),
          dbService.getAll<Client>('clients')
        ]);

        let finalClients = cl;
        let finalTickets = t;
        let finalLogs = l;
        let finalCustomers = c;

        // Demo dáta nahrávame IBA ak ide o nový súbor (alebo novú inštaláciu prehliadača)
        if (isNewDb) {
          await Promise.all([
            dbService.bulkPut('tickets', INITIAL_TICKETS),
            dbService.bulkPut('worklogs', INITIAL_LOGS),
            dbService.bulkPut('customers', INITIAL_CUSTOMERS),
            dbService.bulkPut('clients', INITIAL_CLIENTS)
          ]);
          finalTickets = INITIAL_TICKETS;
          finalLogs = INITIAL_LOGS;
          finalCustomers = INITIAL_CUSTOMERS;
          finalClients = INITIAL_CLIENTS;
          
          // Uložíme informáciu, že inicializácia prebehla (pre režim prehliadača)
          localStorage.setItem('dt_initialized', 'true');
        }

        setTickets(finalTickets);
        setLogs(finalLogs);
        setCustomers(finalCustomers);
        setClients(finalClients);

        if (!selectedClientId && finalClients.length > 0) {
          setSelectedClientId(finalClients[0].id);
        }
      } catch (error) {
        console.error("Chyba inicializácie dát:", error);
      }
    };
    initData();
  }, []);

  const filteredTickets = useMemo(() => 
    selectedClientId ? tickets.filter(t => t.clientId === selectedClientId) : tickets
  , [tickets, selectedClientId]);

  const filteredLogs = useMemo(() => 
    selectedClientId ? logs.filter(l => l.clientId === selectedClientId) : logs
  , [logs, selectedClientId]);

  const filteredCustomers = useMemo(() => 
    selectedClientId ? customers.filter(c => c.clientId === selectedClientId) : customers
  , [customers, selectedClientId]);

  const putEntity = useCallback(async (table: string, item: any) => {
    await dbService.put(table, item);
    if (table === 'tickets') setTickets(prev => {
        const idx = prev.findIndex(x => x.id === item.id);
        return idx !== -1 ? prev.map(x => x.id === item.id ? item : x) : [...prev, item];
    });
    if (table === 'worklogs') setLogs(prev => {
        const idx = prev.findIndex(x => x.id === item.id);
        return idx !== -1 ? prev.map(x => x.id === item.id ? item : x) : [...prev, item];
    });
    if (table === 'customers') setCustomers(prev => {
        const idx = prev.findIndex(x => x.id === item.id);
        return idx !== -1 ? prev.map(x => x.id === item.id ? item : x) : [...prev, item];
    });
    if (table === 'clients') {
      setClients(prev => {
        const idx = prev.findIndex(x => x.id === item.id);
        const next = idx !== -1 ? prev.map(x => x.id === item.id ? item : x) : [...prev, item];
        if (next.length === 1 && !selectedClientId) setSelectedClientId(next[0].id);
        return next;
      });
    }
  }, [selectedClientId]);

  const deleteEntity = useCallback(async (table: string, id: string) => {
    await dbService.delete(table, id);
    if (table === 'tickets') setTickets(prev => prev.filter(x => x.id !== id));
    if (table === 'worklogs') setLogs(prev => prev.filter(x => x.id !== id));
    if (table === 'customers') setCustomers(prev => prev.filter(x => x.id !== id));
    if (table === 'clients') {
      setClients(prev => {
        const next = prev.filter(x => x.id !== id);
        if (selectedClientId === id) {
          setSelectedClientId(next.length > 0 ? next[0].id : '');
        }
        return next;
      });
    }
  }, [selectedClientId]);

  const clearDatabase = useCallback(async () => {
    await dbService.clearAll();
    // Po resete nastavíme dt_initialized na true, aby sa pri znovunačítaní nenahrali demo dáta
    localStorage.setItem('dt_initialized', 'true');
    window.location.reload();
  }, []);

  return {
    tickets, logs, customers, clients,
    filteredTickets, filteredLogs, filteredCustomers,
    dbPath, selectedClientId, setSelectedClientId,
    putEntity, deleteEntity, clearDatabase,
    setLogs 
  };
};
