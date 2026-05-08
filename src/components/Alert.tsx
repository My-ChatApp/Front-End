import { ReactNode } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
  children?: ReactNode;
  className?: string;
}

const alertConfig = {
  success: {
    baseClass: 'bg-green-50/80 border-green-200 text-green-800',
    icon: <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
  },
  error: {
    baseClass: 'bg-red-50/80 border-red-200 text-red-800',
    icon: <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
  },
  warning: {
    baseClass: 'bg-orange-50/80 border-orange-200 text-orange-800',
    icon: <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
  },
  info: {
    baseClass: 'bg-blue-50/80 border-blue-200 text-blue-800',
    icon: <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
  }
};

export const Alert = ({ type, message, onClose, children, className = '' }: AlertProps) => {
  const { baseClass, icon } = alertConfig[type];

  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-sm shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 ${baseClass} ${className}`}>
      {icon}
      <div className="flex-1 text-sm font-medium leading-relaxed">
        <p>{message}</p>
        {children && <div className="mt-2">{children}</div>}
      </div>
      {onClose && (
        <button 
          type="button"
          title='alert'
          onClick={onClose}
          className="p-1 rounded-full hover:bg-black/5 text-current/60 hover:text-current transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};