import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context';
import { Alert, LoadingSpinner } from '@/components';
import { UserPlus, User, Mail, Lock } from 'lucide-react';

export const Register = () => {
  const [formData, setFormData] = useState({ email: '', username: '', password: '', confirmPassword: '' });
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return; 
    try {
      await register(formData);
      navigate('/login?registered=true');
    } catch (err) {}
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-teal-600 to-green-600 rounded-[2rem] blur opacity-20 transition duration-1000"></div>
        
        <div className="relative bg-white/80 backdrop-blur-2xl border border-white/50 p-10 rounded-[2rem] shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              Tạo tài khoản mới
            </h1>
            <p className="text-slate-500 mt-2">Gia nhập cộng đồng Chat App ngay</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Tên người dùng</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-green-500 outline-none transition-all"
                    placeholder="john_doe"
                    onChange={e => setFormData({...formData, username: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-green-500 outline-none transition-all"
                    placeholder="vidu@mail.com"
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-green-500 outline-none transition-all"
                  placeholder="••••••••"
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Xác nhận mật khẩu</label>
              <input
                type="password"
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-green-500 outline-none transition-all"
                placeholder="••••••••"
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 mt-4 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {isLoading ? <LoadingSpinner /> : <><UserPlus size={20} /> Đăng ký tài khoản</>}
            </button>
          </form>

          <p className="text-center mt-6 text-slate-600 text-sm">
            Đã có tài khoản? <Link to="/login" className="text-teal-600 font-bold hover:underline">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
};


