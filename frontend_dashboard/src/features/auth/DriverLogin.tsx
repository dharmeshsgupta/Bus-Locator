import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../services/api/authApi';
import toast from 'react-hot-toast';

export function DriverLogin() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setLogin } = useAuthStore();

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await authApi.sendOTP({ phone: phone });
      setStep(2);
      if (res.dev_otp) {
        toast.success(`DEV OTP: ${res.dev_otp}`, { duration: 6000, icon: '🔧' });
        setOtp(res.dev_otp); // Auto-fill for convenience
      } else {
        toast.success('OTP sent successfully!');
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await authApi.driverLogin({ phone: phone, otp: otp }); 
      setLogin(res.user || { id: '1', role: 'driver' }, res.access_token, res.refresh_token);
      
      try {
        const me = await authApi.getMe();
        setLogin(me, res.access_token, res.refresh_token);
      } catch (err) {
        console.warn('Failed to fetch profile', err);
      }

      navigate('/driver/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-xl mt-xl md:mt-0">
      <div className="text-center md:text-left">
        <h2 className="text-headline-lg-mobile md:text-headline-lg text-on-surface mb-xs">Driver Portal</h2>
        <p className="text-body-sm text-on-surface-variant">
          {step === 1 ? 'Sign in with your phone number' : 'Enter the verification code'}
        </p>
      </div>

      <form onSubmit={step === 1 ? handleRequestOTP : handleVerifyOTP} className="flex flex-col gap-4 bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs md:text-sm font-bold text-slate-800" htmlFor="phone">Phone Number</label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 material-symbols-outlined text-slate-500 text-[20px]">call</span>
            <input
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm font-medium rounded-xl pl-11 pr-3.5 py-2.5 h-11 md:h-12 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-400 disabled:opacity-50"
              id="phone" placeholder="+1 (555) 000-0000" type="tel"
              value={phone} onChange={(e) => setPhone(e.target.value)} required disabled={step === 2}
            />
          </div>
        </div>

        {step === 2 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs md:text-sm font-bold text-slate-800" htmlFor="otp">Verification Code (OTP)</label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 material-symbols-outlined text-slate-500 text-[20px]">password</span>
              <input
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm font-medium rounded-xl pl-11 pr-3.5 py-2.5 h-11 md:h-12 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-400"
                id="otp" placeholder="123456" type="text"
                value={otp} onChange={(e) => setOtp(e.target.value)} required
              />
            </div>
            <div className="text-right mt-1">
               <button type="button" onClick={() => setStep(1)} className="text-blue-600 font-semibold text-xs hover:underline">Change Number</button>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-sm p-md bg-error/10 border border-error/20 text-error rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2">
            <span className="material-symbols-outlined text-[20px] mt-0.5">error</span>
            <div className="flex-1">
              <p className="font-semibold text-body-md mb-0.5">Authentication Failed</p>
              <p className="text-body-sm text-error/80">{error}</p>
            </div>
          </div>
        )}

        <button type="submit" disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl py-3 h-11 md:h-12 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] disabled:opacity-60">
          {isLoading ? (
            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
          ) : (
            <><span>{step === 1 ? 'Request OTP' : 'Verify & Sign In'}</span><span className="material-symbols-outlined text-[18px]">arrow_forward</span></>
          )}
        </button>
      </form>

      <button onClick={() => navigate('/auth/student')}
        className="text-primary text-label-md hover:underline self-center">
        ← Back to Student Login
      </button>
    </div>
  );
}
