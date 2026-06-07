import { supabase } from './supabaseClient';

/**
 * Inserts a new incident report into the 'reports' table.
 * @param {Object} reportPayload
 */
export const createReport = async (reportPayload) => {
  const { data, error } = await supabase
    .from('reports')
    .insert([
      {
        type: reportPayload.type,
        severity: reportPayload.severity,
        zone_name: reportPayload.zone_name,
        lat: Number(reportPayload.lat),
        lng: Number(reportPayload.lng),
        lighting: reportPayload.lighting,
        people_flow: reportPayload.people_flow,
        description: reportPayload.description,
        is_anonymous: reportPayload.is_anonymous,
        user_id: reportPayload.is_anonymous ? null : reportPayload.user_id
      }
    ])
    .select();

  if (error) throw error;
  return data?.[0] || data;
};

/**
 * Retrieves the most recent reports.
 * @param {number} limit
 */
export const getRecentReports = async (limit = 20) => {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

/**
 * Retrieves report records by their IDs.
 * @param {Array<string>} ids
 */
export const getReportsByIds = async (ids = []) => {
  if (!Array.isArray(ids) || ids.length === 0) return [];

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .in('id', ids);

  if (error) throw error;
  return data || [];
};

/**
 * Subscribes to real-time additions/modifications in the reports table.
 * @param {Function} callback
 * @returns {Function} Unsubscribe cleanup function
 */
export const subscribeToReports = (callback) => {
  const channel = supabase
    .channel('public:reports')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'reports' },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
