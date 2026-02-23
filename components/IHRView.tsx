
import React, { useState, useMemo } from 'react';
import { WorkLog, Ticket, Customer } from '../types';
import { 
  Clock, ArrowUpDown, ArrowUp, ArrowDown, FileSpreadsheet, ChevronLeft, ChevronRight, Briefcase, PencilLine
} from 'lucide-react';
import DatePicker from './DatePicker';

interface IHRViewProps {
  logs: WorkLog[];
  tickets: Ticket[];
  customers: Customer[];
  searchQuery?: string;
  onExportExcel: (data: any[], filename: string) => void;
}

type SortKey = 'date' | 'customer' | 'project' | 'hours';
type SortOrder = 'asc' | 'desc';
type FilterMode = 'day' | 'week' | 'month' | 'year' | 'period';

const toYMD = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const IHRView: React.FC<IHRViewProps> = ({ logs, tickets, customers, searchQuery = '', onExportExcel }) => {
  const today = toYMD(new Date());
  const firstOfMonth = toYMD(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);
  const [filterMode, setFilterMode] = useState<FilterMode>('month');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterTicket, setFilterTicket] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({ key: 'date', order: 'desc' });

  const getTicket = (id: string) => tickets.find(t => t.id === id);
  const getCustomer = (log: WorkLog) => customers.find(c => c.id === log.customerId);
  const formatDateSlovak = (dateStr: string) => dateStr ? dateStr.split('-').reverse().join('.') : '';

  const requestSort = (key: SortKey) => {
    let order: SortOrder = 'asc';
    if (sortConfig.key === key && sortConfig.order === 'asc') {
      order = 'desc';
    }
    setSortConfig({ key, order });
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={12} className="opacity-30 ml-1" />;
    return sortConfig.order === 'asc' ? <ArrowUp size={12} className="text-blue-600 ml-1" /> : <ArrowDown size={12} className="text-blue-600 ml-1" />;
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

  const availableTicketsForFilter = useMemo(() => {
    if (!filterCustomer) return tickets;
    return tickets.filter(t => t.customerId === filterCustomer);
  }, [tickets, filterCustomer]);

  const filteredLogs = useMemo(() => {
    const s = searchQuery.toLowerCase();
    
    const result = logs.filter(log => {
      const matchesTime = log.date >= dateFrom && log.date <= dateTo;
      const matchesCustomer = filterCustomer ? log.customerId === filterCustomer : true;
      const matchesTicket = filterTicket ? log.ticketId === filterTicket : true;
      
      let matchesSearch = true;
      if (s) {
        const ticket = getTicket(log.ticketId);
        const searchString = [
          log.description,
          log.manualTicketId,
          ticket?.sapId,
          ticket?.title,
          getCustomer(log)?.name
        ].filter(Boolean).join(' ').toLowerCase();
        matchesSearch = searchString.includes(s);
      }

      return matchesTime && matchesCustomer && matchesTicket && matchesSearch;
    });

    return result.sort((a, b) => {
      let vA: any, vB: any;
      if (sortConfig.key === 'date') { vA = a.date; vB = b.date; }
      else if (sortConfig.key === 'hours') { vA = a.hours; vB = b.hours; }
      else if (sortConfig.key === 'customer') { vA = getCustomer(a)?.name || ''; vB = getCustomer(b)?.name || ''; }
      else if (sortConfig.key === 'project') { 
        vA = getTicket(a.ticketId)?.sapId || a.manualTicketId || ''; 
        vB = getTicket(b.ticketId)?.sapId || b.manualTicketId || ''; 
      }
      
      if (vA < vB) return sortConfig.order === 'asc' ? -1 : 1;
      if (vA > vB) return sortConfig.order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [logs, dateFrom, dateTo, filterCustomer, filterTicket, sortConfig, tickets, customers, searchQuery]);

  const totalHours = filteredLogs.reduce((sum, log) => sum + log.hours, 0);

  const handleExcelExport = () => {
    const data = filteredLogs.map(l => ({
      'Dátum': formatDateSlovak(l.date),
      'Zákazník': getCustomer(l)?.name || 'Neznámy',
      'Projekt': getTicket(l.ticketId)?.sapId || l.manualTicketId || 'Manuálne',
      'Modul': getTicket(l.ticketId)?.sapModule || l.manualModule || 'N/A',
      'Popis činnosti': l.description,
      'Čas (h)': l.hours
    }));
    onExportExcel(data, `IHR_Export`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 flex items-center gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-blue-600 rounded-xl shadow-sm"><Clock size={20} /></div>
        <div><p className="text-[10px] text-blue-600 font-black uppercase tracking-tighter">Súčet za výber</p><p className="text-2xl font-black text-blue-900 dark:text-white">{totalHours.toFixed(1)} h</p></div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-end gap-4">
        {/* Kompaktnejší dátový filter */}
        <div className="flex flex-col gap-1.5 min-w-[260px]">
          <div className="flex items-center justify-between ml-1">
            <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Obdobie reportu</label>
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
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">Zákazník</label>
          <select 
            value={filterCustomer} 
            onChange={e => {
              setFilterCustomer(e.target.value);
              setFilterTicket(''); 
            }} 
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white h-[38px] outline-none"
          >
            <option value="">Všetci zákazníci</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="w-48">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">Projekt</label>
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

        <button onClick={handleExcelExport} className="bg-emerald-600 text-white p-2.5 rounded-xl hover:bg-emerald-700 shadow-lg active:scale-95 transition-all h-[38px] flex items-center justify-center px-4"><FileSpreadsheet size={18} /></button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left min-w-[1000px]">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th onClick={() => requestSort('date')} className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase w-32 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center justify-center">Dátum {getSortIcon('date')}</div>
              </th>
              <th onClick={() => requestSort('customer')} className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase w-40 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center">Zákazník {getSortIcon('customer')}</div>
              </th>
              <th onClick={() => requestSort('project')} className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase w-44 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center">Projekt / ID {getSortIcon('project')}</div>
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">Popis činnosti</th>
              <th onClick={() => requestSort('hours')} className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase text-right w-24 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center justify-end">Čas {getSortIcon('hours')}</div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredLogs.map(log => {
              const t = getTicket(log.ticketId);
              const isManual = !log.ticketId || !!log.manualTicketId;
              const sapId = t?.sapId || log.manualTicketId || 'Manuálne';
              const module = t?.sapModule || log.manualModule || 'N/A';
              
              return (
                <tr key={log.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 align-top transition-colors ${isManual ? 'bg-amber-50/10 dark:bg-amber-900/5' : ''}`}>
                  <td className="px-6 py-1 text-xs font-mono text-slate-500 dark:text-slate-400 text-center">{formatDateSlovak(log.date)}</td>
                  <td className="px-6 py-1"><span className="text-xs font-bold text-slate-900 dark:text-white truncate block w-full">{getCustomer(log)?.name || 'Neznámy'}</span></td>
                  <td className="px-6 py-1">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-mono font-bold ${isManual ? 'text-amber-600 dark:text-amber-500' : 'text-blue-600 dark:text-blue-400'}`}>
                          {sapId}
                        </span>             
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{module}</span>
                    </div>
                  </td>
                  <td className="px-6 py-1 text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed">{log.description}</td>
                  <td className="px-6 py-1 text-sm font-black text-slate-900 dark:text-white text-right">{log.hours.toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredLogs.length === 0 && <div className="py-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest opacity-30">Žiadne dáta</div>}
      </div>
    </div>
  );
};

export default IHRView;
