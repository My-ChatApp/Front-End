import { AlertCircle } from 'lucide-react';

interface FieldErrorProps {
  message?: string;
  className?: string;
}

export const FieldError = ({ message, className = '' }: FieldErrorProps) => {
  if (!message) return null;
  return (
    <p className={`mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600 animate-fade-in ${className}`} role="alert">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      {message}
    </p>
  );
};
