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

      <form onSubmit={handleLogin} className="flex flex-col gap-4 bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs md:text-sm font-bold text-slate-800" htmlFor="admin-email">Email Address</label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 material-symbols-outlined text-slate-500 text-[20px]">mail</span>
            <input
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm font-medium rounded-xl pl-11 pr-3.5 py-2.5 h-11 md:h-12 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-400"
              id="admin-email" placeholder="Enter your email" type="email"
              value={email} onChange={(e) => setEmail(e.target.value)} required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs md:text-sm font-bold text-slate-800" htmlFor="admin-password">Password</label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 material-symbols-outlined text-slate-500 text-[20px]">lock</span>
            <input
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm font-medium rounded-xl pl-11 pr-3.5 py-2.5 h-11 md:h-12 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-400"
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
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl py-3 h-11 md:h-12 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] disabled:opacity-60">
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
