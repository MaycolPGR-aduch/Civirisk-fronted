import { supabase } from './supabaseClient';

/**
 * Retrieves all risk predictions from the 'risk_predictions' table.
 */
export const getRiskPredictions = async () => {
  const { data, error } = await supabase
    .from('risk_predictions')
    .select('*')
    .order('generated_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Retrieves risk predictions ordered by score descending to get a risk ranking.
 * @param {number} limit
 */
export const getRiskRanking = async (limit = 10) => {
  const { data, error } = await supabase
    .from('risk_predictions')
    .select('*')
    .order('score', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

/**
 * Retrieves recent alerts.
 */
export const getAlerts = async () => {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Subscribes to real-time changes in the 'risk_predictions' table.
 * @param {Function} callback
 * @returns {Function} Unsubscribe cleanup function
 */
export const subscribeToRiskPredictions = (callback) => {
  const channel = supabase
    .channel('public:risk_predictions')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'risk_predictions' },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Subscribes to real-time changes in the 'alerts' table.
 * @param {Function} callback
 * @returns {Function} Unsubscribe cleanup function
 */
export const subscribeToAlerts = (callback) => {
  const channel = supabase
    .channel('public:alerts')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'alerts' },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
