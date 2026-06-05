import { useAuth } from '../../hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';

const Topbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/app') return 'Inicio';
    if (path === '/app/reportar') return 'Reportar Incidente';
    if (path === '/app/mapa') return 'Mapa en Tiempo Real';
    if (path === '/app/dashboard') return 'Dashboard de Riesgo';
    if (path === '/app/alertas') return 'Alertas de Riesgo';
    return 'CiviRisk AI';
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const displayName = user?.user_metadata?.full_name || user?.email || 'Usuario';

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight my-0">
          {getPageTitle()}
        </h1>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-6">
        {/* User Info Card */}
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 border border-slate-200">
            <User className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-800 leading-tight">
              {displayName}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {user?.email}
            </span>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-slate-200"></div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-slate-500 hover:text-red-600 text-sm font-medium py-1.5 px-3 rounded-lg hover:bg-red-50 transition-all duration-200"
          title="Cerrar Sesión"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Cerrar sesión</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
