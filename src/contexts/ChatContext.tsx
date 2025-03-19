import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Conversation, Message } from '../types';
import { useAuth } from './AuthContext';
import { conversationApi } from '../api/conversation';
import { storageService } from '../services/storageService';
import { convertApiConversation, generateTempId, generateConversationTitle } from '../utils/conversationUtils';

// Clé pour stocker l'ID de la conversation active
const ACTIVE_CONVERSATION_KEY = 'comptax_active_conversation';

interface ChatContextProps {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
  createConversation: (title: string) => Promise<Conversation>;
  selectConversation: (id: string) => void;
  updateConversationTitle: (id: string, title: string) => Promise<boolean>;
  deleteConversation: (id: string) => Promise<boolean>;
  addMessageToConversation: (conversationId: string, message: Message) => void;
  updateStreamingMessage: (conversationId: string, messageId: string, content: string) => void;
  finalizeMessage: (conversationId: string, tempMessageId: string, finalMessage: Message) => void;
  refreshConversations: () => Promise<void>;
  clearError: () => void;
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { isAuthenticated, getToken } = useAuth();
  
  // Charger les conversations au démarrage
  useEffect(() => {
    const loadConversations = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Récupérer l'ID de la conversation active depuis le localStorage
        const activeConversationId = localStorage.getItem(ACTIVE_CONVERSATION_KEY);
        
        if (isAuthenticated) {
          // Charger les conversations depuis le serveur
          const token = getToken();
          if (!token) throw new Error('Token non disponible');
          
          const apiConversations = await conversationApi.fetchConversations(token);
          
          // Convertir les données API en format local
          const formattedConversations = apiConversations.map(convertApiConversation);
          
          // Trier par date de mise à jour (plus récentes en premier)
          formattedConversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
          
          setConversations(formattedConversations);
          
          // Restaurer la conversation active si elle existe
          if (activeConversationId && formattedConversations.length > 0) {
            const activeConversation = formattedConversations.find(
              c => c.id === activeConversationId || c.serverId === activeConversationId
            );
            
            if (activeConversation) {
              // Charger les détails complets de la conversation active
              if (activeConversation.serverId) {
                try {
                  const fullConversation = await conversationApi.fetchConversation(activeConversation.serverId, token);
                  const formattedConversation = convertApiConversation(fullConversation);
                  
                  // Mettre à jour la conversation dans la liste
                  setConversations(prev => prev.map(c => 
                    c.id === activeConversation.id ? formattedConversation : c
                  ));
                  
                  setCurrentConversation(formattedConversation);
                } catch (error) {
                  console.error('Erreur lors du chargement des détails de la conversation:', error);
                  setCurrentConversation(activeConversation);
                }
              } else {
                setCurrentConversation(activeConversation);
              }
            } else if (formattedConversations.length > 0) {
              // Si la conversation active n'existe plus, prendre la première
              setCurrentConversation(formattedConversations[0]);
              localStorage.setItem(ACTIVE_CONVERSATION_KEY, formattedConversations[0].id);
            }
          } else if (formattedConversations.length > 0) {
            // Si aucune conversation active n'est stockée, prendre la première
            setCurrentConversation(formattedConversations[0]);
            localStorage.setItem(ACTIVE_CONVERSATION_KEY, formattedConversations[0].id);
          }
        } else {
          // Charger les conversations locales
          const localConversations = storageService.loadConversations();
          setConversations(localConversations);
          
          // Restaurer la conversation active locale
          if (activeConversationId && localConversations.length > 0) {
            const activeConversation = localConversations.find(c => c.id === activeConversationId);
            if (activeConversation) {
              setCurrentConversation(activeConversation);
            } else if (localConversations.length > 0) {
              // Si la conversation active n'existe plus, prendre la première
              setCurrentConversation(localConversations[0]);
              localStorage.setItem(ACTIVE_CONVERSATION_KEY, localConversations[0].id);
            }
          } else if (localConversations.length > 0) {
            // Si aucune conversation active n'est stockée, prendre la première
            setCurrentConversation(localConversations[0]);
            localStorage.setItem(ACTIVE_CONVERSATION_KEY, localConversations[0].id);
          }
        }
      } catch (err) {
        console.error('Erreur lors du chargement des conversations:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des conversations');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadConversations();
  }, [isAuthenticated, getToken]);
  
