import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../services/api/authApi';

const roles = [
  { key: 'student', label: 'Student', icon: 'school', path: '/auth/student' },
  { key: 'parent', label: 'Parent', icon: 'family_restroom', path: '/auth/student' },
  { key: 'driver', label: 'Driver', icon: 'directions_run', path: '/auth/driver' },
  { key: 'admin', label: 'Admin', icon: 'admin_panel_settings', path: '/auth/admin' },
];

export function StudentLogin() {
  const [selectedRole, setSelectedRole] = useState('student');
  const [enrollment, setEnrollment] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setLogin } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await authApi.studentLogin({ enrollment_no: enrollment, password });
      // Initially set token so getMe can use it
      setLogin(res.user || { id: '1', role: 'student' }, res.access_token, res.refresh_token);
      
      try {
        const me = await authApi.getMe();
        setLogin(me, res.access_token, res.refresh_token);
      } catch (err) {
        console.warn('Failed to fetch profile', err);
      }

      navigate('/student/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleClick = (role: typeof roles[0]) => {
    setSelectedRole(role.key);
    if (role.key !== 'student' && role.key !== 'parent') {
      navigate(role.path);
    }
  };

  return (
    <div className="flex flex-col gap-xl mt-xl md:mt-0">
      {/* Header */}
      <div className="text-center md:text-left">
        <h2 className="text-headline-lg-mobile md:text-headline-lg text-on-surface mb-xs">Welcome back</h2>
        <p className="text-body-sm text-on-surface-variant">Please select your role and sign in to continue.</p>
      </div>

      {/* Role Selection Grid */}
      <div className="space-y-sm">
        <label className="text-label-md text-on-surface-variant uppercase tracking-wider">I am a...</label>
        <div className="grid grid-cols-2 gap-md">
          {roles.map((role) => (
            <div
              key={role.key}
              onClick={() => handleRoleClick(role)}
              className={`cursor-pointer border rounded-xl p-md flex flex-col items-center justify-center gap-sm transition-all shadow-sm hover:shadow-md bg-surface-container-lowest ${
                selectedRole === role.key
                  ? 'border-primary bg-primary-fixed'
                  : 'border-outline-variant'
              }`}
            >
              <span className={`material-symbols-outlined text-[28px] ${
                selectedRole === role.key ? 'text-primary filled' : 'text-secondary'
              }`}>
                {role.icon}
              </span>
              <span className="text-label-md text-on-surface">{role.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleLogin} className="flex flex-col gap-lg bg-surface-container-lowest p-lg rounded-xl border border-surface-container shadow-[0_4px_6px_-1px_rgb(0,0,0,0.05)]">
        <div className="flex flex-col gap-sm">
          <label className="text-label-md text-on-surface" htmlFor="enrollment">Enrollment Number</label>
          <div className="relative flex items-center">
            <span className="absolute left-md material-symbols-outlined text-outline">badge</span>
            <input
              className="w-full bg-surface-container-low border border-outline-variant text-on-surface text-body-sm rounded-lg pl-[48px] pr-md py-sm h-12 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow placeholder:text-outline/70"
              id="enrollment"
              placeholder="e.g. EN123456"
              type="text"
              value={enrollment}
              onChange={(e) => setEnrollment(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-sm">
          <label className="text-label-md text-on-surface" htmlFor="password">Password</label>
          <div className="relative flex items-center">
            <span className="absolute left-md material-symbols-outlined text-outline">lock</span>
            <input
              className="w-full bg-surface-container-low border border-outline-variant text-on-surface text-body-sm rounded-lg pl-[48px] pr-md py-sm h-12 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow placeholder:text-outline/70"
              id="student-password" placeholder="••••••••" type="password"
              value={password} onChange={(e) => setPassword(e.target.value)} required
            />
          </div>

        <div className="text-xs text-center text-slate-500 -mt-md">
          First time? Ask the Admin to register your account.
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

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary-container text-on-primary-container text-label-md rounded-lg py-sm h-12 hover:bg-primary hover:text-on-primary transition-colors flex items-center justify-center gap-sm shadow-sm disabled:opacity-60"
        >
          {isLoading ? (
            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
          ) : (
            <>
              <span>Sign In</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-md">
        <div className="h-[1px] flex-1 bg-outline-variant" />
        <span className="text-label-md text-outline">or continue with</span>
        <div className="h-[1px] flex-1 bg-outline-variant" />
      </div>

      {/* Google Sign-In */}
      <button className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface text-label-md rounded-lg py-sm h-12 hover:bg-surface-container-low transition-colors flex items-center justify-center gap-md shadow-sm">
        <svg className="w-5 h-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" fill="#EA4335" />
          <path d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" fill="#4285F4" />
          <path d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" fill="#FBBC05" />
          <path d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" fill="#34A853" />
        </svg>
        Sign in with Google
      </button>

      <div className="text-center mt-sm">
        <p className="text-body-sm text-on-surface-variant">
          By signing in, you agree to our{' '}
          <a className="text-primary hover:underline" href="#">Terms of Service</a>{' '}
          and <a className="text-primary hover:underline" href="#">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
