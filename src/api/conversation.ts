import axios from 'axios';
import { ApiConversation, ApiError } from '../types/api';
import { FeedbackData } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Gère les erreurs de l'API
 */
const handleApiError = (error: unknown): Error => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as unknown as {
      response?: {
        data?: ApiError;
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
};

/**
 * Client API pour les opérations de conversation
 */
export const conversationApi = {
  /**
   * Récupère la liste des conversations
   */
  async fetchConversations(token: string): Promise<ApiConversation[]> {
    try {
      const response = await axios.get<ApiConversation[]>(`${API_URL}/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  /**
   * Récupère une conversation spécifique avec ses messages
   */
  async fetchConversation(conversationId: string, token: string): Promise<ApiConversation> {
    try {
      const response = await axios.get<ApiConversation>(
        `${API_URL}/conversations/${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  /**
   * Crée une nouvelle conversation
   */
  async createConversation(title: string, token: string): Promise<ApiConversation> {
    try {
      const response = await axios.post<ApiConversation>(
        `${API_URL}/conversations`,
        { title },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  /**
   * Met à jour le titre d'une conversation
   */
  async updateConversationTitle(
    conversationId: string, 
    title: string, 
    token: string
  ): Promise<ApiConversation> {
    try {
      const response = await axios.put<ApiConversation>(
        `${API_URL}/conversations/${conversationId}`,
        { title },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  /**
   * Supprime une conversation
   */
  async deleteConversation(
    conversationId: string, 
    token: string
  ): Promise<{ status: string; message: string }> {
    try {
      const response = await axios.delete<{ status: string; message: string }>(
        `${API_URL}/conversations/${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  /**
   * Ajoute un feedback à un message
   */
  async addFeedback(
    messageId: string, 
    feedback: FeedbackData, 
    token: string
  ): Promise<{ feedback_id: string }> {
    try {
      const response = await axios.post<{ feedback_id: string }>(
        `${API_URL}/conversations/messages/${messageId}/feedback`,
        feedback,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};