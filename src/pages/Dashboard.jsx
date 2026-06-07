import { useState, useEffect, useMemo } from 'react';
import { getRiskPredictions, subscribeToRiskPredictions } from '../services/predictionsService';
import { getRecentReports, subscribeToReports } from '../services/reportsService';
import {
  translateIncidentType,
  translateSeverity,
  translateLighting,
  translatePeopleFlow,
  formatDate
} from '../utils/formatters';
import StatCard from '../components/ui/StatCard';
import RiskBadge from '../components/ui/RiskBadge';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell as PieCell,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  BarChart3, TrendingUp, RefreshCw, Award, Database,
  FileText, AlertTriangle, EyeOff,
  User, MapPin, ChevronLeft, ChevronRight, Activity,
  PieChart as PieIcon, Clock, ShieldCheck, Sun, Flame
} from 'lucide-react';

// ── Pagination hook ────────────────────────────────────────────────────────────
const usePagination = (data, defaultPageSize = 10) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  // Reset to page 1 during render if data length or page size changes
  const [prevLength, setPrevLength] = useState(data.length);
  const [prevSize, setPrevSize] = useState(pageSize);

  if (data.length !== prevLength || pageSize !== prevSize) {
    setPrevLength(data.length);
    setPrevSize(pageSize);
    setPage(1);
  }

  // Adjust page if it exceeds total pages
  if (page > totalPages) {
    setPage(totalPages);
  }

  const paged = useMemo(
    () => data.slice((page - 1) * pageSize, page * pageSize),
    [data, page, pageSize]
  );
  return { paged, page, setPage, pageSize, setPageSize, totalPages };
};

// ── Shared tooltip ─────────────────────────────────────────────────────────────
const ChartTooltip = ({ children }) => (
  <div className="bg-slate-900 text-white px-3 py-2.5 rounded-xl shadow-lg border border-slate-800 text-xs space-y-1">
    {children}
  </div>
);

