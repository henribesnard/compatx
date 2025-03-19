import axios from 'axios';
import { StreamOptions, StreamCallbacks } from '../types/chat';
import { ApiQueryResponse, ApiError } from '../types/api';
import { streamService } from '../services/streamService';

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
 * Client API pour les opérations OHADA
 */
export const ohadaApi = {
  /**
   * Effectue une requête normale (non streaming)
   */
  async query(
    query: string, 
    options: StreamOptions = {}, 
    token?: string
  ): Promise<ApiQueryResponse> {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await axios.post<ApiQueryResponse>(
        `${API_URL}/query`,
        {
          query,
          ...options
        },
        { headers }
      );
      
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  /**
   * Effectue une requête en streaming
   */
  streamQuery(
    query: string, 
    options: StreamOptions = {}, 
    callbacks: StreamCallbacks,
    token?: string
  ): AbortController {
    // Consolider les options avec la query
    const streamOptions: StreamOptions & { query: string } = { 
      ...options,
      query
    };
    
    // Démarrer le stream en passant le token pour le header Authorization
    return streamService.setupStream(streamOptions, callbacks, token);
  },
  
  /**
   * Annule un stream en cours
   */
  cancelStream() {
    streamService.cancelStream();
  }
};