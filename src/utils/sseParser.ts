import { SSEEvent } from '../types/chat';

/**
 * Parse un chunk de données SSE en événements structurés
 */
export function parseSSEEvents(chunk: string): SSEEvent[] {
  const events: SSEEvent[] = [];
  const lines = chunk.split('\n');
  let event: Partial<SSEEvent> = {};
  
  for (const line of lines) {
    if (line === '') {
      if (event.type && event.data) {
        events.push(event as SSEEvent);
        event = {};
      }
      continue;
    }
    
    if (line.startsWith('event:')) {
      event.type = line.substring(6).trim();
    } else if (line.startsWith('data:')) {
      event.data = line.substring(5).trim();
    }
  }
  
  // Ajouter le dernier événement s'il est complet
  if (event.type && event.data) {
    events.push(event as SSEEvent);
  }
  
  return events;
}

/**
 * Traite un seul événement SSE et retourne un objet structuré
 */
export function processSSEEvent(event: SSEEvent): { type: string; payload: any } {
  try {
    const payload = JSON.parse(event.data);
    return { type: event.type, payload };
  } catch (error) {
    console.error('Erreur de parsing SSE JSON:', error);
    return { type: event.type, payload: { error: 'Format de données invalide' } };
  }
}