// ── Severity badge ─────────────────────────────────────────────────────────────
const SEVERITY_STYLES = {
  alta:  'bg-red-50 text-red-700 border border-red-200',
  media: 'bg-amber-50 text-amber-700 border border-amber-200',
  baja:  'bg-emerald-50 text-emerald-700 border border-emerald-200'
};
const SeverityBadge = ({ severity }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${SEVERITY_STYLES[severity] || 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
    {translateSeverity(severity)}
  </span>
);

// ── Pagination controls ────────────────────────────────────────────────────────
const PAGE_SIZES = [5, 10, 20, 50];
const Pagination = ({ page, totalPages, total, pageSize, setPage, setPageSize, label = 'registros' }) => {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 mt-2">
      <span className="text-xs text-slate-400 font-medium">
        Mostrando <span className="text-slate-600 font-bold">{from}–{to}</span> de{' '}
        <span className="text-slate-600 font-bold">{total}</span> {label}
      </span>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 font-medium">Por página:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700 font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
          >
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce((acc, p, idx, arr) => {
              if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
              acc.push(p);
              return acc;
            }, [])
            .map((item, idx) =>
              item === '...' ? (
                <span key={`e-${idx}`} className="px-1 text-slate-400 text-xs select-none">…</span>
              ) : (
                <button key={item} onClick={() => setPage(item)}
                  className={`min-w-[28px] h-7 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${item === page ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                  {item}
                </button>
              )
            )}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Chart card wrapper ─────────────────────────────────────────────────────────
const ChartCard = ({ icon: Icon, title, subtitle, children, className = '' }) => (
  <div className={`bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs ${className}`}>
    <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-5">
      <Icon className="h-5 w-5 text-blue-600 shrink-0" />
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-slate-800 my-0 leading-tight">{title}</h3>
        {subtitle && <p className="text-[11px] text-slate-400 font-medium mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

// ── Colour helpers ─────────────────────────────────────────────────────────────
const scoreColor  = (s) => s <= 39 ? '#10b981' : s <= 69 ? '#f59e0b' : '#ef4444';
const PIE_COLORS  = { alta: '#ef4444', media: '#f59e0b', baja: '#10b981', desconocida: '#94a3b8' };
const HOUR_COLORS = ['#dbeafe','#bfdbfe','#93c5fd','#60a5fa','#3b82f6','#2563eb','#1d4ed8','#1e3a8a'];

// Constantes para el mapa de calor
const DAYS   = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HBLOCKS = ['00', '03', '06', '09', '12', '15', '18', '21'];

// Riesgo general del sistema basado en el promedio de scores
const getGlobalRisk = (avg) => {
  if (avg >= 70) return { label: 'Alto',  color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200'     };
  if (avg >= 40) return { label: 'Medio', color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200'   };
  return            { label: 'Bajo',  color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
};

// ═══════════════════════════════════════════════════════════════════════════════
const Dashboard = () => {
  const [predictions, setPredictions] = useState([]);
  const [reports, setReports]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [errorMsg, setErrorMsg]       = useState('');

  const fetchData = async () => {
    try {
      const [predictionsData, reportsData] = await Promise.all([
        getRiskPredictions(),
        getRecentReports(200)
      ]);
      setPredictions(predictionsData);
      setReports(reportsData);
      setErrorMsg('');
    } catch (err) {
      console.error(err);
      setErrorMsg('No se pudieron cargar los datos del dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => { setLoading(true); fetchData(); };

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => { if (active) fetchData(); });
    const unsubPred = subscribeToRiskPredictions(() => fetchData());
    const unsubRep  = subscribeToReports(() => fetchData());
    return () => { active = false; unsubPred(); unsubRep(); };
  }, []);

  // ── Derived: predictions ─────────────────────────────────────────────────────
  const rankedPredictions = useMemo(
    () => [...predictions].sort((a, b) => (b.score || 0) - (a.score || 0)),
    [predictions]
  );
  const totalPredictions = predictions.length;
  const highestRiskPred  = rankedPredictions[0];
  const averageScore     = totalPredictions > 0
    ? Math.round(predictions.reduce((s, p) => s + (p.score || 0), 0) / totalPredictions)
    : 0;
  const lastUpdate = predictions.reduce((latest, p) =>
    !latest || new Date(p.generated_at) > new Date(latest) ? p.generated_at : latest
  , '');
  const globalRisk = getGlobalRisk(averageScore);

  // ── Derived: reports ─────────────────────────────────────────────────────────
  const todayStr            = new Date().toISOString().slice(0, 10);
  const incidentesToday     = reports.filter((r) => r.created_at?.slice(0, 10) === todayStr).length;
  const reportesVerificados = reports.filter((r) => r.is_anonymous === false).length;
  const totalReports        = reports.length;
  const highSeverityReports = reports.filter((r) => r.severity === 'alta').length;

  // Tiempo promedio de respuesta ML (created_at reporte → generated_at predicción)
  const avgResponseMinutes = useMemo(() => {
    const pairs = predictions
      .filter((p) => p.last_report_id && p.generated_at)
      .map((p) => {
        const report = reports.find((r) => r.id === p.last_report_id);
        if (!report?.created_at) return null;
        const diff = (new Date(p.generated_at) - new Date(report.created_at)) / 60000;
        return diff > 0 ? diff : null;
      })
      .filter(Boolean);
    if (pairs.length === 0) return null;
    return Math.round(pairs.reduce((a, b) => a + b, 0) / pairs.length);
  }, [predictions, reports]);

  // ── Chart data ───────────────────────────────────────────────────────────────

  // 1. Bar — score por zona (top 8)
  const zoneBarData = rankedPredictions.slice(0, 8).map((p) => ({
    name: p.zone_name,
    score: p.score,
    type: translateIncidentType(p.incident_type)
  }));

  // 2. Reportes por tipo
  const typeCounts  = reports.reduce((acc, r) => { const k = r.type || 'desconocido'; acc[k] = (acc[k] || 0) + 1; return acc; }, {});
  const typeBarData = Object.entries(typeCounts)
    .map(([type, count]) => ({ name: translateIncidentType(type), count }))
    .sort((a, b) => b.count - a.count);

  // 3. Tendencia semanal (line — 14 días)
  const lineData = useMemo(() => {
    const now  = new Date();
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (13 - i));
      return d.toISOString().slice(0, 10);
    });
    const counts = Object.fromEntries(days.map((d) => [d, 0]));
    reports.forEach((r) => {
      const day = r.created_at?.slice(0, 10);
      if (day && counts[day] !== undefined) counts[day]++;
    });
    return days.map((d) => ({ day: d.slice(5), reportes: counts[d] }));
  }, [reports]);

  // 4. Pie — severidad
  const severityCounts = reports.reduce((acc, r) => { const k = r.severity || 'desconocida'; acc[k] = (acc[k] || 0) + 1; return acc; }, {});
  const pieData = Object.entries(severityCounts).map(([sev, value]) => ({
    name: translateSeverity(sev), value, color: PIE_COLORS[sev] || PIE_COLORS.desconocida
  }));

  // 5. Reportes por hora (0–23 agrupados en bloques de 2h para legibilidad)
  const hourData = useMemo(() => {
    const slots = Array.from({ length: 12 }, (_, i) => ({
      label: `${String(i * 2).padStart(2, '0')}h`,
      count: 0
    }));
    reports.forEach((r) => {
      if (!r.created_at) return;
      const h = new Date(r.created_at).getHours();
      slots[Math.floor(h / 2)].count++;
    });
    return slots;
  }, [reports]);

  // 6. Reportes por zona (conteo, no score)
  const zoneReportCounts = useMemo(() => {
    const counts = reports.reduce((acc, r) => {
      const k = r.zone_name || 'Sin zona';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [reports]);

  // 7. Mapa de calor: día de semana × bloque de hora (conteo)
  const heatData = useMemo(() => {
    // matrix[day][hblock] = count
    const matrix = Array.from({ length: 7 }, () => Array(8).fill(0));
    reports.forEach((r) => {
      if (!r.created_at) return;
      const d = new Date(r.created_at);
      const day  = d.getDay();
      const hb   = Math.floor(d.getHours() / 3);
      matrix[day][hb]++;
    });
    // flatten for rendering
    return matrix.map((row, dayIdx) =>
      row.map((count, hbIdx) => ({ day: DAYS[dayIdx], hour: HBLOCKS[hbIdx], count }))
    ).flat();
  }, [reports]);

  const maxHeat = Math.max(...heatData.map((c) => c.count), 1);

  // ── Pagination ───────────────────────────────────────────────────────────────
  const predPag   = usePagination(rankedPredictions, 5);
  const reportPag = usePagination(reports, 10);

  if (loading) return <LoadingState message="Cargando análisis predictivo..." />;

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight my-0">
            Dashboard de Análisis Predictivo PI24
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Estadísticas consolidadas, índices de riesgo e historial de reportes ciudadanos.
            {lastUpdate && ` · Última actualización: ${formatDate(lastUpdate)}`}
          </p>
        </div>
        <div className="flex items-center gap-3 self-start">
          {/* Riesgo general badge prominente */}
          {totalPredictions > 0 && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${globalRisk.bg} ${globalRisk.border} ${globalRisk.color}`}>
              <Flame className="h-3.5 w-3.5" />
              Riesgo General: {globalRisk.label}
            </div>
          )}
          <button onClick={handleRefresh}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs transition-colors whitespace-nowrap">
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            Actualizar
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl text-red-700 text-sm">{errorMsg}</div>
      )}

      {/* ── KPI row 1 — Indicadores principales ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Incidentes Hoy"
          value={incidentesToday}
          description={`Total reportes del día · ${todayStr}`}
          icon={Sun}
          trendIsPositive={incidentesToday === 0}
        />
        <StatCard
          title="Reportes Verificados"
          value={reportesVerificados}
          description={`${totalReports > 0 ? Math.round((reportesVerificados / totalReports) * 100) : 0}% del total con identidad confirmada`}
          icon={ShieldCheck}
          trendIsPositive={true}
        />
        <StatCard
          title="Zona Mayor Riesgo"
          value={highestRiskPred ? highestRiskPred.zone_name : 'N/A'}
          description={highestRiskPred ? `Score ${highestRiskPred.score}/100 · ${translateIncidentType(highestRiskPred.incident_type)}` : 'Sin predicciones'}
          icon={Award}
          trendIsPositive={false}
        />
        <StatCard
          title="T. Promedio Respuesta ML"
          value={avgResponseMinutes != null ? `${avgResponseMinutes} min` : 'N/A'}
          description="Tiempo entre reporte y predicción calculada"
          icon={Clock}
          trendIsPositive={avgResponseMinutes != null && avgResponseMinutes < 5}
        />
      </div>

      {/* ── KPI row 2 — Predicciones + reportes ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Predicciones Activas"
          value={totalPredictions}
          description="Cálculos ML activos en base de datos"
          icon={Database}
        />
        <StatCard
          title="Promedio Score"
          value={totalPredictions > 0 ? `${averageScore} / 100` : 'N/A'}
          description={totalPredictions > 0 ? `Rango: ${averageScore >= 70 ? 'Alto' : averageScore >= 40 ? 'Medio' : 'Bajo'}` : 'Sin datos'}
          icon={TrendingUp}
          trendIsPositive={averageScore < 50}
        />
        <StatCard
          title="Total Reportes"
          value={totalReports}
          description="Histórico de reportes ciudadanos"
          icon={FileText}
        />
        <StatCard
          title="Severidad Alta"
          value={highSeverityReports}
          description={`${totalReports > 0 ? Math.round((highSeverityReports / totalReports) * 100) : 0}% del total de reportes`}
          icon={AlertTriangle}
          trendIsPositive={false}
        />
      </div>

      {/* ── Charts row 1: score zonas + tendencia semanal ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        <ChartCard icon={BarChart3} title="Score de Riesgo por Zona" subtitle="Top 8 · índice predictivo ML" className="lg:col-span-3">
          {zoneBarData.length === 0 ? <NoData /> : (
            <>
              <div className="h-60 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={zoneBarData} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={46} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} content={({ active, payload }) => active && payload?.length ? (
                      <ChartTooltip>
                        <p className="font-extrabold">{payload[0].payload.name}</p>
                        <p className="text-slate-300">Incidente: {payload[0].payload.type}</p>
                        <p>Score: <span className="text-blue-400 font-extrabold">{payload[0].payload.score}</span></p>
                      </ChartTooltip>
                    ) : null} />
                    <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={28}>
                      {zoneBarData.map((entry, i) => <PieCell key={i} fill={scoreColor(entry.score)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-50 flex-wrap">
                {[['#10b981','Bajo (0–39)'],['#f59e0b','Medio (40–69)'],['#ef4444','Alto (70–100)']].map(([color, label]) => (
                  <div key={label} className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                    <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    {label}
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartCard>

        <ChartCard icon={Activity} title="Tendencia Semanal" subtitle="Reportes por día · últimos 14 días" className="lg:col-span-2">
          {reports.length === 0 ? <NoData /> : (
            <div className="h-60 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 4, right: 12, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
                  <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                    <ChartTooltip>
                      <p className="font-bold text-slate-300">{label}</p>
                      <p>Reportes: <span className="text-blue-400 font-extrabold">{payload[0].value}</span></p>
                    </ChartTooltip>
                  ) : null} />
                  <Line type="monotone" dataKey="reportes" stroke="#3b82f6" strokeWidth={2.5}
                    dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#2563eb' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── Charts row 2: tipo + hora ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <ChartCard icon={BarChart3} title="Reportes por Tipo de Incidente" subtitle="Distribución de categorías reportadas">
          {typeBarData.length === 0 ? <NoData /> : (
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeBarData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} width={82} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} content={({ active, payload }) => active && payload?.length ? (
                    <ChartTooltip>
                      <p className="font-bold">{payload[0].payload.name}</p>
                      <p className="text-blue-400 font-extrabold">{payload[0].value} reportes</p>
                    </ChartTooltip>
                  ) : null} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard icon={Clock} title="Reportes por Hora del Día" subtitle="Bloques de 2 horas · actividad temporal">
          {reports.length === 0 ? <NoData /> : (
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourData} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} content={({ active, payload }) => active && payload?.length ? (
                    <ChartTooltip>
                      <p className="font-bold">{payload[0].payload.label}</p>
                      <p className="text-blue-400 font-extrabold">{payload[0].value} reportes</p>
                    </ChartTooltip>
                  ) : null} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={22}>
                    {hourData.map((_, i) => (
                      <PieCell key={i} fill={HOUR_COLORS[Math.min(i, HOUR_COLORS.length - 1)]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── Charts row 3: zona (conteo) + severidad pie ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <ChartCard icon={MapPin} title="Reportes por Zona" subtitle="Concentración de incidentes por área">
          {zoneReportCounts.length === 0 ? <NoData /> : (
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zoneReportCounts} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} content={({ active, payload }) => active && payload?.length ? (
                    <ChartTooltip>
                      <p className="font-bold">{payload[0].payload.name}</p>
                      <p className="text-blue-400 font-extrabold">{payload[0].value} reportes</p>
                    </ChartTooltip>
                  ) : null} />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard icon={PieIcon} title="Distribución por Severidad" subtitle="Proporción de reportes por nivel">
          {pieData.length === 0 ? <NoData /> : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="h-52 w-full sm:w-1/2 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, i) => <PieCell key={i} fill={entry.color} stroke="none" />)}
                    </Pie>
                    <Tooltip content={({ active, payload }) => active && payload?.length ? (
                      <ChartTooltip>
                        <p className="font-bold">{payload[0].name}</p>
                        <p className="text-blue-400 font-extrabold">{payload[0].value} reportes</p>
                      </ChartTooltip>
                    ) : null} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-3 w-full sm:w-auto">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between sm:justify-start gap-3">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: entry.color }} />
                      <span className="text-sm font-semibold text-slate-700">{entry.name}</span>
                    </div>
                    <span className="text-sm font-extrabold text-slate-800 sm:ml-2">{entry.value}</span>
                    <span className="text-xs text-slate-400 font-medium">
                      ({totalReports > 0 ? Math.round((entry.value / totalReports) * 100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── Mapa de calor: día × hora ──────────────────────────────────────────── */}
      <ChartCard icon={Flame} title="Mapa de Calor de Actividad" subtitle="Concentración de reportes por día de semana y bloque horario">
        {reports.length === 0 ? <NoData /> : (
          <div className="overflow-x-auto">
            <div className="min-w-[480px]">
              {/* Header — horas */}
              <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: '48px repeat(8, 1fr)' }}>
                <div />
                {HBLOCKS.map((h) => (
                  <div key={h} className="text-center text-[10px] text-slate-400 font-semibold">{h}h</div>
                ))}
              </div>
              {/* Rows — días */}
              {DAYS.map((day) => (
                <div key={day} className="grid gap-1 mb-1" style={{ gridTemplateColumns: '48px repeat(8, 1fr)' }}>
                  <div className="flex items-center justify-end pr-2 text-[11px] text-slate-500 font-semibold">{day}</div>
                  {HBLOCKS.map((hour) => {
                    const cell = heatData.find((c) => c.day === day && c.hour === hour);
                    const count = cell?.count || 0;
                    const intensity = count / maxHeat;
                    // Color from slate-100 → blue-700
                    const alpha = 0.08 + intensity * 0.92;
                    const bg = count === 0
                      ? '#f8fafc'
                      : `rgba(37, 99, 235, ${alpha.toFixed(2)})`;
                    const textColor = intensity > 0.5 ? '#fff' : '#475569';
                    return (
                      <div
                        key={hour}
                        title={`${day} ${hour}h — ${count} reporte${count !== 1 ? 's' : ''}`}
                        className="rounded-lg h-8 flex items-center justify-center text-[10px] font-bold transition-colors cursor-default"
                        style={{ background: bg, color: textColor }}
                      >
                        {count > 0 ? count : ''}
                      </div>
                    );
                  })}
                </div>
              ))}
              {/* Legend */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50">
                <span className="text-[10px] text-slate-400 font-medium">Menos</span>
                {[0.08, 0.25, 0.45, 0.65, 0.85, 1.0].map((a) => (
                  <div key={a} className="h-4 w-6 rounded" style={{ background: `rgba(37, 99, 235, ${a})` }} />
                ))}
                <span className="text-[10px] text-slate-400 font-medium">Más</span>
              </div>
            </div>
          </div>
        )}
      </ChartCard>

      {/* ── Predictions ranking table ─────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="pb-4 border-b border-slate-100 mb-4">
          <h3 className="text-base font-bold text-slate-800 my-0">Ranking de Riesgo PI24</h3>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            {totalPredictions} predicción{totalPredictions !== 1 ? 'es' : ''} · ordenadas por score descendente
          </p>
        </div>
        {predictions.length === 0 ? (
          <EmptyState title="Sin datos predictivos" description="Aún no hay predicciones calculadas. Registre un reporte para disparar el motor de predicción."
            actionButton={<RefreshButton onClick={handleRefresh} />} />
        ) : (
          <>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-left text-sm border-collapse min-w-[580px]">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Zona</th>
                    <th className="py-3 px-4">Tipo Predicho</th>
                    <th className="py-3 px-4 text-center">Score</th>
                    <th className="py-3 px-4">Nivel</th>
                    <th className="py-3 px-4 hidden lg:table-cell">Prob. 24h</th>
                    <th className="py-3 px-4 hidden xl:table-cell">Generado</th>
                  </tr>
                </thead>
                <tbody>
                  {predPag.paged.map((pred, i) => (
                    <tr key={pred.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 text-slate-400 font-bold text-xs">{(predPag.page - 1) * predPag.pageSize + i + 1}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{pred.zone_name}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{translateIncidentType(pred.incident_type)}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">{pred.score}</td>
                      <td className="py-3.5 px-4"><RiskBadge score={pred.score} /></td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-xs hidden lg:table-cell">
                        {pred.probability_24h != null ? `${(pred.probability_24h * 100).toFixed(1)}%` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs font-mono hidden xl:table-cell">{formatDate(pred.generated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={predPag.page} totalPages={predPag.totalPages} total={rankedPredictions.length}
              pageSize={predPag.pageSize} setPage={predPag.setPage} setPageSize={predPag.setPageSize} label="predicciones" />
          </>
        )}
      </div>

      {/* ── Reports table ─────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="pb-4 border-b border-slate-100 mb-4">
          <h3 className="text-base font-bold text-slate-800 my-0 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Reportes Ciudadanos
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            {totalReports} reporte{totalReports !== 1 ? 's' : ''} · más recientes primero
          </p>
        </div>
        {reports.length === 0 ? (
          <EmptyState title="Sin reportes registrados" description="Aún no hay reportes ciudadanos en la base de datos."
            actionButton={<RefreshButton onClick={handleRefresh} />} />
        ) : (
          <>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-left text-sm border-collapse min-w-[760px]">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Zona</th>
                    <th className="py-3 px-4">Severidad</th>
                    <th className="py-3 px-4 hidden md:table-cell">Iluminación</th>
                    <th className="py-3 px-4 hidden md:table-cell">Flujo Personas</th>
                    <th className="py-3 px-4 hidden lg:table-cell">Descripción</th>
                    <th className="py-3 px-4">Autor</th>
                    <th className="py-3 px-4 hidden xl:table-cell">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {reportPag.paged.map((report) => (
                    <tr key={report.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{translateIncidentType(report.type)}</td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          {report.zone_name || '—'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4"><SeverityBadge severity={report.severity} /></td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs hidden md:table-cell">{translateLighting(report.lighting)}</td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs hidden md:table-cell">{translatePeopleFlow(report.people_flow)}</td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs hidden lg:table-cell max-w-[200px]">
                        <span className="line-clamp-2 leading-snug">{report.description || '—'}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {report.is_anonymous
                          ? <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium"><EyeOff className="h-3 w-3" /> Anónimo</span>
                          : <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium"><User className="h-3 w-3 text-blue-400" /> Registrado</span>}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs font-mono hidden xl:table-cell">{formatDate(report.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={reportPag.page} totalPages={reportPag.totalPages} total={reports.length}
              pageSize={reportPag.pageSize} setPage={reportPag.setPage} setPageSize={reportPag.setPageSize} label="reportes" />
          </>
        )}
      </div>

    </div>
  );
};

// ── Small helpers ──────────────────────────────────────────────────────────────
const NoData = () => (
  <div className="h-52 flex items-center justify-center text-slate-400 text-sm font-medium">
    Sin datos suficientes
  </div>
);

const RefreshButton = ({ onClick }) => (
  <button onClick={onClick}
    className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer transition-colors">
    Reintentar
  </button>
);

export default Dashboard;
