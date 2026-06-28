import { useAuthStore } from '../../store/authStore';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const { user } = useAuthStore();

  return (
    <div className="flex h-16 w-full items-center justify-between px-md md:px-lg bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30">
      {/* Mobile Menu & Brand */}
      <div className="flex items-center gap-sm">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-secondary hover:bg-slate-100 rounded-lg flex items-center justify-center transition-colors border border-slate-200"
          aria-label="Toggle Sidebar"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="flex md:hidden items-center gap-xs">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-sm">
            <span className="material-symbols-outlined text-[18px] filled">directions_bus</span>
          </div>
          <span className="text-body-lg font-bold text-primary">BusLocator</span>
        </div>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-sm md:gap-md">
        {/* Search */}
        <div className="relative hidden sm:block">
          <input
            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-full text-body-sm text-on-surface w-[160px] md:w-[240px] transition-all outline-none"
            placeholder="Search routes or stops..."
            type="text"
          />
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[20px]">search</span>
        </div>

        {/* Notifications */}
        <button className="w-10 h-10 rounded-full flex items-center justify-center bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors relative">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
        </button>

        {/* Profile */}
        <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 hover:border-slate-300 cursor-pointer bg-slate-100 flex items-center justify-center transition-colors">
          {user?.avatarUrl ? (
            <img alt="User Profile" className="w-full h-full object-cover" src={user.avatarUrl} />
          ) : (
            <span className="material-symbols-outlined text-secondary text-[20px]">person</span>
          )}
        </div>
      </div>
    </div>
  );
}
