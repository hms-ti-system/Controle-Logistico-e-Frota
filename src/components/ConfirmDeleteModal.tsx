import React from 'react';
import { AlertTriangle, Trash2, X, Power, CheckCircle2, Info } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'success' | 'info';
  icon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  message,
  itemName,
  confirmLabel = 'Sim, Excluir',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  icon,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          iconBox: 'bg-amber-950/70 border-amber-800/80 text-amber-400',
          defaultIcon: <Power className="w-5 h-5" />,
          button: 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white',
        };
      case 'success':
        return {
          iconBox: 'bg-emerald-950/70 border-emerald-800/80 text-emerald-400',
          defaultIcon: <CheckCircle2 className="w-5 h-5" />,
          button: 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white',
        };
      case 'info':
        return {
          iconBox: 'bg-blue-950/70 border-blue-800/80 text-blue-400',
          defaultIcon: <Info className="w-5 h-5" />,
          button: 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white',
        };
      case 'danger':
      default:
        return {
          iconBox: 'bg-red-950/70 border-red-800/80 text-red-400',
          defaultIcon: <AlertTriangle className="w-5 h-5" />,
          button: 'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white',
        };
    }
  };

  const currentStyles = getVariantStyles();

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
      onClick={onCancel}
    >
      <div 
        className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${currentStyles.iconBox}`}>
              {icon || currentStyles.defaultIcon}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">{title}</h3>
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {message}
              </p>
              {itemName && (
                <div className="mt-2.5 p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 truncate">
                  {itemName}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onConfirm();
              }}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer ${currentStyles.button}`}
            >
              {variant === 'danger' && <Trash2 className="w-3.5 h-3.5" />}
              {variant === 'warning' && <Power className="w-3.5 h-3.5" />}
              {variant === 'success' && <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{confirmLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

