// Tiny fetch wrapper around the FastAPI endpoints.
import { API_BASE_URL } from "./config";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new Error(detail);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const fetchSubmissions = () => request("/submissions/");

export const createSubmission = (payload) =>
  request("/submissions/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const deleteSubmission = (id) =>
  request(`/submissions/${id}`, { method: "DELETE" });
