import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getRecentReports, subscribeToReports } from '../services/reportsService';
import { getAlerts, getRiskPredictions, subscribeToAlerts, subscribeToRiskPredictions } from '../services/predictionsService';
import StatCard from '../components/ui/StatCard';
import RiskBadge from '../components/ui/RiskBadge';
import LoadingState from '../components/ui/LoadingState';
import { ZONES } from '../data/zones';
import { translateIncidentType, formatDate } from '../utils/formatters';
import { 
  Map, 
  PlusCircle, 
  FileText, 
  Bell, 
  MapPin, 
  AlertOctagon,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [reportsCount, setReportsCount] = useState(0);
  const [alertsCount, setAlertsCount] = useState(0);
  const [avgRiskScore, setAvgRiskScore] = useState(0);
  const [recentReports, setRecentReports] = useState([]);
  const [latestAlerts, setLatestAlerts] = useState([]);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [reports, alerts, predictions] = await Promise.all([
          getRecentReports(20),
          getAlerts(),
          getRiskPredictions()
        ]);

        if (active) {
          setRecentReports(reports);
          setReportsCount(reports.length);
          setLatestAlerts(alerts.slice(0, 5));
          setAlertsCount(alerts.length);

          if (predictions.length > 0) {
            const sum = predictions.reduce((acc, curr) => acc + (curr.score || 0), 0);
            setAvgRiskScore(Math.round(sum / predictions.length));
          } else {
            setAvgRiskScore(0);
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    // Set up Realtime subscriptions
    const unsubReports = subscribeToReports(() => {
      fetchData(); // Reload stats when reports table changes
    });

    const unsubAlerts = subscribeToAlerts(() => {
      fetchData(); // Reload stats when alerts table changes
    });

    const unsubPredictions = subscribeToRiskPredictions(() => {
      fetchData(); // Reload stats when predictions table changes
    });

    return () => {
      active = false;
      unsubReports();
      unsubAlerts();
      unsubPredictions();
    };
  }, []);

  const getGeneralRiskLevel = (score) => {
    if (score <= 39) return 'Bajo';
    if (score <= 69) return 'Medio';
    return 'Alto';
  };

  if (loading) {
    return <LoadingState message="Cargando panel de control..." />;
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Ciudadano';

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Welcome Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-700 via-blue-600 to-indigo-600 p-8 md:p-10 text-white shadow-lg">
        {/* Decorative background shapes */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute left-1/3 bottom-0 -mb-16 h-48 w-48 rounded-full bg-blue-400/20 blur-2xl"></div>

        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold tracking-wide">
            <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping"></span>
            Monitoreo Activo
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Hola, {displayName}
          </h2>
          <p className="text-base text-blue-50/90 leading-relaxed font-medium">
            Bienvenido a <strong>CiviRisk AI</strong>, la plataforma inteligente de seguridad ciudadana.
            Reporta incidentes de infraestructura o seguridad en tu barrio y accede a análisis predictivos en tiempo real.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={() => navigate('/app/reportar')}
              className="bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-xl px-5 py-3 text-sm flex items-center gap-2 cursor-pointer shadow-sm transition-all duration-200"
            >
              <PlusCircle className="h-4.5 w-4.5" />
              Registrar incidente
            </button>
            <button
              onClick={() => navigate('/app/mapa')}
              className="bg-blue-500/30 text-white border border-white/20 hover:bg-blue-500/40 font-bold rounded-xl px-5 py-3 text-sm flex items-center gap-2 cursor-pointer transition-all duration-200"
            >
              <Map className="h-4.5 w-4.5" />
              Ver mapa
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Incidentes Recientes"
          value={reportsCount}
          description="Reportes registrados en el sistema"
          icon={FileText}
        />
        <StatCard
          title="Zonas Monitoreadas"
          value={ZONES.length}
          description="Zonas urbanas bajo vigilancia"
          icon={MapPin}
        />
        <StatCard
          title="Alertas Activas"
          value={alertsCount}
          description="Alertas preventivas de riesgo"
          icon={Bell}
          trendText={alertsCount > 0 ? `${alertsCount} activas` : 'Sin alertas'}
          trendIsPositive={alertsCount === 0}
        />
        <StatCard
          title="Riesgo Promedio"
          value={avgRiskScore}
          description={`Nivel general: ${getGeneralRiskLevel(avgRiskScore)}`}
          icon={AlertOctagon}
          trendText={`Score global (0-100)`}
          trendIsPositive={avgRiskScore < 50}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PI24 Explanation block */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-blue-600">
              <TrendingUp className="h-6 w-6" />
              <h3 className="text-lg font-bold text-slate-800 my-0">
                ¿Qué es la Predicción PI24?
              </h3>
            </div>
            
            <p className="text-sm text-slate-600 leading-relaxed">
              <strong>PI24</strong> es un indicador predictivo generado mediante Inteligencia Artificial.
              Estima la probabilidad de ocurrencia de incidentes de seguridad y orden urbano en las próximas <strong>24 horas</strong>,
              desglosado por zona geográfica y tipo de incidente.
            </p>
            
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Flujo del análisis predictivo
              </h4>
              <ol className="text-xs text-slate-500 space-y-2 list-decimal list-inside">
                <li>El ciudadano registra un reporte en la sección <strong className="text-slate-700">Registrar Incidente</strong>.</li>
                <li>La base de datos Supabase registra la inserción y gatilla un webhook automático.</li>
                <li>El motor de Machine Learning en FastAPI evalúa las condiciones de iluminación, hora y flujo.</li>
                <li>La predicción es recalculada, actualizando al instante el Mapa de Riesgos y el Dashboard.</li>
              </ol>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 mt-6 flex justify-between items-center">
            <span className="text-xs text-slate-400 font-medium">
              Motor predictivo en ejecución automática
            </span>
            <Link 
              to="/app/dashboard" 
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Ir a analíticas <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Recent Alerts Feed */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <h3 className="text-base font-bold text-slate-800 my-0">
              Alertas Recientes
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded-full">
              Live
            </span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto max-h-[280px] pr-1">
            {latestAlerts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <Bell className="h-8 w-8 text-slate-300" />
                <p className="text-xs font-medium text-slate-400">
                  No hay alertas activas en este momento
                </p>
              </div>
            ) : (
              latestAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/70 transition-all duration-150 space-y-1.5"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-800">
                      {alert.title}
                    </span>
                    <RiskBadge score={alert.score} />
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {alert.message}
                  </p>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {formatDate(alert.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>
          
          <Link 
            to="/app/alertas" 
            className="text-xs font-bold text-blue-600 hover:text-blue-700 mt-4 pt-3 border-t border-slate-100 text-center block"
          >
            Ver todas las alertas
          </Link>
        </div>
      </div>

      {/* Recent Activity Table snippet */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <h3 className="text-base font-bold text-slate-800 my-0">
            Últimos Incidentes Reportados
          </h3>
          <Link 
            to="/app/mapa" 
            className="text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            Ver en mapa
          </Link>
        </div>

        <div className="overflow-x-auto">
          {recentReports.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Aún no se han registrado reportes.
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Zona</th>
                  <th className="py-3 px-4">Severidad</th>
                  <th className="py-3 px-4">Iluminación</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.slice(0, 5).map((report) => (
                  <tr 
                    key={report.id} 
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {translateIncidentType(report.type)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {report.zone_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-sm text-xs font-bold uppercase tracking-wider ${
                        report.severity === 'alta' 
                          ? 'bg-red-50 text-red-700' 
                          : report.severity === 'media'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {report.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {report.lighting === 'alta' ? 'Buena' : report.lighting === 'media' ? 'Regular' : 'Mala'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-xs font-mono">
                      {formatDate(report.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-500">
                      {report.is_anonymous ? (
                        <span className="text-slate-400 italic">Anónimo</span>
                      ) : (
                        <span>Registrado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};

export default Home;
