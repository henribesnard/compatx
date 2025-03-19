// src/services/streamService.ts
import { StreamCallbacks, StreamOptions, SSEEvent } from '../types/chat';
import { parseSSEEvents, processSSEEvent } from '../utils/sseParser';

class StreamService {
  private abortController: AbortController | null = null;
  
  /**
   * Configure et démarre une connexion de streaming SSE
   */
  setupStream(
    options: StreamOptions & { query: string }, 
    callbacks: StreamCallbacks,
    token?: string // Token à utiliser dans l'en-tête Authorization
  ): AbortController {
    // Annuler tout stream existant
    if (this.abortController) {
      this.abortController.abort();
    }
    
    // Créer un nouveau contrôleur d'annulation
    this.abortController = new AbortController();
    
    // Extraire la query et les autres options
    const { query, ...otherOptions } = options;
    
    // Construire l'URL avec les paramètres
    const urlParams = new URLSearchParams({ query });
    
    // Ajouter les paramètres optionnels
    if (otherOptions.partie !== undefined) urlParams.append('partie', otherOptions.partie.toString());
    if (otherOptions.chapitre !== undefined) urlParams.append('chapitre', otherOptions.chapitre.toString());
    if (otherOptions.n_results !== undefined) urlParams.append('n_results', otherOptions.n_results.toString());
    if (otherOptions.include_sources !== undefined) urlParams.append('include_sources', otherOptions.include_sources.toString());
    if (otherOptions.save_to_conversation) urlParams.append('save_to_conversation', otherOptions.save_to_conversation);
    if (otherOptions.create_conversation !== undefined) urlParams.append('create_conversation', otherOptions.create_conversation.toString());

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    const url = `${API_URL}/stream?${urlParams.toString()}`;
    
    console.log('URL de streaming:', url);
    
    // Démarrer la requête fetch
    this.startFetchStream(url, callbacks, token);
    
    return this.abortController;
  }
  
  /**
   * Démarre la requête fetch et gère le stream
   */
  private async startFetchStream(url: string, callbacks: StreamCallbacks, token?: string) {
    try {
      // Préparer les en-têtes avec l'en-tête d'authentification si présent
      const headers: Record<string, string> = {
        'Accept': 'text/event-stream',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('En-tête Authorization ajouté pour le streaming');
      }
      
      // Effectuer la requête
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: this.abortController?.signal,
        credentials: 'include' // Pour inclure les cookies d'authentification
      });
      
      if (!response.ok) {
        console.error(`Erreur HTTP: ${response.status} ${response.statusText}`);
        throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
      }
      
      // Utiliser ReadableStream pour traiter le stream
      const reader = response.body?.getReader();
      
      if (!reader) {
        throw new Error("Le stream n'est pas lisible");
      }
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          // Décoder le chunk et l'ajouter au buffer
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // Parser les événements dans le buffer
          const events = parseSSEEvents(buffer);
          
          // Traiter chaque événement
          events.forEach(event => {
            const { type, payload } = processSSEEvent(event);
            
            // Déclencher le callback approprié en fonction du type d'événement
            switch (type) {
              case 'start':
                if (callbacks.onStart) callbacks.onStart(payload);
                break;
              
              case 'progress':
                if (callbacks.onProgress) callbacks.onProgress(payload);
                break;
              
              case 'chunk':
                if (callbacks.onChunk) callbacks.onChunk(payload.text || '');
                break;
              
              case 'complete':
                if (callbacks.onComplete) callbacks.onComplete(payload);
                break;
              
              case 'error':
                if (callbacks.onError) callbacks.onError(new Error(payload.error || 'Erreur inconnue'));
                break;
            }
          });
          
          // Mettre à jour le buffer en supprimant les événements déjà traités
          if (events.length > 0) {
            const lastEvent = events[events.length - 1];
            const lastEventIndex = buffer.lastIndexOf(lastEvent.data) + lastEvent.data.length;
            buffer = buffer.substring(lastEventIndex);
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('Stream annulé par l\'utilisateur');
        } else {
          throw err;
        }
      }
    } catch (err: any) {
      console.error('Erreur de streaming:', err);
      if (err.name !== 'AbortError' && callbacks.onError) {
        callbacks.onError(err);
      }
    }
  }
  
  /**
   * Annule le stream en cours
   */
  cancelStream() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}

// Exporter une instance unique du service
export const streamService = new StreamService();