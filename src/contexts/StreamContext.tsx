import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useChat } from './ChatContext';
import { ohadaApi } from '../api/ohada';
import { StreamOptions, StreamProgress } from '../types/chat';
import { generateTempId } from '../utils/conversationUtils';
import { ApiQueryResponse } from '../types/api';

interface StreamContextProps {
  isStreaming: boolean;
  streamedText: string;
  streamingProgress: number;
  streamingMessageId: string | null;
  streamingConversationId: string | null;
  error: Error | null;
  startStream: (query: string, conversationId?: string) => Promise<void>;
  cancelStream: () => void;
  clearStreamingState: () => void;
}

const StreamContext = createContext<StreamContextProps | undefined>(undefined);

export const StreamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [streamingProgress, setStreamingProgress] = useState(0);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [streamingConversationId, setStreamingConversationId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  // Utiliser useRef pour suivre le texte accumulé
  const accumulatedTextRef = useRef('');
  
  const { isAuthenticated, getToken } = useAuth();
  const { 
    currentConversation, 
    createConversation, 
    addMessageToConversation, 
    updateStreamingMessage,
    finalizeMessage,
    refreshConversations
  } = useChat();
  
  // Démarrer une requête streaming
  const startStream = useCallback(async (query: string, conversationId?: string) => {
    setError(null);
    
    // Identifier la conversation à utiliser
    let targetConversationId = conversationId || currentConversation?.id;
    let targetConversation = currentConversation;
    
    try {
      // Créer une nouvelle conversation si nécessaire
      if (!targetConversationId) {
        const newTitle = query.length > 30 ? `${query.substring(0, 27)}...` : query;
        const newConversation = await createConversation(newTitle);
        targetConversationId = newConversation.id;
        targetConversation = newConversation;
      }
      
      if (!targetConversationId) {
        throw new Error('Impossible de créer ou d\'identifier une conversation');
      }
      
      // Préparer les IDs des messages
      const userMessageId = generateTempId();
      const assistantMessageId = generateTempId();
      
      // Ajouter le message de l'utilisateur
      addMessageToConversation(targetConversationId, {
        id: userMessageId,
        content: query,
        role: 'user',
        timestamp: new Date()
      });
      
      // Ajouter un message vide pour l'assistant
      addMessageToConversation(targetConversationId, {
        id: assistantMessageId,
        content: '',
        role: 'assistant',
        timestamp: new Date()
      });
      
      // Configurer les options de streaming
      const streamOptions: StreamOptions = {
        include_sources: true,
        n_results: 5
      };
      
      // Si authentifié, ajouter l'option pour sauvegarder dans la conversation
      if (isAuthenticated && targetConversation?.serverId) {
        streamOptions.save_to_conversation = targetConversation.serverId;
      } else {
        streamOptions.create_conversation = true;
      }
      
      // Réinitialiser le texte accumulé
      accumulatedTextRef.current = '';
      
      // Démarrer le streaming
      setIsStreaming(true);
      setStreamedText('');
      setStreamingProgress(0);
      setStreamingMessageId(assistantMessageId);
      setStreamingConversationId(targetConversationId);
      
      // Obtenir le token si authentifié
      const token = isAuthenticated ? getToken() : undefined;
      
      // Démarrer la requête de streaming
      ohadaApi.streamQuery(
        query,
        streamOptions,
        {
          onStart: (data) => {
            console.log('Stream started:', data);
          },
          onProgress: (progress: StreamProgress) => {
            setStreamingProgress(progress.completion || 0);
          },
          onChunk: (text: string) => {
            // Accumuler le texte
            accumulatedTextRef.current += text;
            
            // Mettre à jour l'état
            setStreamedText(accumulatedTextRef.current);
            
            // Mettre à jour le message si les IDs sont disponibles
            if (targetConversationId && assistantMessageId) {
              updateStreamingMessage(targetConversationId, assistantMessageId, accumulatedTextRef.current);
            }
          },
          onComplete: (data: ApiQueryResponse) => {
            // Finaliser le message avec les données complètes d'abord
            if (targetConversationId && assistantMessageId) {
              if (data.sources) {
                const finalMessage = {
                  id: assistantMessageId,
                  serverId: data.ia_message_id,
                  content: data.answer,
                  role: 'assistant' as const,
                  timestamp: new Date(),
                  sources: data.sources.map(src => ({
                    documentId: src.document_id,
                    title: src.metadata?.title || 'Document sans titre',
                    metadata: {
                      partie: src.metadata?.partie,
                      chapitre: src.metadata?.chapitre,
                      title: src.metadata?.title,
                      documentType: src.metadata?.document_type
                    },
                    relevanceScore: src.relevance_score,
                    preview: src.preview || ''
                  }))
                };
                
                finalizeMessage(targetConversationId, assistantMessageId, finalMessage);
              } else {
                finalizeMessage(targetConversationId, assistantMessageId, {
                  id: assistantMessageId,
                  serverId: data.ia_message_id,
                  content: data.answer,
                  role: 'assistant',
                  timestamp: new Date()
                });
              }
            }

            // Arrêter le streaming
            setIsStreaming(false);
            
            // Si authentifié, rafraîchir les conversations pour obtenir les ID serveur
            // mais avec un délai pour éviter la redirection immédiate
            if (isAuthenticated) {
              setTimeout(() => {
                refreshConversations();
              }, 500);
            }
            
            // Réinitialiser l'état de streaming
            clearStreamingState();
          },
          onError: (err: Error) => {
            setIsStreaming(false);
            setError(err);
            
            // Mettre à jour le message avec l'erreur
            if (streamingMessageId && streamingConversationId) {
              updateStreamingMessage(
                streamingConversationId, 
                streamingMessageId, 
                `Erreur: ${err.message || 'Une erreur est survenue lors de la génération de la réponse.'}`
              );
            }
            
            // Réinitialiser l'état de streaming
            clearStreamingState();
          }
        },
        token
      );
    } catch (err) {
      console.error('Erreur lors du démarrage du stream:', err);
      setError(err instanceof Error ? err : new Error('Erreur lors du démarrage du stream'));
      setIsStreaming(false);
    }
  }, [
    currentConversation, 
    createConversation, 
    addMessageToConversation, 
    updateStreamingMessage,
    finalizeMessage,
    refreshConversations,
    isAuthenticated,
    getToken
  ]);
  
  // Annuler le stream en cours
  const cancelStream = useCallback(() => {
    ohadaApi.cancelStream();
    setIsStreaming(false);
    
    // Mettre à jour le message avec l'indication d'annulation
    if (streamingMessageId && streamingConversationId) {
      const currentContent = accumulatedTextRef.current || '';
      const cancelMessage = currentContent 
        ? `${currentContent}\n\n[Génération interrompue par l'utilisateur]` 
        : "[Génération interrompue par l'utilisateur]";
      
      updateStreamingMessage(streamingConversationId, streamingMessageId, cancelMessage);
    }
  }, [streamingMessageId, streamingConversationId, updateStreamingMessage]);
  
  // Réinitialiser l'état de streaming
  const clearStreamingState = useCallback(() => {
    setStreamedText('');
    setStreamingProgress(0);
    setStreamingMessageId(null);
    setStreamingConversationId(null);
    accumulatedTextRef.current = '';
  }, []);
  
  return (
    <StreamContext.Provider value={{
      isStreaming,
      streamedText,
      streamingProgress,
      streamingMessageId,
      streamingConversationId,
      error,
      startStream,
      cancelStream,
      clearStreamingState
    }}>
      {children}
    </StreamContext.Provider>
  );
};

export const useStream = () => {
  const context = useContext(StreamContext);
  if (context === undefined) {
    throw new Error('useStream must be used within a StreamProvider');
  }
  return context;
};