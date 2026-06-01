type ButtonSpinnerProps = {
  className?: string;
};

/** Spinner nhỏ dùng trong nút submit — không làm nút giãn chiều cao */
export const ButtonSpinner = ({ className = '' }: ButtonSpinnerProps) => (
  <span
    className={`inline-block h-5 w-5 shrink-0 rounded-full border-2 border-white/35 border-t-white animate-spin ${className}`}
    role="status"
    aria-label="Đang xử lý"
  />
);
