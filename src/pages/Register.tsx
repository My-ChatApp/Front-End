import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context';
import { Alert, FieldError, LoadingSpinner } from '@/components';
import { FieldErrors, inputErrorClass, validateRegisterForm } from '@/utils/validation';
import { UserPlus, User, Mail, Lock, MessageCircle, ShieldCheck } from 'lucide-react';

const inputBaseClass =
  'app-input w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all text-slate-800 placeholder:text-slate-400';
const inputBaseClassPlain =
  'app-input w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all text-slate-800 placeholder:text-slate-400';

export const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState<
    FieldErrors<'email' | 'username' | 'password' | 'confirmPassword'>
  >({});
  const [localError, setLocalError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuth();

  const displayError = localError || error;

  const updateField = <K extends keyof typeof formData>(key: K, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
    setLocalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    const result = validateRegisterForm(formData);
    if (!result.valid) {
      setFieldErrors(result.fields);
      setLocalError(result.message);
      return;
    }

    setFieldErrors({});
    try {
      await register({
        email: formData.email.trim(),
        username: formData.username.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      navigate('/chat');
    } catch {
      // AuthContext sets error state
    }
  };

  return (
    <div className=" w-full min-h-[calc(100vh-80px)] flex items-center justify-center p-4 relative overflow-hidden m-4">
      {/* Background decoration */}
      <div className="absolute top-10 left-20 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-30 animate-blob"></div>
      <div className="absolute bottom-10 right-20 w-80 h-80 bg-green-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-lg mx-auto relative group animate-fade-in-up">
        {/* Glow border */}
        <div className="absolute -inset-1 bg-gradient-to-r from-teal-600 to-green-600 rounded-[2.25rem] blur opacity-20 group-hover:opacity-35 transition duration-1000"></div>

        <div className="relative app-card-strong p-10 rounded-[2rem]">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl app-hero-banner flex items-center justify-center shadow-lg shadow-teal-500/20">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold app-gradient-text">
              Tạo tài khoản mới
            </h1>
            <p className="app-muted-text mt-2">Gia nhập cộng đồng Chat App ngay</p>
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

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="app-label ml-1">Tên người dùng</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-[18px] h-[18px]" />
                  <input
                    type="text"
                    className={inputErrorClass(!!fieldErrors.username, inputBaseClass)}
                    placeholder="john_doe"
                    value={formData.username}
                    onChange={(e) => updateField('username', e.target.value)}
                    autoComplete="username"
                  />
                </div>
                <FieldError message={fieldErrors.username} />
              </div>
              <div className="space-y-2">
                <label className="app-label ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-[18px] h-[18px]" />
                  <input
                    type="email"
                    className={inputErrorClass(!!fieldErrors.email, inputBaseClass)}
                    placeholder="vidu@mail.com"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <FieldError message={fieldErrors.email} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="app-label ml-1">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-[18px] h-[18px]" />
                <input
                  type="password"
                  className={inputErrorClass(!!fieldErrors.password, inputBaseClass)}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <FieldError message={fieldErrors.password} />
            </div>

            <div className="space-y-2">
              <label className="app-label ml-1">Xác nhận mật khẩu</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-[18px] h-[18px]" />
                <input
                  type="password"
                  className={inputErrorClass(!!fieldErrors.confirmPassword, inputBaseClassPlain)}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <FieldError message={fieldErrors.confirmPassword} />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="app-button-primary w-full py-4 mt-4 rounded-2xl text-lg disabled:opacity-60"
            >
              {isLoading ? <LoadingSpinner /> : <><UserPlus size={20} /> Đăng ký tài khoản</>}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-slate-200/80"></div>
            <span className="text-xs text-slate-400 font-medium">HOẶC</span>
            <div className="flex-1 h-px bg-slate-200/80"></div>
          </div>

          <p className="text-center app-muted-text text-sm">
            Đã có tài khoản? <Link to="/login" className="font-bold text-green-600 hover:underline">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
