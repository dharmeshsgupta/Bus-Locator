import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface SubItem {
  name: string;
  path: string;
}

interface NavItem {
  name: string;
  path?: string;
  icon: string;
  iconFilled?: boolean;
  subItems?: SubItem[];
}

const roleLinks: Record<string, NavItem[]> = {
  student: [
    { name: 'Dashboard', path: '/student/dashboard', icon: 'dashboard' },
    { name: 'Live Map', path: '/student/map', icon: 'map' },
    { name: 'Routes', path: '/student/routes', icon: 'route' },
    { name: 'Schedules', path: '/student/schedules', icon: 'calendar_month' },
    { name: 'Fees', path: '/student/fees', icon: 'payments' },
    { name: 'Settings', path: '/student/settings', icon: 'settings' },
  ],
  driver: [
    { name: 'Dashboard', path: '/driver/dashboard', icon: 'dashboard' },
    { name: 'My Route', path: '/driver/route', icon: 'route' },
    { name: 'Occupancy', path: '/driver/occupancy', icon: 'groups' },
    { name: 'Settings', path: '/driver/settings', icon: 'settings' },
  ],
  admin: [
    { name: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard' },
    { name: 'Live Map', path: '/admin/map', icon: 'map' },
    { name: 'Students', path: '/admin/students', icon: 'school' },
    { name: 'Drivers', path: '/admin/drivers', icon: 'directions_run' },
    { name: 'Routes', path: '/admin/routes', icon: 'route' },
    { name: 'Stops', path: '/admin/stops', icon: 'pin_drop' },
    { name: 'Fleet', path: '/admin/buses', icon: 'local_shipping' },
    {
      name: 'Finance',
      icon: 'account_balance',
      subItems: [
        { name: 'Finance Overview', path: '/admin/finance' },
        { name: 'Transaction Ledger', path: '/admin/finance/ledger' },
        { name: 'Refund Management', path: '/admin/finance/refunds' },
        { name: 'System Audit Logs', path: '/admin/finance/audit' },
        { name: 'Settings & Rules', path: '/admin/finance/settings' },
        { name: 'Fees Control', path: '/admin/fees' },
      ],
    },
  ],
  superadmin: [
    { name: 'Dashboard', path: '/superadmin/dashboard', icon: 'dashboard' },
    { name: 'Admins', path: '/superadmin/admins', icon: 'admin_panel_settings' },
    { name: 'Analytics', path: '/superadmin/analytics', icon: 'analytics' },
    { name: 'Settings', path: '/superadmin/settings', icon: 'settings' },
  ],
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function CollapsibleMenuItem({
  link,
  currentPath,
}: {
  link: NavItem;
  currentPath: string;
}) {
  const isChildActive = link.subItems?.some(sub => currentPath === sub.path || currentPath.startsWith(sub.path)) || false;
  const [isOpen, setIsOpen] = useState(isChildActive);

  // Auto-expand if a child route becomes active
  useEffect(() => {
    if (isChildActive) {
      setIsOpen(true);
    }
  }, [currentPath, isChildActive]);

  return (
    <div className="space-y-xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-md py-sm transition-colors duration-150 cursor-pointer ${
          isChildActive
            ? 'bg-slate-200/30 text-slate-900 border-l-[3px] border-primary font-semibold rounded-r-lg pl-[13px] pr-md'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg pl-md pr-md'
        }`}
      >
        <div className="flex items-center gap-md">
          <span className={`material-symbols-outlined transition-colors ${isChildActive ? 'filled text-primary font-medium' : 'text-slate-400'}`}>
            {link.icon}
          </span>
          <span className="text-body-lg font-medium">{link.name}</span>
        </div>
        <span className="material-symbols-outlined text-slate-400 text-[20px] transition-transform duration-200">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {isOpen && (
        <div className="ml-[28px] pl-md border-l border-slate-200 space-y-xs my-xs">
          {link.subItems?.map((sub) => {
            const isSubActive = currentPath === sub.path;
            return (
              <Link
                key={sub.path}
                to={sub.path}
                className={`flex items-center py-xs px-sm text-body-md transition-colors duration-150 rounded-lg ${
                  isSubActive
                    ? 'bg-white text-slate-950 font-bold shadow-xs border-l-2 border-primary pl-[6px]'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/30'
                }`}
              >
                <span>{sub.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { role, setLogout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const links = role ? roleLinks[role] || [] : [];

  // Automatically close sidebar on mobile when route changes
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  const handleLogout = () => {
    setLogout();
    navigate('/auth/student');
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <nav
        className={`fixed inset-y-0 left-0 z-50 flex flex-col h-full py-lg border-r border-slate-200 bg-slate-50 w-[280px] shadow-xl md:shadow-none flex-shrink-0 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo and Close Button */}
        <div className="px-md mb-xl flex items-center justify-between">
          <div className="flex items-center gap-sm">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-sm">
              <span className="material-symbols-outlined filled">directions_bus</span>
            </div>
            <div>
              <h1 className="text-headline-md font-bold text-slate-900">BusLocator</h1>
              <p className="text-label-md text-slate-500">Transit Intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-sm text-secondary hover:bg-slate-100 rounded-lg flex items-center justify-center transition-colors border border-slate-200"
            aria-label="Close Sidebar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Nav Items */}
        <div className="flex-1 pr-sm space-y-xs overflow-y-auto">
          {links.map((link) => {
            if (link.subItems) {
              return (
                <CollapsibleMenuItem
                  key={link.name}
                  link={link}
                  currentPath={location.pathname}
                />
              );
            }

            const isActive = link.path ? location.pathname.startsWith(link.path) : false;
            return (
              <Link
                key={link.path}
                to={link.path!}
                className={`flex items-center gap-md py-sm transition-colors duration-150 ${
                  isActive
                    ? 'bg-white text-slate-900 border-l-[3px] border-primary font-semibold shadow-xs rounded-r-lg pl-[13px] pr-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg pl-md pr-md'
                }`}
              >
                <span className={`material-symbols-outlined transition-colors ${isActive ? 'filled text-primary font-medium' : 'text-slate-400'}`}>{link.icon}</span>
                <span className="text-body-lg">{link.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Bottom */}
        <div className="px-sm mt-auto border-t border-slate-200 pt-sm">
          <button className="w-full flex items-center justify-center gap-sm bg-white hover:bg-slate-50 text-slate-700 transition-colors py-sm rounded-lg mb-sm border border-slate-200 font-semibold shadow-xs">
            <span className="material-symbols-outlined text-[20px] text-primary">support_agent</span>
            <span className="text-label-md">Live Support</span>
          </button>
          <a href="#" className="flex items-center gap-md text-slate-600 hover:text-slate-950 hover:bg-slate-100/60 transition-colors rounded-lg px-md py-sm">
            <span className="material-symbols-outlined text-slate-400">help</span>
            <span className="text-label-md">Help</span>
          </a>
          <button onClick={handleLogout} className="w-full flex items-center gap-md text-slate-600 hover:text-[#e11d48] hover:bg-[#ffe4e6]/50 transition-colors rounded-lg px-md py-sm">
            <span className="material-symbols-outlined text-slate-400">logout</span>
            <span className="text-label-md">Logout</span>
          </button>
        </div>
      </nav>
    </>
  );
}
