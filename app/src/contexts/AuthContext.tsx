import type React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { api, AUTH_LOGOUT_EVENT } from '../lib/api';
import { clearAccessToken, setAccessToken } from '../lib/tokenService';

export type UserRole = 'STUDENT' | 'PARENT' | 'TEACHER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  mustChangePassword?: boolean;
  student?: any;
  parent?: any;
  teacher?: any;
  admin?: any;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Call protected endpoint - if token expired, interceptor handles refresh automatically
        await fetchCurrentUser();
      } catch (error) {
        // If refresh fails or no valid session, user stays logged out
        clearAccessToken();
        setUser(null);
        setLoading(false);
      }
    };

    initializeSession();
  }, []);

  useEffect(() => {
    const handleLogout = () => {
      clearAccessToken();
      setUser(null);
    };

    window.addEventListener(AUTH_LOGOUT_EVENT, handleLogout as EventListener);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleLogout as EventListener);
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/api/auth/me');
      const data = response.data;
      setUser({
        ...data.data.user,
        mustChangePassword: data.data.mustChangePassword ?? false
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          clearAccessToken();
          setUser(null);
        }
      } else {
        console.error('Failed to fetch current user:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const data = response.data;

      setAccessToken(data.data.accessToken);
      setUser(data.data.user);
    } catch (error: any) {
      clearAccessToken();
      setUser(null);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401) {
          throw new Error('Email ou mot de passe incorrect');
        }
        if (status === 403) {
          throw new Error('Compte désactivé. Contactez l\'administrateur');
        }
        throw new Error(error.response?.data?.error || 'Erreur de connexion. Veuillez réessayer.');
      }

      throw new Error('Le serveur ne renvoie pas de réponse valide. Vérifiez la connexion au backend.');
    }
  };

  const logout = () => {
    api.post('/api/auth/logout').catch(() => undefined);
    clearAccessToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      loading,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};