// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';

// Type pour les données utilisateur
export interface User {
  user_id: string;
  email: string;
  name: string;
  profile_picture?: string;
  created_at: string;
  last_login: string;
  auth_provider: 'internal';
  email_verified: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

interface ResetPasswordData {
  email: string;
  token: string;
  new_password: string;
}

interface ApiErrorResponse {
  detail?: string;
  message?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  getToken: () => string | null;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (data: ResetPasswordData) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'comptax_auth_token';
const USER_DATA_KEY = 'comptax_user_data';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Charger l'état d'authentification au démarrage
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem(TOKEN_KEY);
      const userData = localStorage.getItem(USER_DATA_KEY);
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData) as User;
          setUser(parsedUser);
          setIsAuthenticated(true);
          
          // Vérifier que le token est valide avec le backend
          fetchUserProfile(token);
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          // En cas d'erreur, réinitialiser
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_DATA_KEY);
        }
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);
  
  // Récupérer le profil utilisateur depuis le backend
  const fetchUserProfile = async (token: string) => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.status === 200) {
        setUser(response.data);
        setIsAuthenticated(true);
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(response.data));
      } else {
        // Réinitialiser en cas d'erreur
        handleLogout();
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      handleLogout();
    }
  };
  
  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/auth/login`, credentials);
      
      if (response.status === 200) {
        const { user, token } = response.data;
        
        // Stocker le token et les données utilisateur
        localStorage.setItem(TOKEN_KEY, token.access_token);
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
        
        setUser(user);
        setIsAuthenticated(true);
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      handleApiError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/auth/register`, data);
      
      if (response.status === 200) {
        // Après l'inscription, connecter l'utilisateur directement
        await login({ email: data.email, password: data.password });
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      handleApiError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    
    // Appeler l'API de déconnexion si un token existe
    if (token) {
      try {
        await axios.post(`${API_URL}/auth/logout`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('Error during logout:', error);
      }
    }
    
    // Supprimer les données locales
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    setIsAuthenticated(false);
    setUser(null);
  };
  
  const getToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  };
  
  const requestPasswordReset = async (email: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/auth/password-reset`, { email });
      
      if (response.status !== 200) {
        throw new Error('Password reset request failed');
      }
    } catch (error) {
      console.error('Password reset request error:', error);
      handleApiError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetPassword = async (data: ResetPasswordData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/auth/password-reset-confirm`, data);
      
      if (response.status !== 200) {
        throw new Error('Password reset failed');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      handleApiError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleApiError = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      if (axiosError.response?.data?.detail) {
        setError(axiosError.response.data.detail);
      } else if (axiosError.response?.data?.message) {
        setError(axiosError.response.data.message);
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
    } else {
      setError('Une erreur inattendue est survenue. Veuillez réessayer.');
    }
  };
  
  const clearError = () => {
    setError(null);
  };
  
  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      isLoading,
      login,
      register,
      logout: handleLogout,
      getToken,
      requestPasswordReset,
      resetPassword,
      error,
      clearError
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