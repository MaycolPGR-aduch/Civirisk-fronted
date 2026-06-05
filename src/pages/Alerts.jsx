import { useState, useEffect } from 'react';
import { getAlerts, subscribeToAlerts } from '../services/predictionsService';
import { formatDate } from '../utils/formatters';
import RiskBadge from '../components/ui/RiskBadge';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import { 
  Bell, 
  RefreshCw, 
  ShieldAlert, 
  CalendarDays
} from 'lucide-react';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    try {
      const data = await getAlerts();
      setAlerts(data);
      setErrorMsg('');
    } catch (err) {
      console.error(err);
      setErrorMsg('No se pudieron recuperar las alertas de la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        fetchData();
      }
    });

    // Listen to realtime updates
    const unsubscribe = subscribeToAlerts((payload) => {
      console.log('Realtime alert received:', payload);
      fetchData(); // Reload list
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (loading) {
    return <LoadingState message="Cargando canal de alertas..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight my-0">
            Alertas Ciudadanas Activas
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Notificaciones preventivas generadas en tiempo real para las distintas zonas de la ciudad.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="self-start md:self-auto bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
          Actualizar
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Alerts list/feed */}
      {alerts.length === 0 ? (
        <div className="py-12">
          <EmptyState
            title="Sin alertas vigentes"
            description="Actualmente no se registran alertas preventivas de riesgo crítico en las zonas monitoreadas."
            icon={Bell}
            actionButton={
              <button
                onClick={handleRefresh}
                className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                Refrescar
              </button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const isHigh = String(alert.risk_level).toLowerCase() === 'alto' || alert.score >= 70;
            return (
              <div
                key={alert.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs transition-all hover:shadow-md duration-200 border-slate-200 ${
                  isHigh ? 'relative overflow-hidden' : ''
                }`}
              >
                {/* Red warning border indicator for high risk */}
                {isHigh && (
                  <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-red-500"></div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  
                  {/* Alert Info details */}
                  <div className="space-y-2 flex-1">
                    
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className={`p-1.5 rounded-lg flex items-center justify-center ${
                        isHigh ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        <ShieldAlert className="h-4 w-4" />
                      </span>
                      <h3 className="text-base font-bold text-slate-800 my-0">
                        {alert.title}
                      </h3>
                      <RiskBadge score={alert.score} level={alert.risk_level} />
                    </div>

                    {/* Message Body */}
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      {alert.message}
                    </p>

                    {/* Sub details footer */}
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatDate(alert.created_at)}</span>
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default Alerts;
