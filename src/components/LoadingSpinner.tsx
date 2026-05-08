export const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-4">
      {/* Vòng xoay hiện đại */}
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
        <div className="absolute inset-0 rounded-full border-4 border-green-600 border-t-transparent animate-spin"></div>
      </div>
      <p className="text-slate-500 font-medium text-sm animate-pulse">Đang tải dữ liệu...</p>
    </div>
  );
};


