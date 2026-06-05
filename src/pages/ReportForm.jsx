import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { createReport } from '../services/reportsService';
import { ZONES, getCoordinatesForZone } from '../data/zones';
import { 
  Send, 
  ShieldAlert, 
  Info, 
  MapPin, 
  Loader2,
  CheckCircle2,
  Plus
} from 'lucide-react';

const ReportForm = () => {
  const { user } = useAuth();
  
  // Form state
  const [type, setType] = useState('robo');
  const [severity, setSeverity] = useState('media');
  const [zoneName, setZoneName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [lighting, setLighting] = useState('media');
  const [peopleFlow, setPeopleFlow] = useState('medio');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Status state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedReport, setSubmittedReport] = useState(null);

  // Autocomplete coordinates on zone change
  const handleZoneChange = (e) => {
    const selectedZone = e.target.value;
    setZoneName(selectedZone);
    
    if (selectedZone) {
      const coords = getCoordinatesForZone(selectedZone);
      setLat(coords.lat !== null ? String(coords.lat) : '');
      setLng(coords.lng !== null ? String(coords.lng) : '');
    } else {
      setLat('');
      setLng('');
    }
  };

  const handleReset = () => {
    setType('robo');
    setSeverity('media');
    setZoneName('');
    setLat('');
    setLng('');
    setLighting('media');
    setPeopleFlow('medio');
    setDescription('');
    setIsAnonymous(false);
    setErrorMsg('');
    setIsSuccess(false);
    setSubmittedReport(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!zoneName || !lat || !lng || !description) {
      setErrorMsg('Por favor, rellene todos los campos obligatorios del reporte.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        type,
        severity,
        zone_name: zoneName,
        lat: Number(lat),
        lng: Number(lng),
        lighting,
        people_flow: peopleFlow,
        description,
        is_anonymous: isAnonymous,
        user_id: user ? user.id : null
      };

      const result = await createReport(payload);
      setSubmittedReport(result);
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Ocurrió un error al registrar el reporte en la base de datos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Form Card */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs">
          
          {isSuccess ? (
            <div className="text-center py-10 space-y-6">
              <div className="inline-flex p-4 bg-emerald-50 text-emerald-600 rounded-full">
                <CheckCircle2 className="h-16 w-16" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-2xl font-extrabold text-slate-800">
                  ¡Reporte Registrado!
                </h3>
                <p className="text-sm text-slate-500 font-medium">
                  El incidente en **{submittedReport?.zone_name}** ha sido guardado exitosamente en Supabase PostgreSQL.
                </p>
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mt-4 text-left flex gap-3 text-blue-800 text-xs">
                  <Info className="h-5 w-5 flex-shrink-0 text-blue-600" />
                  <p className="leading-relaxed font-medium">
                    <strong>Integración Webhook ML:</strong> La predicción de riesgo PI24 se generará automáticamente por el motor ML de FastAPI en unos segundos y actualizará el mapa y dashboard.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex justify-center gap-4">
                <button
                  onClick={handleReset}
                  className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl px-5 py-3 font-semibold text-sm flex items-center gap-2 cursor-pointer transition-all duration-200 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Registrar otro incidente
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-1">
                  Registrar Incidente
                </h2>
                <p className="text-sm text-slate-500 font-medium">
                  Complete los detalles del incidente observado para alimentar el sistema predictivo.
                </p>
              </div>

              {/* Error messages */}
              {errorMsg && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-start gap-3 text-red-700 text-sm">
                  <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Error al guardar reporte</p>
                    <p className="opacity-90">{errorMsg}</p>
                  </div>
                </div>
              )}

              {/* Form grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Incident Type */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Tipo de incidente <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="robo">Robo</option>
                    <option value="accidente">Accidente</option>
                    <option value="zona_oscura">Zona oscura</option>
                    <option value="emergencia">Emergencia</option>
                  </select>
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Severidad <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>

                {/* Zone Selection */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Zona Urbana <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={zoneName}
                    onChange={handleZoneChange}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Seleccione una zona...</option>
                    {ZONES.map((z) => (
                      <option key={z.name} value={z.name}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lighting status */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Nivel de Iluminación <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={lighting}
                    onChange={(e) => setLighting(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="baja">Mala / Oscuro</option>
                    <option value="media">Regular</option>
                    <option value="alta">Buena</option>
                  </select>
                </div>

                {/* Coordinates (Autocompleted, disabled) */}
                <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
                      Latitud (Autocompletado)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <MapPin className="h-3.5 w-3.5" />
                      </div>
                      <input
                        type="text"
                        disabled
                        value={lat}
                        placeholder="--"
                        className="w-full rounded-lg border border-slate-200 bg-slate-100/60 pl-8 pr-3 py-2 text-xs text-slate-600 font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
                      Longitud (Autocompletado)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <MapPin className="h-3.5 w-3.5" />
                      </div>
                      <input
                        type="text"
                        disabled
                        value={lng}
                        placeholder="--"
                        className="w-full rounded-lg border border-slate-200 bg-slate-100/60 pl-8 pr-3 py-2 text-xs text-slate-600 font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* People Flow */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Flujo de Personas <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={peopleFlow}
                    onChange={(e) => setPeopleFlow(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="bajo">Bajo</option>
                    <option value="medio">Medio</option>
                    <option value="alto">Alto</option>
                  </select>
                </div>

                {/* Anonymous switch */}
                <div className="flex items-center gap-3 pt-2 md:pt-8">
                  <input
                    id="isAnonymous"
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="h-5 w-5 text-blue-600 border-slate-300 rounded-lg focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="isAnonymous" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                    Reportar de forma anónima
                  </label>
                </div>

              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Descripción del incidente <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalle lo observado (ej: robo a transeúnte con intimidación en la esquina, iluminación rota, etc.)..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                ></textarea>
              </div>

              {/* Submit button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 rounded-xl px-4 py-3 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all duration-200"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      <span>Guardando reporte...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4.5 w-4.5" />
                      <span>Enviar Reporte</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>

      {/* Info Explainer Sidebar Card */}
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
          <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            ¿Qué pasa después?
          </h3>
          
          <div className="relative border-l-2 border-slate-100 pl-6 ml-3 space-y-6">
            
            {/* Step 1 */}
            <div className="relative">
              <span className="absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700 ring-4 ring-white">
                1
              </span>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Guardado de datos
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                El reporte se almacena de inmediato en Supabase PostgreSQL.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <span className="absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700 ring-4 ring-white">
                2
              </span>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Disparador Webhook
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Supabase Database Webhook llama al backend ML en FastAPI.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <span className="absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700 ring-4 ring-white">
                3
              </span>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Predicción PI24
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                El modelo ML calcula el score de riesgo para las siguientes 24 horas y lo guarda en <code className="text-[10px]">risk_predictions</code>.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <span className="absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700 ring-4 ring-white">
                4
              </span>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Actualización en Vivo
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                El mapa, dashboard y alertas de todos los usuarios se refrescan al instante vía Realtime.
              </p>
            </div>

          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[11px] text-slate-500 leading-relaxed font-medium">
            “La predicción PI24 estima la probabilidad de ocurrencia de incidentes en las próximas 24 horas por zona y tipo de incidente.”
          </div>

        </div>
      </div>

    </div>
  );
};

export default ReportForm;
