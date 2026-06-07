import { NavLink } from 'react-router-dom';
import {
  Home,
  AlertTriangle,
  Map,
  BarChart3,
  Bell,
  ShieldAlert,
  PanelLeftClose,
  PanelLeftOpen,
  X
} from 'lucide-react';

const menuItems = [
  { path: '/app',            name: 'Inicio',              icon: Home,          end: true },
  { path: '/app/reportar',   name: 'Registrar Incidente', icon: AlertTriangle              },
  { path: '/app/mapa',       name: 'Mapa en Tiempo Real', icon: Map                        },
  { path: '/app/dashboard',  name: 'Dashboard',           icon: BarChart3                  },
  { path: '/app/alertas',    name: 'Alertas',             icon: Bell                       }
];

const Sidebar = ({ isCollapsed, toggleCollapse, isMobileOpen, closeMobileMenu }) => {
  return (
    <>
      {/* ── Mobile overlay ──────────────────────────────────────────────────── */}
      <div
        onClick={closeMobileMenu}
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* ── Sidebar drawer ──────────────────────────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200
          transition-all duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:sticky md:top-0 md:h-screen
          w-64
          ${isCollapsed ? 'md:w-[72px]' : 'md:w-64'}
        `}
      >
        {/* ── Brand header ──────────────────────────────────────────────────── */}
        <div className="h-16 flex items-center justify-between px-3 border-b border-slate-100 flex-shrink-0">
          {/* Logo + name */}
          <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg flex-shrink-0 shadow-sm">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <span
              className={`font-extrabold text-[17px] text-slate-800 tracking-tight whitespace-nowrap transition-all duration-200 ${
                isCollapsed ? 'md:opacity-0 md:w-0 md:overflow-hidden' : 'opacity-100'
              }`}
            >
              CiviRisk{' '}
              <span className="text-blue-600 font-semibold text-sm">AI</span>
            </span>
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={toggleCollapse}
            className="hidden md:flex flex-shrink-0 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
            title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {isCollapsed
              ? <PanelLeftOpen  className="h-[18px] w-[18px]" />
              : <PanelLeftClose className="h-[18px] w-[18px]" />}
          </button>

          {/* Mobile close button */}
          <button
            onClick={closeMobileMenu}
            className="md:hidden flex-shrink-0 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
            title="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Navigation ────────────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={closeMobileMenu}
                title={isCollapsed ? item.name : undefined}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-xl text-sm font-medium
                   transition-all duration-150 select-none
                   ${isCollapsed ? 'md:justify-center md:px-0 py-3' : 'px-3 py-2.5'}
                   ${
                     isActive
                       ? 'bg-blue-50 text-blue-700 font-semibold'
                       : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                   }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active left-bar accent */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-600 rounded-full" />
                    )}

                    <Icon
                      className={`flex-shrink-0 h-[18px] w-[18px] transition-colors ${
                        isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />

                    <span
                      className={`whitespace-nowrap transition-all duration-200 ${
                        isCollapsed ? 'md:opacity-0 md:w-0 md:overflow-hidden' : 'opacity-100'
                      }`}
                    >
                      {item.name}
                    </span>

                    {/* Tooltip on collapsed desktop */}
                    {isCollapsed && (
                      <span className="
                        pointer-events-none hidden md:flex
                        absolute left-full ml-3 px-2.5 py-1.5
                        bg-slate-900 text-white text-xs font-semibold rounded-lg whitespace-nowrap
                        opacity-0 group-hover:opacity-100
                        translate-x-1 group-hover:translate-x-0
                        transition-all duration-150 shadow-lg z-50
                      ">
                        {item.name}
                        {/* Arrow */}
                        <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <div
          className={`flex-shrink-0 border-t border-slate-100 bg-slate-50/60 px-3 py-3 transition-all duration-200 ${
            isCollapsed ? 'md:items-center md:flex md:justify-center' : ''
          }`}
        >
          {isCollapsed ? (
            /* Collapsed: just the pulse dot */
            <span
              className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse block"
              title="Sistema en Línea"
            />
          ) : (
            /* Expanded: status + version */
            <div className="space-y-1 px-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse flex-shrink-0" />
                <span className="text-xs font-semibold text-slate-500">Sistema en Línea</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono leading-tight pl-4">
                v1.0.0 · FastAPI + Supabase
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
