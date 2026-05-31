import { Link } from 'react-router-dom';
import { Home, AlertCircle, MessageCircle, ArrowRight } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="app-page-shell min-h-[calc(100vh-80px)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-25 animate-blob"></div>
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-teal-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-25 animate-blob animation-delay-2000"></div>

      <div className="text-center relative group max-w-lg w-full animate-fade-in-up">
        {/* Hiệu ứng Glow nền */}
        <div className="absolute -inset-1 bg-linear-to-r from-green-600 to-teal-600 rounded-4xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
        
        <div className="relative app-card-strong p-12 rounded-4xl flex flex-col items-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6 shadow-sm border border-red-100">
            <AlertCircle size={32} />
          </div>
          
          <h1 className="text-7xl md:text-8xl font-black bg-linear-to-r from-green-600 to-teal-600 bg-clip-text text-transparent drop-shadow-sm mb-4 animate-float">
            404
          </h1>
          
          <h2 className="text-2xl font-bold text-slate-800 mb-3">
            Không tìm thấy trang
          </h2>
          
          <p className="app-muted-text mb-10 px-4 leading-relaxed">
            Trang bạn đang tìm kiếm có thể đã bị gỡ bỏ, đổi tên, hoặc tạm thời không khả dụng. Xin vui lòng kiểm tra lại đường dẫn.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Link 
              to="/" 
              className="app-button-dark w-full sm:w-auto px-8 py-4 rounded-full"
            >
              <Home size={20} />
              <span>Trở về Trang chủ</span>
            </Link>
            <Link 
              to="/chat" 
              className="app-button-primary w-full sm:w-auto px-8 py-4 rounded-full"
            >
              <MessageCircle size={20} />
              <span>Đi tới Chat</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
