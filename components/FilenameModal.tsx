
import React, { useState, useEffect } from 'react';
import { X, FileSpreadsheet, Download } from 'lucide-react';

interface FilenameModalProps {
  defaultFilename: string;
  onConfirm: (filename: string) => void;
  onClose: () => void;
}

const FilenameModal: React.FC<FilenameModalProps> = ({ defaultFilename, onConfirm, onClose }) => {
  const [filename, setFilename] = useState(defaultFilename);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filename.trim()) {
      onConfirm(filename.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Export dát</h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Zadajte názov pre súbor Excel</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Názov súboru</label>
            <div className="relative group">
              <input 
                type="text" 
                autoFocus
                required
                value={filename}
                onChange={e => setFilename(e.target.value)}
                onFocus={(e) => e.target.select()}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-4 pr-16 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                placeholder="napr. Report_Januar"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest pointer-events-none">
                .xlsx
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-sm"
            >
              Zrušiť
            </button>
            <button 
              type="submit" 
              className="flex-2 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2 px-8"
            >
              <Download size={16} /> Potvrdiť a uložiť
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FilenameModal;
