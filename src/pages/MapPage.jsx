import { useState, useEffect } from 'react';
import { subscribeToRiskPredictions } from '../services/predictionsService';
import { getRiskRanking, getZones as getZonesApi } from '../services/civiriskApi';
import { getReportsByIds, getRecentReports } from '../services/reportsService';
import { translateIncidentType, translateSeverity, translateLighting, translatePeopleFlow, formatDate } from '../utils/formatters';
import { getRiskDetails } from '../utils/risk';
import { ZONES } from '../data/zones';
import { MapContainer, TileLayer, Marker, Popup, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import RiskBadge from '../components/ui/RiskBadge';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import HeatmapLayer from '../components/ui/HeatmapLayer';
import { 
  Filter, 
  Layers, 
  RefreshCw,
  MapPin,
  Clock,
  Lightbulb,
  Users,
  MessageCircle,
  ShieldAlert,
  Maximize2,
  X
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Legend tab state: 'predicciones' | 'reportes' | 'capas'
  const [legendTab, setLegendTab] = useState('predicciones');

  // Zones from backend (fallback to local ZONES)
  const [zones, setZones] = useState([]);
  const [reportsById, setReportsById] = useState({});
  const [standaloneReports, setStandaloneReports] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [data, zonesApi] = await Promise.all([
        getRiskRanking(200),
        (async () => {
          try {
            return await getZonesApi();
          } catch {
            return [];
          }
        })()
      ]);

      const normalizedPredictions = Array.isArray(data) ? data : [];
      const reportIds = Array.from(
        new Set(
          normalizedPredictions
            .map((prediction) => prediction.last_report_id)
            .filter(Boolean)
        )
      );

      let reportRecords = [];
      if (reportIds.length > 0) {
        try {
          reportRecords = await getReportsByIds(reportIds);
        } catch (reportErr) {
          console.warn('No se pudieron cargar los datos de reportes asociados:', reportErr);
        }
      }

      const reportsMap = reportRecords.reduce((acc, report) => {
        if (report?.id) acc[report.id] = report;
        return acc;
      }, {});

      // Load all recent reports to find standalone ones (not in predictions)
      let allReports = [];
      try {
        allReports = await getRecentReports(100);
      } catch (err) {
        console.warn('No se pudieron cargar los reportes recientes:', err);
      }

      // Filter out reports that already have a prediction
      const predictionReportIds = new Set(normalizedPredictions.map(p => p.last_report_id).filter(Boolean));
      const standalone = allReports.filter(report => !predictionReportIds.has(report.id));

      setPredictions(normalizedPredictions);
      setZones(zonesApi || []);
      setReportsById(reportsMap);
      setStandaloneReports(standalone);
      setErrorMsg('');

      if (normalizedPredictions.length > 0) setSelectedPin(normalizedPredictions[0]);
      else if (standalone.length > 0) setSelectedPin(standalone[0]);
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

  const getLatLngForPred = (pred) => {
    const report = pred.last_report_id ? reportsById[pred.last_report_id] : null;
    if (report?.lat && report?.lng) return [Number(report.lat), Number(report.lng)];
    if (pred.lat && pred.lng) return [Number(pred.lat), Number(pred.lng)];
    const z = zones.find(z => z.name === pred.zone_name) || ZONES.find(z => z.name === pred.zone_name);
    if (z) return [z.lat || z.center_lat || -12.0464, z.lng || z.center_lng || -77.0428];
    return [-12.0464, -77.0428];
  };

  const getIncidentTimeEmoji = (generatedAt) => {
    const date = new Date(generatedAt);
    if (Number.isNaN(date.getTime())) return '⏰';
    const hour = date.getHours();
    if (hour >= 6 && hour < 12) return '🌅';
    if (hour >= 12 && hour < 18) return '🌤️';
    if (hour >= 18 && hour < 22) return '🌙';
    return '🌃';
  };

  const getIncidentTypeIconSvg = (incidentType, color = '#28282aff', size = 20) => {
    const type = String(incidentType || 'default').toLowerCase();
    const icons = {
      robo: `<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" id="_x32_" width="${size}" height="${size}" fill="${color}" viewBox="0 0 512 512"><path d="M454.25 131.406c-16.344-38.641-43.609-71.453-77.938-94.656C342 13.563 300.5 0 256 0c-29.656 0-58 6.016-83.75 16.906-38.641 16.344-71.453 43.609-94.656 77.938-23.188 34.328-36.75 75.813-36.75 120.313v81.688c0 29.656 6.016 58 16.906 83.75 16.344 38.641 43.609 71.453 77.938 94.656C170 498.438 211.5 512 256 512c29.656 0 58-6.031 83.75-16.906 38.641-16.344 71.469-43.609 94.656-77.938s36.75-75.813 36.75-120.313v-81.688c0-29.655-6.015-57.999-16.906-83.749m-15.781 165.438c0 25.25-5.094 49.203-14.328 71.031-13.828 32.719-36.984 60.609-66.125 80.281-29.141 19.688-64.172 31.156-102.016 31.156-25.25 0-49.203-5.094-71.031-14.328-32.719-13.828-60.609-37-80.281-66.125C85 369.719 73.531 334.688 73.531 296.844v-81.688c0-25.234 5.094-49.203 14.328-71.031 13.828-32.719 36.984-60.609 66.125-80.281C183.125 44.156 218.156 32.688 256 32.688c25.25 0 49.203 5.094 71.031 14.328 32.719 13.828 60.609 37 80.281 66.125 19.688 29.141 31.156 64.172 31.156 102.016z"/><path d="M313.875 321.406h-115.75a50.95 50.95 0 0 0-36.094 14.969 51 51 0 0 0-14.969 36.125 50.94 50.94 0 0 0 14.969 36.109 50.8 50.8 0 0 0 36.094 14.953h115.75a50.87 50.87 0 0 0 36.109-14.953 51 51 0 0 0 14.953-36.109 51.04 51.04 0 0 0-14.953-36.125 51 51 0 0 0-36.109-14.969m20.703 71.797c-5.328 5.328-12.594 8.578-20.703 8.578h-115.75c-8.109 0-15.375-3.25-20.688-8.578-5.328-5.328-8.594-12.594-8.594-20.703 0-8.125 3.266-15.375 8.594-20.719 5.313-5.313 12.578-8.563 20.688-8.578h115.75c8.109.016 15.375 3.266 20.703 8.578 5.313 5.344 8.578 12.594 8.578 20.719 0 8.109-3.265 15.375-8.578 20.703m-10.484-247.422H187.906c-40.094 0-72.625 32.516-72.625 72.625s32.531 72.625 72.625 72.625c31.219 0 47.219-30.969 68.094-30.969s36.875 30.969 68.094 30.969c40.109 0 72.625-32.516 72.625-72.625s-32.516-72.625-72.625-72.625"/><path d="M300.938 363.406h-89.875c-5 0-9.078 4.063-9.078 9.094 0 5 4.078 9.063 9.078 9.063h89.875c5.016 0 9.078-4.063 9.078-9.063 0-5.031-4.063-9.094-9.078-9.094"/></svg>`,
      accidente: `<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" id="Jankyard" width="${size}" height="${size}" fill="${color}" baseProfile="tiny" viewBox="0 0 256 256"><path id="_x37_" d="m161 145.2-35.4 9.9-24.4-20.4c-5.2-4.5-14-5.6-19.7-2.8l-51.2 25.5c-5.7 2.9-10 10.7-9.5 17.4l1.7 31.8-9.1 9.2c-4.4 4.5-5.8 11.9-3.4 16.5l8.6 17c2.4 4.6 8.2 6.7 13.6 3.9l6.7-3.3c-5.7-11.4-1-25.3 10.4-31s25.3-1 31 10.4l53.5-26.7c-5.7-11.4-1-25.3 10.4-31s25.3-1 31 10.4l4.2-2c4.9-2.5 7-8 4.6-12.6l-8.5-16.8c-3-4.4-9.2-6.9-14.5-5.4m-97.4 40.9-30.3 15-1.3-26.7c0-2.5 2.1-5.8 3.3-6.6l15.5-7.7zm10.2-5.3-13-25.8 25.7-12.6c1.3-.5 5.5-.3 7.3 1.2l20.4 17.3z"/><path id="_x35_" d="m126.3 88.4 2.3 2.9c6.8-7.7 18.8-8.4 26.4-1.4 7.7 6.8 8.4 18.8 1.4 26.4l36 32.7c6.8-7.7 18.8-8.4 26.4-1.4 7.7 6.8 8.4 18.8 1.4 26.4l4.6 4.1c3.7 3.1 8.7 2.9 11.6-.1l10.4-11.5c3-3.3 3.6-9.2 1-13.7l-4.9-9.4 8.4-24.6c1.8-5.1.1-12.2-3.7-15.6L212.8 72c-3.8-3.6-10.9-4.4-16-2.3l-23.6 10.6-1.6-31.9c-.1-1.3-1.2-2.3-2.5-2.2s-2.3 1.2-2.2 2.5l1.4 28.7-20.6-12.8c-3.9-2.4-9.1-1.6-12 1.4l-10.1 11.3c-2.9 3.1-2.8 8 .7 11.1m88.6 29.9 15.7-17.5 10.6 9.4c1 .8 1.7 4 1.2 5.8l-6.9 20.7zm-44.6-20L180.7 87l19.9-8.8c2-.9 5-.2 5.9.6l17.2 15.6-34.6 38.1-20.3-18.3c2.1-4.9 2.8-10.3 1.5-15.9"/><path id="_x34_" d="m11.8 89.9 9.3 16c2.5 4.4 8.3 6 12.7 3.5l1.6-.9 4.6 8.1c1.2 2.1 3.9 2.8 6.3 1.6l3.9-2.3c2.1-1.2 2.8-3.9 1.6-6.3l-4.6-8.1 49.8-29c4.4-2.5 6-8.3 3.5-12.7l-9.3-16c-1.9-3.2-5.8-5.1-9.5-4.4L61.2 17.9c-3.5-3.7-10-4.6-14.4-2.1L9.3 37.5C4.9 40 2.6 46.3 4 51.2l8.3 28.3c-2.3 3-2.8 7.2-.5 10.4M73 62.6c-1.9-3.2-.7-7.6 2.5-9.5s7.6-.7 9.5 2.5.7 7.6-2.5 9.5c-3.3 1.9-7.7.7-9.5-2.5M20.4 74.2 13 48.9c-.2-.9.5-2.5 1.2-3l37.5-21.8c.7-.5 2.5-.2 3 .5l18.3 19zm4.1 16.2c-1.9-3.2-.7-7.6 2.5-9.5s7.6-.7 9.5 2.5.7 7.6-2.5 9.5c-3.2 2.1-7.6.7-9.5-2.5"/><path id="_x32_" d="m144.5 47.2-26-29.1c-1.9-2.1-1.6-5.6.5-7.4l8.5-7.4c2.1-1.9 5.6-1.6 7.4.5l26 28.9c1.9 2.1 1.6 5.6-.5 7.4l-8.5 7.4c-2.1 2.1-5.3 1.8-7.4-.3"/><path id="_x31_" d="M141.8 222.2V242c0 6.6 14.3 11.9 31.8 11.9s31.8-5.3 31.8-11.9v-19.9c0-6.6-14.3-11.9-31.8-11.9-17.8 0-31.8 5.3-31.8 12m13.8 0c0-3.7 8.2-6.6 18-6.6 10.1 0 18 2.9 18 6.6s-8.2 6.6-18 6.6c-10.1 0-18-2.9-18-6.6"/></svg>`,
      zona_oscura: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" fill="${color}" viewBox="0 0 24 24"><path fill="#0f0f0f" d="m14.574 1.11-.791 1.583a.2.2 0 0 1-.09.09l-1.582.79a.2.2 0 0 0 0 .359l1.582.791a.2.2 0 0 1 .09.09l.79 1.582a.2.2 0 0 0 .359 0l.791-1.583a.2.2 0 0 1 .09-.089l1.582-.791a.2.2 0 0 0 0-.358l-1.583-.791a.2.2 0 0 1-.089-.09l-.791-1.582a.2.2 0 0 0-.358 0m4.668 3.961-.779 2.336a.2.2 0 0 1-.126.127L16 8.313a.2.2 0 0 0 0 .38l2.336.778a.2.2 0 0 1 .126.127l.779 2.336a.2.2 0 0 0 .38 0l.778-2.336a.2.2 0 0 1 .127-.127l2.335-.778a.2.2 0 0 0 0-.38l-2.335-.778a.2.2 0 0 1-.127-.127l-.779-2.336a.2.2 0 0 0-.38 0"/><path fill="#0f0f0f" fill-rule="evenodd" d="M10.408 13.664c2.827 2.827 7.244 3.072 10.256.706a8 8 0 0 0 .68-.603c.512-.512 1.562-.21 1.408.498a11 11 0 0 1-.357 1.261C20.898 19.814 16.789 23 12 23 5.925 23 1 18.075 1 12 1 7.133 4.29 2.983 8.669 1.543l.053-.018a11 11 0 0 1 1.073-.287c.743-.159 1.047.953.51 1.49a8 8 0 0 0-.513.566c-2.462 3.014-2.247 7.507.616 10.37m-1.415 1.414c2.732 2.732 6.68 3.552 10.094 2.391C17.428 19.602 14.85 21 12 21a9 9 0 0 1-9-9c0-2.908 1.457-5.528 3.66-7.182-1.244 3.453-.443 7.485 2.333 10.26" clip-rule="evenodd"/></svg>`,
      emergencia: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" fill="${color}" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M10 7.172V2h4v5.172l3.657-3.657 2.828 2.828L16.828 10H22v4h-5.172l3.657 3.657-2.828 2.828L14 16.828V22h-4v-5.172l-3.657 3.657-2.828-2.828L7.172 14H2v-4h5.172L3.515 6.343l2.828-2.828z"/></svg>`,
      default: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="${color}"><path d="M12 2C8 2 5 5 5 9c0 5.25 5 11 7 13 2-2 7-7.75 7-13 0-4-3-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>`
    };

    return icons[type] || icons.default;
  };

  const hexToRgb = (hex) => {
    const normalized = hex.replace('#','');
    const bigint = parseInt(normalized, 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  };

  const createIncidentIcon = (pred, count = 1, maxCount = 1, representativeScore = null) => {
    const scoreToUse = representativeScore !== null ? representativeScore : pred.score;
    const rDetails = getRiskDetails(scoreToUse);
    const baseHex = rDetails.level === 'alto' ? '#ef4444' : rDetails.level === 'medio' ? '#f59e0b' : '#10b981';
    const iconSvg = getIncidentTypeIconSvg(pred.incident_type || pred.type, '#28282aff', 20);

    // Normalize intensity from 0.15 .. 1.0 (few incidents -> low intensity)
    const intensity = Math.min(1, Math.max(0.01, count / Math.max(1, maxCount)));
    const alpha = 0.25 + intensity * 0.75; // ensures some visibility even for single
    const [r,g,b] = hexToRgb(baseHex);
    const bgColor = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    const glowColor = `rgba(${r}, ${g}, ${b}, ${Math.min(0.9, alpha)})`;

    // softness/blur based on inverse intensity (less incidents -> more blur)
    const blurPx = Math.round((1 - intensity) * 3); // 0..3px
    const glowSize = Math.round(6 + intensity * 18); // 6..24px

    return L.divIcon({
      html: `
        <div data-base="${baseHex}" data-level="${rDetails.level}" style="position:relative;display:flex;align-items:center;justify-content:center;width:40px;height:40px;font-size:18px;">
          <div style="position:absolute;inset:0;border-radius:50%;background:${bgColor};box-shadow:0 0 ${glowSize}px ${glowColor};filter:blur(${blurPx}px);"></div>
          <div style="position:relative;z-index:2;opacity:${0.85 + intensity * 0.15};">
            ${iconSvg}
          </div>
        </div>
      `,
      className: 'custom-incident-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -38]
    });
  };

  

  const clusterIconCreate = (cluster) => {
    const count = cluster.getChildCount();
    // Inspect children to aggregate a representative color (prefer highest severity)
    const children = cluster.getAllChildMarkers ? cluster.getAllChildMarkers() : [];
    let severityPriority = { alto: 3, medio: 2, bajo: 1 };
    let aggLevel = null;
    let baseHex = '#0f172a';
    for (const child of children) {
      try {
        const html = (child.getIcon && child.getIcon().options && child.getIcon().options.html) || '';
        const m = html.match(/data-level="(alto|medio|bajo)"/i);
        const h = html.match(/data-base="(#?[0-9a-fA-F]{6})"/);
        const level = m ? m[1].toLowerCase() : null;
        const hex = h ? h[1] : null;
        if (level) {
          if (!aggLevel || severityPriority[level] > severityPriority[aggLevel]) aggLevel = level;
        }
        if (hex) baseHex = hex;
      } catch (e) {
        // ignore
        console.warn('Error parsing child marker for cluster icon:', e);
      }
    }

    // choose color by aggLevel
    const aggHex = aggLevel === 'alto' ? '#ef4444' : aggLevel === 'medio' ? '#f59e0b' : '#10b981';
    const [r,g,b] = hexToRgb(aggHex || baseHex.replace('#',''));
    const bg = `rgba(${r}, ${g}, ${b}, 0.95)`;
    const ring = `rgba(${r}, ${g}, ${b}, 0.32)`;

    return L.divIcon({
      html: `
        <div style="display:flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:50%;background:${bg};border:2px solid rgba(255,255,255,0.9);color:#fff;font-weight:700;font-size:14px;box-shadow:0 0 0 8px ${ring};">
          ${count}
        </div>
      `,
      className: 'custom-cluster-icon',
      iconSize: [52, 52],
      iconAnchor: [26, 26]
    });
  };

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

  // Filtered Standalone Reports (no prediction)
  const filteredStandaloneReports = standaloneReports.filter((report) => {
    const typeMatch = selectedType === 'todos' || report.type === selectedType;
    return typeMatch;
  });

  const createStandaloneReportIcon = (report) => {
    const iconSvg = getIncidentTypeIconSvg(report.type || 'default', '#28282aff', 20);
    const severityColors = {
      baja: '#9ca3af',
      media: '#6366f1',
      alta: '#f43f5e'
    };
    const color = severityColors[report.severity] || '#6b7280';
    const [r, g, b] = hexToRgb(color);
    const bgColor = `rgba(${r}, ${g}, ${b}, 0.65)`;
    const glowColor = `rgba(${r}, ${g}, ${b}, 0.75)`;

    return L.divIcon({
      html: `
        <div data-base="${color}" data-level="reporte" style="position:relative;display:flex;align-items:center;justify-content:center;width:40px;height:40px;font-size:18px;">
          <div style="position:absolute;inset:0;border-radius:50%;background:${bgColor};box-shadow:0 0 12px ${glowColor};opacity:0.7;"></div>
          <div style="position:relative;z-index:2;opacity:0.95;">
            ${iconSvg}
          </div>
          <div style="position:absolute;inset:0;border-radius:50%;border:2px dashed rgba(255,255,255,0.6);"></div>
        </div>
      `,
      className: 'custom-report-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -38]
    });
  };

  // A prediction always has incident_type; a standalone report has 'type' instead
  const selectedIsPrediction = selectedPin && selectedPin.incident_type !== undefined;

  // Compute counts and representative max score per location so marker intensity and color are consistent
  const locationCounts = {};
  const locationMaxScore = {};
  filteredPredictions.forEach((pred) => {
    const report = pred.last_report_id ? reportsById[pred.last_report_id] : null;
    const key = report?.lat && report?.lng
      ? `${Number(report.lat).toFixed(4)}|${Number(report.lng).toFixed(4)}`
      : pred.lat && pred.lng
      ? `${Number(pred.lat).toFixed(4)}|${Number(pred.lng).toFixed(4)}`
      : (pred.zone_name || 'unknown');
    locationCounts[key] = (locationCounts[key] || 0) + 1;
    const score = Number(pred.score) || 0;
    locationMaxScore[key] = Math.max(locationMaxScore[key] || 0, score);
  });
  
  filteredStandaloneReports.forEach((report) => {
    if (report.lat && report.lng) {
      const key = `${Number(report.lat).toFixed(4)}|${Number(report.lng).toFixed(4)}`;
      locationCounts[key] = (locationCounts[key] || 0) + 1;
    }
  });
  const maxLocationCount = Object.values(locationCounts).length ? Math.max(...Object.values(locationCounts)) : 1;

  // Build heatmap points from filtered predictions + standalone reports
  // Format: [lat, lng, intensity 0..1]
  const heatmapPoints = [
    ...filteredPredictions.map((pred) => {
      const [lat, lng] = getLatLngForPred(pred);
      const intensity = Math.min(1, Math.max(0.05, (Number(pred.score) || 0) / 100));
      return [lat, lng, intensity];
    }),
    ...filteredStandaloneReports
      .filter((r) => r.lat && r.lng)
      .map((r) => {
        const severityWeight = r.severity === 'alta' ? 0.7 : r.severity === 'media' ? 0.45 : 0.25;
        return [Number(r.lat), Number(r.lng), severityWeight];
      }),
  ];

  // Render the complete detail structure for a selected pin
  const renderDetailsPanelContent = (pin) => {
    if (!pin) {
      return (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-10 text-center text-sm text-slate-500">
          <MapPin className="h-10 w-10 mx-auto mb-3 text-slate-200" />
          <p className="font-bold text-slate-600 mb-1 text-base">Ningún marcador seleccionado</p>
          <p className="text-slate-400">Haz clic en cualquier punto del mapa para ver la información completa del incidente o predicción.</p>
        </div>
      );
    }

    const isPrediction = pin.incident_type !== undefined;
    const report = pin.last_report_id ? reportsById[pin.last_report_id] : null;

    return (
      <>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-800 my-0">
              {pin.zone_name || 'Reporte ciudadano'}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {isPrediction
                ? 'Predicción de riesgo calculada por IA · Modelo PI24'
                : 'Reporte ciudadano pendiente de análisis predictivo.'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {pin.score !== undefined && <RiskBadge score={pin.score} />}
            {!isPrediction && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Sin predicción aún
              </span>
            )}
          </div>
        </div>

        {isPrediction ? (
          /* ── PREDICTION PANEL ── */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Left + Center */}
            <div className="lg:col-span-2 space-y-3">

              {/* ML Message banner */}
              {pin.message && (
                <div className="rounded-2xl bg-blue-50 border border-blue-100 px-4 py-2.5 flex items-start gap-3">
                  <ShieldAlert className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-800 font-medium leading-snug">{pin.message}</p>
                </div>
              )}

              {/* Core info grid */}
              <div className="grid grid-cols-2 gap-2.5 text-sm">

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-0.5">Zona</p>
                  <p className="font-semibold text-slate-800">{pin.zone_name || '—'}</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-0.5">Tipo de incidente</p>
                  <p className="font-semibold text-slate-800">{translateIncidentType(pin.incident_type)}</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-0.5">Severidad del reporte</p>
                  <p className="font-semibold text-slate-800">
                    {translateSeverity(report?.severity || pin.features_used?.severity)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Lightbulb className="h-3 w-3 text-slate-400" />
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Iluminación</p>
                  </div>
                  <p className="font-semibold text-slate-800">
                    {translateLighting(report?.lighting || pin.features_used?.lighting)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Users className="h-3 w-3 text-slate-400" />
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Afluencia</p>
                  </div>
                  <p className="font-semibold text-slate-800">
                    {translatePeopleFlow(report?.people_flow || pin.features_used?.people_flow)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Hora del incidente</p>
                  </div>
                  <p className="font-semibold text-slate-800">
                    {pin.features_used?.hour !== undefined
                      ? `${String(pin.features_used.hour).padStart(2, '0')}:00 h`
                      : report?.created_at
                      ? new Date(report.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-0.5">Calculado el</p>
                  <p className="font-semibold text-slate-800 text-xs">{formatDate(pin.generated_at)}</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-0.5">Modelo ML</p>
                  <p className="font-semibold text-slate-800 text-xs font-mono">{pin.model_version || 'civirisk_rf_v1'}</p>
                </div>

              </div>

              {/* Context stats from features_used */}
              {pin.features_used && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-2">Contexto de zona</p>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="text-center">
                      <p className="text-xl font-black text-slate-900">{pin.features_used.reports_24h ?? '—'}</p>
                      <p className="text-[9px] text-slate-500 font-medium mt-0.5">reportes 24h</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-black text-slate-900">{pin.features_used.reports_7d ?? '—'}</p>
                      <p className="text-[9px] text-slate-500 font-medium mt-0.5">reportes 7 d</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-black text-slate-900">{pin.features_used.serious_reports_7d ?? '—'}</p>
                      <p className="text-[9px] text-slate-500 font-medium mt-0.5">graves 7 d</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${pin.features_used.is_peak_hour ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'}`}>
                      {pin.features_used.is_peak_hour ? '⚡ Hora pico' : 'Fuera de hora pico'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${pin.features_used.is_weekend ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
                      {pin.features_used.is_weekend ? '📅 Fin de semana' : 'Día hábil'}
                    </span>
                  </div>
                </div>
              )}

              {/* Coordinates */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Coordenadas GPS</p>
                </div>
                <p className="font-semibold text-slate-800 text-xs font-mono">
                  {report?.lat && report?.lng
                    ? `${Number(report.lat).toFixed(6)}, ${Number(report.lng).toFixed(6)}`
                    : (() => {
                        const z = zones.find(z => z.name === pin.zone_name);
                        return z
                          ? `${z.center_lat?.toFixed(4)}, ${z.center_lng?.toFixed(4)} (centro de zona)`
                          : 'No disponible';
                      })()}
                </p>
              </div>

              {/* Description */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <MessageCircle className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Descripción del reporte vinculado</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {report?.description || 'El reporte asociado no incluye descripción adicional.'}
                </p>
              </div>

            </div>

            {/* Right: Quick Summary */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs uppercase tracking-wider">
                <ShieldAlert className="h-3.5 w-3.5 text-blue-600" />
                Resumen PI24
              </div>

              {/* Score with bar */}
              <div className="rounded-xl bg-white p-2.5 shadow-xs">
                <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400">Score de riesgo</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5 leading-none">
                  {pin.score}
                  <span className="text-xs font-medium text-slate-400 ml-1">/ 100</span>
                </p>
                <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      pin.score >= 70 ? 'bg-red-500' :
                      pin.score >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${pin.score}%` }}
                  />
                </div>
              </div>

              {/* Probability */}
              <div className="rounded-xl bg-white p-2.5 shadow-xs">
                <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400">Probabilidad 24h</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">
                  {pin.probability_24h != null
                    ? `${(pin.probability_24h * 100).toFixed(1)}%`
                    : '—'}
                </p>
              </div>

              {/* Risk Level */}
              <div className="rounded-xl bg-white p-2.5 shadow-xs">
                <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400">Nivel de riesgo</p>
                <p className="text-base font-bold text-slate-900 mt-0.5 capitalize">
                  {pin.risk_level || getRiskDetails(pin.score).level}
                </p>
              </div>

              {/* Model */}
              <div className="rounded-xl bg-white p-2.5 shadow-xs">
                <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400">Modelo</p>
                <p className="text-[10px] font-mono font-semibold text-slate-700 mt-0.5 break-all">{pin.model_version || 'civirisk_rf_v1'}</p>
              </div>
            </div>

          </div>

        ) : (
          /* ── STANDALONE REPORT PANEL ── */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            <div className="lg:col-span-2 space-y-3">

              <div className="grid grid-cols-2 gap-2.5 text-sm">

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-0.5">Zona reportada</p>
                  <p className="font-semibold text-slate-800">{pin.zone_name || '—'}</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-0.5">Tipo de incidente</p>
                  <p className="font-semibold text-slate-800">{translateIncidentType(pin.type)}</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-0.5">Severidad</p>
                  <p className="font-semibold text-slate-800">{translateSeverity(pin.severity)}</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Lightbulb className="h-3 w-3 text-slate-400" />
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Iluminación</p>
                  </div>
                  <p className="font-semibold text-slate-800">{translateLighting(pin.lighting)}</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Users className="h-3 w-3 text-slate-400" />
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Afluencia</p>
                  </div>
                  <p className="font-semibold text-slate-800">{translatePeopleFlow(pin.people_flow)}</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Fecha del reporte</p>
                  </div>
                  <p className="font-semibold text-slate-800 text-xs">{formatDate(pin.created_at)}</p>
                </div>

                <div className="col-span-2 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Coordenadas GPS</p>
                  </div>
                  <p className="font-semibold text-slate-800 text-xs font-mono">
                    {pin.lat && pin.lng
                      ? `${Number(pin.lat).toFixed(6)}, ${Number(pin.lng).toFixed(6)}`
                      : 'No disponible'}
                  </p>
                </div>

              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <MessageCircle className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Descripción del ciudadano</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {pin.description || 'El ciudadano no agregó descripción adicional.'}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-0.5">Reportado por</p>
                <p className="font-semibold text-slate-800">
                  {pin.is_anonymous ? 'Ciudadano anónimo' : 'Usuario registrado'}
                </p>
              </div>

            </div>

            {/* Right summary */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs uppercase tracking-wider">
                <ShieldAlert className="h-3.5 w-3.5 text-indigo-500" />
                Estado del reporte
              </div>

              <div className="rounded-xl bg-white p-2.5 shadow-xs">
                <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400">Estado ML</p>
                <p className="text-xs font-bold text-indigo-600 mt-0.5">Pendiente de análisis</p>
              </div>

              <div className="rounded-xl bg-white p-2.5 shadow-xs">
                <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400">Severidad</p>
                <p className={`text-lg font-black mt-0.5 ${
                  pin.severity === 'alta' ? 'text-red-600' :
                  pin.severity === 'media' ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {translateSeverity(pin.severity)}
                </p>
              </div>

              <div className="rounded-xl bg-white p-2.5 shadow-xs">
                <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400">Tipo</p>
                <p className="text-xs font-semibold text-slate-800 mt-0.5">{translateIncidentType(pin.type)}</p>
              </div>

              <div className="rounded-xl bg-white p-2.5 shadow-xs">
                <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400">Fecha</p>
                <p className="text-[10px] font-mono font-semibold text-slate-700 mt-0.5">{formatDate(pin.created_at)}</p>
              </div>
            </div>

          </div>
        )}
      </>
    );
  };

  // (Legacy) getMapCoordinates removed — using real Leaflet coordinates

  if (loading) {
    return <LoadingState message="Cargando mapa en tiempo real..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
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

            {/* Legend Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-0.5 gap-0.5">
              {[
                { key: 'predicciones', label: 'ML' },
                { key: 'reportes', label: 'Reportes' },
                { key: 'capas', label: 'Capas' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setLegendTab(tab.key)}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all duration-150 cursor-pointer ${
                    legendTab === tab.key
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab: Predicciones ML */}
            {legendTab === 'predicciones' && (
              <div className="space-y-2.5">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Score de riesgo</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-medium text-slate-600">
                    <span className="h-3 w-3 bg-red-500 border-2 border-white rounded-full shadow-sm"></span>
                    Riesgo Alto
                  </span>
                  <span className="font-mono text-slate-400 font-bold">70–100</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-medium text-slate-600">
                    <span className="h-3 w-3 bg-amber-500 border-2 border-white rounded-full shadow-sm"></span>
                    Riesgo Medio
                  </span>
                  <span className="font-mono text-slate-400 font-bold">40–69</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-medium text-slate-600">
                    <span className="h-3 w-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm"></span>
                    Riesgo Bajo
                  </span>
                  <span className="font-mono text-slate-400 font-bold">0–39</span>
                </div>
                <div className="border-t border-slate-100 pt-2.5 space-y-1.5">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Clusters</p>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    <span className="h-5 w-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold shadow-sm">N</span>
                    Agrupación de marcadores — color = riesgo más alto del grupo
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Reportes */}
            {legendTab === 'reportes' && (
              <div className="space-y-2.5">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Reportes ciudadanos</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Los reportes sin predicción ML aún se muestran con borde punteado y color según severidad:
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-medium text-slate-600">
                    <span className="h-3 w-3 bg-rose-500 border-2 border-dashed border-rose-400 rounded-full"></span>
                    Severidad Alta
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-medium text-slate-600">
                    <span className="h-3 w-3 bg-indigo-500 border-2 border-dashed border-indigo-400 rounded-full"></span>
                    Severidad Media
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-medium text-slate-600">
                    <span className="h-3 w-3 bg-slate-400 border-2 border-dashed border-slate-300 rounded-full"></span>
                    Severidad Baja
                  </span>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-2.5 mt-1">
                  <p className="text-[10px] text-indigo-700 font-medium leading-relaxed">
                    El borde punteado distingue estos reportes de las predicciones ML. El análisis predictivo se generará automáticamente una vez procesados.
                  </p>
                </div>
              </div>
            )}

            {/* Tab: Capas */}
            {legendTab === 'capas' && (
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Capas visuales</p>
                <button
                  type="button"
                  onClick={() => setShowHeatmap((v) => !v)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    showHeatmap
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">🌡️</span>
                    Mapa de calor
                  </span>
                  <span className={`h-4 w-7 rounded-full transition-colors duration-200 flex items-center ${showHeatmap ? 'bg-blue-400' : 'bg-slate-300'}`}>
                    <span className={`h-3 w-3 rounded-full bg-white shadow-sm transform transition-transform duration-200 ml-0.5 ${showHeatmap ? 'translate-x-3' : 'translate-x-0'}`} />
                  </span>
                </button>
                {showHeatmap && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Intensidad del calor</p>
                    <div className="h-2.5 w-full rounded-full" style={{background: 'linear-gradient(to right, #312e81, #4f46e5, #06b6d4, #a3e635)'}}></div>
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono font-bold">
                      <span>Menor</span>
                      <span>Mayor</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed pt-1">
                      Los colores del mapa de calor (azul → cian → verde) son independientes de los marcadores para evitar confusión visual.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          
        </div>

        {/* Center / Right Map Area */}
        <div className="lg:col-span-3 flex flex-col gap-6 min-w-0 max-w-full">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl relative overflow-hidden flex flex-col justify-between group min-w-0 max-w-full" style={{height: '580px'}}>
            
            {/* Map Grid Blueprint overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px] opacity-30"></div>
            
            {/* Map Info Bar 
            <div className="relative z-20 flex justify-between items-center bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2 text-[10px] font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <MapIcon className="h-3.5 w-3.5 text-blue-500" />
                <span>MAP_GRID: LIMA_METRO</span>
              </div>
              <span>COORDS: WGS-84</span>
            </div>*/}

            {/* Real Leaflet Map */}
            <div className="absolute inset-0 z-10 min-w-0 overflow-hidden">
              {filteredPredictions.length === 0 && filteredStandaloneReports.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400">
                  <EmptyState 
                    title="Sin marcadores" 
                    description="No hay predicciones ni reportes que coincidan con los filtros seleccionados." 
                  />
                </div>
              ) : (
                <MapContainer
                  center={filteredPredictions.length > 0 ? getLatLngForPred(filteredPredictions[0]) : (filteredStandaloneReports.length > 0 ? [Number(filteredStandaloneReports[0].lat), Number(filteredStandaloneReports[0].lng)] : [-12.0464, -77.0428])}
                  zoom={13}
                  style={{ width: '100%', height: '100%', minWidth: 0 }}
                  className="rounded-2xl"
                >
                  <LayersControl position="bottomleft">
                    <LayersControl.BaseLayer checked name="OpenStreetMap">
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="OpenTopoMap">
                      <TileLayer url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" />
                    </LayersControl.BaseLayer>
                  </LayersControl>

                  {/* Heatmap layer — rendered below markers */}
                  <HeatmapLayer points={heatmapPoints} visible={showHeatmap} />

                  <MarkerClusterGroup
                    chunkedLoading={true}
                    spiderfyOnMaxZoom={true}
                    showCoverageOnHover={true}
                    iconCreateFunction={clusterIconCreate}
                  >
                    {filteredPredictions.map((pred) => {
                      const [plat, plng] = getLatLngForPred(pred);
                      const report = pred.last_report_id ? reportsById[pred.last_report_id] : null;
                      const key = report?.lat && report?.lng
                        ? `${Number(report.lat).toFixed(4)}|${Number(report.lng).toFixed(4)}`
                        : pred.lat && pred.lng
                        ? `${Number(pred.lat).toFixed(4)}|${Number(pred.lng).toFixed(4)}`
                        : (pred.zone_name || 'unknown');
                      const count = locationCounts[key] || 1;
                      const repScore = locationMaxScore[key] || Number(pred.score) || 0;

                      return (
                        <Marker
                          key={pred.id}
                          position={[plat, plng]}
                          icon={createIncidentIcon(pred, count, maxLocationCount, repScore)}
                          riseOnHover={true}
                        >
                          <Popup maxWidth={380} minWidth={280}>
                            <div className="space-y-3 text-sm p-0.5">
                              {/* Prediction popup header — blue accent */}
                              <div className="flex items-center gap-2 pb-2 border-b border-blue-100">
                                <span className="text-lg">{getIncidentTimeEmoji(pred.generated_at)}</span>
                                <div className="flex-1 min-w-0">
                                  <strong className="text-slate-800 block truncate">{pred.zone_name}</strong>
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[9px] font-bold uppercase tracking-wide mt-0.5">
                                    ⚡ Predicción ML
                                  </span>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                                <div className="rounded-lg bg-blue-50 p-2">
                                  <span className="block font-semibold text-slate-800">Score</span>
                                  <span>{pred.score} / 100</span>
                                </div>
                                <div className="rounded-lg bg-blue-50 p-2">
                                  <span className="block font-semibold text-slate-800">Nivel</span>
                                  <span>{getRiskDetails(pred.score).label || getRiskDetails(pred.score).level}</span>
                                </div>
                                <div className="rounded-lg bg-blue-50 p-2 col-span-2">
                                  <span className="block font-semibold text-slate-800">Tipo</span>
                                  <span>{translateIncidentType(pred.incident_type)}</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                                  {formatDate(pred.generated_at)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-3.5 w-3.5 text-slate-400" />
                                  {pred.severity ? translateSeverity(pred.severity) : 'N/A'}
                                </div>
                              </div>
                              {pred.description && (
                                <div className="rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-600 border border-slate-100">
                                  <div className="flex items-center gap-1 text-slate-700 font-semibold mb-1">
                                    <MessageCircle className="h-3.5 w-3.5 text-slate-400" />
                                    Descripción
                                  </div>
                                  <p className="mt-1 leading-snug line-clamp-3">{pred.description}</p>
                                </div>
                              )}
                              
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPin(pred);
                                  setIsModalOpen(true);
                                }}
                                className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all duration-200 cursor-pointer shadow-xs border border-slate-850 mt-2 hover:scale-[1.02] active:scale-[0.98]"
                              >
                                <Maximize2 className="h-3.5 w-3.5 text-slate-200" />
                                Ver detalles completos
                              </button>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                    {filteredStandaloneReports.map((report) => (
                      <Marker
                        key={`report-${report.id}`}
                        position={[Number(report.lat), Number(report.lng)]}
                        icon={createStandaloneReportIcon(report)}
                        riseOnHover={true}
                      >
                        <Popup maxWidth={380} minWidth={280}>
                          <div className="space-y-3 text-sm p-0.5">
                            {/* Standalone report popup header — indigo accent */}
                            <div className="flex items-center gap-2 pb-2 border-b border-indigo-100">
                              <span className="text-lg">{getIncidentTimeEmoji(report.created_at)}</span>
                              <div className="flex-1 min-w-0">
                                <strong className="text-slate-800 block truncate">{report.zone_name || 'Reporte'}</strong>
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[9px] font-bold uppercase tracking-wide mt-0.5">
                                  📋 Reporte ciudadano
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                              <div className="rounded-lg bg-indigo-50 p-2">
                                <span className="block font-semibold text-slate-800">Tipo</span>
                                <span>{translateIncidentType(report.type)}</span>
                              </div>
                              <div className="rounded-lg bg-indigo-50 p-2">
                                <span className="block font-semibold text-slate-800">Severidad</span>
                                <span>{translateSeverity(report.severity)}</span>
                              </div>
                              <div className="rounded-lg bg-indigo-50 p-2 col-span-2">
                                <span className="block font-semibold text-slate-800">Estado</span>
                                <span>Reporte sin predicción</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                {formatDate(report.created_at)}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                {`${Number(report.lat).toFixed(4)}, ${Number(report.lng).toFixed(4)}`}
                              </div>
                            </div>
                            {report.description && (
                              <div className="rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-600 border border-slate-100">
                                <div className="flex items-center gap-1 text-slate-700 font-semibold mb-1">
                                  <MessageCircle className="h-3.5 w-3.5 text-slate-400" />
                                  Descripción
                                </div>
                                <p className="mt-1 leading-snug line-clamp-3">{report.description}</p>
                              </div>
                            )}
                            
                            <button
                              type="button"
                              onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPin(report);
                                  setIsModalOpen(true);
                              }}
                              className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-850 rounded-xl transition-all duration-200 cursor-pointer shadow-xs border border-slate-850 mt-2 hover:scale-[1.02] active:scale-[0.98]"
                            >
                              <Maximize2 className="h-3.5 w-3.5 text-slate-200" />
                              Ver detalles completos
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MarkerClusterGroup>
                </MapContainer>
              )}
            </div>

            {/* Bottom status and Map Switch placeholders */}
          </div>

        </div>

      </div>

      {/* Details Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md"
          onClick={() => setIsModalOpen(false)}
        >
          {/* Centering wrapper — doesn't scroll, just centers */}
          <div className="flex min-h-full items-center justify-center p-3 sm:p-5">
            {/* Modal panel */}
            <div
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl animate-fade-in relative flex flex-col"
              style={{ maxHeight: 'calc(100dvh - 2.5rem)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sticky header with close button */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 flex-shrink-0">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
                    {selectedIsPrediction ? 'Predicción PI24 · Modelo ML' : 'Reporte ciudadano'}
                  </p>
                  <p className="text-base font-extrabold text-slate-800 leading-tight mt-0.5">
                    {selectedPin?.zone_name || 'Detalle del incidente'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer flex-shrink-0 ml-4"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable content area */}
              <div className="overflow-y-auto flex-1 p-5 md:p-6">
                {renderDetailsPanelContent(selectedPin)}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MapPage;
