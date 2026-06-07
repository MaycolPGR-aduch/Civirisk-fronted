const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL || '';

if (!API_BASE) {
  console.warn('VITE_API_BASE_URL o VITE_BACKEND_URL no configurada. Asegúrese de definirla en .env');
}

async function request(path, opts = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API request failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function getZones() {
  return request('/zones');
}

export async function getRiskRanking(limit = 100) {
  const q = limit ? `?limit=${limit}` : '';
  const result = await request(`/risk-ranking${q}`);

  if (Array.isArray(result)) {
    return result;
  }

  if (result?.data && Array.isArray(result.data)) {
    return result.data;
  }

  if (result?.risk_predictions && Array.isArray(result.risk_predictions)) {
    return result.risk_predictions;
  }

  if (result?.predictions && Array.isArray(result.predictions)) {
    return result.predictions;
  }

  if (result?.results && Array.isArray(result.results)) {
    return result.results;
  }

  console.warn('getRiskRanking: response no es un arreglo', result);
  return [];
}

export async function predictByReport(reportId) {
  return request('/predict-by-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ report_id: reportId })
  });
}

export default { getZones, getRiskRanking, predictByReport };
