
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  minimal?: boolean;
  rangeMode?: boolean;
  startDate?: string;
  endDate?: string;
  onRangeChange?: (start: string, end: string) => void;
}

const SLOVAK_MONTHS = [
  'Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún',
  'Júl', 'August', 'September', 'Október', 'November', 'December'
];

const SLOVAK_DAYS = ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'];

const toYMD = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const DatePicker: React.FC<DatePickerProps> = ({ 
  value, onChange, label, minimal, 
  rangeMode, startDate, endDate, onRangeChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
  
  const [viewDate, setViewDate] = useState(() => {
    const refDate = rangeMode ? (startDate || value) : value;
    if (refDate) {
      const [y, m, d] = refDate.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragCurrent, setDragCurrent] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setViewMode('days');
        setIsDragging(false);
      }
    };
    
    const handleGlobalMouseUp = () => {
      if (isDragging) finishSelection();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart, dragCurrent]);

  const formatDateSlovak = (dateStr?: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  };

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; 
  };

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysCount = daysInMonth(year, month);
    const startOffset = firstDayOfMonth(year, month);
    const days = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let i = 1; i <= daysCount; i++) days.push(new Date(year, month, i));
    return days;
  }, [viewDate]);

  const yearRange = useMemo(() => {
    const currentYear = viewDate.getFullYear();
    const start = currentYear - 6;
    return Array.from({ length: 12 }, (_, i) => start + i);
  }, [viewDate]);

  const finishSelection = () => {
    if (rangeMode && dragStart && dragCurrent && onRangeChange) {
      const dates = [dragStart, dragCurrent].sort();
      onRangeChange(dates[0], dates[1]);
    }
    setIsDragging(false);
    setDragStart(null);
    setDragCurrent(null);
    if (!rangeMode) setIsOpen(false);
  };

  const handleDayMouseDown = (dateStr: string) => {
    if (rangeMode) {
      setIsDragging(true);
      setDragStart(dateStr);
      setDragCurrent(dateStr);
    } else {
      onChange(dateStr);
      setIsOpen(false);
    }
  };

  const handleDayMouseEnter = (dateStr: string) => {
    if (isDragging) setDragCurrent(dateStr);
  };

  const isInSelectedRange = (dateStr: string) => {
    if (isDragging && dragStart && dragCurrent) {
      const start = dragStart < dragCurrent ? dragStart : dragCurrent;
      const end = dragStart < dragCurrent ? dragCurrent : dragStart;
      return dateStr >= start && dateStr <= end;
    }
    if (rangeMode && startDate && endDate) {
      return dateStr >= startDate && dateStr <= endDate;
    }
    return false;
  };

  const isSelectionBound = (dateStr: string) => {
    if (isDragging && dragStart && dragCurrent) {
      return dateStr === dragStart || dateStr === dragCurrent;
    }
    if (rangeMode && startDate && endDate) {
      return dateStr === startDate || dateStr === endDate;
    }
    return dateStr === value;
  };

  return (
    <div className={`relative ${minimal ? 'flex-1' : ''}`} ref={containerRef}>
      {label && <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1 ml-1 tracking-widest">{label}</label>}
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-all ${minimal ? 'px-2 py-1 h-8 border-none bg-transparent' : 'px-4 py-2 h-12'}`}
      >
        <span className={`font-bold text-slate-900 dark:text-slate-100 tracking-tight ${minimal ? 'text-[12px]' : 'text-sm'}`}>
          {rangeMode 
            ? `${formatDateSlovak(startDate)} - ${formatDateSlovak(endDate)}`
            : formatDateSlovak(value)
          }
        </span>
        <CalendarIcon size={minimal ? 12 : 16} className="text-slate-400 dark:text-slate-500" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-[100] animate-in zoom-in-95 fade-in duration-200 origin-top select-none">
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><ChevronLeft size={18} className="text-slate-600 dark:text-slate-400" /></button>
            <button onClick={() => setViewMode(viewMode === 'days' ? 'months' : viewMode === 'months' ? 'years' : 'days')} className="flex items-center gap-1 font-black text-slate-900 dark:text-slate-100 text-xs uppercase tracking-tight hover:text-blue-600 transition-colors">
              {viewMode === 'days' && `${SLOVAK_MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`}
              {viewMode === 'months' && `${viewDate.getFullYear()}`}
              {viewMode === 'years' && `${yearRange[0]} - ${yearRange[11]}`}
              <ChevronDown size={12} />
            </button>
            <button type="button" onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><ChevronRight size={18} className="text-slate-600 dark:text-slate-400" /></button>
          </div>

          {viewMode === 'days' && (
            <>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {SLOVAK_DAYS.map(day => (<div key={day} className="text-[10px] font-bold text-slate-400 dark:text-slate-500 text-center py-1">{day}</div>))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, i) => {
                  if (!date) return <div key={`empty-${i}`} className="aspect-square" />;
                  const dStr = toYMD(date);
                  const isSelected = isInSelectedRange(dStr);
                  const isBound = isSelectionBound(dStr);
                  const isToday = dStr === toYMD(new Date());
                  
                  return (
                    <button
                      key={dStr}
                      type="button"
                      onMouseDown={() => handleDayMouseDown(dStr)}
                      onMouseEnter={() => handleDayMouseEnter(dStr)}
                      className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all relative ${
                        isBound 
                          ? 'bg-blue-600 text-white shadow-md z-10 scale-105' 
                          : isSelected
                            ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-none'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {date.getDate()}
                      {isToday && !isBound && !isSelected && (<div className="absolute bottom-1 w-1 h-1 bg-blue-500 rounded-full" />)}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {viewMode === 'months' && (
            <div className="grid grid-cols-3 gap-2">
              {SLOVAK_MONTHS.map((m, idx) => (
                <button key={m} onClick={() => { setViewDate(new Date(viewDate.getFullYear(), idx, 1)); setViewMode('days'); }} className="py-2.5 px-1 rounded-xl text-[10px] font-black uppercase hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 hover:text-blue-600 border border-transparent hover:border-blue-100 transition-all">{m.substring(0, 3)}</button>
              ))}
            </div>
          )}

          {viewMode === 'years' && (
            <div className="grid grid-cols-3 gap-2">
              {yearRange.map(year => (
                <button key={year} onClick={() => { setViewDate(new Date(year, viewDate.getMonth(), 1)); setViewMode('months'); }} className="py-2.5 px-1 rounded-xl text-xs font-black hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 hover:text-blue-600 border border-transparent hover:border-blue-100 transition-all">{year}</button>
              ))}
            </div>
          )}
          
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-center">
            <button 
              type="button" 
              onClick={() => {
                const today = toYMD(new Date());
                if (rangeMode) onRangeChange?.(today, today); else onChange(today);
                setIsOpen(false);
              }} 
              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-1.5 rounded-lg transition-colors"
            >
              Dnes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
