/**
 * Aplica un evento de Supabase Realtime (postgres_changes) a una lista en memoria,
 * sin recargar desde el servidor. Usa directamente el payload del evento, por lo que
 * no depende de un SELECT posterior (evita el lag de replicación) ni de carreras
 * entre refetches concurrentes.
 *
 * @param {Array}  list           Lista actual de filas.
 * @param {Object} payload        Payload de Supabase: { eventType | type, new, old }.
 * @param {Object} [opts]
 * @param {string} [opts.idKey='id']        Campo identificador único de cada fila.
 * @param {(a, b) => number} [opts.sort]    Comparador opcional para reordenar tras el cambio.
 * @returns {Array} Nueva lista (referencia nueva sólo si hubo cambio).
 */
export const applyRealtimeChange = (list, payload, opts = {}) => {
  const { idKey = 'id', sort } = opts;
  const eventType = payload.eventType || payload.type;
  const row = payload.new && Object.keys(payload.new).length ? payload.new : null;
  const oldRow = payload.old && Object.keys(payload.old).length ? payload.old : null;

  let next;
  switch (eventType) {
    case 'INSERT': {
      if (!row) return list;
      // Evita duplicados (StrictMode, reconexiones, eventos repetidos).
      next = list.some((item) => item[idKey] === row[idKey])
        ? list.map((item) => (item[idKey] === row[idKey] ? { ...item, ...row } : item))
        : [row, ...list];
      break;
    }
    case 'UPDATE': {
      if (!row) return list;
      // Conserva campos enriquecidos en cliente (merge) y aplica los cambios.
      next = list.some((item) => item[idKey] === row[idKey])
        ? list.map((item) => (item[idKey] === row[idKey] ? { ...item, ...row } : item))
        : [row, ...list]; // UPDATE de una fila que aún no teníamos en memoria.
      break;
    }
    case 'DELETE': {
      const delId = oldRow?.[idKey];
      if (delId == null) return list;
      next = list.filter((item) => item[idKey] !== delId);
      break;
    }
    default:
      return list;
  }

  return sort ? [...next].sort(sort) : next;
};
