import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

// Injecter le token JWT dans chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si le serveur renvoie 401 (token expiré/invalide), déconnecter automatiquement
api.interceptors.response.use(
  (response) => response,
  (erreur) => {
    if (erreur.response?.status === 401) {
      // Éviter la boucle infinie sur la route de login elle-même
      const estRouteAuth = erreur.config?.url?.includes('/auth/login');
      if (!estRouteAuth) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(erreur);
  }
);

export default api;

