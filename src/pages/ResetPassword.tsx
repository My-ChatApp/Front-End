import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context';
import { authService } from '@/services';
import { Alert, ButtonSpinner, FieldError, LoadingSpinner } from '@/components';
import {
  FieldErrors,
  inputErrorClass,
  validateConfirmPassword,
  validatePassword,
} from '@/utils/validation';
import { Lock } from 'lucide-react';

const inputBaseClass =
  'app-input w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all text-slate-800';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<'password' | 'confirmPassword'>>({});
  const { resetPassword, isSubmitting, error, clearError } = useAuth();

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }
    void authService.validateResetToken(token).then(setTokenValid).catch(() => setTokenValid(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const fields: FieldErrors<'password' | 'confirmPassword'> = {};
    const passwordError = validatePassword(password);
    const confirmError = validateConfirmPassword(password, confirmPassword);
    if (passwordError) fields.password = passwordError;
    if (confirmError) fields.confirmPassword = confirmError;

    if (Object.keys(fields).length > 0) {
      setFieldErrors(fields);
      return;
    }

    setFieldErrors({});
    try {
      await resetPassword(token, password);
      navigate('/login', { state: { message: 'Mật khẩu đã được đặt lại. Vui lòng đăng nhập.' } });
    } catch {
      // context error
    }
  };

  if (tokenValid === null) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="w-full max-w-md mx-auto app-card-strong p-10 rounded-[2rem] m-8">
        <Alert type="error" message="Link reset không hợp lệ hoặc đã hết hạn." className="mb-6" />
        <Link to="/forgot-password" className="font-bold text-green-600 hover:underline">
          Yêu cầu link mới
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-80px)] flex items-center justify-center p-4 m-4">
      <div className="w-full max-w-md mx-auto app-card-strong p-10 rounded-[2rem]">
        <h1 className="text-3xl font-extrabold app-gradient-text text-center mb-8">Đặt lại mật khẩu</h1>

        {error && <Alert type="error" message={error} onClose={clearError} className="mb-6" />}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label className="app-label ml-1">Mật khẩu mới</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="password"
                className={inputErrorClass(!!fieldErrors.password, inputBaseClass)}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }}
              />
            </div>
            <FieldError message={fieldErrors.password} />
          </div>
          <div>
            <label className="app-label ml-1">Xác nhận mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="password"
                className={inputErrorClass(!!fieldErrors.confirmPassword, inputBaseClass)}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
              />
            </div>
            <FieldError message={fieldErrors.confirmPassword} />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="app-button-primary w-full min-h-[3.25rem] py-4 rounded-2xl disabled:opacity-60"
          >
            {isSubmitting ? <ButtonSpinner /> : 'Đặt lại mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
};
