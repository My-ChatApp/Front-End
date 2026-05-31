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
    <nav className="sticky top-0 z-50 app-card-soft border-x-0 border-t-0 rounded-none bg-white/72">
      <div className="container mx-auto px-4 md:px-6 h-20 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <MessageCircle className="w-8 h-8 text-green-600 group-hover:scale-110 transition-transform" />
          <span className="text-xl font-extrabold app-gradient-text">
            Chat App
          </span>
        </Link>

        {/* Menu Items */}
        <div className="flex items-center gap-4 md:gap-6">
          {isAuthenticated ? (
            <>
              <Link
                to="/chat"
                className="text-sm font-semibold text-slate-600 hover:text-green-600 transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-green-600 after:to-teal-600 after:rounded-full hover:after:w-full after:transition-all after:duration-300"
              >
                Chat
              </Link>
              <Link
                to="/dashboard"
                className="hidden sm:inline text-sm font-semibold text-slate-500 hover:text-green-600 transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-green-600 after:to-teal-600 after:rounded-full hover:after:w-full after:transition-all after:duration-300"
              >
                Dashboard
              </Link>
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-md rounded-full border border-slate-200/60 text-sm font-medium text-slate-700 shadow-sm">
                <User className="w-4 h-4 text-green-600" />
                <span>{user?.email}</span>
              </div>
              <button 
                onClick={handleLogout} 
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-full transition-all active:scale-95"
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
                className="app-button-primary px-6 py-2.5 text-sm"
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
