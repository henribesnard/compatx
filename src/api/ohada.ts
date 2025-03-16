// src/api/ohada.ts
import axios from 'axios';

const API_URL = 'http://localhost:8080'; // Remplacer par l'URL de votre API OHADA

// Création d'une instance axios configurée
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types pour l'API OHADA
export interface QueryRequest {
  query: string;
  partie?: number | null;
  chapitre?: number | null;
  n_results?: number;
  include_sources?: boolean;
  stream?: boolean;
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
      const response = await api.get<ApiInfo>('/');
      return response.data;
    } catch (error) {
      console.error('Error getting API info:', error);
      throw error;
    }
  },
  
  // Envoyer une requête standard (sans streaming)
  async query(queryText: string, options: Partial<QueryRequest> = {}): Promise<QueryResponse> {
    try {
      const requestData: QueryRequest = {
        query: queryText,
        n_results: options.n_results || 5,
        include_sources: options.include_sources !== false,
        partie: options.partie || null,
        chapitre: options.chapitre || null,
        stream: false,
      };
      
      const response = await api.post<QueryResponse>('/query', requestData);
      return response.data;
    } catch (error) {
      console.error('Error querying OHADA API:', error);
      throw error;
    }
  },
  
  // Obtenir l'historique des conversations
  async getHistory(limit: number = 10): Promise<HistoryResponse> {
    try {
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
    callbacks: StreamCallbacks
  ): () => void {
    
    // Construire l'URL avec les paramètres
    const params = new URLSearchParams({
      query: queryText,
      include_sources: (options.include_sources !== false).toString(),
      n_results: (options.n_results || 5).toString(),
    });
    
    if (options.partie) params.append('partie', options.partie.toString());
    if (options.chapitre) params.append('chapitre', options.chapitre.toString());
    
    // Créer l'EventSource pour le streaming
    const eventSource = new EventSource(`${API_URL}/stream?${params}`);
    
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