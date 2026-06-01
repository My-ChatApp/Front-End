import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context';
import { Alert, ButtonSpinner, FieldError } from '@/components';
import { validateEmail } from '@/utils/validation';
import { Mail, KeyRound } from 'lucide-react';

const inputBaseClass =
  'app-input w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all text-slate-800';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [submitted, setSubmitted] = useState(false);
  const { forgotPassword, isSubmitting, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFieldError(undefined);

    const emailError = validateEmail(email);
    if (emailError) {
      setFieldError(emailError);
      return;
    }

    try {
      await forgotPassword(email.trim());
      setSubmitted(true);
    } catch {
      // context error
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] flex items-center justify-center p-4 m-4">
      <div className="w-full max-w-md mx-auto app-card-strong p-10 rounded-[2rem]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl app-hero-banner flex items-center justify-center">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold app-gradient-text">Quên mật khẩu</h1>
          <p className="app-muted-text mt-2">Nhập email để nhận link đặt lại mật khẩu</p>
        </div>

        {error && !submitted && (
          <Alert type="error" message={error} onClose={clearError} className="mb-6" />
        )}

        {submitted ? (
          <Alert
            type="success"
            message="Nếu email tồn tại, link reset password sẽ được gửi trong vài phút."
            className="mb-6"
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
                    setFieldError(undefined);
                  }}
                />
              </div>
              <FieldError message={fieldError} />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="app-button-primary w-full min-h-[3.25rem] py-4 rounded-2xl disabled:opacity-60"
            >
              {isSubmitting ? <ButtonSpinner /> : 'Gửi link reset'}
            </button>
          </form>
        )}

        <p className="text-center app-muted-text mt-8">
          <Link to="/login" className="font-bold text-green-600 hover:underline">Quay lại đăng nhập</Link>
        </p>
      </div>
    </div>
  );
};
