// src/contexts/ChatContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Conversation, Source } from '../types';
import { useAuth } from './AuthContext';
import { conversationService } from '../services/conversationService';
import { messageService } from '../services/messageService';
import { 
  loadConversationsFromStorage, 
  saveConversationsToStorage,
  hasMessageWithContent,
  initialConversation
} from '../utils/conversationUtils';

interface ChatContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  createNewConversation: () => void;
  selectConversation: (id: string) => void;
  addMessage: (content: string, role: 'user' | 'assistant' | 'system', sources?: Source[], force?: boolean) => void;
  updateConversationTitle: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;
  isLoadingConversations: boolean;
  addFeedback: (messageId: string, rating: number, comment?: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, getToken } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState<boolean>(true);
  const [isCreatingConversation, setIsCreatingConversation] = useState<boolean>(false);
  const [isSyncingConversation, setIsSyncingConversation] = useState<boolean>(false);

  // Obtenir le token de manière sécurisée
  const getValidToken = useCallback((): string | null => {
    if (!isAuthenticated) return null;
    return getToken();
  }, [isAuthenticated, getToken]);

  // Charger les conversations au démarrage
  useEffect(() => {
    const loadConversations = async () => {
      if (!isLoadingConversations) return;
      
      try {
        if (isAuthenticated) {
          try {
            const token = getValidToken();
            if (!token) throw new Error("No authentication token available");
            
            const serverConversations = await conversationService.fetchConversations(token);
            
            setConversations(serverConversations);
            
            if (serverConversations.length > 0) {
              setCurrentConversation(serverConversations[0]);
            } else {
              setCurrentConversation(null);
            }
          } catch (error) {
            console.error('Error fetching conversations from server:', error);
            const localConversations = loadConversationsFromStorage();
            setConversations(localConversations);
            if (localConversations.length > 0 && !currentConversation) {
              setCurrentConversation(localConversations[0]);
            }
          }
        } else {
          const localConversations = loadConversationsFromStorage();
          setConversations(localConversations);
          if (localConversations.length > 0 && !currentConversation) {
            setCurrentConversation(localConversations[0]);
          }
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
        const defaultConversations = [initialConversation];
        setConversations(defaultConversations);
        setCurrentConversation(defaultConversations[0]);
      } finally {
        setIsLoadingConversations(false);
      }
    };
    
    loadConversations();
  }, [isAuthenticated, getValidToken, isLoadingConversations, currentConversation]);

  // Sauvegarder les conversations dans localStorage
  useEffect(() => {
    saveConversationsToStorage(conversations, isAuthenticated);
  }, [conversations, isAuthenticated]);

  // Rafraîchir manuellement les conversations
  const refreshConversations = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoadingConversations(true);
    
    try {
      const token = getValidToken();
      if (!token) throw new Error("No authentication token available");
      
      const serverConversations = await conversationService.fetchConversations(token);
      
      setConversations(serverConversations);
      
      if (currentConversation && currentConversation.serverId) {
        const updatedCurrentConv = serverConversations.find(
          conv => conv.serverId === currentConversation.serverId
        );
        
        if (updatedCurrentConv) {
          setCurrentConversation(updatedCurrentConv);
        } else if (serverConversations.length > 0) {
          setCurrentConversation(serverConversations[0]);
        } else {
          setCurrentConversation(null);
        }
      }
    } catch (error) {
      console.error('Error refreshing conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [isAuthenticated, getValidToken, currentConversation]);

  // Synchroniser une conversation spécifique
  const syncConversation = useCallback(async (conversationId: string, serverId?: string) => {
    if (!isAuthenticated || !serverId || isSyncingConversation) return null;
    
    setIsSyncingConversation(true);
    
    try {
      const token = getValidToken();
      if (!token) throw new Error("No authentication token available");
      
      const updatedConversation = await conversationService.fetchConversation(token, serverId);
      
      // Préserver l'ID local
      updatedConversation.id = conversationId;
      
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === conversationId ? updatedConversation : conv
        )
      );
      
      if (currentConversation && currentConversation.id === conversationId) {
        setCurrentConversation(updatedConversation);
      }
      
      return updatedConversation;
    } catch (error) {
      console.error('Error syncing conversation:', error);
      return null;
    } finally {
      setIsSyncingConversation(false);
    }
  }, [isAuthenticated, getValidToken, currentConversation, isSyncingConversation]);

  // Créer une nouvelle conversation
  const createNewConversation = useCallback(() => {
    if (isCreatingConversation) return;
    
    setIsCreatingConversation(true);
    
    // Créer localement
    const newConversation = conversationService.createLocalConversation();
    
    // Mettre à jour l'UI immédiatement
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversation(newConversation);
    
    setIsCreatingConversation(false);
    
    // Synchroniser avec le serveur en arrière-plan
    if (isAuthenticated) {
      (async () => {
        try {
          const token = getValidToken();
          if (!token) throw new Error("No authentication token available");
          
          const { conversation_id } = await conversationService.createConversation(token, newConversation.title);
          
          setConversations(prevConversations => 
            prevConversations.map(conv => {
              if (conv.id === newConversation.id) {
                return {
                  ...conv,
                  serverId: conversation_id,
                  syncedWithServer: true
                };
              }
              return conv;
            })
          );
          
          setCurrentConversation(current => {
            if (current?.id === newConversation.id) {
              return {
                ...current,
                serverId: conversation_id,
                syncedWithServer: true
              };
            }
            return current;
          });
        } catch (error) {
          console.error('Error creating conversation on server:', error);
        }
      })();
    }
  }, [isCreatingConversation, isAuthenticated, getValidToken]);

  // Sélectionner une conversation
  const selectConversation = useCallback((id: string) => {
    if (currentConversation?.id === id) return;
    
    const conversation = conversations.find(conv => conv.id === id);
    if (!conversation) return;
    
    setCurrentConversation(conversation);
    
    if (isAuthenticated && conversation.serverId) {
      (async () => {
        try {
          await syncConversation(id, conversation.serverId);
        } catch (error) {
          console.error('Error syncing conversation details:', error);
        }
      })();
    }
  }, [currentConversation?.id, conversations, isAuthenticated, syncConversation]);

  // Ajouter un message
  const addMessage = useCallback((content: string, role: 'user' | 'assistant' | 'system', sources?: Source[], force: boolean = false) => {
    if (!currentConversation) return;
    
    if (!force && hasMessageWithContent(currentConversation, content, role)) {
      console.log(`Message with identical content already exists, skipping addition`);
      return;
    }
    
    // Créer le message localement
    const newMessage = messageService.createLocalMessage(content, role, sources);

    // Mise à jour du titre si nécessaire
    let updatedTitle = currentConversation.title;
    const isFirstUserMessage = role === 'user' && currentConversation.messages.filter(m => m.role === 'user').length === 0;
    
    if (isFirstUserMessage) {
      updatedTitle = content.length > 30 ? `${content.substring(0, 27)}...` : content;
    }

    // Mettre à jour l'état local
    const updatedConversation = {
      ...currentConversation,
      title: updatedTitle,
      messages: [...currentConversation.messages, newMessage],
      updatedAt: new Date()
    };

    setCurrentConversation(updatedConversation);
    setConversations(prevConversations => 
      prevConversations.map(conv => 
        conv.id === updatedConversation.id ? updatedConversation : conv
      )
    );

    // Synchroniser avec le serveur en arrière-plan
    if (isAuthenticated) {
      setTimeout(() => {
        (async () => {
          try {
            const token = getValidToken();
            if (!token) throw new Error("No authentication token available");
            
            if (updatedConversation.serverId) {
              const response = await messageService.addMessageToConversation(
                token, 
                updatedConversation.serverId, 
                content
              );
              
              const messageServerId = role === 'user' 
                ? response.user_message_id 
                : response.ia_message_id;
              
              // Mettre à jour les IDs
              setConversations(prevConversations => {
                return prevConversations.map(conv => {
                  if (conv.id === updatedConversation.id) {
                    return {
                      ...conv,
                      messages: conv.messages.map(msg => {
                        if (msg.id === newMessage.id) {
                          return { ...msg, serverId: messageServerId };
                        }
                        return msg;
                      })
                    };
                  }
                  return conv;
                });
              });
              
              // Mettre à jour la conversation courante
              setCurrentConversation(current => {
                if (current?.id !== updatedConversation.id) return current;
                
                return {
                  ...current,
                  messages: current.messages.map(msg => {
                    if (msg.id === newMessage.id) {
                      return { ...msg, serverId: messageServerId };
                    }
                    return msg;
                  })
                };
              });
              
              // Mettre à jour le titre si nécessaire
              if (isFirstUserMessage) {
                await conversationService.updateConversationTitle(
                  token, 
                  updatedConversation.serverId, 
                  updatedTitle
                );
              }
            } else {
              // Créer une nouvelle conversation avec le message
              const response = await messageService.createConversationWithMessage(
                token, 
                content, 
                updatedTitle
              );
              
              const serverId = response.conversation_id;
              const messageServerId = role === 'user' 
                ? response.user_message_id 
                : response.ia_message_id;
              
              // Mettre à jour les conversations
              setConversations(prevConversations => {
                return prevConversations.map(conv => {
                  if (conv.id === updatedConversation.id) {
                    return {
                      ...conv,
                      serverId,
                      syncedWithServer: true,
                      messages: conv.messages.map(msg => {
                        if (msg.id === newMessage.id) {
                          return { ...msg, serverId: messageServerId };
                        }
                        return msg;
                      })
                    };
                  }
                  return conv;
                });
              });
              
              // Mettre à jour la conversation courante
              setCurrentConversation(current => {
                if (current?.id !== updatedConversation.id) return current;
                
                return {
                  ...current,
                  serverId,
                  syncedWithServer: true,
                  messages: current.messages.map(msg => {
                    if (msg.id === newMessage.id) {
                      return { ...msg, serverId: messageServerId };
                    }
                    return msg;
                  })
                };
              });
            }
          } catch (error) {
            console.error('Error syncing message with server:', error);
          }
        })();
      }, 0);
    }
  }, [currentConversation, isAuthenticated, getValidToken]);

  // Mettre à jour le titre d'une conversation
  const updateConversationTitle = useCallback((id: string, title: string) => {
    const conversation = conversations.find(conv => conv.id === id);
    if (!conversation) return;
    
    const updatedConversation = {
      ...conversation,
      title,
      updatedAt: new Date()
    };
    
    setConversations(prevConversations => 
      prevConversations.map(conv => 
        conv.id === id ? updatedConversation : conv
      )
    );
    
    if (currentConversation && currentConversation.id === id) {
      setCurrentConversation(updatedConversation);
    }
    
    if (isAuthenticated && conversation.serverId) {
      setTimeout(() => {
        (async () => {
          try {
            const token = getValidToken();
            if (!token) throw new Error("No authentication token available");
            
            await conversationService.updateConversationTitle(token, conversation.serverId!, title);
          } catch (error) {
            console.error('Error updating conversation title on server:', error);
          }
        })();
      }, 0);
    }
  }, [conversations, currentConversation, isAuthenticated, getValidToken]);

  // Supprimer une conversation
  const deleteConversation = useCallback((id: string) => {
    const conversation = conversations.find(conv => conv.id === id);
    if (!conversation) return;
    
    const updatedConversations = conversations.filter(conv => conv.id !== id);
    setConversations(updatedConversations);
    
    if (currentConversation && currentConversation.id === id) {
      setCurrentConversation(updatedConversations.length > 0 ? updatedConversations[0] : null);
    }
    
    if (isAuthenticated && conversation.serverId) {
      setTimeout(() => {
        (async () => {
          try {
            const token = getValidToken();
            if (!token) throw new Error("No authentication token available");
            
            await conversationService.deleteConversation(token, conversation.serverId!);
          } catch (error) {
            console.error('Error deleting conversation on server:', error);
          }
        })();
      }, 0);
    }
  }, [conversations, currentConversation, isAuthenticated, getValidToken]);

  // Ajouter un feedback à un message
  const addFeedback = useCallback(async (messageId: string, rating: number, comment?: string) => {
    if (!currentConversation) return;
    
    const messageIndex = currentConversation.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;
    
    const message = currentConversation.messages[messageIndex];
    
    // Mettre à jour localement
    const updatedMessage = {
      ...message,
      feedback: {
        rating,
        comment
      }
    };
    
    const updatedConversation = {
      ...currentConversation,
      messages: [
        ...currentConversation.messages.slice(0, messageIndex),
        updatedMessage,
        ...currentConversation.messages.slice(messageIndex + 1)
      ],
      updatedAt: new Date()
    };
    
    setCurrentConversation(updatedConversation);
    setConversations(prevConversations => 
      prevConversations.map(conv => 
        conv.id === currentConversation.id ? updatedConversation : conv
      )
    );
    
    // Envoyer au serveur
    if (isAuthenticated && message.serverId) {
      try {
        const token = getValidToken();
        if (!token) throw new Error("No authentication token available");
        
        await messageService.addFeedback(token, message.serverId, rating, comment);
      } catch (error) {
        console.error('Error adding feedback on server:', error);
        throw error;
      }
    }
  }, [currentConversation, isAuthenticated, getValidToken]);

  return (
    <ChatContext.Provider value={{
      conversations,
      currentConversation,
      createNewConversation,
      selectConversation,
      addMessage,
      updateConversationTitle,
      deleteConversation,
      isLoadingConversations,
      addFeedback,
      refreshConversations
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};