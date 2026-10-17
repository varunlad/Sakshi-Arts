const API_BASE = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_BASE_URL || 'https://sakshi-arts-backend.onrender.com');

export function apiUrl(path) {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}
