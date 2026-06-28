import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex antialiased bg-surface text-on-surface">
      {/* Left Visual Pane — hidden on mobile */}
      <div className="hidden md:flex md:w-1/2 lg:w-5/12 bg-gradient-to-br from-[#030712] via-[#0b1528] to-[#1e40af] relative overflow-hidden flex-col justify-between p-xl border-r border-white/5">
        {/* Radial Glow Blobs */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-600 rounded-full blur-[100px] opacity-35 pointer-events-none animate-float-slow" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-indigo-500 rounded-full blur-[120px] opacity-25 pointer-events-none animate-float-reverse" />

        {/* Abstract Map Background */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay animate-map-pan"
          style={{
            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBieN4g7ApGwrQ2L1ZYxw3pN5KB1_1zO-HhvKcph_RhOBjfVJDFvNU_xW8NIRAaR5S7MXs5wXPMa7clPDgTwsEpadxSSYTwQ1X3PIAU4vdvvoDiO-pN2WSR0J0P_ovqc_SkG1o3rFQDfQNvPiuyyJTgNSXVYabmDApwCy5eJIFDydrzQ4GDAhO3SWSNM4NfbJ6WWkgaa6WPS0geUv6a_XJ9U0FNSFX3RjHygrJX5W1lPVhyym-Hne8CcmZTOEVZ9yWlKGKXLlRPv8Oi')`
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-sm animate-fade-slide-up delay-100">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg">
            <span className="material-symbols-outlined text-[24px] filled">directions_bus</span>
          </div>
          <span className="text-headline-md font-extrabold text-white tracking-tight">
            BusLocator
          </span>
        </div>

        {/* Hero text */}
        <div className="relative z-10 mb-xl">
          <h1 className="text-headline-lg text-white font-extrabold mb-md max-w-[448px] tracking-tight leading-tight animate-fade-slide-up delay-200">
            Intelligent Transit Routing <br />
            <span className="text-blue-400">&amp;</span> Monitoring<span className="text-blue-400">.</span>
          </h1>
          <p className="text-body-lg text-slate-300 max-w-[384px] leading-relaxed animate-fade-slide-up delay-300">
            Securely manage your fleet, track routes in real-time, and ensure passenger safety with our enterprise-grade platform.
          </p>
        </div>

        {/* Bottom gradient overlay */}
        <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>

      {/* Right Login Pane */}
      <div className="w-full md:w-1/2 lg:w-7/12 flex items-center justify-center p-margin-mobile md:p-margin-desktop bg-surface relative">
        {/* Mobile Logo */}
        <div className="absolute top-margin-mobile left-margin-mobile flex md:hidden items-center gap-sm">
          <span className="material-symbols-outlined text-[28px] text-primary filled">directions_bus</span>
          <span className="text-headline-md font-extrabold text-primary tracking-tight">BusLocator</span>
        </div>

        <div className="w-full max-w-[440px]">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
