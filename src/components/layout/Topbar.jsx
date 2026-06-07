import { useAuth } from '../../hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { LogOut, User, Menu } from 'lucide-react';

const PAGE_TITLES = {
  '/app':            'Inicio',
  '/app/reportar':   'Reportar Incidente',
  '/app/mapa':       'Mapa en Tiempo Real',
  '/app/dashboard':  'Dashboard de Riesgo',
  '/app/alertas':    'Alertas de Riesgo'
};

const Topbar = ({ toggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'CiviRisk AI';

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario';
  const displayEmail = user?.email || '';

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 flex-shrink-0 gap-4">

      {/* ── Left: hamburger + page title ────────────────────────────── */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={toggleMobileMenu}
          className="flex-shrink-0 p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg md:hidden cursor-pointer transition-colors"
          title="Abrir Menú"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h1 className="text-[17px] font-bold text-slate-800 tracking-tight truncate my-0">
          {pageTitle}
        </h1>
      </div>

      {/* ── Right: user info + logout ────────────────────────────────── */}
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">

        {/* Avatar + name — hide email on xs */}
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-sm font-semibold text-slate-800 truncate max-w-[140px]">
              {displayName}
            </span>
            {displayEmail && (
              <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                {displayEmail}
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-slate-500 hover:text-red-600 text-sm font-medium py-1.5 px-2 sm:px-3 rounded-lg hover:bg-red-50 transition-all duration-150 cursor-pointer"
          title="Cerrar Sesión"
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span className="hidden sm:inline">Cerrar sesión</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
