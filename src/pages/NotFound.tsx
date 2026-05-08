import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
      <div className="text-center relative group max-w-lg w-full">
        {/* Hiệu ứng Glow nền */}
        <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-teal-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
        
        <div className="relative bg-white/80 backdrop-blur-2xl border border-white/50 p-12 rounded-[2rem] shadow-2xl flex flex-col items-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6 shadow-sm border border-red-100">
            <AlertCircle size={32} />
          </div>
          
          <h1 className="text-7xl md:text-8xl font-black bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent drop-shadow-sm mb-4">
            404
          </h1>
          
          <h2 className="text-2xl font-bold text-slate-800 mb-3">
            Không tìm thấy trang
          </h2>
          
          <p className="text-slate-500 mb-10 px-4 leading-relaxed">
            Trang bạn đang tìm kiếm có thể đã bị gỡ bỏ, đổi tên, hoặc tạm thời không khả dụng. Xin vui lòng kiểm tra lại đường dẫn.
          </p>
          
          <Link 
            to="/" 
            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95"
          >
            <Home size={20} />
            <span>Trở về Trang chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
};


