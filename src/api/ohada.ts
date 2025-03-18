import axios, { AxiosInstance } from 'axios';
import { ApiErrorResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

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
  onError?: (error: StreamErrorEvent | Error) => void;
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

/**
 * Création d'une instance axios configurée avec les en-têtes appropriés
 */
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

/**
 * Gestionnaire d'erreurs commun pour toutes les requêtes API
 */
const handleApiError = (error: unknown): Error => {
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
    } else if (axiosError.response?.status === 403) {
      return new Error('Accès refusé. Vérifiez vos permissions ou reconnectez-vous.');
    }
  }
  
  return new Error('Une erreur inattendue est survenue. Veuillez réessayer.');
};

/**
 * Classe utilitaire pour le traitement des événements SSE
 */
class StreamParser {
  private buffer = '';
  private currentEvent = '';
  private decoder = new TextDecoder();
  
  constructor(private callbacks: StreamCallbacks) {}
  
  processChunk(chunk: Uint8Array): void {
    this.buffer += this.decoder.decode(chunk, { stream: true });
    this.processBuffer();
  }
  
  processFinalChunk(chunk?: Uint8Array): void {
    if (chunk) {
      this.buffer += this.decoder.decode(chunk);
    } else {
      this.buffer += this.decoder.decode();
    }
    this.processBuffer();
  }
  
  private processBuffer(): void {
    let lineEnd;
    
    while ((lineEnd = this.buffer.indexOf('\n')) >= 0) {
      const line = this.buffer.slice(0, lineEnd).trim();
      this.buffer = this.buffer.slice(lineEnd + 1);
      
      if (!line) continue;
      
      if (line.startsWith('event:')) {
        this.currentEvent = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        const data = line.slice(5).trim();
        this.handleEvent(this.currentEvent, data);
      }
    }
  }
  
  private handleEvent(eventType: string, data: string): void {
    try {
      const parsedData = JSON.parse(data);
      
      switch(eventType) {
        case 'start':
          if (this.callbacks.onStart) this.callbacks.onStart(parsedData);
          break;
        case 'progress':
          if (this.callbacks.onProgress) this.callbacks.onProgress(parsedData);
          break;
        case 'chunk':
          if (this.callbacks.onChunk) this.callbacks.onChunk(parsedData.text, parsedData.completion);
          break;
        case 'complete':
          if (this.callbacks.onComplete) this.callbacks.onComplete(parsedData);
          break;
        case 'error':
          if (this.callbacks.onError) this.callbacks.onError(parsedData);
          break;
        default:
          // Si c'est un chunk sans événement spécifié
          if (parsedData.text !== undefined && parsedData.completion !== undefined && this.callbacks.onChunk) {
            this.callbacks.onChunk(parsedData.text, parsedData.completion);
          }
      }
    } catch (e) {
      console.error(`Error parsing event data (${eventType}):`, e, data);
    }
  }
}

