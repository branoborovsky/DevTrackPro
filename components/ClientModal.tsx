
import React, { useState } from 'react';
import { Client } from '../types';
import { X, Save } from 'lucide-react';

interface ClientModalProps {
  client: Partial<Client>;
  onSave: (client: Client) => void;
  onClose: () => void;
}

const ClientModal: React.FC<ClientModalProps> = ({ client, onSave, onClose }) => {
  const [form, setForm] = useState<Partial<Client>>(client);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form as Client);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Mandant</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-2xl transition-colors"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Názov divízie / firmy</label>
            <input type="text" required value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kód (napr. 1000)</label>
            <input type="text" required value={form.code || ''} onChange={e => setForm({...form, code: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sídlo</label>
            <textarea rows={3} value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none resize-none" />
          </div>
          <div className="pt-6 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all">Zrušiť</button>
            <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all">Uložiť mandanta</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientModal;
