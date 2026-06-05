import { NavLink } from 'react-router-dom';
import { Home, AlertTriangle, Map, BarChart3, Bell, ShieldAlert } from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { path: '/app', name: 'Inicio', icon: Home, end: true },
    { path: '/app/reportar', name: 'Registrar Incidente', icon: AlertTriangle },
    { path: '/app/mapa', name: 'Mapa en Tiempo Real', icon: Map },
    { path: '/app/dashboard', name: 'Dashboard', icon: BarChart3 },
    { path: '/app/alertas', name: 'Alertas', icon: Bell }
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-2.5">
        <div className="p-1.5 bg-blue-600 text-white rounded-lg">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <span className="font-extrabold text-lg text-slate-800 tracking-tight">
          CiviRisk <span className="text-blue-600 font-semibold text-sm">AI</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer info */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2 px-2">
          <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="text-xs font-semibold text-slate-500">
            Sistema en Línea
          </span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5 px-2 font-mono">
          v1.0.0 (FastAPI + Supabase)
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
