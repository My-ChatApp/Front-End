import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context';
import { MessageCircle, LogOut, User } from 'lucide-react';

export const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm">
      <div className="container mx-auto px-4 md:px-6 h-16 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <MessageCircle className="w-8 h-8 text-green-600 group-hover:scale-110 transition-transform" />
          <span className="text-xl font-extrabold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            Chat App
          </span>
        </Link>

        {/* Menu Items */}
        <div className="flex items-center gap-4 md:gap-6">
          {isAuthenticated ? (
            <>
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100/50 rounded-full border border-slate-200 text-sm font-medium text-slate-700">
                <User className="w-4 h-4 text-green-600" />
                <span>{user?.email}</span>
              </div>
              <button 
                onClick={handleLogout} 
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </>
          ) : (
             <>
              <Link 
                to="/login" 
                className="text-sm font-semibold text-slate-600 hover:text-green-600 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link 
                to="/register" 
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};


