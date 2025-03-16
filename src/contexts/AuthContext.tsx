import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Type pour les données utilisateur
export interface User {
  user_id: string;
  email: string;
  name: string;
  profile_picture?: string;
  created_at: string;
  last_login: string;
  auth_provider: 'google';
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  googleLogin: (googleIdToken: string) => Promise<void>;
  logout: () => void;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'comptax_auth_token';
const USER_DATA_KEY = 'comptax_user_data';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
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
      const response = await axios.get('http://localhost:8080/auth/me', {
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
  
  const googleLogin = async (googleIdToken: string) => {
    setIsLoading(true);
    
    try {
      const response = await axios.post('http://localhost:8080/auth/google', {
        token: googleIdToken
      });
      
      if (response.status === 200 && response.data.status === 'success') {
        // Stocker le token et les données utilisateur
        localStorage.setItem(TOKEN_KEY, googleIdToken);
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(response.data.user));
        
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    setIsAuthenticated(false);
    setUser(null);
  };
  
  const getToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  };
  
  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      isLoading,
      googleLogin,
      logout: handleLogout,
      getToken
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