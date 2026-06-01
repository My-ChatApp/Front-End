import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context';
import { Alert, ButtonSpinner, FieldError } from '@/components';
import { FieldErrors, inputErrorClass, validateEmail, validateLoginForm } from '@/utils/validation';
import { Eye, EyeOff, LogIn, Mail, Lock, MessageCircle, KeyRound } from 'lucide-react';

const inputBaseClass =
  'app-input w-full pl-12 pr-5 py-3.5 rounded-2xl bg-white border border-slate-200 outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all shadow-sm text-slate-800 placeholder:text-slate-400';

type LoginMode = 'password' | 'otp';

export const Login = () => {
  const location = useLocation();
  const successFromReset = (location.state as { message?: string } | null)?.message;

  const [mode, setMode] = useState<LoginMode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<'email' | 'password'>>({});
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(successFromReset ?? null);
  const navigate = useNavigate();
  const {
    login,
    sendLoginOtp,
    resendLoginOtp,
    loginWithOtp,
    isSubmitting,
    error,
    clearError,
  } = useAuth();

  const displayError = localError || error;

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);
    setSuccessMessage(null);

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
    } catch {
      // AuthContext sets error state
    }
  };

  const handleSendOtp = async () => {
    clearError();
    setLocalError(null);
    setSuccessMessage(null);

    const emailError = validateEmail(email);
    if (emailError) {
      setLocalError(emailError);
      return;
    }

    try {
      await sendLoginOtp(email.trim());
      setOtpSent(true);
      setSuccessMessage('Mã OTP đã được gửi tới email của bạn.');
    } catch {
      // context error
    }
  };

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (!otpSent) {
      await handleSendOtp();
      return;
    }

    if (!otp.trim()) {
      setLocalError('Vui lòng nhập mã OTP');
      return;
    }

    try {
      await loginWithOtp(email.trim(), otp.trim());
      navigate('/chat');
    } catch {
      // context error
    }
  };

  return (
    <div className=" w-full min-h-[calc(100vh-80px)] flex items-center justify-center p-4 relative overflow-hidden m-4">
      <div className="absolute top-20 right-10 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-30 animate-blob"></div>
      <div className="absolute bottom-20 left-10 w-80 h-80 bg-teal-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-30 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-md mx-auto relative group animate-fade-in-up">
        <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-teal-600 rounded-[2.25rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>

        <div className="relative app-card-strong p-10 rounded-[2rem]">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl app-hero-banner flex items-center justify-center shadow-lg shadow-green-500/20">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold app-gradient-text">Chào mừng trở lại</h1>
            <p className="app-muted-text mt-2">Đăng nhập để tiếp tục trò chuyện</p>
          </div>

          <div className="flex rounded-2xl bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode('password')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                mode === 'password' ? 'bg-white shadow text-green-700' : 'text-slate-500'
              }`}
            >
              Mật khẩu
            </button>
            <button
              type="button"
              onClick={() => setMode('otp')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                mode === 'otp' ? 'bg-white shadow text-green-700' : 'text-slate-500'
              }`}
            >
              OTP
            </button>
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
          {successMessage && (
            <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} className="mb-6" />
          )}

          {mode === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-5" noValidate>
              <div>
                <label className="app-label ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="email"
                    className={inputErrorClass(!!fieldErrors.email, inputBaseClass)}
                    placeholder="email@vidu.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                      setLocalError(null);
                    }}
                    autoComplete="email"
                  />
                </div>
                <FieldError message={fieldErrors.email} />
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="app-label ml-1">Mật khẩu</label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-green-600 hover:underline">
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={inputErrorClass(!!fieldErrors.password, inputBaseClass)}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
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
                disabled={isSubmitting}
                className="app-button-primary w-full min-h-[3.25rem] py-4 rounded-2xl text-lg disabled:opacity-60"
              >
                {isSubmitting ? <ButtonSpinner /> : <><LogIn size={20} /> Đăng nhập</>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpLogin} className="space-y-5" noValidate>
              <div>
                <label className="app-label ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="email"
                    className={inputBaseClass}
                    placeholder="email@vidu.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setOtpSent(false);
                      setLocalError(null);
                    }}
                    autoComplete="email"
                  />
                </div>
              </div>

              {otpSent && (
                <div>
                  <label className="app-label ml-1">Mã OTP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    className="app-input w-full text-center text-xl tracking-[0.4em] py-3.5 rounded-2xl"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="app-button-primary w-full min-h-[3.25rem] py-4 rounded-2xl disabled:opacity-60"
              >
                {isSubmitting ? (
                  <ButtonSpinner />
                ) : otpSent ? (
                  <><KeyRound size={20} /> Đăng nhập bằng OTP</>
                ) : (
                  'Gửi mã OTP'
                )}
              </button>

              {otpSent && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    void resendLoginOtp(email.trim())
                      .then(() => setSuccessMessage('Mã OTP đã được gửi lại.'))
                      .catch(() => setSuccessMessage(null));
                  }}
                  className="w-full text-sm font-semibold text-green-600 hover:underline disabled:opacity-60"
                >
                  Gửi lại mã OTP
                </button>
              )}
            </form>
          )}

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-slate-200/80"></div>
            <span className="text-xs text-slate-400 font-medium">HOẶC</span>
            <div className="flex-1 h-px bg-slate-200/80"></div>
          </div>

          <p className="text-center app-muted-text">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-bold text-green-600 hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
