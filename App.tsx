
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TicketsList from './components/TicketsList';
import WorkLogView from './components/WorkLogView';
import ConsumptionView from './components/ConsumptionView';
import IHRView from './components/IHRView';
import CustomerList from './components/CustomerList';
import ClientList from './components/ClientList';
import BillingView from './components/BillingView';
import TicketModal from './components/TicketModal';
import WorkLogModal from './components/WorkLogModal';
import CustomerModal from './components/CustomerModal';
import ClientModal from './components/ClientModal';
import AlertModal from './components/AlertModal';
import FilenameModal from './components/FilenameModal';
import { useAppData } from './hooks/useAppData';
import { View, Ticket, WorkLog, Customer, Client } from './types';
import { INITIAL_TICKET_FORM } from './constants';
import { invoke } from '@tauri-apps/api/core';
import { CheckCircle, X, Trash2, Database, AlertTriangle, FolderOpen, Save, Flame, FileText } from 'lucide-react';

const App: React.FC = () => {
  const data = useAppData();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('dt_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ticketForm, setTicketForm] = useState<Ticket>(INITIAL_TICKET_FORM);
  const [logForm, setLogForm] = useState<Partial<WorkLog>>({});
  const [customerForm, setPartialCustomer] = useState<Partial<Customer>>({});
  const [clientForm, setPartialClientForm] = useState<Partial<Client>>({});
  
  const [tempDbPath, setTempDbPath] = useState('');
  const [toast, setToast] = useState<{ show: boolean, message: string, filename?: string } | null>(null);

  // Stav pre čakanie na názov súboru pri exporte
  const [pendingExport, setPendingExport] = useState<{ data: any[], defaultName: string } | null>(null);

  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'warning' | 'confirm' | 'error';
    onConfirm?: () => void;
    confirmLabel?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning'
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('dt_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (data.dbPath) setTempDbPath(data.dbPath);
  }, [data.dbPath]);

  const handleExport = (exportData: any[], filename: string) => {
    // Namiesto okamžitého exportu vyžiadame názov súboru
    setPendingExport({ data: exportData, defaultName: filename });
  };

  const confirmExport = (finalFilename: string) => {
    if (!pendingExport) return;
    
    try {
      const fullFilename = `${finalFilename}.xlsx`;
      const globalXLSX = (window as any).XLSX;
      if (!globalXLSX) return;
      const ws = globalXLSX.utils.json_to_sheet(pendingExport.data);
      const wb = globalXLSX.utils.book_new();
      globalXLSX.utils.book_append_sheet(wb, ws, "Dáta");
      globalXLSX.writeFile(wb, fullFilename);
      
      setToast({ 
        show: true, 
        message: `Súbor bol uložený do priečinka sťahovania.`,
        filename: fullFilename
      });
      setTimeout(() => setToast(null), 5000);
    } catch (error) {
      console.error("Export zlyhal:", error);
    } finally {
      setPendingExport(null);
    }
  };

  const handleSaveDbPath = async () => {
    if (!tempDbPath || tempDbPath === data.dbPath) return;
    try {
      await invoke('set_db_path', { newPath: tempDbPath });
      setToast({ show: true, message: 'Cesta k databáze bola zmenená. Aplikácia sa reštartuje.' });
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      console.error("Chyba pri zmene cesty:", err);
      setAlertConfig({
        isOpen: true,
        title: "Chyba prístupu",
        message: "Nepodarilo sa zmeniť cestu k databáze. Skontrolujte oprávnenia k priečinku.",
        type: 'error'
      });
    }
  };

  const safeDeleteTicket = (id: string) => {
    const hasLogs = data.logs.some(l => l.ticketId === id);
    if (hasLogs) {
      setAlertConfig({
        isOpen: true,
        title: "Projekt nie je možné zmazať",
        message: "K tomuto projektu existujú priradené záznamy v denníku práce. Najskôr vymažte alebo presuňte všetky výkazy tohto projektu.",
        type: 'error'
      });
      return;
    }
    setAlertConfig({
      isOpen: true,
      title: "Vymazať projekt?",
      message: "Naozaj chcete natrvalo odstrániť tento projekt? Táto akcia je nevratná.",
      type: 'confirm',
      confirmLabel: "Vymazať",
      onConfirm: () => data.deleteEntity('tickets', id)
    });
  };

  const safeDeleteCustomer = (id: string) => {
    const hasTickets = data.tickets.some(t => t.customerId === id);
    const hasLogs = data.logs.some(l => l.customerId === id);
    if (hasTickets || hasLogs) {
      setAlertConfig({
        isOpen: true,
        title: "Zákazníka nie je možné zmazať",
        message: "Tento zákazník má v systéme priradené projekty alebo historické výkazy práce. Pre zachovanie integrity dát mazanie nie je povolené. Zákazníka môžete namiesto toho deaktivovať.",
        type: 'error'
      });
      return;
    }
    setAlertConfig({
      isOpen: true,
      title: "Vymazať zákazníka?",
      message: "Naozaj chcete odstrániť tohto zákazníka? Akcia je nevratná.",
      type: 'confirm',
      confirmLabel: "Vymazať",
      onConfirm: () => data.deleteEntity('customers', id)
    });
  };

  const safeDeleteClient = (id: string) => {
    const hasCustomers = data.customers.some(c => c.clientId === id);
    if (hasCustomers) {
      setAlertConfig({
        isOpen: true,
        title: "Mandanta nie je možné zmazať",
        message: "Tento mandant obsahuje priradených zákazníkov. Najskôr odstráňte všetkých zákazníkov prislúchajúcich k tomuto mandantovi.",
        type: 'error'
      });
      return;
    }
    setAlertConfig({
      isOpen: true,
      title: "Vymazať mandanta?",
      message: "Naozaj chcete odstrániť túto divíziu/mandanta? Všetky nastavenia pre túto entitu budú stratené.",
      type: 'confirm',
      confirmLabel: "Vymazať",
      onConfirm: () => data.deleteEntity('clients', id)
    });
  };

  const triggerFirstDeleteConfirmation = () => {
    setAlertConfig({
      isOpen: true,
      title: "Úplný reset dát",
      message: "Naozaj chcete vymazať celú databázu? Všetky vaše záznamy budú odstránené.",
      type: 'confirm',
      confirmLabel: "Pokračovať k resetu",
      onConfirm: triggerSecondDeleteConfirmation
    });
  };

  const triggerSecondDeleteConfirmation = () => {
    setTimeout(() => {
      setAlertConfig({
        isOpen: true,
        title: "STE SI ABSOLÚTNE ISTÝ?",
        message: "TENTO KROK JE NEVRATNÝ. Stratíte všetkých klientov, projekty a výkazy práce. Chcete definitívne vykonať továrne nastavenia?",
        type: 'confirm',
        confirmLabel: "DEFINITÍVNE VYMAZAŤ",
        onConfirm: data.clearDatabase
      });
    }, 100);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard tickets={data.filteredTickets} logs={data.filteredLogs} theme={theme} onQuickAction={() => {}} />;
      case 'tickets': return <TicketsList tickets={data.filteredTickets} logs={data.filteredLogs} customers={data.filteredCustomers} searchQuery={searchQuery} onUpdateTicket={(t) => data.putEntity('tickets', t)} onEditTicket={(t) => { setEditingId(t.id); setTicketForm(t); setActiveModal('ticket'); }} onAddTicket={() => { setEditingId(null); setTicketForm({ ...INITIAL_TICKET_FORM, clientId: data.selectedClientId }); setActiveModal('ticket'); }} onDeleteTicket={safeDeleteTicket} onCopyTicket={(t) => { const copy = { ...t, id: `TIC-${Date.now()}` }; setTicketForm(copy); setEditingId(null); setActiveModal('ticket'); }} onExport={handleExport} />;
      case 'worklogs': return <WorkLogView logs={data.filteredLogs} tickets={data.filteredTickets} customers={data.filteredCustomers} searchQuery={searchQuery} onAddClick={() => { setLogForm({ date: new Date().toISOString().split('T')[0], clientId: data.selectedClientId }); setEditingId(null); setActiveModal('log'); }} onCopyClick={(l) => { setLogForm({ ...l, id: `LOG-${Date.now()}` }); setEditingId(null); setActiveModal('log'); }} onUpdateLog={(l) => { setEditingId(l.id); setLogForm(l); setActiveModal('log'); }} onDeleteLog={(id) => data.deleteEntity('worklogs', id)} onExport={handleExport} />;
      case 'consumption': return <ConsumptionView tickets={data.filteredTickets} logs={data.filteredLogs} customers={data.filteredCustomers} onExport={handleExport} />;
      case 'ihr': return <IHRView logs={data.filteredLogs} tickets={data.filteredTickets} customers={data.filteredCustomers} searchQuery={searchQuery} onExportExcel={handleExport} />;
      case 'customers': return <CustomerList customers={data.filteredCustomers} onAddClick={() => { setPartialCustomer({ clientId: data.selectedClientId }); setEditingId(null); setActiveModal('customer'); }} onEditClick={(c) => { setEditingId(c.id); setPartialCustomer(c); setActiveModal('customer'); }} onDeleteClick={safeDeleteCustomer} onExport={handleExport} />;
      case 'clients': return <ClientList clients={data.clients} onAddClick={() => { setPartialClientForm({}); setEditingId(null); setActiveModal('client'); }} onEditClick={(c) => { setEditingId(c.id); setPartialClientForm(c); setActiveModal('client'); }} onDeleteClick={safeDeleteClient} onExport={handleExport} />;
      case 'billing': return <BillingView tickets={data.filteredTickets} logs={data.filteredLogs} customers={data.filteredCustomers} searchQuery={searchQuery} onBulkBill={async (ids, inv, date) => {
        const updatedLogs = data.logs.map(l => ids.includes(l.id) ? { ...l, invoiceNumber: inv, billingDate: date } : l);
        await Promise.all(ids.map(id => {
          const log = updatedLogs.find(x => x.id === id);
          return data.putEntity('worklogs', log);
        }));
      }} onExport={handleExport} />;
      case 'settings': return (
        <div className="max-w-4xl space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-24">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Nastavenia systému</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Konfigurácia aplikácie a úložiska</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
                <Database size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Databázové úložisko</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Umiestnenie SQLite súboru</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Absolútna cesta k súboru</label>
                <div className="flex gap-2">
                  <div className="relative flex-1 group">
                    <FolderOpen size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                      type="text" 
                      value={tempDbPath} 
                      onChange={(e) => setTempDbPath(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-3 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      placeholder="C:/Cesta/k/databaze/devtrack_data.db"
                    />
                  </div>
                  <button 
                    onClick={handleSaveDbPath}
                    disabled={tempDbPath === data.dbPath}
                    className="bg-slate-900 dark:bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-blue-700 disabled:opacity-30 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/10"
                  >
                    <Save size={16} /> Zmeniť a reštartovať
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 font-bold ml-1 italic">Zmena cesty vyžaduje automatický reštart aplikácie pre pripojenie k novému súboru.</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50/30 dark:bg-red-900/5 rounded-[2.5rem] border-2 border-red-100 dark:border-red-900/20 p-8 shadow-2xl shadow-red-500/5">
            <div className="flex items-start gap-6">
              <div className="p-4 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-600/20">
                <AlertTriangle size={32} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                   <h4 className="text-xl font-black text-red-600 uppercase tracking-tight">Danger Zone</h4>
                   <div className="px-2 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-[8px] font-black uppercase rounded-md tracking-widest animate-pulse">Kritická zóna</div>
                </div>
                <p className="text-sm text-red-700 dark:text-red-400 font-bold mb-6 max-w-2xl leading-relaxed">
                  Vymazaním databázy odstránite úplne všetky dáta zo systému. Aplikácia bude po reštarte úplne prázdna bez akýchkoľvek preddefinovaných záznamov. Vyžaduje sa dvojitá konfirmácia.
                </p>
                <button 
                  onClick={triggerFirstDeleteConfirmation}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-red-500/20 active:scale-95 group"
                >
                  <Trash2 size={16} className="group-hover:rotate-12 transition-transform" /> Resetovať celú databázu
                </button>
              </div>
              <div className="hidden lg:block opacity-10 dark:opacity-20">
                 <Flame size={120} className="text-red-600" />
              </div>
            </div>
          </div>
        </div>
      );
      default: return <Dashboard tickets={data.filteredTickets} logs={data.filteredLogs} theme={theme} onQuickAction={() => {}} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          selectedClientId={data.selectedClientId} setSelectedClientId={data.setSelectedClientId}
          clients={data.clients} dbPath={data.dbPath} theme={theme} setTheme={setTheme}
        />
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {renderContent()}
        </main>
      </div>

      {activeModal === 'customer' && (
        <CustomerModal customer={customerForm as Customer} onSave={async (c) => { const item = { ...c, id: editingId || `CUST-${Date.now()}` } as Customer; await data.putEntity('customers', item); setActiveModal(null); }} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'ticket' && (
        <TicketModal ticket={ticketForm} customers={data.filteredCustomers} onSave={async (t) => { const item = { ...t, id: editingId || `TIC-${Date.now()}` } as Ticket; await data.putEntity('tickets', item); setActiveModal(null); }} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'log' && (
        <WorkLogModal log={logForm} tickets={data.filteredTickets} logs={data.filteredLogs} customers={data.filteredCustomers} onSave={async (l) => { const item = { ...l, id: editingId || `LOG-${Date.now()}` } as WorkLog; await data.putEntity('worklogs', item); setActiveModal(null); }} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'client' && (
        <ClientModal client={clientForm} onSave={async (c) => { const item = { ...c, id: editingId || `CLI-${Date.now()}` } as Client; await data.putEntity('clients', item); setActiveModal(null); }} onClose={() => setActiveModal(null)} />
      )}

      {pendingExport && (
        <FilenameModal 
          defaultFilename={pendingExport.defaultName}
          onConfirm={confirmExport}
          onClose={() => setPendingExport(null)}
        />
      )}

      {alertConfig.isOpen && (
        <AlertModal 
          title={alertConfig.title} 
          message={alertConfig.message} 
          type={alertConfig.type} 
          confirmLabel={alertConfig.confirmLabel}
          onConfirm={alertConfig.onConfirm} 
          onClose={() => setAlertConfig({...alertConfig, isOpen: false})} 
        />
      )}

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] max-w-md w-full px-4 animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-2xl flex items-center gap-4 border-l-4 border-l-emerald-500">
             <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-xl">
               {toast.filename ? <FileText size={20} /> : <CheckCircle size={20} />}
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{toast.filename ? 'Export úspešný' : 'Info'}</p>
                {toast.filename && <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 truncate">{toast.filename}</p>}
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{toast.message}</p>
             </div>
             <button onClick={() => setToast(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"><X size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
