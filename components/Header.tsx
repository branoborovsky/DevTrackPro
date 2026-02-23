
import React from 'react';
import { Search, Building2, ChevronDown, Database, Moon, Sun } from 'lucide-react';
import { Client } from '../types';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  clients: Client[];
  dbPath: string;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
}

const Header: React.FC<HeaderProps> = ({
  searchQuery, setSearchQuery, 
  selectedClientId, setSelectedClientId, 
  clients, dbPath, theme, setTheme
}) => {
  const isOffline = dbPath === 'LocalStorage (Prehliadač)';

  return (
    <header className="h-16 px-8 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 gap-6">
      
      {/* Selektor Mandanta */}
      <div className="relative group">
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-all shadow-sm">
          <Building2 size={16} className="text-blue-500" />
          <select 
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white outline-none cursor-pointer pr-6 appearance-none border-none focus:ring-0"
          >
            {clients.length === 0 && (
              <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                Žiadny Mandant
              </option>
            )}
            {clients.map(c => (
              <option 
                key={c.id} 
                value={c.id} 
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                {c.name} ({c.code})
              </option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Vyhľadávanie */}
      <div className="flex-1 max-w-md relative group">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Hľadať v projektoch, výkazoch..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
      </div>

      <div className="flex items-center gap-4">
         <div className={`hidden lg:flex items-center gap-2 px-3 py-1 rounded-full border ${
           isOffline 
            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30 text-amber-600 dark:text-amber-400' 
            : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400'
         }`}>
           <Database size={12} />
           <span className="text-[10px] font-black uppercase tracking-tight">
             {isOffline ? 'Offline Mode' : 'Native SQL'}
           </span>
         </div>
         <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
            {theme === 'light' ? <Moon size={20} className="text-slate-600" /> : <Sun size={20} className="text-amber-400" />}
         </button>
      </div>
    </header>
  );
};

export default Header;
