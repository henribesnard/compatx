// src/api/ohada.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Création d'une instance axios configurée
const createApiInstance = (token?: string | null) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return axios.create({
    baseURL: API_URL,
    headers,
  });
};

// Types pour l'API OHADA
export interface QueryRequest {
  query: string;
  partie?: number | null;
  chapitre?: number | null;
  n_results?: number;
  include_sources?: boolean;
  stream?: boolean;
  save_to_conversation?: string | null;
}

export interface Source {
  document_id: string;
  metadata: {
    title?: string;
    partie?: number;
    chapitre?: number;
    document_type?: string;
  };
  relevance_score: number;
  preview: string;
}

export interface Performance {
  reformulation_time_seconds?: number;
  search_time_seconds?: number;
  context_time_seconds?: number;
  generation_time_seconds?: number;
  total_time_seconds: number;
}

export interface QueryResponse {
  id: string;
  query: string;
  answer: string;
  sources?: Source[];
  performance: Performance;
  timestamp: number;
  conversation_id?: string;
  user_message_id?: string;
  ia_message_id?: string;
}

export interface ApiInfo {
  status: string;
  service: string;
  version: string;
  endpoints: Record<string, string>;
}

export interface StreamStartEvent {
  id: string;
  query: string;
  timestamp: number;
  conversation_id?: string;
  user_message_id?: string;
}

export interface StreamProgressEvent {
  status: 'retrieving' | 'analyzing' | 'generating';
  completion: number;
}

export interface StreamChunkEvent {
  text: string;
  completion: number;
}

export interface StreamErrorEvent {
  error: string;
  id?: string;
  query?: string;
  timestamp?: number;
}

export interface StreamCallbacks {
  onStart?: (data: StreamStartEvent) => void;
  onProgress?: (data: StreamProgressEvent) => void;
  onChunk?: (text: string, completion: number) => void;
  onComplete?: (data: QueryResponse) => void;
  onError?: (error: StreamErrorEvent | Event) => void;
}

export interface HistoryResponse {
  history: Array<{
    query: string;
    answer: string;
    timestamp: number;
    metadata?: {
      performance?: Performance;
    };
  }>;
  count: number;
}

export interface QueryStatus {
  status: 'processing' | 'complete' | 'error';
  completion: number;
  error?: string;
}

// Client API pour communiquer avec l'API OHADA
export const ohadaApi = {
  // Obtenir des informations sur l'API
  async getApiInfo(): Promise<ApiInfo> {
    try {
      const api = createApiInstance();
      const response = await api.get<ApiInfo>('/');
      return response.data;
    } catch (error) {
      console.error('Error getting API info:', error);
      throw error;
    }
  },
  
  // Envoyer une requête standard (sans streaming)
  async query(queryText: string, options: Partial<QueryRequest> = {}, token?: string | null): Promise<QueryResponse> {
    try {
      const api = createApiInstance(token);
      const requestData: QueryRequest = {
        query: queryText,
        n_results: options.n_results || 5,
        include_sources: options.include_sources !== false,
        partie: options.partie || null,
        chapitre: options.chapitre || null,
        stream: false,
        save_to_conversation: options.save_to_conversation || null,
      };
      
      const response = await api.post<QueryResponse>('/query', requestData);
      return response.data;
    } catch (error) {
      console.error('Error querying OHADA API:', error);
      throw error;
    }
  },
  
  // Obtenir l'historique des conversations
  async getHistory(limit: number = 10, token?: string | null): Promise<HistoryResponse> {
    try {
      const api = createApiInstance(token);
      const response = await api.get<HistoryResponse>(`/history?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error getting history:', error);
      throw error;
    }
  },
  
  // Vérifier le statut d'une requête en cours
  async getQueryStatus(queryId: string): Promise<QueryStatus> {
    try {
      const api = createApiInstance();
      const response = await api.get<QueryStatus>(`/status/${queryId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking query status:', error);
      throw error;
    }
  },
  
  // Fonction pour le streaming de réponses
  streamQuery(
    queryText: string, 
    options: Partial<QueryRequest> = {},
    callbacks: StreamCallbacks,
    token?: string | null
  ): () => void {
    
    // Construire l'URL avec les paramètres
    const params = new URLSearchParams({
      query: queryText,
      include_sources: (options.include_sources !== false).toString(),
      n_results: (options.n_results || 5).toString(),
    });
    
    if (options.partie) params.append('partie', options.partie.toString());
    if (options.chapitre) params.append('chapitre', options.chapitre.toString());
    if (options.save_to_conversation) params.append('save_to_conversation', options.save_to_conversation);
    
    // Construire l'URL complète avec le token si fourni
    // Note: L'utilisation du token dans l'URL n'est pas une pratique recommandée pour la sécurité
    // mais c'est un contournement pour EventSource qui ne supporte pas les headers
    if (token) {
      params.append('_token', token);
    }
    
    // URL finale pour le streaming
    const streamUrl = `${API_URL}/stream?${params}`;
    
    // Créer l'EventSource pour le streaming
    // EventSource standard ne supporte pas les headers d'authentification
    const eventSource = new EventSource(streamUrl);
    
    // Événement de début de streaming
    eventSource.addEventListener('start', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as StreamStartEvent;
        if (callbacks.onStart) callbacks.onStart(data);
      } catch (error) {
        console.error('Error parsing start event:', error);
      }
    });
    
    // Événement de progression
    eventSource.addEventListener('progress', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as StreamProgressEvent;
        if (callbacks.onProgress) callbacks.onProgress(data);
      } catch (error) {
        console.error('Error parsing progress event:', error);
      }
    });
    
    // Événement de chunk (morceau de réponse)
    eventSource.addEventListener('chunk', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as StreamChunkEvent;
        if (callbacks.onChunk) callbacks.onChunk(data.text, data.completion);
      } catch (error) {
        console.error('Error parsing chunk event:', error);
      }
    });
    
    // Événement de complétion
    eventSource.addEventListener('complete', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as QueryResponse;
        if (callbacks.onComplete) callbacks.onComplete(data);
        eventSource.close();
      } catch (error) {
        console.error('Error parsing complete event:', error);
        eventSource.close();
      }
    });
    
    // Événement d'erreur
    eventSource.addEventListener('error', (event: Event) => {
      if (event instanceof MessageEvent) {
        try {
          const data = JSON.parse(event.data) as StreamErrorEvent;
          if (callbacks.onError) callbacks.onError(data);
        } catch (error) {
          console.error('Error parsing error event:', error);
          if (callbacks.onError) callbacks.onError(event);
        }
      } else {
        console.error('SSE Error:', event);
        if (callbacks.onError) callbacks.onError(event);
      }
      eventSource.close();
    });
    
    // Retourner une fonction pour fermer la connexion
    return () => {
      eventSource.close();
    };
  }
};