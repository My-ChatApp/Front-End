import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context';
import { Alert, FieldError, LoadingSpinner } from '@/components';
import { FieldErrors, inputErrorClass, validateLoginForm } from '@/utils/validation';
import { Eye, EyeOff, LogIn } from 'lucide-react';

const inputBaseClass =
  'w-full px-5 py-3.5 rounded-2xl bg-white border border-slate-200 outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all shadow-sm';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<'email' | 'password'>>({});
  const [localError, setLocalError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();

  const displayError = localError || error;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    const result = validateLoginForm(email, password);
    if (!result.valid) {
      setFieldErrors(result.fields);
      setLocalError(result.message);
      return;
    }

    setFieldErrors({});
    try {
      await login({ email: email.trim(), password });
      navigate('/chat');
    } catch (err) {}
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
      <div className="w-full max-w-md relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-teal-600 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>

        <div className="relative bg-white/80 backdrop-blur-2xl border border-white/50 p-10 rounded-[2rem] shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              Chào mừng trở lại
            </h1>
            <p className="text-slate-500 mt-2">Đăng nhập để tiếp tục trò chuyện</p>
          </div>

          {displayError && (
            <Alert
              type="error"
              message={displayError}
              onClose={() => {
                setLocalError(null);
                clearError();
              }}
              className="mb-6"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">Email</label>
              <input
                type="email"
                className={inputErrorClass(!!fieldErrors.email, inputBaseClass)}
                placeholder="email@vidu.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }
                  setLocalError(null);
                }}
                autoComplete="email"
              />
              <FieldError message={fieldErrors.email} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={inputErrorClass(!!fieldErrors.password, inputBaseClass)}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }
                    setLocalError(null);
                  }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-green-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <FieldError message={fieldErrors.password} />
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
