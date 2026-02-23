
import React from 'react';
import { ClientOrder, Status } from '../types';
import { Calendar, Clock, Plus, Archive } from 'lucide-react';

interface OrdersListProps {
  orders: ClientOrder[];
  onAddClick: () => void;
}

/**
 * Komponent pre správu a vizualizáciu obchodných zákaziek (Orders).
 * Poznámka: Tento modul je v aktuálnom builde využívaný sekundárne 
 * pre potreby evidencie budúcich projektov.
 */
const OrdersList: React.FC<OrdersListProps> = ({ orders, onAddClick }) => {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Hlavička modulu */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Zákazky</h2>
          <p className="text-slate-500">Správa obchodných kontraktov a ich časových fondov.</p>
        </div>
        <button 
          onClick={onAddClick}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-all font-medium shadow-sm active:scale-95"
        >
          <Plus size={20} />
          Nová zákazka
        </button>
      </div>

      {/* Grid kariet zákaziek */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {orders.map((order) => (
          <div key={order.id} className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-blue-300 transition-all ${order.isArchived ? 'opacity-75 grayscale-[0.5]' : ''}`}>
            <div className="p-6">
              {/* Sekcia so stavom a ID */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                    order.status === Status.IN_PROGRESS ? 'bg-blue-100 text-blue-700' : 
                    order.status === Status.OPEN ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {order.status}
                  </span>
                  {order.isArchived && (
                    <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-white flex items-center gap-1">
                      <Archive size={10} /> Archivované
                    </span>
                  )}
                </div>
                <span className="text-slate-400 text-xs font-mono">{order.id}</span>
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-1">{order.title}</h3>
              <p className="text-slate-600 text-sm mb-6">{order.clientName}</p>
              
              {/* Informácie o budgete a deadline */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <Clock size={16} className="text-blue-500" />
                  <span className="font-semibold text-slate-900">{order.budget.toLocaleString()} h</span>
                  <span className="text-xs text-slate-400 tracking-tighter uppercase font-bold">fond</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <Calendar size={16} className="text-slate-400" />
                  <span>Termín: <span className="text-slate-900 font-medium">{new Date(order.deadline).toLocaleDateString('sk-SK')}</span></span>
                </div>
              </div>
            </div>

            {/* Spodná pätka karty s placeholderom pre tím */}
            <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-t border-slate-100">
              <button className="text-blue-600 text-sm font-semibold hover:underline">Zobraziť detaily</button>
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                    <img src={`https://picsum.photos/seed/${order.id}${i}/32/32`} alt="tímový kolega" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersList;
