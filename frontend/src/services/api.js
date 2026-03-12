const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
console.log("API_BASE_URL:", API_BASE_URL);

export async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}
