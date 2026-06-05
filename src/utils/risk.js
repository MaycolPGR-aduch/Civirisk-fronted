/**
 * Get risk level details based on a numeric score (0 to 100).
 * @param {number} score
 */
export const getRiskDetails = (score) => {
  const numScore = Number(score);
  
  if (isNaN(numScore) || numScore < 0) {
    return {
      level: 'baja',
      label: 'Bajo',
      classes: {
        text: 'text-slate-500',
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        badge: 'bg-slate-50 text-slate-700 border-slate-200'
      }
    };
  }

  if (numScore <= 39) {
    return {
      level: 'bajo',
      label: 'Bajo',
      classes: {
        text: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 border'
      }
    };
  } else if (numScore <= 69) {
    return {
      level: 'medio',
      label: 'Medio',
      classes: {
        text: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        badge: 'bg-amber-50 text-amber-700 border-amber-200 border'
      }
    };
  } else {
    return {
      level: 'alto',
      label: 'Alto',
      classes: {
        text: 'text-red-700',
        bg: 'bg-red-50',
        border: 'border-red-200',
        badge: 'bg-red-50 text-red-700 border-red-200 border'
      }
    };
  }
};

/**
 * Get color/classes using the string representation of risk level ('bajo', 'medio', 'alto').
 * @param {string} level
 */
export const getRiskDetailsByLevel = (level) => {
  const normalized = String(level).toLowerCase().trim();
  switch (normalized) {
    case 'bajo':
    case 'baja':
      return getRiskDetails(20);
    case 'medio':
    case 'media':
      return getRiskDetails(50);
    case 'alto':
    case 'alta':
      return getRiskDetails(90);
    default:
      return getRiskDetails(-1);
  }
};
