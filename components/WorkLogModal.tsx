
import React, { useState, useMemo } from 'react';
import { WorkLog, Ticket, Customer, Status } from '../types';
import { X, Save, AlertCircle, Target, Clock, CheckCircle2 } from 'lucide-react';
import DatePicker from './DatePicker';

interface WorkLogModalProps {
  log: Partial<WorkLog>;
  tickets: Ticket[];
  logs: WorkLog[];
  customers: Customer[];
  onSave: (log: WorkLog) => void;
  onClose: () => void;
}

const WorkLogModal: React.FC<WorkLogModalProps> = ({ log, tickets, logs, customers, onSave, onClose }) => {
  const [isManual, setIsManual] = useState(!!log.manualTicketId);
  const [form, setForm] = useState<Partial<WorkLog>>({
    date: new Date().toISOString().split('T')[0],
    hours: log.hours, 
    description: '',
    ...log
  });

  const availableCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesClient = !form.clientId || c.clientId === form.clientId;
      const isActiveOrSelected = !c.isInactive || c.id === form.customerId;
      return matchesClient && isActiveOrSelected;
    });
  }, [customers, form.clientId, form.customerId]);

  const availableTickets = useMemo(() => {
    if (!form.customerId) return [];
    return tickets.filter(t => 
      t.customerId === form.customerId && 
      t.clientId === form.clientId && 
      (
        t.status === Status.IN_PROGRESS || 
        t.status === Status.TESTING || 
        t.id === form.ticketId
      )
    );
  }, [tickets, form.customerId, form.clientId, form.ticketId]);

  const budgetBalance = useMemo(() => {
    if (!form.ticketId || isManual) return null;
    const ticket = tickets.find(t => t.id === form.ticketId);
    if (!ticket) return null;

    const spentAlready = logs
      .filter(l => l.ticketId === form.ticketId && l.id !== form.id)
      .reduce((sum, l) => sum + l.hours, 0);

    const budget = ticket.budget || 0;
    const currentInput = form.hours || 0;
    const totalWithNew = spentAlready + currentInput;
    const afterThis = budget - totalWithNew;

    return {
      budget,
      spentAlready,
      afterThis,
      overBudget: afterThis < 0
    };
  }, [form.ticketId, form.hours, tickets, logs, isManual, form.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form as WorkLog);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Záznam výkonu</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Evidencia odpracovaného času</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 min-h-[580px] flex flex-col justify-between overflow-y-auto max-h-[80vh] custom-scrollbar">
          <div className="space-y-6">
            {/* Prepínač režimu */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit">
              <button 
                type="button"
                onClick={() => setIsManual(false)} 
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${!isManual ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md' : 'text-slate-500'}`}
              >
                Systémový Projekt
              </button>
              <button 
                type="button"
                onClick={() => setIsManual(true)} 
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${isManual ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md' : 'text-slate-500'}`}
              >
                Manuálne zadanie
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Zákazník</label>
                <select 
                  required
                  value={form.customerId || ''}
                  onChange={e => setForm({...form, customerId: e.target.value, ticketId: ''})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="">Vyberte zákazníka...</option>
                  {availableCustomers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.isInactive ? '(Neaktívny)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {!isManual ? (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Výber projektu</label>
                  <select 
                    required
                    disabled={!form.customerId}
                    value={form.ticketId || ''}
                    onChange={e => setForm({...form, ticketId: e.target.value})}
                    className={`w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${!form.customerId ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="">{form.customerId ? 'Vyberte projekt...' : 'Najskôr vyberte zákazníka...'}</option>
                    {availableTickets.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.sapId} - {t.title} {t.status === Status.DONE || t.status === Status.CANCELLED ? `(${t.status})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Projektu</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="napr. 80000123"
                      value={form.manualTicketId || ''} 
                      onChange={e => setForm({...form, manualTicketId: e.target.value})} 
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">SAP Modul</label>
                    <input 
                      type="text" 
                      placeholder="napr. SD"
                      value={form.manualModule || ''} 
                      onChange={e => setForm({...form, manualModule: e.target.value})} 
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none" 
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div className="space-y-1.5">
                <DatePicker 
                  label="Dátum výkonu"
                  value={form.date || ''} 
                  onChange={val => setForm({...form, date: val})} 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Hodiny</label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.1" 
                    required 
                    placeholder="0.0"
                    value={form.hours ?? ''} 
                    onChange={e => {
                      const val = e.target.value;
                      setForm({...form, hours: val === '' ? undefined : Number(val)});
                    }} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 h-12" 
                  />
                  <Clock size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Popis činnosti</label>
              <textarea required rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-blue-500/20" placeholder="Detailný popis vykonanej práce..." />
            </div>

            {/* Bilancia projektu - teraz POD popisom činnosti */}
            <div className="min-h-[70px]"> 
              {budgetBalance && (
                <div className={`px-6 py-3 rounded-2xl border flex items-center justify-between gap-6 transition-all animate-in slide-in-from-top-2 duration-300 ${
                  budgetBalance.overBudget 
                    ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 shadow-sm' 
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 shadow-sm'
                }`}>
                  <div className="flex-1 grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-700">
                    <div className="pr-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Target size={12} className="text-amber-500" />
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Budget</p>
                      </div>
                      <p className="text-sm font-black text-amber-600 dark:text-amber-500 leading-none">{budgetBalance.budget} h</p>
                    </div>
                    <div className="px-6">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Clock size={12} className="text-blue-500" />
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Doteraz</p>
                      </div>
                      <p className="text-sm font-black text-blue-600 dark:text-blue-500 leading-none">{budgetBalance.spentAlready} h</p>
                    </div>
                    <div className="pl-6">
                      <div className="flex items-center gap-1.5 mb-1">
                        <CheckCircle2 size={12} className={budgetBalance.overBudget ? 'text-red-500' : 'text-emerald-500'} />
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Zostane</p>
                      </div>
                      <p className={`text-sm font-black leading-none ${budgetBalance.overBudget ? 'text-red-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {budgetBalance.afterThis.toFixed(1)} h
                      </p>
                    </div>
                  </div>
                  {budgetBalance.overBudget && (
                    <div className="shrink-0 bg-red-600 text-white p-2 rounded-xl animate-pulse shadow-lg shadow-red-500/20">
                      <AlertCircle size={18} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="pt-8 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Zrušiť</button>
            <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-500/30 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2">
              <Save size={18} /> Uložiť záznam do denníka
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkLogModal;
