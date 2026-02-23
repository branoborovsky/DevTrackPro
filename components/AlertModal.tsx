
import React from 'react';
import { AlertTriangle, HelpCircle, X, Check, AlertCircle } from 'lucide-react';

interface AlertModalProps {
  title: string;
  message: string;
  type: 'warning' | 'confirm' | 'error';
  onConfirm?: () => void;
  onClose: () => void;
  confirmLabel?: string;
}

const AlertModal: React.FC<AlertModalProps> = ({ 
  title, message, type, onConfirm, onClose, confirmLabel = "Potvrdiť" 
}) => {
  const hasAction = !!onConfirm;

  const getIcon = () => {
    switch (type) {
      case 'error': return <AlertCircle size={32} />;
      case 'warning': return <AlertTriangle size={32} />;
      case 'confirm': return <HelpCircle size={32} />;
      default: return <Check size={32} />;
    }
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'error': return 'bg-red-50 dark:bg-red-900/20 text-red-600';
      case 'warning': return 'bg-amber-50 dark:bg-amber-900/20 text-amber-600';
      case 'confirm': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-600';
      default: return 'bg-slate-50 dark:bg-slate-800 text-slate-600';
    }
  };

  const getButtonStyles = () => {
    switch (type) {
      case 'error':
      case 'warning':
        return 'bg-red-600 hover:bg-red-700 shadow-red-500/20';
      case 'confirm':
        return 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20';
      default:
        return 'bg-slate-900 hover:bg-slate-800 shadow-slate-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 text-center">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${getTypeStyles()}`}>
            {getIcon()}
          </div>
          
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
            {title}
          </h3>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            Zrušiť
          </button>
          
          {hasAction && onConfirm && (
            <button 
              onClick={() => { onConfirm(); onClose(); }}
              className={`flex-1 py-3 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 ${getButtonStyles()}`}
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
