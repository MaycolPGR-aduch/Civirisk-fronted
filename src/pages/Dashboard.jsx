import { useState, useEffect } from 'react';
import { getRiskPredictions, subscribeToRiskPredictions } from '../services/predictionsService';
import { translateIncidentType, formatDate } from '../utils/formatters';
import StatCard from '../components/ui/StatCard';
import RiskBadge from '../components/ui/RiskBadge';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  RefreshCw, 
  Award, 
  Database,
  CalendarDays
} from 'lucide-react';

const Dashboard = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    try {
      const data = await getRiskPredictions();
      setPredictions(data);
      setErrorMsg('');
    } catch (err) {
      console.error(err);
      setErrorMsg('No se pudieron cargar las analíticas predictivas.');
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

    // Listen for realtime updates
    const unsubscribe = subscribeToRiskPredictions((payload) => {
      console.log('Realtime prediction updated in Dashboard:', payload);
      fetchData(); // Refresh analytics
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (loading) {
    return <LoadingState message="Cargando análisis predictivo..." />;
  }

  if (predictions.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          title="Sin datos predictivos"
          description="Aún no hay predicciones calculadas en la base de datos. Por favor, registre un reporte para disparar el webhook de predicción."
          actionButton={
            <button
              onClick={handleRefresh}
              className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer"
            >
              Reintentar
            </button>
          }
        />
      </div>
    );
  }

  // Calculate stats
  const totalPredictions = predictions.length;
  
  // Sort predictions by score descending to find rankings
  const rankedPredictions = [...predictions].sort((a, b) => (b.score || 0) - (a.score || 0));
  
  const highestRiskPred = rankedPredictions[0];
  
  const averageScore = Math.round(
    predictions.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalPredictions
  );

  const lastUpdate = predictions.reduce((latest, current) => {
    if (!latest) return current.generated_at;
    return new Date(current.generated_at) > new Date(latest) ? current.generated_at : latest;
  }, '');

  // Prepare chart data (Zone Name -> Max Score)
  const chartData = predictions.map(pred => ({
    name: pred.zone_name,
    score: pred.score,
    type: translateIncidentType(pred.incident_type),
    level: pred.risk_level
  })).slice(0, 8); // Top 8 zones

  // Determine bar fill color based on score
  const getBarColor = (score) => {
    if (score <= 39) return '#10b981'; // emerald-500
    if (score <= 69) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight my-0">
            Dashboard de Análisis Predictivo PI24
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Estadísticas consolidadas e índices de riesgo urbano estimados por Inteligencia Artificial.
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

      {/* KPI Panel Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Mayor Riesgo"
          value={highestRiskPred ? highestRiskPred.zone_name : 'N/A'}
          description={highestRiskPred ? `Score: ${highestRiskPred.score}/100 - ${translateIncidentType(highestRiskPred.incident_type)}` : ''}
          icon={Award}
          trendIsPositive={false}
        />
        <StatCard
          title="Promedio Score"
          value={`${averageScore} / 100`}
          description={`Rango: ${averageScore >= 70 ? 'Alto' : averageScore >= 40 ? 'Medio' : 'Bajo'}`}
          icon={TrendingUp}
          trendIsPositive={averageScore < 50}
        />
        <StatCard
          title="Predicciones Activas"
          value={totalPredictions}
          description="Cálculos activos en base de datos"
          icon={Database}
        />
        <StatCard
          title="Última Actualización"
          value={lastUpdate ? new Date(lastUpdate).toLocaleTimeString('es-ES') : 'N/A'}
          description={lastUpdate ? formatDate(lastUpdate) : ''}
          icon={CalendarDays}
        />
      </div>

      {/* Analytics Chart Block */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center gap-2 text-slate-800 pb-4 border-b border-slate-100 mb-6">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h3 className="text-base font-bold my-0">
            Niveles de Riesgo por Zona de Monitoreo
          </h3>
        </div>

        {/* Recharts Wrapper */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-800 text-xs space-y-1">
                        <p className="font-extrabold">{data.name}</p>
                        <p className="text-slate-300 font-medium">Incidente: {data.type}</p>
                        <p className="font-bold flex items-center gap-1.5 mt-1">
                          Score: <span className="text-blue-400 font-extrabold">{data.score}</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="score" radius={[8, 8, 0, 0]} barSize={36}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Predictions list Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="pb-4 border-b border-slate-100 mb-4">
          <h3 className="text-base font-bold text-slate-800 my-0">
            Ranking de Riesgo PI24
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Zona</th>
                <th className="py-3 px-4">Tipo Incidente Predicho</th>
                <th className="py-3 px-4 text-center">Score Predictivo</th>
                <th className="py-3 px-4">Nivel Riesgo</th>
                <th className="py-3 px-4">Generado En</th>
              </tr>
            </thead>
            <tbody>
              {rankedPredictions.map((pred) => {
                return (
                  <tr 
                    key={pred.id} 
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {pred.zone_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {translateIncidentType(pred.incident_type)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                      {pred.score}
                    </td>
                    <td className="py-3.5 px-4">
                      <RiskBadge score={pred.score} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-xs font-mono">
                      {formatDate(pred.generated_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
