import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../services/api/authApi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function SuperAdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setLogin } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Assuming adminLogin works for superadmin for now, or just reject
      const res = await authApi.adminLogin({ email, password });
      setLogin(res.user || { id: '0', role: 'superadmin' }, res.access_token, res.refresh_token);
      
      try {
        const me = await authApi.getMe();
        setLogin(me, res.access_token, res.refresh_token);
      } catch (err) {
        console.warn('Failed to fetch profile', err);
      }

      navigate('/superadmin/dashboard');
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.detail || 'Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full border-rose-200 dark:border-rose-900 shadow-rose-500/10">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-rose-600 dark:text-rose-500">System Admin</h2>
        <p className="text-sm text-slate-500 mt-1">Authorized personnel only</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          label="Root Email"
          type="email"
          placeholder="root@buslocator.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Secure Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <Button variant="danger" type="submit" className="w-full" isLoading={isLoading}>
          Authenticate
        </Button>
      </form>
      
      <div className="mt-4 text-center">
        <Button variant="ghost" size="sm" onClick={() => navigate('/auth/student')}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}
