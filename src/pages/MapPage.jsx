import { useState, useEffect } from 'react';
import { getRiskPredictions, subscribeToRiskPredictions } from '../services/predictionsService';
import { translateIncidentType, formatDate } from '../utils/formatters';
import { getRiskDetails } from '../utils/risk';
import { ZONES } from '../data/zones';
import RiskBadge from '../components/ui/RiskBadge';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import { 
  Filter, 
  Map as MapIcon, 
  Layers, 
  Info,
  RefreshCw
} from 'lucide-react';

const MapPage = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Filters state
  const [selectedType, setSelectedType] = useState('todos');
  const [selectedRisk, setSelectedRisk] = useState('todos');
  
  // Selected zone marker state
  const [selectedPin, setSelectedPin] = useState(null);

  const fetchData = async () => {
    try {
      const data = await getRiskPredictions();
      setPredictions(data);
      setErrorMsg('');
      
      // Auto select first prediction pin if available
      if (data.length > 0) {
        setSelectedPin(data[0]);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('No se pudieron cargar las predicciones de riesgo.');
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
    const unsubscribe = subscribeToRiskPredictions((payload) => {
      console.log('Realtime prediction update:', payload);
      fetchData(); // Reload predictions
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Filtered Predictions
  const filteredPredictions = predictions.filter((pred) => {
    const typeMatch = selectedType === 'todos' || pred.incident_type === selectedType;
    
    let riskMatch = true;
    if (selectedRisk !== 'todos') {
      const riskDetails = getRiskDetails(pred.score);
      riskMatch = riskDetails.level === selectedRisk;
    }
    
    return typeMatch && riskMatch;
  });

  // Geographical coordinate calculation to map coordinates (x, y %)
  // Bounding box for Lima sample zones
  // Lat: -12.0700 to -12.0400
  // Lng: -77.0500 to -77.0288
  const getMapCoordinates = (lat, lng) => {
    const minLat = -12.0720;
    const maxLat = -12.0380;
    const minLng = -77.0520;
    const maxLng = -77.0260;

    // Convert coordinates to percentages for map viewport
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100; // Invert latitude for Y axis

    return { 
      x: Math.max(5, Math.min(95, x)), 
      y: Math.max(5, Math.min(95, y)) 
    };
  };

  if (loading) {
    return <LoadingState message="Cargando mapa en tiempo real..." />;
  }

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight my-0">
            Mapa de Predicción de Riesgo
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Visualización geoespacial interactiva de scores de riesgo PI24 recalculados en tiempo real.
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

      {/* Main Map + Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Control Panel / Filters */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Filters Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2 uppercase tracking-wider">
              <Filter className="h-4 w-4 text-blue-600" />
              Filtros
            </h3>
            
            {/* Filter by Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Tipo de Incidente
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 font-semibold focus:border-blue-500 focus:outline-none"
              >
                <option value="todos">Todos los tipos</option>
                <option value="robo">Robo</option>
                <option value="accidente">Accidente</option>
                <option value="zona_oscura">Zona Oscura</option>
                <option value="emergencia">Emergencia</option>
              </select>
            </div>

            {/* Filter by Risk Level */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Nivel de Riesgo
              </label>
              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 font-semibold focus:border-blue-500 focus:outline-none"
              >
                <option value="todos">Todos los niveles</option>
                <option value="bajo">Riesgo Bajo (0-39)</option>
                <option value="medio">Riesgo Medio (40-69)</option>
                <option value="alto">Riesgo Alto (70-100)</option>
              </select>
            </div>
          </div>

          {/* Map Legends Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2 uppercase tracking-wider">
              <Layers className="h-4 w-4 text-blue-600" />
              Leyenda
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-medium text-slate-600">
                  <span className="h-3 w-3 bg-red-500 border-2 border-white rounded-full shadow-xs"></span>
                  Riesgo Alto (PI24)
                </span>
                <span className="font-mono text-slate-400 font-bold">70 - 100</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-medium text-slate-600">
                  <span className="h-3 w-3 bg-amber-500 border-2 border-white rounded-full shadow-xs"></span>
                  Riesgo Medio (PI24)
                </span>
                <span className="font-mono text-slate-400 font-bold">40 - 69</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-medium text-slate-600">
                  <span className="h-3 w-3 bg-emerald-500 border-2 border-white rounded-full shadow-xs"></span>
                  Riesgo Bajo (PI24)
                </span>
                <span className="font-mono text-slate-400 font-bold">0 - 39</span>
              </div>
            </div>
          </div>
          
        </div>

        {/* Center / Right Map Area */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl aspect-video relative overflow-hidden flex flex-col justify-between group min-h-[450px]">
            
            {/* Map Grid Blueprint overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px] opacity-30"></div>
            
            {/* Map Info Bar */}
            <div className="relative z-20 flex justify-between items-center bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2 text-[10px] font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <MapIcon className="h-3.5 w-3.5 text-blue-500" />
                <span>MAP_GRID: LIMA_METRO</span>
              </div>
              <span>COORDS: WGS-84</span>
            </div>

            {/* Simulated Geographic Pins container */}
            <div className="absolute inset-0 z-10 p-12">
              {filteredPredictions.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400">
                  <EmptyState 
                    title="Sin marcadores" 
                    description="No hay predicciones que coincidan con los filtros seleccionados." 
                  />
                </div>
              ) : (
                filteredPredictions.map((pred) => {
                  const zCoord = ZONES.find(z => z.name === pred.zone_name) || { lat: -12.0464, lng: -77.0428 };
                  const mapPos = getMapCoordinates(zCoord.lat, zCoord.lng);
                  const isSelected = selectedPin?.id === pred.id;
                  
                  const rDetails = getRiskDetails(pred.score);
                  let colorClass = 'bg-emerald-500';
                  if (rDetails.level === 'medio') colorClass = 'bg-amber-500';
                  if (rDetails.level === 'alto') colorClass = 'bg-red-500';

                  return (
                    <button
                      key={pred.id}
                      onClick={() => setSelectedPin(pred)}
                      style={{ left: `${mapPos.x}%`, top: `${mapPos.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group/pin focus:outline-none cursor-pointer"
                    >
                      {/* Tooltip on hover */}
                      <span className="absolute bottom-full mb-2 bg-slate-950 text-white text-[10px] font-semibold px-2 py-1 rounded-lg shadow-lg opacity-0 group-hover/pin:opacity-100 pointer-events-none transition-opacity duration-150 whitespace-nowrap z-30">
                        {pred.zone_name} ({pred.score})
                      </span>

                      {/* Ripple/Sonar ring for high risk */}
                      {rDetails.level === 'alto' && (
                        <span className="absolute inline-flex h-6 w-6 rounded-full bg-red-400 opacity-75 animate-ping"></span>
                      )}

                      {/* Pin point */}
                      <span className={`h-4.5 w-4.5 rounded-full border-2 border-white shadow-md transition-all duration-200 ${colorClass} ${
                        isSelected ? 'scale-130 ring-4 ring-blue-500/50' : 'group-hover/pin:scale-120'
                      }`}></span>

                      {/* Small label snippet */}
                      <span className="text-[9px] text-slate-400 font-bold mt-1 bg-slate-950/80 px-1 rounded-xs backdrop-blur-xs font-mono">
                        {pred.zone_name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Bottom status and Map Switch placeholders */}
            <div className="relative z-20 flex justify-between items-end">
              <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl p-3 text-[10px] text-slate-400 space-y-1 max-w-xs font-mono">
                <p className="font-bold text-slate-200">INTEGRACIÓN DE MAPA</p>
                <p>Estructura Leaflet v1.9 + React-Leaflet v5.0 lista en dependencias.</p>
              </div>

              {/* Map Scale */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1 text-[9px] text-slate-500 font-mono">
                500 m
              </div>
            </div>

          </div>

          {/* Selected Pin Details Panel (Dynamic) */}
          {selectedPin && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fade-in">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-extrabold text-slate-800 my-0">
                    {selectedPin.zone_name}
                  </h3>
                  <RiskBadge score={selectedPin.score} />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-6 text-xs text-slate-500 font-medium">
                  <p>
                    Tipo predicho:{' '}
                    <strong className="text-slate-700">
                      {translateIncidentType(selectedPin.incident_type)}
                    </strong>
                  </p>
                  <p>
                    Score Predictivo:{' '}
                    <strong className="text-slate-700">{selectedPin.score} / 100</strong>
                  </p>
                  <p className="col-span-2 md:col-span-1">
                    Cálculo:{' '}
                    <span className="font-mono text-slate-400 text-[10px]">
                      {formatDate(selectedPin.generated_at)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-blue-600 bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs font-semibold leading-relaxed max-w-sm">
                <Info className="h-4.5 w-4.5 flex-shrink-0 text-blue-600" />
                <p className="m-0 font-medium">
                  La tasa estimada en esta zona representa la concentración de incidentes, iluminación y afluencia reciente.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default MapPage;
