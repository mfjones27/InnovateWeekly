// Single source of truth for the backend URL.
// Override in production by setting REACT_APP_API_BASE_URL.
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
