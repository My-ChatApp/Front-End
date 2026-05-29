interface FieldErrorProps {
  message?: string;
  className?: string;
}

export const FieldError = ({ message, className = '' }: FieldErrorProps) => {
  if (!message) return null;
  return (
    <p className={`mt-1 text-xs font-medium text-red-500 ${className}`} role="alert">
      {message}
    </p>
  );
};
