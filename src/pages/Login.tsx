import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context';
import { Alert, LoadingSpinner } from '@/components';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {}
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
      <div className="w-full max-w-md relative group">
        {/* Glow effect đằng sau card */}
        <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-teal-600 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
        
        <div className="relative bg-white/80 backdrop-blur-2xl border border-white/50 p-10 rounded-[2rem] shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              Chào mừng trở lại
            </h1>
            <p className="text-slate-500 mt-2">Đăng nhập để tiếp tục trò chuyện</p>
          </div>

          {error && <Alert type="error" message={error} onClose={clearError} className="mb-6" />}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">Email</label>
              <input
                type="email"
                className="w-full px-5 py-3.5 rounded-2xl bg-white border border-slate-200 outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all shadow-sm"
                placeholder="email@vidu.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-5 py-3.5 rounded-2xl bg-white border border-slate-200 outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all shadow-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-green-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold text-lg hover:shadow-lg hover:shadow-green-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isLoading ? <LoadingSpinner /> : <><LogIn size={20} /> Đăng nhập</>}
            </button>
          </form>

          <p className="text-center mt-8 text-slate-600">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-green-600 font-bold hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};


