
import React from 'react';
import { Client } from '../types';
import { UserPlus, Building2, MapPin, Edit3, Trash2, ShieldCheck, FileSpreadsheet } from 'lucide-react';

interface ClientListProps {
  clients: Client[];
  onAddClick: () => void;
  onEditClick: (client: Client) => void;
  onDeleteClick: (id: string) => void;
  onExport: (data: any[], filename: string) => void;
}

/**
 * Komponent pre správu Mandantov (Klientov).
 */
const ClientList: React.FC<ClientListProps> = ({ clients, onAddClick, onEditClick, onDeleteClick, onExport }) => {
  const handleExcelExport = () => {
    const data = clients.map(c => ({
      'Kód Mandanta': c.code,
      'Názov Mandanta': c.name,
      'Adresa/Sídlo': c.address
    }));
    onExport(data, `Zoznam_Mandantov_${new Date().getFullYear()}`);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Správa Mandantov</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Definícia najvyššej úrovne izolácie dát</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExcelExport}
            className="flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white w-12 h-12 rounded-xl transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
            title="Exportovať do Excelu"
          >
            <FileSpreadsheet size={20} />
          </button>
          <button 
            onClick={onAddClick}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95"
          >
            <UserPlus size={18} />
            Nový Mandant
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {clients.map((client) => (
          <div key={client.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-8 hover:border-blue-300 dark:hover:border-blue-500/50 transition-all group relative overflow-hidden">
            <div className="flex items-center gap-5 mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">{client.name}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                   <div className="w-2 h-2 rounded-full bg-blue-500" />
                   <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest">Mandant: {client.code}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <MapPin size={18} className="text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                <span className="leading-relaxed font-bold italic">{client.address || 'Adresa nie je zadaná v systéme'}</span>
              </div>
            </div>

            <div className="pt-5 border-t border-slate-50 dark:border-slate-800 flex justify-end gap-3">
              <button 
                onClick={() => onEditClick(client)}
                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <Edit3 size={14} /> Upraviť
              </button>
              <button 
                onClick={() => onDeleteClick(client.id)}
                className="flex items-center gap-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={14} /> Odstrániť
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {clients.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-slate-400 dark:text-slate-600">
          <div className="p-8 bg-slate-100 dark:bg-slate-900 rounded-full mb-6">
            <Building2 size={64} className="opacity-20" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-center">Zatiaľ nie sú evidovaní žiadni klienti.<br/><span className="text-blue-500">Vytvorte prvého mandanta pre začatie práce.</span></p>
        </div>
      )}
    </div>
  );
};

export default ClientList;
