import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function OtpVerification() {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setLogin } = useAuthStore();

  const state = location.state as { phone?: string, role?: 'driver' | 'admin' };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setLogin(
        { id: '2', name: 'Bob Driver', email: '', role: state?.role || 'driver' },
        'mock-token',
        'mock-refresh-token'
      );
      setIsLoading(false);
      navigate(state?.role === 'admin' ? '/admin/dashboard' : '/auth/route-selection');
    }, 1000);
  };

  return (
    <Card className="w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Verify OTP</h2>
        <p className="text-sm text-slate-500 mt-1">Enter the code sent to {state?.phone || 'your device'}</p>
      </div>

      <form onSubmit={handleVerify} className="space-y-4">
        <Input
          label="One-Time Password"
          placeholder="000000"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength={6}
          required
        />
        
        <Button type="submit" className="w-full" isLoading={isLoading}>
          Verify & Login
        </Button>
      </form>
    </Card>
  );
}
