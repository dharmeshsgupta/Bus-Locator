import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useRouteStore } from '../../store/routeStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MapPin } from 'lucide-react';

const mockRoutes = [
  { id: 'r1', name: 'North Campus Route' },
  { id: 'r2', name: 'South City Express' },
  { id: 'r3', name: 'Downtown Connector' },
];

export function RouteSelection() {
  const [selected, setSelected] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const { setSelectedRoute } = useRouteStore();

  const handleContinue = () => {
    if (!selected) return;
    setIsLoading(true);
    setSelectedRoute(selected);
    
    setTimeout(() => {
      setIsLoading(false);
      if (role === 'student') navigate('/student/dashboard');
      else if (role === 'driver') navigate('/driver/dashboard');
      else navigate('/');
    }, 500);
  };

  return (
    <Card className="w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Select Your Route</h2>
        <p className="text-sm text-slate-500 mt-1">Choose the bus route you are tracking or driving today</p>
      </div>

      <div className="space-y-3 mb-6">
        {mockRoutes.map((route) => (
          <div
            key={route.id}
            onClick={() => setSelected(route.id)}
            className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center ${
              selected === route.id
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-slate-200 hover:border-indigo-300 dark:border-slate-700 dark:hover:border-indigo-700'
            }`}
          >
            <div className={`p-2 rounded-full mr-4 ${selected === route.id ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
              <MapPin className="w-5 h-5" />
            </div>
            <div className="font-medium">{route.name}</div>
          </div>
        ))}
      </div>

      <Button 
        className="w-full" 
        disabled={!selected} 
        onClick={handleContinue}
        isLoading={isLoading}
      >
        Continue to Dashboard
      </Button>
    </Card>
  );
}
