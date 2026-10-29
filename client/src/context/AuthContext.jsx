import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    async function chargerSession() {
      const token = localStorage.getItem('token');

      if (!token) {
        setChargement(false);
        return;
      }

      try {
        const reponse = await api.get('/auth/moi');
        setUser(reponse.data.user);
      } catch {
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setChargement(false);
      }
    }

    chargerSession();
  }, []);

  function login(token, userData) {
    localStorage.setItem('token', token);
    setUser(userData);
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // silencieux - on continue avec la déconnexion locale
    }
    localStorage.removeItem('token');
    setUser(null);
  }

  function updateUser(newData) {
    setUser({ ...user, ...newData });
  }

  return (
    <AuthContext.Provider value={{ user, chargement, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
