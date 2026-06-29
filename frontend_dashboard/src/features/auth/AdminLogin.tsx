import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../services/api/authApi';

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setLogin } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await authApi.adminLogin({ email, password });
      setLogin(res.user || { id: '1', role: 'admin' }, res.access_token, res.refresh_token);
      
      try {
        const me = await authApi.getMe();
        setLogin(me, res.access_token, res.refresh_token);
      } catch (err) {
        console.warn('Failed to fetch profile', err);
      }

      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-xl mt-xl md:mt-0">
      <div className="text-center md:text-left">
        <h2 className="text-headline-lg-mobile md:text-headline-lg text-on-surface mb-xs">Admin Portal</h2>
        <p className="text-body-sm text-on-surface-variant">Manage transport operations</p>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-lg bg-surface-container-lowest p-lg rounded-xl border border-surface-container shadow-[0_4px_6px_-1px_rgb(0,0,0,0.05)]">
        <div className="flex flex-col gap-sm">
          <label className="text-label-md text-on-surface" htmlFor="admin-email">Email Address</label>
          <div className="relative flex items-center">
            <span className="absolute left-md material-symbols-outlined text-outline">mail</span>
            <input
              className="w-full bg-surface-container-low border border-outline-variant text-on-surface text-body-sm rounded-lg pl-[48px] pr-md py-sm h-12 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow placeholder:text-outline/70"
              id="admin-email" placeholder="Enter your email" type="email"
              value={email} onChange={(e) => setEmail(e.target.value)} required
            />
          </div>
        </div>

        <div className="flex flex-col gap-sm">
          <label className="text-label-md text-on-surface" htmlFor="admin-password">Password</label>
          <div className="relative flex items-center">
            <span className="absolute left-md material-symbols-outlined text-outline">lock</span>
            <input
              className="w-full bg-surface-container-low border border-outline-variant text-on-surface text-body-sm rounded-lg pl-[48px] pr-md py-sm h-12 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow placeholder:text-outline/70"
              id="admin-password" placeholder="Enter your password" type="password"
              value={password} onChange={(e) => setPassword(e.target.value)} required
            />
          </div>
        </div>

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
            <><span>Sign In</span><span className="material-symbols-outlined text-[18px]">arrow_forward</span></>
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
