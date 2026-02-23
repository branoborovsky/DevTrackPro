
import React, { useState, useMemo } from 'react';
import { WorkLog, Ticket, Customer } from '../types';
import { 
  Clock, Trash2, Edit3, Calendar,
  Copy, FileSpreadsheet, ChevronLeft, ChevronRight,
  ArrowUpDown, ArrowUp, ArrowDown, Briefcase
} from 'lucide-react';
import DatePicker from './DatePicker';

interface WorkLogViewProps {
  logs: WorkLog[];
  tickets: Ticket[];
  customers: Customer[];
  searchQuery?: string;
  onAddClick: () => void;
  onCopyClick: (log: WorkLog) => void;
  onUpdateLog: (log: WorkLog) => void;
  onDeleteLog: (id: string) => void;
  onExport: (data: any[], filename: string) => void;
}

type SortKey = 'date' | 'customer' | 'ticket' | 'hours';
type SortOrder = 'asc' | 'desc';
type FilterMode = 'day' | 'week' | 'month' | 'year' | 'period' | 'all';

const SLOVAK_DAY_NAMES = ['Nedeľa', 'Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota'];

const toYMD = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const WorkLogView: React.FC<WorkLogViewProps> = ({ logs, tickets, customers, searchQuery = '', onAddClick, onCopyClick, onUpdateLog, onDeleteLog, onExport }) => {
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterTicket, setFilterTicket] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('month');
  
  const [dateFrom, setDateFrom] = useState(toYMD(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [dateTo, setDateTo] = useState(toYMD(new Date()));
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({ key: 'date', order: 'desc' });

  const getTicket = (id: string) => tickets.find(t => t.id === id);
  const getCustomerName = (log: WorkLog) => customers.find(c => c.id === log.customerId)?.name || 'Neznámy';
  
  const getTicketSapId = (log: WorkLog) => {
    if (log.ticketId) {
      return getTicket(log.ticketId)?.sapId || 'N/A';
    }
    return log.manualTicketId || 'Manuálne';
  };

  const formatDateSlovak = (dateStr: string) => dateStr ? dateStr.split('-').reverse().join('.') : '';
  const getDayName = (dateStr: string) => SLOVAK_DAY_NAMES[new Date(dateStr).getDay()];

  const requestSort = (key: SortKey) => {
    let order: SortOrder = 'asc';
    if (sortConfig.key === key && sortConfig.order === 'asc') {
      order = 'desc';
    }
    setSortConfig({ key, order });
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={12} className="opacity-30 ml-1 shrink-0" />;
    return sortConfig.order === 'asc' ? <ArrowUp size={12} className="text-blue-600 ml-1 shrink-0" /> : <ArrowDown size={12} className="text-blue-600 ml-1 shrink-0" />;
  };

  const shiftPeriod = (direction: number) => {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    if (filterMode === 'day') { from.setDate(from.getDate() + direction); to.setDate(to.getDate() + direction); }
    else if (filterMode === 'week') { from.setDate(from.getDate() + (direction * 7)); to.setDate(to.getDate() + (direction * 7)); }
    else if (filterMode === 'month') { from.setMonth(from.getMonth() + direction, 1); to.setMonth(from.getMonth() + 1, 0); }
    else if (filterMode === 'year') { from.setFullYear(from.getFullYear() + direction, 0, 1); to.setFullYear(from.getFullYear(), 11, 31); }
    else {
      const diff = to.getTime() - from.getTime();
      from.setTime(from.getTime() + (direction * (diff + 86400000)));
      to.setTime(to.getTime() + (direction * (diff + 86400000)));
    }
    setDateFrom(toYMD(from)); setDateTo(toYMD(to));
  };

  const quickFilter = (mode: FilterMode) => {
    const d = new Date();
    let start, end;
    if (mode === 'day') { start = toYMD(d); end = start; }
    else if (mode === 'week') {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      start = toYMD(new Date(new Date().setDate(diff)));
      end = toYMD(new Date(new Date().setDate(diff + 6)));
    } else if (mode === 'month') {
      start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      end = toYMD(new Date(d.getFullYear(), d.getMonth() + 1, 0));
    } else if (mode === 'year') {
      start = `${d.getFullYear()}-01-01`;
      end = `${d.getFullYear()}-12-31`;
    } else { start = dateFrom; end = dateTo; }
    setDateFrom(start); setDateTo(end); setFilterMode(mode);
  };

  const availableTicketsForFilter = useMemo(() => {
    if (!filterCustomer) return tickets;
    return tickets.filter(t => t.customerId === filterCustomer);
  }, [tickets, filterCustomer]);

  const filteredLogs = useMemo(() => {
    const s = searchQuery.toLowerCase();
    
    let result = logs.filter(log => {
      const matchesTime = log.date >= dateFrom && log.date <= dateTo;
      const mCust = filterCustomer ? log.customerId === filterCustomer : true;
      const mTick = filterTicket ? log.ticketId === filterTicket : true;
      
      let matchesSearch = true;
      if (s) {
        const ticket = getTicket(log.ticketId);
        const searchString = [
          log.description,
          log.manualTicketId,
          log.manualModule,
          ticket?.sapId,
          ticket?.title,
          getCustomerName(log)
        ].filter(Boolean).join(' ').toLowerCase();
        
        matchesSearch = searchString.includes(s);
      }

      return matchesTime && mCust && mTick && matchesSearch;
    });

    return result.sort((a, b) => {
      let vA: any, vB: any;
      if (sortConfig.key === 'hours') { vA = a.hours; vB = b.hours; }
      else if (sortConfig.key === 'customer') { vA = getCustomerName(a); vB = getCustomerName(b); }
      else if (sortConfig.key === 'ticket') { vA = getTicketSapId(a); vB = getTicketSapId(b); }
      else { vA = a.date; vB = b.date; }
      
      if (vA < vB) return sortConfig.order === 'asc' ? -1 : 1;
      if (vA > vB) return sortConfig.order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [logs, dateFrom, dateTo, filterCustomer, filterTicket, sortConfig, tickets, customers, searchQuery]);

  const groupedLogs = useMemo(() => {
    const groups: { [date: string]: { items: WorkLog[], total: number } } = {};
    filteredLogs.forEach(l => {
      if (!groups[l.date]) groups[l.date] = { items: [], total: 0 };
      groups[l.date].items.push(l); groups[l.date].total += l.hours;
    });

    return Object.keys(groups)
      .sort((a, b) => {
        if (sortConfig.key === 'hours') {
           const totalA = groups[a].total;
           const totalB = groups[b].total;
           return sortConfig.order === 'asc' ? totalA - totalB : totalB - totalA;
        }
        return sortConfig.order === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
      })
      .map(d => ({ date: d, ...groups[d] }));
  }, [filteredLogs, sortConfig]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-end gap-4">
        <button onClick={onAddClick} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-tight flex items-center gap-2 hover:bg-blue-700 shadow-lg active:scale-95 transition-all">
          <Clock size={16} /> Zadať výkon
        </button>

        {/* Kompaktnejší dátový filter */}
        <div className="flex flex-col gap-1.5 min-w-[260px]">
          <div className="flex items-center justify-between ml-1">
            <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Obdobie výkazov</label>
            <div className="flex gap-1">
              {['day', 'week', 'month', 'year'].map((m) => (
                <button key={m} onClick={() => quickFilter(m as FilterMode)} className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded transition-all ${filterMode === m ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-blue-500'}`}>{m === 'day' ? 'D' : m === 'week' ? 'T' : m === 'month' ? 'M' : 'R'}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 h-[38px]">
             <button onClick={() => shiftPeriod(-1)} className="p-1 text-slate-400 hover:text-blue-500 transition-colors"><ChevronLeft size={16} /></button>
             <DatePicker rangeMode startDate={dateFrom} endDate={dateTo} onRangeChange={(s, e) => { setDateFrom(s); setDateTo(e); setFilterMode('period'); }} minimal value="" onChange={() => {}} />
             <button onClick={() => shiftPeriod(1)} className="p-1 text-slate-400 hover:text-blue-500 transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>

        <div className="w-48">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Zákazník</label>
          <select 
            value={filterCustomer} 
            onChange={e => {
              setFilterCustomer(e.target.value);
              setFilterTicket(''); 
            }} 
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white h-[38px] outline-none"
          >
            <option value="">Všetci</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="w-48">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Projekt</label>
          <div className="relative group">
            <select 
              value={filterTicket} 
              onChange={e => setFilterTicket(e.target.value)} 
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white h-[38px] outline-none appearance-none"
            >
              <option value="">Všetky projekty</option>
              {availableTicketsForFilter.map(t => (
                <option key={t.id} value={t.id}>{t.sapId} - {t.title}</option>
              ))}
            </select>
            <Briefcase size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <button onClick={() => onExport(filteredLogs, `Export_Vykonov`)} title="Export do Excelu" className="bg-emerald-600 text-white p-2.5 rounded-xl hover:bg-emerald-700 shadow-lg active:scale-95 transition-all">
           <FileSpreadsheet size={18} />
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left min-w-[950px] bg-white dark:bg-transparent">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th onClick={() => requestSort('date')} className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase cursor-pointer w-32 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
                <div className="flex items-center">Dátum {getSortIcon('date')}</div>
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase w-48">Zákazník / Modul</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase w-48">Projekt / ID</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Popis činnosti</th>
              <th onClick={() => requestSort('hours')} className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase text-right w-24 cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
                <div className="flex items-center justify-end">Čas {getSortIcon('hours')}</div>
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase text-right w-24">Akcie</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {groupedLogs.map(group => (
              <React.Fragment key={group.date}>
                <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                  <td colSpan={4} className="px-6 py-1.5"><div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatDateSlovak(group.date)} <span className="text-blue-600/50">({getDayName(group.date)})</span></div></td>
                  <td className="px-6 py-1.5 text-xs font-black text-blue-600 dark:text-blue-400 text-right">{group.total.toFixed(1)} h</td>
                  <td className="px-6 py-1.5"></td>
                </tr>
                {group.items.map(log => {
                  const ticket = getTicket(log.ticketId);
                  const module = ticket?.sapModule || log.manualModule || 'N/A';
                  const isManual = !log.ticketId || !!log.manualTicketId;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group/row">
                      <td className="px-6 py-1 text-xs font-bold text-slate-500">{formatDateSlovak(log.date)}</td>
                      <td className="px-6 py-1">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate w-40">{getCustomerName(log)}</span>
                          <span className="text-[9px] font-black uppercase text-slate-400">{module}</span>
                        </div>
                      </td>
                      <td className="px-6 py-1">
                        <div className="flex flex-col">
                          <span className={`text-sm font-mono font-bold ${isManual ? 'text-amber-600 dark:text-amber-500' : 'text-blue-600 dark:text-blue-400'}`}>{getTicketSapId(log)}</span>
                          <span className="text-[10px] text-slate-400 truncate w-40">{ticket?.title || (log.manualTicketId ? 'Ticket' : '-')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-1 text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed">{log.description}</td>
                      <td className="px-6 py-1 text-sm font-black text-slate-900 dark:text-white text-right">{log.hours.toFixed(1)}</td>
                      <td className="px-6 py-1 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                          <button onClick={() => onUpdateLog(log)} className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"><Edit3 size={14} /></button>
                          <button onClick={() => onCopyClick(log)} className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-lg transition-colors"><Copy size={14} /></button>
                          <button onClick={() => onDeleteLog(log.id)} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {groupedLogs.length === 0 && <div className="py-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest opacity-30">Žiadne záznamy</div>}
      </div>
    </div>
  );
};

export default WorkLogView;
