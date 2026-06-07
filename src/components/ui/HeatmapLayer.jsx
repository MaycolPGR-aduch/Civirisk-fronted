import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import 'leaflet.heat';
import L from 'leaflet';

const GRADIENT = {
  0.0:  '#312e81', // indigo-950 — mínima densidad
  0.25: '#4f46e5', // indigo-600
  0.5:  '#06b6d4', // cyan-500
  0.75: '#a3e635', // lime-400
  1.0:  '#fde047', // yellow-300 — máxima densidad
};

const HeatmapLayer = ({ points = [], visible = true }) => {
  const map = useMap();
  const heatRef = useRef(null);

  // Create the layer once, never destroy it — just add/remove from map
  useEffect(() => {
    if (!map) return;

    heatRef.current = L.heatLayer([], {
      radius: 35,
      blur: 25,
      maxZoom: 17,
      max: 1.0,
      gradient: GRADIENT,
    });

    // Cleanup: remove layer when component unmounts
    return () => {
      try {
        if (heatRef.current && map && map.hasLayer(heatRef.current)) {
          map.removeLayer(heatRef.current);
        }
      } catch (_) {
        // ignore — map may already be gone
      }
      heatRef.current = null;
    };
  }, [map]);

  // Update points whenever they change
  useEffect(() => {
    if (!heatRef.current) return;
    try {
      heatRef.current.setLatLngs(points);
    } catch (_) {
      // ignore
    }
  }, [points]);

  // Toggle visibility without recreating the layer
  useEffect(() => {
    if (!map || !heatRef.current) return;
    try {
      if (visible) {
        if (!map.hasLayer(heatRef.current)) {
          heatRef.current.addTo(map);
        }
      } else {
        if (map.hasLayer(heatRef.current)) {
          map.removeLayer(heatRef.current);
        }
      }
    } catch (_) {
      // ignore
    }
  }, [map, visible]);

  return null;
};

export default HeatmapLayer;
