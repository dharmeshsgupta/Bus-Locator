import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/api/adminApi';

export function AdminDashboard() {
  const navigate = useNavigate();
  
  const { data: routesData, isLoading: routesLoading } = useQuery({
    queryKey: ['admin-routes', 1],
    queryFn: () => adminApi.getRoutes({ page: 1, page_size: 5 }),
  });
  const { data: busesData, isLoading: busesLoading } = useQuery({
    queryKey: ['admin-buses', 1],
    queryFn: () => adminApi.getBuses({ page: 1, page_size: 5 }),
  });

  const totalRoutes = routesData?.total || 0;
  const totalBuses = busesData?.total || 0;

  return (
    <div className="flex flex-col gap-lg">
      {/* Header */}
      <div>
        <h1 className="text-headline-lg font-bold text-on-surface">Admin Dashboard</h1>
        <p className="text-body-lg text-secondary">Manage and monitor your transit fleet</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
        <KPICard icon="route" label="Total Routes" value={String(totalRoutes)} onClick={() => navigate('/admin/routes')} />
        <KPICard icon="directions_bus" label="Active Buses" value={String(totalBuses)} onClick={() => navigate('/admin/buses')} />
        <KPICard icon="pin_drop" label="Stops" value="Manage" onClick={() => navigate('/admin/stops')} />
        <KPICard icon="school" label="Students" value="Assign" onClick={() => navigate('/admin/students')} />
      </div>

      {/* Quick Actions */}
      <div className="bg-surface rounded-xl shadow-sm border border-outline-variant/30 p-lg">
        <h3 className="text-headline-md font-semibold text-on-surface mb-md">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
          <QuickAction icon="add_road" label="Create Route" onClick={() => navigate('/admin/routes')} />
          <QuickAction icon="add" label="Add Bus" onClick={() => navigate('/admin/buses')} />
          <QuickAction icon="pin_drop" label="Manage Stops" onClick={() => navigate('/admin/stops')} />
          <QuickAction icon="person_add" label="Assign Student" onClick={() => navigate('/admin/students')} />
        </div>
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        {/* Recent Routes */}
        <div className="bg-surface rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
          <div className="p-md border-b border-surface-container-high flex justify-between items-center">
            <h3 className="text-headline-md font-semibold text-on-surface flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary">route</span>
              Routes
            </h3>
            <button onClick={() => navigate('/admin/routes')} className="text-primary text-label-md hover:underline">View All →</button>
          </div>
          <div className="divide-y divide-surface-container-high">
            {routesLoading ? (
              <div className="p-lg text-center text-secondary">Loading routes...</div>
            ) : routesData?.items?.length === 0 ? (
              <div className="p-lg text-center text-secondary">No routes found. Create one from the Routes page.</div>
            ) : (
              routesData?.items?.slice(0, 4).map((route: any) => (
                <div key={route.id} className="px-md py-sm flex justify-between items-center hover:bg-surface-container-low transition-colors cursor-pointer" onClick={() => navigate('/admin/routes')}>
                  <div>
                    <p className="text-body-sm font-medium text-on-surface">{route.route_name}</p>
                    <p className="text-label-md text-secondary">{route.start_location} → {route.end_location}</p>
                  </div>
                  <span className="material-symbols-outlined text-secondary text-[20px]">chevron_right</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Buses */}
        <div className="bg-surface rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
          <div className="p-md border-b border-surface-container-high flex justify-between items-center">
            <h3 className="text-headline-md font-semibold text-on-surface flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary">directions_bus</span>
              Fleet
            </h3>
            <button onClick={() => navigate('/admin/buses')} className="text-primary text-label-md hover:underline">View All →</button>
          </div>
          <div className="divide-y divide-surface-container-high">
            {busesLoading ? (
              <div className="p-lg text-center text-secondary">Loading buses...</div>
            ) : busesData?.items?.length === 0 ? (
              <div className="p-lg text-center text-secondary">No buses found. Add one from the Fleet page.</div>
            ) : (
              busesData?.items?.slice(0, 4).map((bus: any) => (
                <div key={bus.id} className="px-md py-sm flex justify-between items-center hover:bg-surface-container-low transition-colors cursor-pointer" onClick={() => navigate('/admin/buses')}>
                  <div className="flex items-center gap-md">
                    <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[18px]">directions_bus</span>
                    </div>
                    <div>
                      <p className="text-body-sm font-medium text-on-surface">{bus.bus_number}</p>
                      <p className="text-label-md text-secondary">{bus.capacity} seats • {bus.registration_number}</p>
                    </div>
                  </div>
                  <span className={`px-sm py-xs rounded-full text-label-md ${
                    bus.current_status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                    bus.current_status === 'EN_ROUTE' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {bus.current_status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, onClick }: { icon: string; label: string; value: string; onClick: () => void }) {
  return (
    <div onClick={onClick} className="bg-surface rounded-xl p-lg shadow-sm border border-outline-variant/30 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-center justify-between mb-md">
        <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-[22px]">{icon}</span>
        </div>
      </div>
      <div className="text-headline-lg font-bold text-on-surface">{value}</div>
      <div className="text-label-md text-secondary uppercase tracking-wider mt-xs">{label}</div>
    </div>
  );
}

function QuickAction({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-sm p-md rounded-xl border border-outline-variant/30 hover:bg-primary-fixed/30 hover:border-primary/30 transition-all">
      <span className="material-symbols-outlined text-primary text-[28px]">{icon}</span>
      <span className="text-label-md text-on-surface">{label}</span>
    </button>
  );
}
