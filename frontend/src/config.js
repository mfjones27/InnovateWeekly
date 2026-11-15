// Single source of truth for the backend URL.
// Override in production by setting VITE_API_BASE_URL at build time.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
