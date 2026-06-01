import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context';
import { Alert, ButtonSpinner } from '@/components';
import { Mail, ShieldCheck } from 'lucide-react';

export const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const emailFromState = (location.state as { email?: string } | null)?.email ?? '';
  const [email] = useState(emailFromState);
  const [otp, setOtp] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { verifyRegistrationOtp, resendRegistrationOtp, isSubmitting, error, clearError } = useAuth();

  const displayError = localError || error;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);
    setSuccessMessage(null);

    if (!email) {
      setLocalError('Thiếu email. Vui lòng đăng ký lại.');
      return;
    }
    if (!otp.trim()) {
      setLocalError('Vui lòng nhập mã OTP');
      return;
    }

    try {
      await verifyRegistrationOtp(email, otp.trim());
      navigate('/chat');
    } catch {
      // error in context
    }
  };

  const handleResend = async () => {
    clearError();
    setLocalError(null);
    setSuccessMessage(null);
    if (!email) {
      setLocalError('Thiếu email. Vui lòng đăng ký lại.');
      return;
    }
    try {
      await resendRegistrationOtp(email);
      setSuccessMessage('Mã OTP mới đã được gửi tới email của bạn.');
    } catch {
      // error in context
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] flex items-center justify-center p-4 relative overflow-hidden m-4">
      <div className="w-full max-w-md mx-auto relative app-card-strong p-10 rounded-[2rem]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl app-hero-banner flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold app-gradient-text">Xác nhận OTP</h1>
          <p className="app-muted-text mt-2">Nhập mã 6 số đã gửi tới email của bạn</p>
        </div>

        {displayError && (
          <Alert type="error" message={displayError} onClose={() => { setLocalError(null); clearError(); }} className="mb-6" />
        )}
        {successMessage && (
          <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} className="mb-6" />
        )}

        <div className="flex items-center gap-2 mb-6 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <Mail className="w-5 h-5 text-slate-400" />
          <span className="text-sm text-slate-600 truncate">{email || '—'}</span>
        </div>

        <form onSubmit={handleVerify} className="space-y-5" noValidate>
          <input
            type="text"
            inputMode="numeric"
            maxLength={10}
            className="app-input w-full text-center text-2xl tracking-[0.5em] py-4 rounded-2xl"
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="app-button-primary w-full min-h-[3.25rem] py-4 rounded-2xl disabled:opacity-60"
          >
            {isSubmitting ? <ButtonSpinner /> : 'Xác nhận'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleResend}
          disabled={isSubmitting}
          className="w-full mt-4 text-sm font-semibold text-green-600 hover:underline disabled:opacity-60"
        >
          Gửi lại mã OTP
        </button>

        <p className="text-center app-muted-text mt-8">
          <Link to="/register" className="font-bold text-green-600 hover:underline">Quay lại đăng ký</Link>
        </p>
      </div>
    </div>
  );
};
