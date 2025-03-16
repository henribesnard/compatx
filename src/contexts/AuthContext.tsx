// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginCredentials, RegisterData, ResetPasswordData } from '../types';
import { authApi } from '../api/auth';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Charger l'état d'authentification au démarrage
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      const userData = localStorage.getItem(USER_DATA_KEY);
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData) as User;
          setUser(parsedUser);
          setIsAuthenticated(true);
          
          // Vérifier que le token est valide avec le backend
          await fetchUserProfile(token);
        } catch (error) {
          console.error('Error parsing stored user data or verifying token:', error);
          // En cas d'erreur, réinitialiser
          await handleLogout();
        }
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);
  
  // Récupérer le profil utilisateur depuis le backend
  const fetchUserProfile = async (token: string) => {
    try {
      const fetchedUser = await authApi.getUserProfile(token);
      setUser(fetchedUser);
      setIsAuthenticated(true);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(fetchedUser));
    } catch (error) {
      console.error('Error fetching user profile:', error);
      await handleLogout();
      throw error;
    }
  };
  
  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authApi.login(credentials);
      
      // Stocker le token et les données utilisateur
      localStorage.setItem(TOKEN_KEY, response.token.access_token);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(response.user));
      
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Une erreur est survenue lors de la connexion.');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await authApi.register(data);
      
      // Après l'inscription, connecter l'utilisateur directement
      await login({ 
        email: data.email, 
        password: data.password 
      });
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Une erreur est survenue lors de l\'inscription.');
      }
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
        await authApi.logout(token);
      } catch (error) {
        console.error('Error during logout:', error);
        // Continuer malgré l'erreur car on veut déconnecter localement
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
      await authApi.requestPasswordReset(email);
    } catch (error) {
      console.error('Password reset request error:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Une erreur est survenue lors de la demande de réinitialisation.');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetPassword = async (data: ResetPasswordData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await authApi.resetPassword(data);
    } catch (error) {
      console.error('Password reset error:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Une erreur est survenue lors de la réinitialisation du mot de passe.');
      }
      throw error;
    } finally {
      setIsLoading(false);
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