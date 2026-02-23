
import React from 'react';
import { LayoutDashboard, Clock, Users, PieChart, TableProperties, Building2, Settings, ReceiptText, Ticket as TicketIcon } from 'lucide-react';
import { Status, Priority, Ticket, WorkLog, Customer, Client } from './types';

export const INITIAL_CLIENTS: Client[] = [
  { id: 'CLI-100', name: 'Internal Dev Division', code: '100', address: 'Bratislava' },
  { id: 'CLI-200', name: 'External Services Ltd.', code: '200', address: 'Košice' },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'CUST-001', clientId: 'CLI-100', name: 'Alza.sk s.r.o.', address: 'Bottova 6654/7, 811 09 Bratislava' },
  { id: 'CUST-002', clientId: 'CLI-200', name: 'Slovenská sporiteľňa, a.s.', address: 'Tomášikova 48, 832 37 Bratislava' },
];

export const INITIAL_TICKETS: Ticket[] = [
  { 
    id: 'TIC-101', 
    clientId: 'CLI-100',
    customerId: 'CUST-001', 
    sapId: '80001234', 
    sapModule: 'SD', 
    title: 'Implementácia platobnej brány', 
    description: 'Prepojenie s TatraPay a CardPay.', 
    priority: Priority.HIGH, 
    status: Status.IN_PROGRESS, 
    budget: 80,
    estimation: 100,
    date: '2024-06-30',
    createdAt: '2024-03-01' 
  },
];

export const INITIAL_LOGS: WorkLog[] = [
  { id: 'LOG-001', clientId: 'CLI-100', customerId: 'CUST-001', ticketId: 'TIC-101', date: '2024-03-10', hours: 4, description: 'Analýza API dokumentácie' },
];

export const INITIAL_TICKET_FORM: Ticket = {
  id: '',
  clientId: '',
  customerId: '',
  sapId: '',
  sapModule: '',
  title: '',
  description: '',
  priority: Priority.MEDIUM,
  status: Status.OPEN,
  budget: undefined,
  estimation: undefined,
  startDate: new Date().toISOString().split('T')[0],
  date: new Date().toISOString().split('T')[0],
  createdAt: new Date().toISOString().split('T')[0]
};

export const NAV_ITEMS = [
  { id: 'worklogs', label: 'Výkony', icon: <Clock size={20} /> },
  { id: 'dashboard', label: 'Sumár', icon: <LayoutDashboard size={20} /> },
  { id: 'ihr', label: 'Prehľad', icon: <TableProperties size={20} /> },
  { id: 'consumption', label: 'Čerpanie', icon: <PieChart size={20} /> },
  { id: 'billing', label: 'Fakturácia', icon: <ReceiptText size={20} /> },
  { id: 'tickets', label: 'Projekty', icon: <TicketIcon size={20} /> },
  { id: 'customers', label: 'Zákazníci', icon: <Users size={20} /> },
  { id: 'clients', label: 'Klienti', icon: <Building2 size={20} /> },
  { id: 'settings', label: 'Nastavenia', icon: <Settings size={20} /> },
];
