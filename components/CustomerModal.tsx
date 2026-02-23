
import React, { useState } from 'react';
import { Customer, Client } from '../types';
import { X, Save, Lock } from 'lucide-react';

interface CustomerModalProps {
  customer: Partial<Customer>;
  onSave: (customer: Customer) => void;
  onClose: () => void;
}

const CustomerModal: React.FC<CustomerModalProps> = ({ customer, onSave, onClose }) => {
  const [form, setForm] = useState<Partial<Customer>>(customer);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form as Customer);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Zákazník</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-2xl transition-colors"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Názov spoločnosti</label>
            <input type="text" required value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Adresa</label>
            <textarea rows={3} value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={!!form.isInactive} onChange={e => setForm({...form, isInactive: e.target.checked})} className="w-5 h-5 rounded-lg text-blue-600 outline-none cursor-pointer" />
            <span className="text-xs font-bold text-slate-600 uppercase">Neaktívny zákazník</span>
          </div>
          <div className="pt-6 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all">Zrušiť</button>
            <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all">Uložiť</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerModal;
