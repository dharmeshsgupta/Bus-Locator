import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

export function StudentSettingsView() {
  const { user, setLogout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    setLogout();
    navigate('/auth/student');
  };

  return (
    <div className="flex flex-col h-full bg-surface-container-lowest p-6 rounded-3xl shadow-sm max-w-3xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-display-sm font-bold text-on-surface">Settings</h2>
        <p className="text-body-lg text-on-surface-variant mt-1">Manage your account and notifications</p>
      </div>

      <div className="space-y-6 flex-1">
        
        {/* Profile Section */}
        <div className="bg-surface-container-low p-6 rounded-2xl border border-surface-container">
          <div className="flex items-center gap-4 mb-4">
             <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center text-2xl font-bold">
               {user?.role === 'student' ? 'ST' : 'US'}
             </div>
             <div>
               <h3 className="text-title-lg font-bold">Student Account</h3>
               <p className="text-body-md text-on-surface-variant">Role: {user?.role.toUpperCase()}</p>
             </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-surface-container-low p-6 rounded-2xl border border-surface-container space-y-4">
          <h3 className="text-title-md font-bold mb-4">Notification Preferences</h3>
          
          <div className="flex justify-between items-center py-2 border-b border-surface-container last:border-0">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-body-sm text-on-surface-variant">Alerts when bus is near your stop</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-toggle-active"></div>
            </label>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-surface-container last:border-0">
            <div>
              <p className="font-medium">SMS Alerts</p>
              <p className="text-body-sm text-on-surface-variant">Text messages for emergencies</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-toggle-active"></div>
            </label>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-surface-container-low p-6 rounded-2xl border border-surface-container text-center">
           <p className="text-label-md text-on-surface-variant">BusLocator Student App v1.0.0</p>
        </div>

      </div>

      <div className="mt-auto pt-6 border-t border-surface-container">
        <button 
          onClick={handleLogout}
          className="w-full py-4 bg-error-container text-on-error-container font-bold text-title-md rounded-xl hover:bg-error hover:text-on-error transition-colors"
        >
          LOGOUT
        </button>
      </div>
    </div>
  );
}
