
import React, { useState, useMemo } from 'react';
import { Ticket, Priority, Status, WorkLog, Customer } from '../types';
import { 
  AlertCircle, Edit3, Calendar, 
  Trash2, Copy, Filter, Users,
  LayoutGrid, Eye, FileSpreadsheet, ChevronDown,
  ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';

interface TicketsListProps {
  tickets: Ticket[];
  logs: WorkLog[];
  customers: Customer[];
  searchQuery?: string;
  onUpdateTicket: (ticket: Ticket) => void;
  onEditTicket: (ticket: Ticket) => void;
  onAddTicket: () => void;
  onDeleteTicket: (id: string) => void;
  onCopyTicket: (ticket: Ticket) => void;
  onExport: (data: any[], filename: string) => void;
}

type SortKey = 'sapId' | 'title' | 'date' | 'status' | 'priority' | 'budget' | 'spent' | 'remaining';
type SortOrder = 'asc' | 'desc';

const TicketsList: React.FC<TicketsListProps> = ({ 
  tickets, logs, customers, searchQuery = '', onUpdateTicket, onEditTicket, onAddTicket, onDeleteTicket, onCopyTicket, onExport 
}) => {
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({ key: 'date', order: 'desc' });
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCustomer, setFilterCustomer] = useState<string>('');
  const [showAll, setShowAll] = useState(false);

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

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case Priority.URGENT: return 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30';
      case Priority.HIGH: return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30';
      case Priority.MEDIUM: return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30';
      default: return 'text-slate-600 bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700';
    }
  };

  const getStatusStyle = (s: Status) => {
    switch (s) {
      case Status.DONE: return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case Status.IN_PROGRESS: return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case Status.TESTING: return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case Status.CANCELLED: return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      default: return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    }
  };

  const ticketStats = useMemo(() => {
    const stats: Record<string, { spent: number; remaining: number }> = {};
    tickets.forEach(ticket => {
      const spent = logs.filter(l => l.ticketId === ticket.id).reduce((sum, l) => sum + l.hours, 0);
      stats[ticket.id] = { spent, remaining: (ticket.budget || 0) - spent };
    });
    return stats;
  }, [tickets, logs]);

  const filteredTickets = useMemo(() => {
    const s = searchQuery.toLowerCase();
    
    return tickets.filter(t => {
      const matchesStatus = filterStatus ? t.status === filterStatus : true;
      const matchesCustomer = filterCustomer ? t.customerId === filterCustomer : true;
      const matchesActive = showAll ? true : (t.status !== Status.DONE && t.status !== Status.CANCELLED);
      
      let matchesSearch = true;
      if (s) {
        const customer = customers.find(c => c.id === t.customerId);
        const searchString = [
          t.sapId,
          t.title,
          t.description,
          customer?.name
        ].filter(Boolean).join(' ').toLowerCase();
        
        matchesSearch = searchString.includes(s);
      }

      return matchesStatus && matchesCustomer && matchesActive && matchesSearch;
    });
  }, [tickets, filterStatus, filterCustomer, showAll, searchQuery, customers]);

  const sortedTickets = useMemo(() => {
    return [...filteredTickets].sort((a, b) => {
      let valA: any, valB: any;
      const statsA = ticketStats[a.id] || { spent: 0, remaining: 0 }; 
      const statsB = ticketStats[b.id] || { spent: 0, remaining: 0 };
      
      switch (sortConfig.key) {
        case 'sapId': valA = a.sapId; valB = b.sapId; break;
        case 'title': valA = a.title; valB = b.title; break;
        case 'date': valA = a.date; valB = b.date; break;
        case 'status': valA = a.status; valB = b.status; break;
        case 'priority': valA = a.priority; valB = b.priority; break;
        case 'budget': valA = a.budget; valB = b.budget; break;
        case 'spent': valA = statsA.spent; valB = statsB.spent; break;
        case 'remaining': valA = statsA.remaining; valB = statsB.remaining; break;
        default: return 0;
      }
      
      if (valA < valB) return sortConfig.order === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTickets, sortConfig, ticketStats]);

  const handleExcelExport = () => {
    const data = sortedTickets.map(t => {
      const stats = ticketStats[t.id];
      const customer = customers.find(c => c.id === t.customerId);
      return {
        'ID Projektu': t.sapId,
        'Zákazník': customer?.name || 'Neznámy',
        'Názov': t.title,
        'Status': t.status,
        'Priorita': t.priority,
        'Budget (h)': t.budget,
        'Odpracované (h)': stats.spent,
        'Zostatok (h)': stats.remaining,
        'Deadline': t.date.split('-').reverse().join('.')
      };
    });
    onExport(data, `Zoznam_Projektov`);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
            <Users size={16} className="text-slate-400" />
            <select 
              value={filterCustomer} 
              onChange={e => setFilterCustomer(e.target.value)}
              className="bg-transparent text-[11px] font-black uppercase tracking-tight text-slate-700 dark:text-slate-300 outline-none min-w-[150px] cursor-pointer"
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Všetci zákazníci</option>
              {customers.map(c => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
            <Filter size={16} className="text-slate-400" />
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-transparent text-[11px] font-black uppercase tracking-tight text-slate-700 dark:text-slate-300 outline-none min-w-[130px] cursor-pointer"
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Všetky stavy</option>
              {Object.values(Status).map(s => (
                <option key={s} value={s} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 hidden md:block" />
          
          <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700">
            <button onClick={() => setShowAll(false)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${!showAll ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400'}`}><LayoutGrid size={12} /> Aktívne</button>
            <button onClick={() => setShowAll(true)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${showAll ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400'}`}><Eye size={12} /> Všetky</button>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExcelExport} title="Exportovať do Excelu" className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center">
            <FileSpreadsheet size={20} />
          </button>
          <button onClick={onAddTicket} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95">Nový projekt</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left min-w-[1000px] bg-white dark:bg-transparent">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th onClick={() => requestSort('sapId')} className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider w-44 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center">ID projektu {getSortIcon('sapId')}</div>
              </th>
              <th onClick={() => requestSort('title')} className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider w-96 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center">Názov projektu {getSortIcon('title')}</div>
              </th>
              <th onClick={() => requestSort('status')} className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider w-48 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center">Status {getSortIcon('status')}</div>
              </th>
              <th onClick={() => requestSort('priority')} className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center">Priorita {getSortIcon('priority')}</div>
              </th>
              <th onClick={() => requestSort('spent')} className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right w-44 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center justify-end">Čerpanie (h) {getSortIcon('spent')}</div>
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right w-24">Akcie</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-transparent">
            {sortedTickets.map((ticket) => {
              const { spent, remaining } = ticketStats[ticket.id] || { spent: 0, remaining: 0 };
              const customer = customers.find(c => c.id === ticket.customerId);
              return (
                <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-blue-600 dark:text-blue-400 leading-tight text-sm">{ticket.sapId || 'N/A'}</span>
                      <span className="text-[10px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-tight mt-0.5">{customer?.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 dark:text-white leading-tight">{ticket.title}</div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-1">
                      <Calendar size={10} /> {ticket.date.split('-').reverse().join('.')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative inline-block group/status">
                      <select 
                        value={ticket.status}
                        onChange={(e) => onUpdateTicket({ ...ticket, status: e.target.value as Status })}
                        className={`appearance-none px-3 py-1.5 pr-8 rounded-full text-[10px] font-black uppercase border cursor-pointer outline-none transition-all ${getStatusStyle(ticket.status)}`}
                      >
                        {Object.values(Status).map(s => (
                          <option key={s} value={s} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                            {s}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-hover/status:opacity-100" />
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</span></td>
                  <td className="px-6 py-4 text-right font-black text-xs">
                    <span className="text-slate-400 dark:text-slate-500" title="Rozpočet">{ticket.budget}</span>
                    <span className="mx-1 text-slate-200 dark:text-slate-800">/</span>
                    <span className="text-blue-600 dark:text-blue-400" title="Čerpané">{spent}</span>
                    <span className="mx-1 text-slate-200 dark:text-slate-800">/</span>
                    <span className={`${remaining < 0 ? 'text-red-600' : 'text-emerald-600 dark:text-emerald-400'}`} title="Zostatok">{remaining}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onCopyTicket(ticket)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg" title="Kopírovať"><Copy size={16} /></button>
                      <button onClick={() => onEditTicket(ticket)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" title="Upraviť"><Edit3 size={16} /></button>
                      <button onClick={() => onDeleteTicket(ticket.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg" title="Vymazať"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sortedTickets.length === 0 && <div className="py-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest opacity-30">Žiadne projekty</div>}
      </div>
    </div>
  );
};

export default TicketsList;
