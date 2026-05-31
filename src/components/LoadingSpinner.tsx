export const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-5">
      {/* Gradient spinner with glow */}
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-white/80"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-600 border-r-teal-500 animate-spin"></div>
        <div className="absolute inset-1 rounded-full bg-linear-to-tr from-green-500/10 to-teal-500/10 blur-sm"></div>
      </div>
      <p className="app-muted-text font-semibold text-sm animate-pulse">Đang tải dữ liệu...</p>
    </div>
  );
};
