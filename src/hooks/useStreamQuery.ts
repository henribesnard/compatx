import { useState, useCallback } from 'react';
import { useStream } from '../contexts/StreamContext';
import { useChat } from '../contexts/ChatContext';

/**
 * Hook pour gérer les requêtes en streaming
 */
export function useStreamQuery() {
  const [query, setQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { 
    isStreaming, 
    streamedText, 
    streamingProgress, 
    error,
    startStream, 
    cancelStream 
  } = useStream();
  
  const { currentConversation, createConversation } = useChat();
  
  // Soumettre une requête
  const submitQuery = useCallback(async (input: string, conversationId?: string) => {
    if (!input.trim() || isStreaming || isSubmitting) return;
    
    setQuery(input);
    setIsSubmitting(true);
    
    try {
      // Utiliser la conversation fournie ou la conversation active ou en créer une nouvelle
      const targetId = conversationId || currentConversation?.id;
      
      await startStream(input, targetId);
    } catch (error) {
      console.error('Erreur lors de la soumission de la requête:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [isStreaming, isSubmitting, startStream, currentConversation]);
  
  return {
    query,
    setQuery,
    submitQuery,
    cancelQuery: cancelStream,
    isSubmitting,
    isStreaming,
    streamedText,
    streamingProgress,
    error
  };
}