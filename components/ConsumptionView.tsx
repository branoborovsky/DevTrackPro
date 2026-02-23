
import React, { useState, useMemo } from 'react';
import { Ticket, WorkLog, Status, Customer } from '../types';
import { 
  Clock, 
  CheckCircle2, BarChart3, LayoutGrid, Eye, Users, FileSpreadsheet, Target, Building2
} from 'lucide-react';

interface ConsumptionViewProps {
  tickets: Ticket[];
  logs: WorkLog[];
  customers: Customer[];
  onExport: (data: any[], filename: string) => void;
}

const ConsumptionView: React.FC<ConsumptionViewProps> = ({ tickets, logs, customers, onExport }) => {
  const [showCompleted, setShowCompleted] = useState(false);
  const [filterCustomer, setFilterCustomer] = useState('');

  // Usporiadanie iba AKTÍVNYCH zákazníkov pre filter podľa abecedy
  const sortedCustomersForFilter = useMemo(() => {
    return customers
      .filter(c => !c.isInactive)
      .sort((a, b) => a.name.localeCompare(b.name, 'sk'));
  }, [customers]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesCompleted = showCompleted ? true : (t.status !== Status.DONE && t.status !== Status.CANCELLED);
      const matchesCustomer = filterCustomer ? t.customerId === filterCustomer : true;
      return matchesCompleted && matchesCustomer;
    });
  }, [tickets, showCompleted, filterCustomer]);

  const consumptionData = useMemo(() => {
    return filteredTickets.map(ticket => {
      const projectLogs = logs.filter(l => l.ticketId === ticket.id);
      const totalHoursSpent = projectLogs.reduce((sum, l) => sum + l.hours, 0);
      const budget = ticket.budget || 0;
      const remainingHours = Math.max(budget - totalHoursSpent, 0);
      const progress = budget > 0 ? Math.min((totalHoursSpent / budget) * 100, 100) : 0;
      const customer = customers.find(c => c.id === ticket.customerId);
      
      return {
        ...ticket,
        customerName: customer?.name || 'Neznámy zákazník',
        totalHoursSpent,
        remainingHours,
        progress,
        spentDays: (totalHoursSpent / 8).toFixed(1),
        remainingDays: (remainingHours / 8).toFixed(1)
      };
    });
  }, [filteredTickets, logs, customers]);

  const handleExcelExport = () => {
    const data = consumptionData.map(d => {
      return {
        'ID Projektu': d.sapId,
        'Zákazník': d.customerName,
        'Názov projektu': d.title,
        'Budget (h)': d.budget || 0,
        'Odpracované (h)': d.totalHoursSpent,
        'Zostatok (h)': d.remainingHours,
        'Status': d.status
      };
    });
    onExport(data, `Cerpanie_Projektov`);
  };

  const globalSummary = useMemo(() => {
    return consumptionData.reduce((acc, curr) => ({
      totalBudget: acc.totalBudget + (curr.budget || 0),
      totalSpent: acc.totalSpent + curr.totalHoursSpent,
      totalRemaining: acc.totalRemaining + curr.remainingHours
    }), { totalBudget: 0, totalSpent: 0, totalRemaining: 0 });
  }, [consumptionData]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm w-full md:w-64">
          <div className="flex items-center gap-2 pl-2">
             <Users size={16} className="text-slate-400" />
          </div>
          <select 
            value={filterCustomer} 
            onChange={e => setFilterCustomer(e.target.value)}
            className="flex-1 bg-transparent text-xs font-bold text-slate-700 dark:text-white outline-none border-none appearance-none cursor-pointer py-1.5"
          >
            <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Všetci aktívni zákazníci</option>
            {sortedCustomersForFilter.map(c => (
              <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-4 shrink-0">
          <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <button onClick={() => setShowCompleted(false)} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${!showCompleted ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}><LayoutGrid size={14} /> Aktívne</button>
            <button onClick={() => setShowCompleted(true)} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${showCompleted ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}><Eye size={14} /> Všetky</button>
          </div>
          <button onClick={handleExcelExport} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-1.5 rounded-xl transition-all font-bold shadow-sm active:scale-95 text-xs uppercase tracking-tight"><FileSpreadsheet size={16} /> Excel</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatItem label="Budget Celkom" hours={globalSummary.totalBudget} color="amber" />
        <StatItem label="Odpracované Celkom" hours={globalSummary.totalSpent} color="blue" />
        <StatItem label="Zostáva Celkom" hours={globalSummary.totalRemaining} color="emerald" />
      </div>

      <div className="grid grid-cols-1 gap-2">
        {consumptionData.map(data => (
          <div key={data.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-3 hover:border-blue-300 dark:hover:border-blue-700 transition-all group overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Informácie o projekte - Viac do šírky, menšia výška */}
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded uppercase tracking-tighter ring-1 ring-blue-100 dark:ring-blue-800">{data.sapId}</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{data.sapModule}</span>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest border ${
                    data.status === Status.DONE 
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' 
                    : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800'
                  }`}>
                    {data.status}
                  </span>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-baseline gap-x-3 gap-y-0.5">
                  <div className="flex items-center gap-1 shrink-0">
                    <Building2 size={10} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight truncate max-w-[200px]">
                      {data.customerName}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight truncate" title={data.title}>
                    {data.title}
                  </h3>

                </div>
              </div>

              {/* Kompaktnejšie metriky - Úzke pole */}
              <div className="flex items-center gap-4 shrink-0 bg-slate-50 dark:bg-slate-800/50 px-3 py-4 rounded-lg border border-slate-100 dark:border-slate-800 self-start md:self-center">
                <Metric label="Rozpočet" val={data.budget} icon={<Target size={11} />} color="text-amber-600 dark:text-amber-400" />
                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />
                <Metric label="Čerpané" val={data.totalHoursSpent} sub={`${data.spentDays} MD`} icon={<Clock size={11} />} color="text-blue-600 dark:text-blue-400" />
                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />
                <Metric 
                  label="Zostatok" 
                  val={data.remainingHours} 
                  sub={`${data.remainingDays} MD`} 
                  icon={<CheckCircle2 size={11} />} 
                  color={data.remainingHours < 5 && (data.budget || 0) > 0 ? "text-red-600" : "text-emerald-600 dark:text-emerald-400"} 
                />
              </div>
            </div>

            {/* Progres Bar - Tenší */}
            <div className="mt-2.5 relative h-0.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`absolute top-0 left-0 h-full transition-all duration-1000 ${
                  data.progress > 95 ? 'bg-red-500' : data.progress > 75 ? 'bg-amber-500' : 'bg-blue-600'
                }`} 
                style={{ width: `${data.progress}%` }} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Metric = ({ label, val, sub, icon, color }: { label: string, val: number | undefined, sub?: string, icon: React.ReactNode, color: string }) => (
  <div className="flex flex-col min-w-[65px]">
    <div className="flex items-center gap-1 mb-0">
      <span className="text-slate-400 dark:text-slate-500">{icon}</span>
      <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter leading-none">{label}</p>
    </div>
    <div className="flex items-baseline justify-center ap-1">
      <span className={`text-[18px] font-black ${color} leading-none`}>{(val || 0).toLocaleString()}</span>
      {!!sub && <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500">({sub})</span>}
    </div>
  </div>
);

const StatItem = ({ label, hours, color }: { label: string, hours: number | undefined, color: string }) => {
  const cardThemes: any = { 
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30', 
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30', 
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30' 
  };
  
  const iconThemes: any = {
    blue: 'bg-blue-600 text-white shadow-blue-500/10',
    amber: 'bg-amber-600 text-white shadow-amber-500/10',
    emerald: 'bg-emerald-600 text-white shadow-emerald-500/10'
  };

  const textThemes: any = {
    blue: 'text-blue-700 dark:text-blue-400',
    amber: 'text-amber-700 dark:text-amber-400',
    emerald: 'text-emerald-700 dark:text-emerald-400'
  };

  const safeHours = hours || 0;
  const md = (safeHours / 8).toFixed(1);
  return (
    <div className={`${cardThemes[color]} p-4 rounded-2xl border shadow-sm flex items-center gap-3 transition-all hover:scale-[1.01] duration-300`}>
      <div className={`p-2.5 rounded-xl ${iconThemes[color]} shadow-md flex items-center justify-center`}>
        <BarChart3 size={20} />
      </div>
      <div>
        <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest mb-0.5">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className={`text-xl font-black leading-none ${textThemes[color]}`}>{safeHours.toLocaleString()} h</p>
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-tight">/ {md} MD</span>
        </div>
      </div>
    </div>
  );
};

export default ConsumptionView;
