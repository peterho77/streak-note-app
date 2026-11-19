const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(endpoint, options = {}) {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const reportApi = {
  list: () => request("/reports/"),
  create: (data) => request("/reports/", { method: "POST", body: JSON.stringify(data) }),
};

export const taskApi = {
  list: () => request("/tasks/"),
  create: (taskName) =>
    request("/tasks/", { method: "POST", body: JSON.stringify({ task_name: taskName }) }),
  check: (taskId) => request(`/tasks/${taskId}/check`, { method: "POST" }),
};