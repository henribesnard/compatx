// src/api/auth.ts
import axios from 'axios';
import { 
  User, 
  LoginCredentials, 
  RegisterData, 
  ResetPasswordData, 
  LoginResponse,
  ApiErrorResponse 
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Client API pour les opérations d'authentification
 */
export const authApi = {
  /**
   * Gère les erreurs de l'API d'authentification
   */
  handleAuthError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as unknown as {
        response?: {
          data?: ApiErrorResponse;
          status?: number;
        };
      };
      
      if (axiosError.response?.data?.detail) {
        return new Error(axiosError.response.data.detail);
      } else if (axiosError.response?.data?.message) {
        return new Error(axiosError.response.data.message);
      } else if (axiosError.response?.status === 401) {
        return new Error('Identifiants incorrects ou session expirée.');
      } else if (axiosError.response?.status === 400) {
        return new Error('Données invalides. Veuillez vérifier vos informations.');
      }
    }
    
    return new Error('Une erreur inattendue est survenue. Veuillez réessayer.');
  },
  
  /**
   * Connecte un utilisateur
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await axios.post<LoginResponse>(`${API_URL}/auth/login`, credentials);
      return response.data;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  },
  
  /**
   * Inscrit un nouvel utilisateur
   */
  async register(data: RegisterData): Promise<User> {
    try {
      const response = await axios.post<User>(`${API_URL}/auth/register`, data);
      return response.data;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  },
  
  /**
   * Déconnecte l'utilisateur courant
   */
  async logout(token: string): Promise<void> {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error during logout:', error);
      // On ne lance pas d'erreur pour le logout car nous voulons quand même
      // déconnecter l'utilisateur localement même si la requête échoue
    }
  },
  
  /**
   * Récupère le profil de l'utilisateur courant
   */
  async getUserProfile(token: string): Promise<User> {
    try {
      const response = await axios.get<User>(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  },
  
  /**
   * Demande une réinitialisation de mot de passe
   */
  async requestPasswordReset(email: string): Promise<{ status: string; message: string }> {
    try {
      const response = await axios.post<{ status: string; message: string }>(
        `${API_URL}/auth/password-reset`,
        { email }
      );
      return response.data;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  },
  
  /**
   * Réinitialise le mot de passe avec un token
   */
  async resetPassword(data: ResetPasswordData): Promise<{ status: string; message: string }> {
    try {
      const response = await axios.post<{ status: string; message: string }>(
        `${API_URL}/auth/password-reset-confirm`,
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  },
  
  /**
   * Change le mot de passe de l'utilisateur connecté
   */
  async changePassword(
    currentPassword: string, 
    newPassword: string, 
    token: string
  ): Promise<{ status: string; message: string }> {
    try {
      const response = await axios.post<{ status: string; message: string }>(
        `${API_URL}/auth/change-password`,
        { current_password: currentPassword, new_password: newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  },
  
  /**
   * Vérifie l'email de l'utilisateur
   */
  async verifyEmail(
    token: string,
    email: string
  ): Promise<{ status: string; message: string }> {
    try {
      const response = await axios.post<{ status: string; message: string }>(
        `${API_URL}/auth/verify-email`,
        { token, email }
      );
      return response.data;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }
};