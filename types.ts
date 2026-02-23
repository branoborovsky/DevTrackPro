
/**
 * Definícia základných stavov projektu/ticketu.
 */
export enum Status {
  OPEN = 'Otvorené',
  IN_PROGRESS = 'V riešení',
  TESTING = 'Testovanie',
  DONE = 'Hotovo',
  CANCELLED = 'Zrušené'
}

/**
 * Priority úloh pre vizuálne odlíšenie dôležitosti.
 */
export enum Priority {
  LOW = 'Nízka',
  MEDIUM = 'Stredná',
  HIGH = 'Vysoká',
  URGENT = 'Urgentná'
}

/**
 * Reprezentuje Mandanta (Klienta) - najvyššia úroveň systému.
 */
export interface Client {
  id: string;
  name: string;
  code: string; // SAP štýl kód (napr. 100, 200)
  address: string;
}

/**
 * Reprezentuje zákazníka/odberateľa, ktorý patrí pod Klienta.
 */
export interface Customer {
  id: string;
  clientId: string; // Väzba na mandanta
  name: string;
  address: string;
  isInactive?: boolean;
}

/**
 * Hlavná entita projektu (Ticketu).
 */
export interface Ticket {
  id: string;
  clientId: string;   // Väzba na mandanta
  customerId: string; // Väzba na zákazníka
  sapId: string;      
  sapModule: string;  
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  budget?: number;     
  estimation?: number; 
  startDate?: string; // Termín začatia
  date?: string;       // Termín ukončenia (deadline)
  createdAt: string;
}

/**
 * Záznam o vykonanej práci.
 */
export interface WorkLog {
  id: string;
  clientId: string;   // Väzba na mandanta
  customerId: string; 
  ticketId: string;   
  manualTicketId?: string; 
  manualModule?: string;   
  date: string;
  hours: number;
  description: string;
  // Fakturačné údaje
  invoiceNumber?: string;
  billingDate?: string;
}

/**
 * Reprezentuje obchodnú zákazku (Order).
 */
export interface ClientOrder {
  id: string;
  title: string;
  clientName: string;
  budget: number;
  deadline: string;
  status: Status;
  isArchived?: boolean;
}

/**
 * Definícia dostupných obrazoviek v aplikácii.
 */
export type View = 'dashboard' | 'clients' | 'customers' | 'tickets' | 'worklogs' | 'consumption' | 'ihr' | 'settings' | 'billing';
