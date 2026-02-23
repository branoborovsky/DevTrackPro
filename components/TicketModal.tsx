
import React, { useState, useMemo } from 'react';
import { Ticket, Customer, Status, Priority } from '../types';
import { X, Save, Calendar, Target, Sparkles } from 'lucide-react';
import DatePicker from './DatePicker';

interface TicketModalProps {
  ticket: Ticket;
  customers: Customer[];
  onSave: (ticket: Ticket) => void;
  onClose: () => void;
}

const TicketModal: React.FC<TicketModalProps> = ({ ticket, customers, onSave, onClose }) => {
  const [form, setForm] = useState<Ticket>(ticket);

  // Filtrovanie zákazníkov podľa priradeného mandanta a aktívneho stavu
  const availableCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesClient = !form.clientId || c.clientId === form.clientId;
      // Zobrazíme ak je aktívny ALEBO ak je to práve vybraný zákazník (pri editácii existujúceho záznamu)
      const isActiveOrSelected = !c.isInactive || c.id === form.customerId;
      return matchesClient && isActiveOrSelected;
    });
  }, [customers, form.clientId, form.customerId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-5 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {ticket.id ? 'Upraviť projekt' : 'Nový projekt'}
            </h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Konfigurácia systémového ticketu</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Zákazník</label>
              <select 
                required
                value={form.customerId}
                onChange={e => setForm({...form, customerId: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              >
                <option value="">Vyberte zákazníka...</option>
                {availableCustomers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.isInactive ? '(Neaktívny)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Projektu (SAP)</label>
              <input 
                type="text" 
                required
                placeholder="napr. 80000123"
                value={form.sapId}
                onChange={e => setForm({...form, sapId: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Názov projektu</label>
            <input 
              type="text" 
              required
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div className="space-y-2 py-1">
             <div className="flex items-center gap-2 ml-1 mb-1">
                <Calendar size={12} className="text-blue-600" />
                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Plánované termíny</h4>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <DatePicker 
                  label="Začiatok projektu"
                  value={form.startDate || ''} 
                  onChange={val => setForm({...form, startDate: val})} 
                />
                <DatePicker 
                  label="Koniec / Deadline"
                  value={form.date || ''} 
                  onChange={val => setForm({...form, date: val})} 
                />
             </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Modul</label>
              <input type="text" value={form.sapModule} onChange={e => setForm({...form, sapModule: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none" placeholder="SD, MM..." />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value as Status})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none">
                {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Priorita</label>
              <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value as Priority})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none">
                {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 ml-1">
                <Sparkles size={12} className="text-amber-500" />
                <label className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Odhad (hodiny)</label>
              </div>
              <input 
                type="number" 
                value={form.estimation || ''} 
                onChange={e => setForm({...form, estimation: e.target.value === '' ? undefined : Number(e.target.value)})} 
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/20 transition-all" 
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 ml-1">
                <Target size={12} className="text-blue-500" />
                <label className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Rozpočet (hodiny)</label>
              </div>
              <input 
                type="number" 
                value={form.budget || ''} 
                onChange={e => setForm({...form, budget: e.target.value === '' ? undefined : Number(e.target.value)})} 
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Poznámky</label>
            <textarea 
              rows={2} 
              value={form.description} 
              onChange={e => setForm({...form, description: e.target.value})} 
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none resize-none" 
              placeholder="Detailné informácie o projekte..."
            />
          </div>

          <div className="pt-4 flex gap-2 sticky bottom-0 bg-white dark:bg-slate-900 py-3 border-t border-slate-50 dark:border-slate-800">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Zrušiť</button>
            <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/10 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2">
              <Save size={16} /> Uložiť projekt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TicketModal;
