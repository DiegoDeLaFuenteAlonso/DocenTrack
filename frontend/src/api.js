import axios from 'axios';

const normalizeBase = (value) => {
  const raw = value || 'http://localhost:8000/api/';
  return raw.endsWith('/') ? raw : `${raw}/`;
};

const preferredBaseURL = normalizeBase(import.meta.env.VITE_API_URL);

// Back-end en Render suele ser `docentrack.onrender.com` y el frontend `docentrack-web.onrender.com`.
// Si el build apunta accidentalmente a `docentrack-api.onrender.com`, hacemos fallback.
const guessBackendBaseURL = () => {
  if (typeof window === 'undefined') return preferredBaseURL;
  const host = window.location.hostname; // ej: docentrack-web.onrender.com
  const backendHost = host.replace(/-web\./, '.'); // -> docentrack.onrender.com
  return normalizeBase(`https://${backendHost}/api/`);
};

const fallbackBaseURL = guessBackendBaseURL();

const createApi = (baseURL) => {
  const instance = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('access');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config;

      // Refresh JWT (solo cuando realmente recibimos 401).
      if (
        error.response?.status === 401 &&
        original &&
        !original._retry &&
        !String(original.url || '').includes('token/')
      ) {
        original._retry = true;
        const refresh = localStorage.getItem('refresh');
        if (!refresh) {
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }

        try {
          const { data } = await axios.post(`${baseURL}token/refresh/`, {
            refresh,
          });
          localStorage.setItem('access', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return instance(original);
        } catch {
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
      }

      // Si el preflight falla o el host equivocado responde 404/no-server, intentamos con fallback.
      const preferredHost = new URL(baseURL).host;
      const fallbackHost = new URL(fallbackBaseURL).host;
      const shouldFallback =
        preferredHost !== fallbackHost &&
        original &&
        !original._fallbackTried &&
        (!error.response || error.response.status === 404);

      if (shouldFallback) {
        original._fallbackTried = true;
        try {
          // Forzamos el baseURL del request al host correcto.
          original.baseURL = fallbackBaseURL;
          return fallbackApi.request(original);
        } catch (e) {
          return Promise.reject(error);
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

const fallbackApi = createApi(fallbackBaseURL);
const api = createApi(preferredBaseURL);

export default api;
