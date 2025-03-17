// src/api/ohada.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ApiErrorResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Création d'une instance axios configurée
const createApiInstance = (token?: string | null): AxiosInstance => {
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
      throw this.handleApiError(error);
    }
  },
  
  // Gérer les erreurs d'API
  handleApiError(error: unknown): Error {
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
        return new Error('Session expirée. Veuillez vous reconnecter.');
      }
    }
    
    return new Error('Une erreur inattendue est survenue. Veuillez réessayer.');
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
      throw this.handleApiError(error);
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
      throw this.handleApiError(error);
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
      throw this.handleApiError(error);
    }
  },
  
  // Fonction pour le streaming de réponses - implémentation avec fetch
  streamQuery(
    queryText: string, 
    options: Partial<QueryRequest> = {},
    callbacks: StreamCallbacks,
    token?: string | null
  ): () => void {
    // Construire l'URL avec les paramètres (sans le token)
    const params = new URLSearchParams({
      query: queryText,
      include_sources: (options.include_sources !== false).toString(),
      n_results: (options.n_results || 5).toString(),
    });
    
    if (options.partie) params.append('partie', options.partie.toString());
    if (options.chapitre) params.append('chapitre', options.chapitre.toString());
    if (options.save_to_conversation) params.append('save_to_conversation', options.save_to_conversation);
    
    const url = `${API_URL}/stream?${params}`;
    console.log("Stream URL:", url);
    
    // Créer un contrôleur d'abandon
    const controller = new AbortController();
    
    // Lancer la requête fetch en mode streaming
    (async () => {
      try {
        // Entêtes avec authorization comme dans Postman
        const headers: Record<string, string> = {
          'Accept': 'text/event-stream'
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        console.log("Fetch request with headers:", headers);
        
        const response = await fetch(url, {
          method: 'GET',
          headers,
          signal: controller.signal
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // Vérifier que le body est disponible
        if (!response.body) {
          throw new Error('ReadableStream not supported in this browser.');
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let currentEvent = '';
        
        console.log("Stream connection established successfully");
        
        // Boucle de lecture du stream
        while (true) {
          const { value, done } = await reader.read();
          
          if (done) {
            console.log('Stream complete');
            break;
          }
          
          const chunk = decoder.decode(value, { stream: true });
          console.log("Raw chunk received:", chunk);
          buffer += chunk;
          
          // Traiter les lignes complètes
          let lineEnd;
          while ((lineEnd = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, lineEnd).trim();
            buffer = buffer.slice(lineEnd + 1);
            
            if (!line) continue;
            
            if (line.startsWith('event:')) {
              currentEvent = line.slice(6).trim();
              console.log("Event type:", currentEvent);
            } else if (line.startsWith('data:')) {
              const data = line.slice(5).trim();
              console.log(`${currentEvent} data:`, data);
              
              try {
                const parsedData = JSON.parse(data);
                
                // Gérer les différents types d'événements
                switch(currentEvent) {
                  case 'start':
                    if (callbacks.onStart) callbacks.onStart(parsedData as StreamStartEvent);
                    break;
                  case 'progress':
                    if (callbacks.onProgress) callbacks.onProgress(parsedData as StreamProgressEvent);
                    break;
                  case 'chunk':
                    if (callbacks.onChunk) callbacks.onChunk(parsedData.text, parsedData.completion);
                    break;
                  case 'complete':
                    if (callbacks.onComplete) callbacks.onComplete(parsedData as QueryResponse);
                    return; // Fin du streaming
                  case 'error':
                    if (callbacks.onError) callbacks.onError(parsedData as StreamErrorEvent);
                    return;
                  default:
                    // Si c'est un chunk sans événement spécifié
                    if (parsedData.text !== undefined && parsedData.completion !== undefined) {
                      if (callbacks.onChunk) callbacks.onChunk(parsedData.text, parsedData.completion);
                    }
                }
              } catch (e) {
                console.error('Error parsing event data:', e, data);
              }
            }
          }
        }
      } catch (error: unknown) {
        const typedError = error as Error;
        if (typedError.name === 'AbortError') {
          console.log('Stream aborted by user');
        } else {
          console.error('Stream error:', typedError);
          if (callbacks.onError) {
            // Type cast pour satisfaire TypeScript
            callbacks.onError(typedError as unknown as Event);
          }
        }
      }
    })();
    
    // Retourner une fonction pour annuler le stream
    return () => {
      console.log("Aborting stream request");
      controller.abort();
    };
  },
  
  // Version alternative avec axios pour comparaison
  streamWithAxios(
    queryText: string,
    options: Partial<QueryRequest> = {},
    callbacks: StreamCallbacks,
    token?: string | null
  ): () => void {
    // Configuration similaire à l'exemple Postman
    const params = new URLSearchParams({
      query: queryText,
      include_sources: (options.include_sources !== false).toString(),
      n_results: (options.n_results || 5).toString(),
    });
    
    if (options.partie) params.append('partie', options.partie.toString());
    if (options.chapitre) params.append('chapitre', options.chapitre.toString());
    if (options.save_to_conversation) params.append('save_to_conversation', options.save_to_conversation);
    
    const url = `${API_URL}/stream?${params}`;
    console.log("Axios Stream URL:", url);
    
    // Configuration Axios similaire à Postman
    const config: AxiosRequestConfig = {
      method: 'get',
      url: url,
      headers: { 
        'Accept': 'text/event-stream'
      },
      responseType: 'stream',
      maxRedirects: 0
    };
    
    if (token) {
      // Utiliser type assertion pour résoudre l'erreur TypeScript
      (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
    
    // Créer un controller pour l'annulation
    const controller = new AbortController();
    
    // Assigner le signal au config en utilisant une assertion de type
    (config as unknown as { signal: AbortSignal }).signal = controller.signal;
    
    // Faire la requête
    axios(config)
      .then(response => {
        console.log("Axios stream response received");
        // Note: Axios ne gère pas nativement les SSE comme fetch
        // On ne traite pas directement response.data ici pour éviter l'erreur
      })
      .catch(error => {
        console.error("Axios stream error:", error);
        if (callbacks.onError) {
          callbacks.onError(error as unknown as Event);
        }
      });
    
    return () => {
      console.log("Aborting axios stream");
      controller.abort();
    };
  }
};