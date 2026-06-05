/**
 * Formats a ISO date string to a human-readable local date and time.
 * @param {string} dateString
 * @returns {string}
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return dateString;
  }
};

/**
 * Translates db incident types to Spanish readable labels.
 * @param {string} type
 */
export const translateIncidentType = (type) => {
  const types = {
    robo: 'Robo',
    accidente: 'Accidente',
    zona_oscura: 'Zona Oscura',
    emergencia: 'Emergencia'
  };
  return types[type] || type || 'Desconocido';
};

/**
 * Translates severity levels to Spanish readable labels.
 * @param {string} severity
 */
export const translateSeverity = (severity) => {
  const levels = {
    baja: 'Baja',
    media: 'Media',
    alta: 'Alta'
  };
  return levels[severity] || severity || 'Desconocida';
};

/**
 * Translates lighting levels to Spanish readable labels.
 * @param {string} lighting
 */
export const translateLighting = (lighting) => {
  const levels = {
    baja: 'Mala / Oscuro',
    media: 'Regular',
    alta: 'Buena'
  };
  return levels[lighting] || lighting || 'No especificada';
};

/**
 * Translates people flow levels to Spanish readable labels.
 * @param {string} flow
 */
export const translatePeopleFlow = (flow) => {
  const levels = {
    bajo: 'Bajo',
    medio: 'Medio',
    alto: 'Alto'
  };
  return levels[flow] || flow || 'No especificado';
};
