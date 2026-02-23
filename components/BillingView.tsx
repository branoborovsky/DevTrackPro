
import React, { useState, useMemo, useEffect } from 'react';
import { Ticket, WorkLog, Customer } from '../types';
import { 
  Clock, CheckCircle2,
  Hourglass, Eye, RotateCcw, Save,
  FileSpreadsheet, Receipt, ChevronLeft, ChevronRight, Calendar,
  ArrowUpDown, ArrowUp, ArrowDown, Users, Briefcase, CheckSquare, Square
} from 'lucide-react';
import DatePicker from './DatePicker';
import AlertModal from './AlertModal';

interface BillingViewProps {
  tickets: Ticket[];
  logs: WorkLog[];
  customers: Customer[];
  searchQuery?: string;
  onBulkBill: (logIds: string[], invoiceNumber: string, billingDate: string) => Promise<void>;
  onExport: (data: any[], filename: string) => void;
}

type SortKey = 'date' | 'customer' | 'project' | 'hours' | 'invoice';
type SortOrder = 'asc' | 'desc';
type FilterMode = 'day' | 'week' | 'month' | 'year' | 'period';

const toYMD = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const BillingView: React.FC<BillingViewProps> = ({ tickets, logs, customers, searchQuery = '', onBulkBill, onExport }) => {
  const today = toYMD(new Date());
  const firstOfMonth = toYMD(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);
  const [filterMode, setFilterMode] = useState<FilterMode>('month');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterTicket, setFilterTicket] = useState('');
  const [showOnlyUnbilled, setShowOnlyUnbilled] = useState(true);

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [billingDate, setBillingDate] = useState(today);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({ key: 'date', order: 'desc' });

  // Stav pre výber riadkov
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Stav pre dialóg
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'confirm' | 'warning';
    onConfirm: () => void;
  } | null>(null);

  const getCustomer = (log: WorkLog) => customers.find(c => c.id === log.customerId);
  const getTicket = (log: WorkLog) => tickets.find(t => t.id === log.ticketId);
  const formatDateSlovak = (dateStr: string) => dateStr ? dateStr.split('-').reverse().join('.') : '';

  const requestSort = (key: SortKey) => {
    let order: SortOrder = 'asc';
    if (sortConfig.key === key && sortConfig.order === 'asc') {
      order = 'desc';
    }
    setSortConfig({ key, order });
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={12} className="opacity-30" />;
    return sortConfig.order === 'asc' ? <ArrowUp size={12} className="text-blue-600" /> : <ArrowDown size={12} className="text-blue-600" />;
  };

  const quickFilter = (mode: FilterMode) => {
    const d = new Date();
    let start, end;
    if (mode === 'day') {
      start = toYMD(d);
      end = start;
    } else if (mode === 'week') {
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
    } else {
      start = dateFrom;
      end = dateTo;
    }
    setDateFrom(start);
    setDateTo(end);
    setFilterMode(mode);
    setSelectedIds(new Set()); // Reset výberu pri zmene filtra
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
    setSelectedIds(new Set());
  };

  const availableTicketsForFilter = useMemo(() => {
    if (!filterCustomer) return tickets;
    return tickets.filter(t => t.customerId === filterCustomer);
  }, [tickets, filterCustomer]);

  const filteredLogs = useMemo(() => {
    const s = searchQuery.toLowerCase();
    
    const base = logs.filter(log => {
      const matchesTime = log.date >= dateFrom && log.date <= dateTo;
      const matchesCustomer = filterCustomer ? log.customerId === filterCustomer : true;
      const matchesTicket = filterTicket ? log.ticketId === filterTicket : true;
      const matchesBillingStatus = showOnlyUnbilled ? !log.invoiceNumber : true;
      
      let matchesSearch = true;
      if (s) {
        const ticket = getTicket(log);
        const searchString = [
          log.description,
          log.invoiceNumber,
          ticket?.sapId,
          ticket?.title,
          getCustomer(log)?.name
        ].filter(Boolean).join(' ').toLowerCase();
        matchesSearch = searchString.includes(s);
      }

      return matchesTime && matchesCustomer && matchesTicket && matchesBillingStatus && matchesSearch;
    });

    return base.sort((a, b) => {
      let vA: any, vB: any;
      if (sortConfig.key === 'date') { vA = a.date; vB = b.date; }
      else if (sortConfig.key === 'hours') { vA = a.hours; vB = b.hours; }
      else if (sortConfig.key === 'customer') { vA = getCustomer(a)?.name || ''; vB = getCustomer(b)?.name || ''; }
      else if (sortConfig.key === 'project') { 
        const ticketA = getTicket(a);
        const ticketB = getTicket(b);
        vA = ticketA?.sapId || a.manualTicketId || ''; 
        vB = ticketB?.sapId || b.manualTicketId || ''; 
      }
      else if (sortConfig.key === 'invoice') { vA = a.invoiceNumber || ''; vB = b.invoiceNumber || ''; }
      
      if (vA < vB) return sortConfig.order === 'asc' ? -1 : 1;
      if (vA > vB) return sortConfig.order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [logs, dateFrom, dateTo, filterCustomer, filterTicket, showOnlyUnbilled, sortConfig, searchQuery, tickets, customers]);

  // Sumárne štatistiky LEN za vyfiltrované
  const stats = useMemo(() => {
    return filteredLogs.reduce((acc, log) => {
      if (log.invoiceNumber) acc.billed += log.hours;
      else acc.unbilled += log.hours;
      return acc;
    }, { billed: 0, unbilled: 0 });
  }, [filteredLogs]);

  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLogs.length && filteredLogs.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLogs.map(l => l.id)));
    }
  };

  const handleExcelExport = () => {
    const data = filteredLogs.map(l => ({
      'Dátum': formatDateSlovak(l.date),
      'Zákazník': getCustomer(l)?.name || 'Neznámy',
      'Hodiny': l.hours,
      'Faktúra': l.invoiceNumber || 'Nefakturované',
      'Dátum fakturácie': l.billingDate ? formatDateSlovak(l.billingDate) : '-'
    }));
    onExport(data, `Fakturacia_Export`);
  };

  const executeAction = (mode: 'bill' | 'cancel') => {
    if (selectedIds.size === 0) {
      alert("Najskôr označte výkony v tabuľke.");
      return;
    }

    if (mode === 'bill' && !invoiceNumber) {
      alert("Zadajte číslo faktúry v hornej lište.");
      return;
    }
    
    const relevantLogs = filteredLogs.filter(l => selectedIds.has(l.id));
    const count = relevantLogs.length;
    const totalHours = relevantLogs.reduce((sum, l) => sum + l.hours, 0);

    setConfirmConfig({
      isOpen: true,
      title: mode === 'bill' ? "Potvrdenie fakturácie" : "Anulovanie fakturácie",
      message: mode === 'bill' 
        ? `Priraďujete faktúru č. ${invoiceNumber} k ${count} vybraným výkonov v celkovom rozsahu ${totalHours.toFixed(1)} h.`
        : `Naozaj chcete vymazať fakturačné údaje pre ${count} označených výkonov v celkovom rozsahu ${totalHours.toFixed(1)} h?`,
      type: mode === 'bill' ? 'confirm' : 'warning',
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          const ids = Array.from(selectedIds);
          if (mode === 'bill') {
            await onBulkBill(ids, invoiceNumber, billingDate);
            setInvoiceNumber('');
          } else {
            await onBulkBill(ids, "", "");
          }
          setSelectedIds(new Set()); // Po úspechu vyčistiť výber
        } catch (err) {
          console.error("Billing action failed", err);
        } finally {
          setIsProcessing(false);
          setConfirmConfig(null);
        }
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="flex gap-4 flex-1 w-full">
            <div className="bg-amber-50 dark:bg-amber-400/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-400/20 flex items-center gap-4 flex-1">
              <div className="p-3 bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 rounded-xl shadow-sm"><Hourglass size={20} /></div>
              <div>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-black uppercase tracking-tighter">Vybrané obdobie</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-amber-900 dark:text-amber-400 leading-none">{stats.unbilled.toFixed(1)} h</p>
                  <span className="text-[10px] font-bold text-amber-600/60 dark:text-amber-400/60">/ k fakturácii</span>
                </div>
              </div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-400/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-400/20 flex items-center gap-4 flex-1">
              <div className="p-3 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-sm"><CheckCircle2 size={20} /></div>
              <div>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-tighter">Vyfakturované</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-emerald-900 dark:text-emerald-400 leading-none">{stats.billed.toFixed(1)} h</p>
                  <span className="text-[10px] font-bold text-emerald-600/60 dark:text-emerald-400/60">/ v období</span>
                </div>
              </div>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-4 w-full xl:w-auto">
          <div className="flex items-center gap-2">
            <Receipt size={16} className="text-blue-500" />
            <input type="text" placeholder="Číslo faktúry..." value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-blue-500" />
            <DatePicker value={billingDate} onChange={setBillingDate} minimal />
          </div>
          <button 
            onClick={() => executeAction('bill')} 
            disabled={isProcessing || !invoiceNumber || selectedIds.size === 0} 
            className="bg-slate-900 dark:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-tight flex items-center gap-2 disabled:opacity-30 active:scale-95 transition-all shadow-lg"
          >
            <Save size={16} /> Priradiť ({selectedIds.size})
          </button>
          <button 
            onClick={() => executeAction('cancel')} 
            disabled={isProcessing || selectedIds.size === 0} 
            className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-tight flex items-center gap-2 active:scale-95 transition-all"
          >
            <RotateCcw size={16} /> Anulovať
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-end gap-4">
        {/* Obdobie Filter */}
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

        {/* Zákazník Filter */}
        <div className="w-48">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">Zákazník</label>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 h-[38px]">
            <Users size={14} className="text-slate-400" />
            <select 
              value={filterCustomer} 
              onChange={e => {
                setFilterCustomer(e.target.value);
                setFilterTicket('');
              }} 
              className="flex-1 bg-transparent text-xs font-bold text-slate-900 dark:text-white outline-none appearance-none"
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Všetci zákazníci</option>
              {customers.map(c => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Projekt Filter */}
        <div className="w-48">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">Projekt</label>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 h-[38px]">
            <Briefcase size={14} className="text-slate-400" />
            <select 
              value={filterTicket} 
              onChange={e => setFilterTicket(e.target.value)} 
              className="flex-1 bg-transparent text-xs font-bold text-slate-900 dark:text-white outline-none appearance-none"
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Všetky projekty</option>
              {availableTicketsForFilter.map(t => (
                <option key={t.id} value={t.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {t.sapId} - {t.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stav Filter */}
        <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 h-[38px]">
          <button onClick={() => { setShowOnlyUnbilled(true); setSelectedIds(new Set()); }} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${showOnlyUnbilled ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500'}`}><Hourglass size={12} /> K fakturácii</button>
          <button onClick={() => { setShowOnlyUnbilled(false); setSelectedIds(new Set()); }} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${!showOnlyUnbilled ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500'}`}><Eye size={12} /> Všetko</button>
        </div>

        <button onClick={handleExcelExport} title="Exportovať do Excelu" className="bg-emerald-600 text-white p-2.5 rounded-xl hover:bg-emerald-700 shadow-lg active:scale-95 h-[38px] flex items-center justify-center px-4">
           <FileSpreadsheet size={18} />
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left min-w-[1100px] bg-white dark:bg-transparent">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-6 py-4 w-12">
                <button 
                  onClick={toggleSelectAll} 
                  className={`p-1.5 rounded-lg transition-all border ${
                    selectedIds.size === filteredLogs.length && filteredLogs.length > 0
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-700'
                  }`}
                  title="Označiť všetko"
                >
                  {selectedIds.size === filteredLogs.length && filteredLogs.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
              </th>
              <th onClick={() => requestSort('date')} className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase w-32 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center justify-center gap-2">Dátum {getSortIcon('date')}</div>
              </th>
              <th onClick={() => requestSort('customer')} className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase w-48 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-2">Zákazník {getSortIcon('customer')}</div>
              </th>
              <th onClick={() => requestSort('project')} className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase w-44 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-2">Projekt {getSortIcon('project')}</div>
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">Popis</th>
              <th onClick={() => requestSort('hours')} className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase text-right w-24 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center justify-end gap-2">Hodiny {getSortIcon('hours')}</div>
              </th>
              <th onClick={() => requestSort('invoice')} className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase w-44 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center justify-end gap-2">Faktúra {getSortIcon('invoice')}</div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-transparent">
            {filteredLogs.map(log => {
              const c = getCustomer(log);
              const t = getTicket(log);
              const isSelected = selectedIds.has(log.id);
              return (
                <tr 
                  key={log.id} 
                  onClick={() => toggleSelectRow(log.id)}
                  className={`transition-colors align-top cursor-pointer ${
                    isSelected 
                      ? 'bg-blue-50/50 dark:bg-blue-900/10' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <td className="px-6 py-1">
                    <div className={`p-1.5 rounded-lg border transition-all ${
                      isSelected 
                        ? 'text-blue-600 border-blue-200 bg-white dark:bg-slate-900' 
                        : 'text-slate-200 dark:text-slate-700 border-transparent'
                    }`}>
                      {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                    </div>
                  </td>
                  <td className="px-6 py-1 text-xs font-mono text-slate-500 dark:text-slate-400 text-center">{formatDateSlovak(log.date)}</td>
                  <td className="px-6 py-1"><span className="text-xs font-bold text-slate-900 dark:text-white truncate block w-full">{c?.name}</span></td>
                  <td className="px-6 py-1">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{t?.sapId || log.manualTicketId || 'N/A'}</span>
                      <span className="text-[10px] text-slate-400 truncate w-32">{t?.title || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-1 text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed">{log.description}</td>
                  <td className="px-6 py-1 text-sm font-black text-slate-900 dark:text-white text-right">{log.hours.toFixed(1)}</td>
                  <td className="px-6 py-1 text-right">
                    {log.invoiceNumber ? (
                      <div className="flex flex-col">
                        <span className="text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase">{log.invoiceNumber}</span>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{formatDateSlovak(log.billingDate || '')}</span>
                      </div>
                    ) : (
                      <span className="text-amber-500 font-black text-[10px] uppercase italic">Čaká...</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredLogs.length === 0 && (
          <div className="py-20 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest opacity-30">Žiadne dáta k zobrazeniu</div>
        )}
      </div>

      {/* Moderný potvrdzovací dialóg pre fakturáciu */}
      {confirmConfig?.isOpen && (
        <AlertModal 
          title={confirmConfig.title} 
          message={confirmConfig.message} 
          type={confirmConfig.type} 
          confirmLabel={confirmConfig.type === 'confirm' ? "Vykonať fakturáciu" : "Potvrdiť anulovanie"}
          onConfirm={confirmConfig.onConfirm} 
          onClose={() => setConfirmConfig(null)} 
        />
      )}
    </div>
  );
};

export default BillingView;