  // Rafraîchir les conversations depuis le serveur
  const refreshConversations = async () => {
    if (!isAuthenticated) return;
    
    // Pour éviter les problèmes UI, ne pas mettre isLoading à true
    setError(null);
    
    try {
      const token = getToken();
      if (!token) throw new Error('Token non disponible');
      
      const apiConversations = await conversationApi.fetchConversations(token);
      
      // Convertir les données API en format local
      const formattedConversations = apiConversations.map(convertApiConversation);
      
      // Trier par date de mise à jour (plus récentes en premier)
      formattedConversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      
      // Conserver l'ID de la conversation actuelle avant la mise à jour
      const currentId = currentConversation?.id;
      const currentServerId = currentConversation?.serverId;
      
      setConversations(formattedConversations);
      
      // Mettre à jour la conversation actuelle si nécessaire SANS changement de focus
      if (currentId) {
        const updatedCurrentConv = formattedConversations.find(
          c => c.id === currentId || c.serverId === currentId || 
              (currentServerId && c.serverId === currentServerId)
        );
        if (updatedCurrentConv) {
          setCurrentConversation(updatedCurrentConv);
        }
      } else if (formattedConversations.length > 0 && !currentConversation) {
        // Seulement si aucune conversation n'est actuellement sélectionnée
        setCurrentConversation(formattedConversations[0]);
        localStorage.setItem(ACTIVE_CONVERSATION_KEY, formattedConversations[0].id);
      }
    } catch (err) {
      console.error('Erreur lors du rafraîchissement des conversations:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du rafraîchissement des conversations');
    }
  };
  
