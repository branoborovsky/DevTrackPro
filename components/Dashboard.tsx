import React, { useState, useMemo } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell 
} from 'recharts';
import { Ticket, WorkLog, Status } from '../types';
import { 
  ClipboardList, Clock, TrendingUp, Hourglass, 
  CalendarDays, ChevronLeft, ChevronRight,
  History, Activity
} from 'lucide-react';

interface DashboardProps {
  tickets: Ticket[];
  logs: WorkLog[];
  theme: 'light' | 'dark';
  onQuickAction: (type: 'log' | 'ticket') => void;
}

const SLOVAK_MONTHS = [
  'Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún',
  'Júl', 'August', 'September', 'Október', 'November', 'December'
];

const SK_FIXED_HOLIDAYS = [
  '1-0', '6-0', '1-4', '8-4', '5-6', '29-7', '15-8', '1-10', '24-11', '25-11', '26-11'
];

/**
 * Výpočet dátumu Veľkonočnej nedele pre daný rok (Meeus/Jones/Butcher algoritmus).
 */
const getEasterDate = (year: number) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
};

const toYMD = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Vlastný komponent pre popisky osi X, ktorý farebne odlišuje nepracovné dni.
 */
const CustomXAxisTick = (props: any) => {
  const { x, y, payload, chartData } = props;
  const dayData = chartData[payload.index];
  const isOffDay = dayData?.isWeekend || dayData?.isHoliday;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={12}
        textAnchor="middle"
        fill={isOffDay ? '#ef4444' : '#94a3b8'}
        fontSize={9} // Mierne zmenšené písmo pre lepšiu hustotu 31 dní
        fontWeight={isOffDay ? "900" : "600"}
      >
        {payload.value}
      </text>
    </g>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ tickets, logs, theme }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const todayStr = toYMD(new Date());
  const currentYear = viewDate.getFullYear();

  const activeTickets = useMemo(() => 
    tickets.filter(t => t.status !== Status.DONE && t.status !== Status.CANCELLED),
  [tickets]);

  const todayHours = useMemo(() => 
    logs.filter(l => l.date === todayStr).reduce((sum, l) => sum + l.hours, 0),
  [logs, todayStr]);

  const recentLogs = useMemo(() => 
    [...logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10),
  [logs]);

  const monthlyFund = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    // Výpočet pohyblivých sviatkov pre aktuálny rok
    const easter = getEasterDate(year);
    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);
    const easterMonday = new Date(easter);
    easterMonday.setDate(easter.getDate() + 1);

    const goodFridayStr = toYMD(goodFriday);
    const easterMondayStr = toYMD(easterMonday);

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let workingDays = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dayOfWeek = date.getDay();
      const dateStr = toYMD(date);

      // Ak je pracovný deň (Po-Pi)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const isFixedHoliday = SK_FIXED_HOLIDAYS.includes(`${d}-${month}`);
        const isEasterHoliday = dateStr === goodFridayStr || dateStr === easterMondayStr;
        
        if (!isFixedHoliday && !isEasterHoliday) {
          workingDays++;
        }
      }
    }
    return workingDays * 8;
  }, [viewDate]);

  const remainingHours = useMemo(() => {
    return activeTickets.reduce((acc, ticket) => {
      const projectLogs = logs.filter(l => l.ticketId === ticket.id);
      const spent = projectLogs.reduce((sum, l) => sum + l.hours, 0);
      const budget = ticket.budget || 0;
      const remaining = Math.max(budget - spent, 0);
      return acc + remaining;
    }, 0);
  }, [activeTickets, logs]);

  const yearlyHours = useMemo(() => 
    logs.filter(l => l.date.startsWith(String(currentYear))).reduce((s, l) => s + l.hours, 0),
  [logs, currentYear]);

  const totalSpentHoursMonth = useMemo(() => {
    const monthPrefix = toYMD(viewDate).substring(0, 7);
    return logs
      .filter(l => l.date.startsWith(monthPrefix))
      .reduce((sum, l) => sum + l.hours, 0);
  }, [logs, viewDate]);

  const chartData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const easter = getEasterDate(year);
    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);
    const easterMonday = new Date(easter);
    easterMonday.setDate(easter.getDate() + 1);

    const gfStr = toYMD(goodFriday);
    const emStr = toYMD(easterMonday);

    const daysCount = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysCount }, (_, i) => {
      const day = i + 1;
      const date = new Date(year, month, day);
      const dateStr = toYMD(date);
      const dayHours = logs.filter(l => l.date === dateStr).reduce((sum, l) => sum + l.hours, 0);
      
      const isFixedHoliday = SK_FIXED_HOLIDAYS.includes(`${day}-${month}`);
      const isEasterHoliday = dateStr === gfStr || dateStr === emStr;

      return { 
        day: `${day}.`, 
        hodiny: dayHours, 
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        isHoliday: isFixedHoliday || isEasterHoliday
      };
    });
  }, [logs, viewDate]);

  const fundFulfillment = monthlyFund > 0 ? Math.round((totalSpentHoursMonth / monthlyFund) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={<Clock />} label="Dnes" value={`${todayHours} h`} subValue={`${(todayHours / 8).toFixed(1)} MD`} color="blue" />
        <StatCard icon={<ClipboardList />} label="Projekty" value={activeTickets.length} subValue="Aktívne úlohy" color="indigo" />
        <StatCard icon={<Hourglass />} label="K čerpaniu" value={`${remainingHours.toFixed(1)} h`} subValue={`${(remainingHours / 8).toFixed(1)} MD`} color="amber" />
        <StatCard icon={<Activity />} label="Za mesiac" value={`${totalSpentHoursMonth} h`} subValue={`${(totalSpentHoursMonth / 8).toFixed(1)} MD`} color="emerald" />
        <StatCard icon={<TrendingUp />} label="Za rok" value={`${yearlyHours} h`} subValue={`${(yearlyHours / 8).toFixed(1)} MD`} color="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-slate-50 dark:border-slate-800 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl"><CalendarDays size={22} /></div>
              <div><h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Výkonnosť</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mesačný sumár</p></div>
            </div>
            <div className="flex items-center gap-6">
               <div className="text-right"><p className="text-[9px] font-black text-slate-400 uppercase">Fond</p><p className="text-base font-black text-slate-600 dark:text-slate-300">{monthlyFund}h</p></div>
               <div className="text-right"><p className="text-[9px] font-black text-slate-400 uppercase">Plnenie</p><p className={`text-base font-black ${fundFulfillment > 100 ? 'text-red-600' : 'text-blue-600'}`}>{fundFulfillment}%</p></div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="font-black text-slate-900 dark:text-white text-lg uppercase tracking-tight">{SLOVAK_MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 transition-colors"><ChevronLeft size={20} /></button>
              <button onClick={() => setViewDate(new Date())} className="text-[10px] font-black uppercase text-blue-600 px-3 py-2">Dnes</button>
              <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 transition-colors"><ChevronRight size={20} /></button>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#cbd5e1' : '#e2e8f0'} opacity={theme === 'dark' ? 0.1 : 0.5} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  interval={0} // Vynútené zobrazenie všetkých dní (ticks)
                  tick={(props) => <CustomXAxisTick {...props} chartData={chartData} />} 
                />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} />
                <Tooltip 
                  cursor={{ fill: theme === 'dark' ? '#f8fafc' : '#f1f5f9', opacity: theme === 'dark' ? 0.05 : 0.4 }} 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                    padding: '12px', 
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', 
                    color: theme === 'dark' ? '#fff' : '#0f172a',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }} 
                />
                <Bar dataKey="hodiny" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={(entry.isWeekend || entry.isHoliday) ? (theme === 'dark' ? '#334155' : '#cbd5e1') : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><History size={14} /> Aktivita</h4>
          <div className="space-y-4 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
            {recentLogs.map((log) => {
              const ticket = tickets.find(t => t.id === log.ticketId);
              const projectId = ticket?.sapId || log.manualTicketId || 'M';
              return (
                <div key={log.id} className="border-b border-slate-50 dark:border-slate-800 pb-3">
                  
                    
                  
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate"><span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter border border-blue-200 dark:border-blue-800/50 px-1 rounded bg-blue-50/50 dark:bg-blue-900/10">
                      {projectId}
                    </span> {log.description}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">{log.hours}h</span>
                    <span className="text-[9px] text-slate-400 font-bold">{log.date.split('-').reverse().join('.')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

type ColorKey = 'blue' | 'indigo' | 'amber' | 'emerald' | 'violet';

const StatCard = ({ icon, label, value, subValue, color }: { icon: any, label: string, value: any, subValue: string, color: ColorKey }) => {
  const iconColors = {
    blue: 'bg-blue-600 text-white shadow-blue-500/20',
    indigo: 'bg-indigo-600 text-white shadow-indigo-500/20',
    amber: 'bg-amber-600 text-white shadow-amber-500/20',
    emerald: 'bg-emerald-600 text-white shadow-emerald-500/20',
    violet: 'bg-violet-600 text-white shadow-violet-500/20'
  };

  const textColors = {
    blue: 'text-blue-600 dark:text-blue-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
    amber: 'text-amber-600 dark:text-amber-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    violet: 'text-violet-600 dark:text-violet-400'
  }

  return (
    <div className={`p-8 rounded-[2.5rem] border transition-all flex flex-col items-center text-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-${color}-300 dark:hover:border-${color}-700`}>
      <div className={`p-4 rounded-3xl mb-4 flex items-center justify-center ${iconColors[color]} shadow-lg`}>
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-slate-400 dark:text-slate-500">{label}</span>
      <div className={`text-3xl font-black mb-1 leading-none ${textColors[color]}`}>{value}</div>
      <div className="text-[11px] font-bold text-slate-400">{subValue}</div>
    </div>
  );
};

export default Dashboard;