// Client API principal pour communiquer avec l'API OHADA
export const ohadaApi = {
  /**
   * Obtenir des informations sur l'API
   */
  async getApiInfo(): Promise<ApiInfo> {
    try {
      const api = createApiInstance();
      const response = await api.get<ApiInfo>('/');
      return response.data;
    } catch (error) {
      console.error('Error getting API info:', error);
      throw handleApiError(error);
    }
  },
  
  /**
   * Envoyer une requête standard (sans streaming)
   */
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
      throw handleApiError(error);
    }
  },
  
  /**
   * Obtenir l'historique des conversations
   */
  async getHistory(limit: number = 10, token?: string | null): Promise<HistoryResponse> {
    try {
      const api = createApiInstance(token);
      const response = await api.get<HistoryResponse>(`/history?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error getting history:', error);
      throw handleApiError(error);
    }
  },
  
  /**
   * Vérifier le statut d'une requête en cours
   */
  async getQueryStatus(queryId: string, token?: string | null): Promise<QueryStatus> {
    try {
      const api = createApiInstance(token);
      const response = await api.get<QueryStatus>(`/status/${queryId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking query status:', error);
      throw handleApiError(error);
    }
  },
  
  /**
   * Méthode principale pour le streaming de réponses
   * Utilise fetch avec ReadableStream pour une compatibilité maximale
   * 
   * @param queryText - Le texte de la requête
   * @param options - Options supplémentaires pour la requête
   * @param callbacks - Fonctions de rappel pour traiter les événements de streaming
   * @param token - Token d'authentification 
   * @returns Fonction pour annuler le stream
   */
  streamQuery(
    queryText: string, 
    options: Partial<QueryRequest> = {},
    callbacks: StreamCallbacks,
    token?: string | null
  ): () => void {
    // Construction des paramètres d'URL
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
    
    // Lance la requête fetch en mode streaming
    (async () => {
      try {
        // Entêtes avec authorization
        const headers: Record<string, string> = {
          'Accept': 'text/event-stream'
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        console.log("Streaming request with headers:", headers);
        
        const response = await fetch(url, {
          method: 'GET',
          headers,
          signal: controller.signal
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
        }
        
        // Vérifier que le body est disponible
        if (!response.body) {
          throw new Error('ReadableStream not supported in this browser.');
        }
        
        console.log("Stream connection established successfully");
        
        const reader = response.body.getReader();
        const parser = new StreamParser(callbacks);
        
        // Boucle de lecture du stream
        while (true) {
          const { value, done } = await reader.read();
          
          if (done) {
            parser.processFinalChunk();
            console.log('Stream complete');
            break;
          }
          
          parser.processChunk(value);
        }
      } catch (error: unknown) {
        const typedError = error as Error;
        if (typedError.name === 'AbortError') {
          console.log('Stream aborted by user');
        } else {
          console.error('Stream error:', typedError);
          if (callbacks.onError) {
            callbacks.onError(typedError);
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
  
  /**
   * Méthode alternative utilisant EventSource
   * Conservé pour compatibilité, mais n'est pas recommandé
   * car EventSource ne permet pas d'ajouter des en-têtes d'auth
   * 
   * Note: Cette méthode est obsolète et ne devrait plus être utilisée
   */
  streamWithEventSource(
    queryText: string, 
    options: Partial<QueryRequest> = {},
    callbacks: StreamCallbacks,
    token?: string | null
  ): () => void {
    console.warn("streamWithEventSource is deprecated. Use streamQuery instead.");
    
    // Construction des paramètres d'URL
    const params = new URLSearchParams({
      query: queryText,
      include_sources: (options.include_sources !== false).toString(),
      n_results: (options.n_results || 5).toString(),
    });
    
    if (options.partie) params.append('partie', options.partie.toString());
    if (options.chapitre) params.append('chapitre', options.chapitre.toString());
    if (options.save_to_conversation) params.append('save_to_conversation', options.save_to_conversation);
    
    // Pour EventSource, nous devons passer le token dans l'URL car
    // EventSource ne supporte pas l'ajout d'en-têtes personnalisés
    if (token) {
      params.append('_token', token);
    }
    
    const url = `${API_URL}/stream?${params}`;
    
    // Variables pour gérer l'EventSource
    let eventSource: EventSource | null = null;
    
    try {
      // Créer une nouvelle instance EventSource
      eventSource = new EventSource(url);
      
      // Configurer les gestionnaires d'événements
      eventSource.onopen = () => {
        console.log('EventSource connection established');
      };
      
      // Événement de démarrage
      eventSource.addEventListener('start', (event) => {
        if (callbacks.onStart && event.data) {
          try {
            const data = JSON.parse(event.data);
            callbacks.onStart(data);
          } catch (e) {
            console.error('Error parsing start event:', e);
          }
        }
      });
      
      // Événement de progression
      eventSource.addEventListener('progress', (event) => {
        if (callbacks.onProgress && event.data) {
          try {
            const data = JSON.parse(event.data);
            callbacks.onProgress(data);
          } catch (e) {
            console.error('Error parsing progress event:', e);
          }
        }
      });
      
      // Événement de fragment
      eventSource.addEventListener('chunk', (event) => {
        if (callbacks.onChunk && event.data) {
          try {
            const data = JSON.parse(event.data);
            callbacks.onChunk(data.text, data.completion);
          } catch (e) {
            console.error('Error parsing chunk event:', e);
          }
        }
      });
      
      // Événement de fin
      eventSource.addEventListener('complete', (event) => {
        if (callbacks.onComplete && event.data) {
          try {
            const data = JSON.parse(event.data);
            callbacks.onComplete(data);
          } catch (e) {
            console.error('Error parsing complete event:', e);
          }
        }
        
        // Fermer la connexion
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
      });
      
      // Événement d'erreur
      eventSource.addEventListener('error', (event) => {
        if (callbacks.onError) {
          if (event instanceof MessageEvent && event.data) {
            try {
              const errorData = JSON.parse(event.data);
              callbacks.onError(errorData);
            } catch (e) {
              callbacks.onError(new Error("Error parsing error event data"));
            }
          } else {
            callbacks.onError(new Error("EventSource connection error"));
          }
        }
        
        // Fermer la connexion en cas d'erreur
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
      });
      
      // Gestion d'erreur générale de l'EventSource
      eventSource.onerror = (event) => {
        console.error('EventSource error:', event);
        if (callbacks.onError) {
          callbacks.onError(new Error("EventSource general error"));
        }
        
        // Fermer la connexion
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
      };
      
    } catch (error) {
      console.error('Error creating EventSource:', error);
      if (callbacks.onError) {
        callbacks.onError(error as Error);
      }
    }
    
    // Retourner une fonction pour fermer la connexion
    return () => {
      if (eventSource) {
        console.log('Closing EventSource connection');
        eventSource.close();
        eventSource = null;
      }
    };
  }
};