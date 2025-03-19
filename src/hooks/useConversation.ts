import { useState, useEffect, useCallback } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { FeedbackData, Message } from '../types';
import { conversationApi } from '../api/conversation';

/**
 * Hook pour gérer une conversation spécifique
 */
export function useConversation(conversationId?: string) {
  const { 
    conversations, 
    currentConversation, 
    selectConversation,
    updateConversationTitle,
    isLoading: isChatLoading
  } = useChat();
  
  const { isAuthenticated, getToken } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ID de la conversation à utiliser (fourni ou actuelle)
  const targetId = conversationId || currentConversation?.id;
  
  // Charger les messages lorsque la conversation change
  useEffect(() => {
    if (!targetId) {
      setMessages([]);
      return;
    }
    
    const conversation = conversations.find(c => c.id === targetId) || currentConversation;
    
    if (conversation) {
      setMessages(conversation.messages);
    } else {
      // Si la conversation n'est pas chargée, la sélectionner
      if (targetId) {
        selectConversation(targetId);
      }
    }
  }, [targetId, conversations, currentConversation, selectConversation]);
  
  // Ajouter un feedback à un message
  const addFeedback = useCallback(async (
    messageId: string, 
    feedback: FeedbackData
  ): Promise<boolean> => {
    if (!isAuthenticated || !targetId) return false;
    
    const message = messages.find(m => m.id === messageId);
    if (!message?.serverId) return false;
    
    setError(null);
    
    try {
      const token = getToken();
      if (!token) throw new Error('Token non disponible');
      
      await conversationApi.addFeedback(message.serverId, feedback, token);
      
      return true;
    } catch (err) {
      console.error('Erreur lors de l\'ajout du feedback:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout du feedback');
      return false;
    }
  }, [isAuthenticated, targetId, messages, getToken]);
  
  return {
    conversation: targetId ? conversations.find(c => c.id === targetId) || currentConversation : null,
    messages,
    isLoading: isChatLoading || isLoadingMessages,
    error,
    addFeedback,
    updateTitle: (title: string) => targetId ? updateConversationTitle(targetId, title) : Promise.resolve(false)
  };
}