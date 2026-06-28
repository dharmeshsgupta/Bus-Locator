import { Card } from '../../components/ui/Card';
import { ShieldAlert, Database, Server, Activity } from 'lucide-react';

export function SuperAdminDashboard() {
  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Super Admin Console</h1>
        <p className="text-slate-500">System metrics and global configuration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-900/10">
          <div className="flex items-center text-rose-600 dark:text-rose-400 mb-2">
            <ShieldAlert className="w-5 h-5 mr-2" />
            <span className="font-semibold">Security Alerts</span>
          </div>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-slate-500 mt-1">System is secure</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center text-indigo-600 dark:text-indigo-400 mb-2">
            <Activity className="w-5 h-5 mr-2" />
            <span className="font-semibold">API Requests</span>
          </div>
          <p className="text-2xl font-bold">12.4k</p>
          <p className="text-xs text-slate-500 mt-1">Past 24 hours</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center text-emerald-600 dark:text-emerald-400 mb-2">
            <Database className="w-5 h-5 mr-2" />
            <span className="font-semibold">Database Load</span>
          </div>
          <p className="text-2xl font-bold">42%</p>
          <p className="text-xs text-slate-500 mt-1">Normal capacity</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center text-amber-600 dark:text-amber-400 mb-2">
            <Server className="w-5 h-5 mr-2" />
            <span className="font-semibold">Active Nodes</span>
          </div>
          <p className="text-2xl font-bold">3/3</p>
          <p className="text-xs text-slate-500 mt-1">All systems operational</p>
        </Card>
      </div>

      <Card>
        <h3 className="font-bold text-lg mb-4">System Audit Logs</h3>
        <div className="space-y-3">
          {[
            { action: 'Admin Created', user: 'root@sys.com', time: '10:45 AM', status: 'Success' },
            { action: 'Config Updated', user: 'root@sys.com', time: '09:12 AM', status: 'Success' },
            { action: 'Failed Login', user: 'unknown', time: '02:30 AM', status: 'Warning' },
            { action: 'Backup Completed', user: 'system', time: '12:00 AM', status: 'Success' },
          ].map((log, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-3 ${log.status === 'Success' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                <div>
                  <p className="text-sm font-medium">{log.action}</p>
                  <p className="text-xs text-slate-500">{log.user}</p>
                </div>
              </div>
              <span className="text-xs text-slate-500">{log.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