  // Créer une nouvelle conversation
  const createConversation = async (title: string): Promise<Conversation> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isAuthenticated) {
        // Créer sur le serveur
        const token = getToken();
        if (!token) throw new Error('Token non disponible');
        
        const newApiConversation = await conversationApi.createConversation(title, token);
        const newConversation = convertApiConversation(newApiConversation);
        
        setConversations(prev => [newConversation, ...prev]);
        setCurrentConversation(newConversation);
        localStorage.setItem(ACTIVE_CONVERSATION_KEY, newConversation.id);
        
        return newConversation;
      } else {
        // Créer localement
        const newConversation: Conversation = {
          id: generateTempId(),
          title,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          syncedWithServer: false
        };
        
        setConversations(prev => [newConversation, ...prev]);
        setCurrentConversation(newConversation);
        localStorage.setItem(ACTIVE_CONVERSATION_KEY, newConversation.id);
        storageService.saveConversation(newConversation);
        
        return newConversation;
      }
    } catch (err) {
      console.error('Erreur lors de la création de la conversation:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de la conversation');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sélectionner une conversation
  const selectConversation = useCallback(async (id: string) => {
    const conversation = conversations.find(c => c.id === id);
    
    if (conversation) {
      setCurrentConversation(conversation);
      
      // Sauvegarder l'ID de la conversation active dans localStorage
      localStorage.setItem(ACTIVE_CONVERSATION_KEY, id);
      
      // Si connecté, charger les détails complets depuis le serveur
      if (isAuthenticated && conversation.serverId) {
        setIsLoading(true);
        
        try {
          const token = getToken();
          if (!token) throw new Error('Token non disponible');
          
          const fullConversation = await conversationApi.fetchConversation(conversation.serverId, token);
          const formattedConversation = convertApiConversation(fullConversation);
          
          // Mettre à jour la conversation dans la liste
          setConversations(prev => prev.map(c => 
            c.id === id ? formattedConversation : c
          ));
          
          setCurrentConversation(formattedConversation);
        } catch (err) {
          console.error('Erreur lors du chargement de la conversation:', err);
          setError(err instanceof Error ? err.message : 'Erreur lors du chargement de la conversation');
        } finally {
          setIsLoading(false);
        }
      }
    }
  }, [conversations, isAuthenticated, getToken]);
  
  // Mettre à jour le titre d'une conversation
  const updateConversationTitle = async (id: string, title: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isAuthenticated) {
        // Mettre à jour sur le serveur
        const conversation = conversations.find(c => c.id === id);
        if (!conversation?.serverId) throw new Error('ID serveur non disponible');
        
        const token = getToken();
        if (!token) throw new Error('Token non disponible');
        
        await conversationApi.updateConversationTitle(conversation.serverId, title, token);
        
        // Mettre à jour localement
        setConversations(prev => prev.map(c => 
          c.id === id ? { ...c, title, updatedAt: new Date() } : c
        ));
        
        if (currentConversation?.id === id) {
          setCurrentConversation(prev => prev ? { ...prev, title } : null);
        }
        
        return true;
      } else {
        // Mettre à jour localement
        setConversations(prev => prev.map(c => 
          c.id === id ? { ...c, title, updatedAt: new Date() } : c
        ));
        
        if (currentConversation?.id === id) {
          setCurrentConversation(prev => prev ? { ...prev, title, updatedAt: new Date() } : null);
        }
        
        const conversation = conversations.find(c => c.id === id);
        if (conversation) {
          const updatedConversation = { ...conversation, title, updatedAt: new Date() };
          storageService.saveConversation(updatedConversation);
        }
        
        return true;
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du titre:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du titre');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Supprimer une conversation
  const deleteConversation = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isAuthenticated) {
        // Supprimer sur le serveur
        const conversation = conversations.find(c => c.id === id);
        if (!conversation?.serverId) throw new Error('ID serveur non disponible');
        
        const token = getToken();
        if (!token) throw new Error('Token non disponible');
        
        await conversationApi.deleteConversation(conversation.serverId, token);
      } else {
        // Supprimer localement du stockage
        storageService.deleteConversation(id);
      }
      
      // Supprimer de l'état
      setConversations(prev => prev.filter(c => c.id !== id));
      
      // Si la conversation supprimée était la dernière
      if (conversations.length === 1 && conversations[0].id === id) {
        localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
        setCurrentConversation(null);
      } 
      // Si la conversation supprimée était la conversation actuelle
      else if (currentConversation?.id === id) {
        const remainingConversations = conversations.filter(c => c.id !== id);
        if (remainingConversations.length > 0) {
          const newActiveConversation = remainingConversations[0];
          setCurrentConversation(newActiveConversation);
          localStorage.setItem(ACTIVE_CONVERSATION_KEY, newActiveConversation.id);
        } else {
          localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
          setCurrentConversation(null);
        }
      }
      
      return true;
    } catch (err) {
      console.error('Erreur lors de la suppression de la conversation:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression de la conversation');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Ajouter un message à une conversation
  const addMessageToConversation = (conversationId: string, message: Message) => {
    setConversations(prev => prev.map(c => {
      if (c.id === conversationId) {
        const updatedMessages = [...c.messages, message];
        const updatedConv = { 
          ...c, 
          messages: updatedMessages,
          updatedAt: new Date()
        };
        
        // Si la conversation n'est pas synchronisée avec le serveur, sauvegarder localement
        if (!c.syncedWithServer) {
          storageService.saveConversation(updatedConv);
        }
        
        return updatedConv;
      }
      return c;
    }));
    
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(prev => {
        if (prev) {
          return {
            ...prev,
            messages: [...prev.messages, message],
            updatedAt: new Date()
          };
        }
        return prev;
      });
    }
  };
  
  // Mettre à jour un message de streaming en cours
  const updateStreamingMessage = (conversationId: string, messageId: string, content: string) => {
    setConversations(prev => prev.map(c => {
      if (c.id === conversationId) {
        const updatedMessages = c.messages.map(m => 
          m.id === messageId ? { ...m, content } : m
        );
        
        return { ...c, messages: updatedMessages };
      }
      return c;
    }));
    
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(prev => {
        if (prev) {
          return {
            ...prev,
            messages: prev.messages.map(m => 
              m.id === messageId ? { ...m, content } : m
            )
          };
        }
        return prev;
      });
    }
  };
  
  // Finaliser un message après le streaming
  const finalizeMessage = (conversationId: string, tempMessageId: string, finalMessage: Message) => {
    setConversations(prev => prev.map(c => {
      if (c.id === conversationId) {
        const updatedMessages = c.messages.map(m => 
          m.id === tempMessageId ? finalMessage : m
        );
        
        const updatedConv = { 
          ...c, 
          messages: updatedMessages,
          updatedAt: new Date(),
          // Si le message a un serverId, marquer la conversation comme synchronisée
          syncedWithServer: finalMessage.serverId ? true : c.syncedWithServer
        };
        
        // Si pas synchronisée, sauvegarder localement
        if (!updatedConv.syncedWithServer) {
          storageService.saveConversation(updatedConv);
        }
        
        return updatedConv;
      }
      return c;
    }));
    
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(prev => {
        if (prev) {
          return {
            ...prev,
            messages: prev.messages.map(m => 
              m.id === tempMessageId ? finalMessage : m
            ),
            updatedAt: new Date(),
            syncedWithServer: finalMessage.serverId ? true : prev.syncedWithServer
          };
        }
        return prev;
      });
    }
  };
  
  // Effacer les erreurs
  const clearError = () => {
    setError(null);
  };
  
  return (
    <ChatContext.Provider value={{
      conversations,
      currentConversation,
      isLoading,
      error,
      createConversation,
      selectConversation,
      updateConversationTitle,
      deleteConversation,
      addMessageToConversation,
      updateStreamingMessage,
      finalizeMessage,
      refreshConversations,
      clearError
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