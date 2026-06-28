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

      <form onSubmit={step === 1 ? handleRequestOTP : handleVerifyOTP} className="flex flex-col gap-lg bg-surface-container-lowest p-lg rounded-xl border border-surface-container shadow-[0_4px_6px_-1px_rgb(0,0,0,0.05)]">
        <div className="flex flex-col gap-sm">
          <label className="text-label-md text-on-surface" htmlFor="phone">Phone Number</label>
          <div className="relative flex items-center">
            <span className="absolute left-md material-symbols-outlined text-outline">call</span>
            <input
              className="w-full bg-surface-container-low border border-outline-variant text-on-surface text-body-sm rounded-lg pl-[48px] pr-md py-sm h-12 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow placeholder:text-outline/70 disabled:opacity-50"
              id="phone" placeholder="+1 (555) 000-0000" type="tel"
              value={phone} onChange={(e) => setPhone(e.target.value)} required disabled={step === 2}
            />
          </div>
        </div>

        {step === 2 && (
          <div className="flex flex-col gap-sm">
            <label className="text-label-md text-on-surface" htmlFor="otp">Verification Code (OTP)</label>
            <div className="relative flex items-center">
              <span className="absolute left-md material-symbols-outlined text-outline">password</span>
              <input
                className="w-full bg-surface-container-low border border-outline-variant text-on-surface text-body-sm rounded-lg pl-[48px] pr-md py-sm h-12 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow placeholder:text-outline/70"
                id="otp" placeholder="123456" type="text"
                value={otp} onChange={(e) => setOtp(e.target.value)} required
              />
            </div>
            <div className="text-right mt-1">
               <button type="button" onClick={() => setStep(1)} className="text-primary text-label-sm hover:underline">Change Number</button>
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
          className="w-full bg-primary-container text-on-primary-container text-label-md rounded-lg py-sm h-12 hover:bg-primary hover:text-on-primary transition-colors flex items-center justify-center gap-sm shadow-sm disabled:opacity-60">
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
