import axios from 'axios';

const baseURL = 'http://localhost:8000/api/';

const api = axios.create({
  baseURL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
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
        return api(original);
      } catch {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
