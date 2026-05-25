const API_BASE = "http://127.0.0.1:10000";

export async function fetchDashboardStats() {

  const response = await fetch(
    `${API_BASE}/api/dashboard/stats`
  );

  return await response.json();
}