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

const Sidebar = ({ isCollapsed, toggleCollapse, isMobileOpen, closeMobileMenu }) => {
  const menuItems = [
    { path: '/app', name: 'Inicio', icon: Home, end: true },
    { path: '/app/reportar', name: 'Registrar Incidente', icon: AlertTriangle },
    { path: '/app/mapa', name: 'Mapa en Tiempo Real', icon: Map },
    { path: '/app/dashboard', name: 'Dashboard', icon: BarChart3 },
    { path: '/app/alertas', name: 'Alertas', icon: Bell }
  ];

  const sidebarWidthClass = isCollapsed ? 'md:w-20' : 'md:w-64';
  const linkPaddingClass = isCollapsed ? 'md:justify-center md:px-0 md:py-3.5' : 'px-4 py-3';

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div 
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      <aside 
        className={`fixed inset-y-0 left-0 z-50 ${sidebarWidthClass} w-64 border-r border-slate-200 bg-white flex flex-col h-screen transform ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-all duration-300 ease-in-out md:translate-x-0 md:sticky md:top-0`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2.5 px-2 overflow-hidden">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg flex-shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <span className="font-extrabold text-lg text-slate-800 tracking-tight whitespace-nowrap animate-fade-in">
                CiviRisk <span className="text-blue-600 font-semibold text-sm">AI</span>
              </span>
            )}
          </div>

          {/* Collapse Button for Desktop */}
          <button
            onClick={toggleCollapse}
            className="hidden md:flex p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
            title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {isCollapsed ? <PanelLeftOpen className="h-4.5 w-4.5" /> : <PanelLeftClose className="h-4.5 w-4.5" />}
          </button>

          {/* Close Button for Mobile */}
          {isMobileOpen && (
            <button
              onClick={closeMobileMenu}
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors mr-1"
              title="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `flex items-center gap-3 ${linkPaddingClass} rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span className="whitespace-nowrap animate-fade-in">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className={`p-4 border-t border-slate-100 bg-slate-50/50 ${isCollapsed ? 'md:flex md:justify-center md:items-center' : ''}`}>
          {isCollapsed ? (
            <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse" title="Sistema en Línea"></span>
          ) : (
            <div className="animate-fade-in">
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
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
