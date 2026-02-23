
import React from 'react';
import { View } from '../types';
import { NAV_ITEMS } from '../constants';
import Icon from './Icon';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

/**
 * Bočný navigačný panel (Sidebar) aplikácie DevTrack Pro.
 */
const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  // Rozdelenie položiek menu - Filtrujeme nastavenia z hlavných zoznamov
  const mainNavItems = NAV_ITEMS.filter(item => !['tickets', 'customers', 'clients', 'settings'].includes(item.id));
  const adminNavItems = NAV_ITEMS.filter(item => ['tickets', 'customers', 'clients'].includes(item.id));
  const settingsItem = NAV_ITEMS.find(item => item.id === 'settings');

  const renderItem = (item: typeof NAV_ITEMS[0]) => (
    <button
      key={item.id}
      onClick={() => onViewChange(item.id as View)}
      className={`w-full flex items-center gap-3 px-6 py-3 transition-all duration-200 ${
        currentView === item.id 
          ? 'bg-blue-600/10 text-blue-400 border-r-4 border-blue-600' 
          : 'hover:bg-slate-800 hover:text-white'
      }`}
    >
      <div className={`${currentView === item.id ? 'text-blue-500' : 'text-slate-500'}`}>
        {item.icon}
      </div>
      <span className="font-semibold text-sm tracking-tight">{item.label}</span>
    </button>
  );

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 h-screen sticky top-0 flex flex-col shadow-2xl z-20">
      <div className="p-8 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Icon size={38} className="shadow-2xl shadow-blue-500/20" />
          <div className="flex flex-col">
            <h1 className="text-lg font-black text-white leading-none tracking-tighter">
              DevTrack
            </h1>
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">PRO</span>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 py-6 overflow-y-auto custom-scrollbar">
        <div className="mb-4 px-6">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Agenda</p>
        </div>
        {mainNavItems.map(renderItem)}
      </nav>

      <nav className="py-6 border-t border-slate-800 bg-slate-900/50">
        <div className="mb-4 px-6">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Nastavenia</p>
        </div>
        {adminNavItems.map(renderItem)}
      </nav>

      {/* Spodná sekcia s verziou a nastaveniami */}
      <div className="p-6 mt-auto border-t border-slate-800 flex items-center gap-3">
        <div className="flex-1 bg-slate-800/40 p-3 rounded-2xl border border-slate-700/30">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
            <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest">v1.2.0 Build</p>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">System Online</p>
        </div>
        
        {settingsItem && (
          <button
            onClick={() => onViewChange('settings')}
            title={settingsItem.label}
            className={`p-3.5 rounded-2xl transition-all duration-300 ${
              currentView === 'settings'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-105'
                : 'bg-slate-800/50 text-slate-500 hover:text-white hover:bg-slate-700'
            }`}
          >
            {settingsItem.icon}
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
