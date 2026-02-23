
import React, { useMemo } from 'react';
import { Customer } from '../types';
import { UserPlus, Building2, MapPin, Edit3, ShieldAlert, Trash2, FileSpreadsheet, ChevronDown } from 'lucide-react';

interface CustomerListProps {
  customers: Customer[];
  onAddClick: () => void;
  onEditClick: (cust: Customer) => void;
  onDeleteClick: (id: string) => void;
  onExport: (data: any[], filename: string) => void;
}

/**
 * Komponent pre zobrazenie zoznamu zákazníkov v riadkovom formáte.
 * Zákazníci sú rozdelení na aktívnych a neaktívnych (pod čiarou).
 */
const CustomerList: React.FC<CustomerListProps> = ({ customers, onAddClick, onEditClick, onDeleteClick, onExport }) => {
  const handleExcelExport = () => {
    const data = customers.map(c => ({
      'ID Zákazníka': c.id,
      'Názov spoločnosti': c.name,
      'Adresa': c.address,
      'Stav': c.isInactive ? 'Neaktívny' : 'Aktívny'
    }));
    onExport(data, `Zoznam_Zakaznikov_${new Date().toISOString().split('T')[0]}`);
  };

  const activeCustomers = useMemo(() => customers.filter(c => !c.isInactive), [customers]);
  const inactiveCustomers = useMemo(() => customers.filter(c => !!c.isInactive), [customers]);

  const renderCustomerRow = (cust: Customer) => (
    <div 
      key={cust.id} 
      className={`flex items-center gap-4 bg-white dark:bg-slate-900 p-3 px-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-all group relative overflow-hidden ${
        cust.isInactive ? 'opacity-60 bg-slate-50/50 dark:bg-slate-900/50' : ''
      }`}
    >
      {/* Ikona */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors ${
        cust.isInactive 
          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' 
          : 'bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600'
      }`}>
        <Building2 size={20} />
      </div>

      {/* Názov a ID */}
      <div className="flex-1 min-w-0 md:w-64">
        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
          {cust.name}
        </h3>
        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">
          ID: {cust.id}
        </p>
      </div>

      {/* Adresa (Viditeľná od stredných obrazoviek) */}
      <div className="hidden lg:flex flex-1 items-center gap-2 text-slate-500 dark:text-slate-400">
        <MapPin size={14} className="shrink-0 text-slate-300 dark:text-slate-600" />
        <span className="text-[11px] font-bold italic truncate max-w-sm">{cust.address || 'Adresa neuvedená'}</span>
      </div>

      {/* Akcie a Stav (vpravo) */}
      <div className="flex items-center gap-4 shrink-0">
        {!!cust.isInactive && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px] font-black uppercase rounded-lg border border-slate-200 dark:border-slate-700">
            <ShieldAlert size={12} /> Neaktívny
          </div>
        )}

        <div className="flex items-center gap-1">
          <button 
            onClick={() => onEditClick(cust)}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
            title="Upraviť"
          >
            <Edit3 size={16} />
          </button>
          <button 
            onClick={() => onDeleteClick(cust.id)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
            title="Odstrániť"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Horný panel akcií */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Zákazníci</h2>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Zoznam zmluvných partnerov</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExcelExport}
            className="flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white w-10 h-10 rounded-xl transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
            title="Exportovať do Excelu"
          >
            <FileSpreadsheet size={18} />
          </button>
          <button 
            onClick={onAddClick}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all font-black text-[11px] uppercase tracking-widest shadow-lg active:scale-95"
          >
            <UserPlus size={16} />
            Nový zákazník
          </button>
        </div>
      </div>

      {/* Zoznam aktívnych zákazníkov */}
      <div className="flex flex-col gap-2">
        {activeCustomers.map(renderCustomerRow)}

        {/* Separátor a Neaktívni zákazníci */}
        {inactiveCustomers.length > 0 && (
          <>
            <div className="flex items-center gap-4 py-4">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <ShieldAlert size={12} /> Neaktívni zákazníci
              </div>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>
            {inactiveCustomers.map(renderCustomerRow)}
          </>
        )}

        {customers.length === 0 && (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-50">Žiadni zákazníci v evidencii</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerList;
