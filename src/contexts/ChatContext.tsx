// src/contexts/ChatContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Conversation, Message, Source } from '../types';
import { useAuth } from './AuthContext';
import axios from 'axios';

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

// Données initiales pour la démonstration
const initialConversation: Conversation = {
  id: uuidv4(),
  title: 'Nouvelle conversation',
  messages: [
    {
      id: uuidv4(),
      content: 'Bonjour ! Comment puis-je vous aider avec la comptabilité OHADA aujourd\'hui ?',
      role: 'assistant',
      timestamp: new Date(),
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
  syncedWithServer: false, // Indique si la conversation est synchronisée avec le serveur
};

// LocalStorage key pour sauvegarder les conversations
const STORAGE_KEY = 'comptax_conversations';

// Type pour les données brutes stockées dans localStorage
interface StoredConversation {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    timestamp: string;
    sources?: StoredSource[];
    feedback?: {
      rating: number;
      comment?: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
  syncedWithServer?: boolean;
  serverId?: string; // ID de la conversation sur le serveur
}

interface StoredSource {
  documentId: string;
  title: string;
  metadata: Record<string, unknown>;
  relevanceScore: number;
  preview: string;
}

// Interface pour les métadonnées sources du serveur
interface ServerSourceMetadata {
  title?: string;
  partie?: number;
  chapitre?: number;
  document_type?: string;
  [key: string]: unknown; // Pour les autres propriétés inconnues
}

// Interface pour les sources du serveur
interface ServerSource {
  document_id: string;
  metadata?: ServerSourceMetadata;
  relevance_score?: number;
  preview?: string;
}

// Interface pour les conversations du serveur
interface ServerConversation {
  conversation_id: string;
  title: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
  first_message?: string;
  messages?: Array<{
    message_id: string;
    conversation_id: string;
    user_id: string;
    is_user: boolean;
    content: string;
    created_at: string;
    metadata?: {
      performance?: Record<string, number>;
      sources?: Array<ServerSource>;
      feedback?: {
        rating: number;
        comment?: string;
      };
    };
  }>;
}

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, getToken } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState<boolean>(true);

  // Convertir une conversation du format serveur au format local
  const convertServerConversation = useCallback((serverConv: ServerConversation): Conversation => {
    // Vérifier que les champs nécessaires existent
    const messages = serverConv.messages || [];
    
    return {
      id: uuidv4(), // ID local unique
      serverId: serverConv.conversation_id, // Conserver l'ID du serveur
      title: serverConv.title || "Nouvelle conversation",
      messages: Array.isArray(messages) ? messages.map((msg) => ({
        id: uuidv4(),
        serverId: msg.message_id,
        content: msg.content || "",
        role: msg.is_user ? 'user' : 'assistant',
        timestamp: new Date(msg.created_at || Date.now()),
        sources: msg.metadata?.sources ? msg.metadata.sources.map((src) => ({
          documentId: src.document_id || "",
          title: src.metadata?.title || 'Document sans titre',
          metadata: {
            partie: src.metadata?.partie,
            chapitre: src.metadata?.chapitre,
            title: src.metadata?.title,
            documentType: src.metadata?.document_type
          },
          relevanceScore: src.relevance_score || 0,
          preview: src.preview || ''
        })) : undefined,
        feedback: msg.metadata?.feedback
      })) : [],
      createdAt: new Date(serverConv.created_at || Date.now()),
      updatedAt: new Date(serverConv.updated_at || Date.now()),
      syncedWithServer: true
    };
  }, []);

  // Charger les conversations depuis le localStorage et/ou le serveur
  useEffect(() => {
    const loadConversations = async () => {
      setIsLoadingConversations(true);
      
      try {
        // D'abord charger les conversations locales
        const localConversations = loadConversationsFromStorage();
        
        if (isAuthenticated) {
          try {
            // Récupérer les conversations du serveur
            const token = getToken();
            const response = await axios.get<ServerConversation[]>('http://localhost:8080/conversations', {
              headers: {
                Authorization: `Bearer ${token}`
              },
              timeout: 8000 // Ajouter un timeout pour éviter les attentes infinies
            });
            
            // Convertir les conversations du serveur au format local
            const serverConversations = response.data.map(serverConv => convertServerConversation(serverConv));
            
            // Fusionner les conversations locales et serveur
            const mergedConversations = mergeConversations(localConversations, serverConversations);
            
            setConversations(mergedConversations);
            if (mergedConversations.length > 0 && !currentConversation) {
              setCurrentConversation(mergedConversations[0]);
            }
          } catch (error) {
            console.error('Error fetching conversations from server:', error);
            setConversations(localConversations);
            if (localConversations.length > 0 && !currentConversation) {
              setCurrentConversation(localConversations[0]);
            }
          }
        } else {
          setConversations(localConversations);
          if (localConversations.length > 0 && !currentConversation) {
            setCurrentConversation(localConversations[0]);
          }
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
        
        // En cas d'erreur critique, au moins initialiser avec une conversation par défaut
        const defaultConversations = [initialConversation];
        setConversations(defaultConversations);
        setCurrentConversation(defaultConversations[0]);
      } finally {
        setIsLoadingConversations(false);
      }
    };
    
    loadConversations();
  }, [isAuthenticated, getToken, convertServerConversation, currentConversation]);

  // Rafraîchir manuellement les conversations (utilisé après certaines actions)
  const refreshConversations = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoadingConversations(true);
    
    try {
      // Récupérer les conversations du serveur
      const token = getToken();
      const response = await axios.get<ServerConversation[]>('http://localhost:8080/conversations', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 8000
      });
      
      // Convertir et mettre à jour
      const serverConversations = response.data.map(serverConv => convertServerConversation(serverConv));
      const localConversations = loadConversationsFromStorage();
      const mergedConversations = mergeConversations(localConversations, serverConversations);
      
      setConversations(mergedConversations);
      
      // Mettre à jour la conversation courante si elle existe dans les nouvelles données
      if (currentConversation) {
        const updatedCurrentConv = mergedConversations.find(
          conv => (conv.serverId && conv.serverId === currentConversation.serverId) || 
                 (conv.id === currentConversation.id)
        );
        
        if (updatedCurrentConv) {
          setCurrentConversation(updatedCurrentConv);
        }
      }
    } catch (error) {
      console.error('Error refreshing conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [isAuthenticated, getToken, convertServerConversation, currentConversation]);

  // Sauvegarder les conversations dans localStorage quand elles changent
  useEffect(() => {
    try {
      if (conversations.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
      }
    } catch (error) {
      console.error('Error saving conversations to storage:', error);
    }
  }, [conversations]);

  // Utilitaire pour charger les conversations depuis le localStorage
  const loadConversationsFromStorage = (): Conversation[] => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const parsed = JSON.parse(storedData) as StoredConversation[];
        
        // Convertir les timestamps en objets Date
        return parsed.map((conv: StoredConversation) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          syncedWithServer: conv.syncedWithServer || false,
          serverId: conv.serverId,
          messages: conv.messages.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
            sources: msg.sources ? msg.sources.map(source => ({
              ...source,
              documentId: source.documentId,
              title: source.title,
              metadata: source.metadata,
              relevanceScore: source.relevanceScore,
              preview: source.preview
            })) : undefined,
            feedback: msg.feedback
          }))
        }));
      }
    } catch (error) {
      console.error('Error loading conversations from storage:', error);
    }
    return [initialConversation];
  };

  // Fusionner les conversations locales et serveur
  const mergeConversations = useCallback((localConvs: Conversation[], serverConvs: Conversation[]): Conversation[] => {
    // S'assurer que les deux listes sont valides
    if (!Array.isArray(localConvs)) localConvs = [];
    if (!Array.isArray(serverConvs)) serverConvs = [];
    
    const result = [...localConvs];
    
    // Ajouter ou mettre à jour les conversations serveur
    serverConvs.forEach(serverConv => {
      if (!serverConv || !serverConv.serverId) return;
      
      // Chercher si une conversation locale correspond à une conversation serveur
      const existingIndex = result.findIndex(c => 
        c.serverId === serverConv.serverId || 
        (serverConv.messages.length > 0 && c.messages.length > 0 && 
         c.messages[0].content === serverConv.messages[0].content)
      );
      
      if (existingIndex >= 0) {
        // Préserver l'ID local et mettre à jour les données
        const localId = result[existingIndex].id;
        result[existingIndex] = { ...serverConv, id: localId };
      } else {
        // Ajouter la nouvelle conversation
        result.push(serverConv);
      }
    });
    
    // Trier par date de mise à jour (plus récent en premier)
    return result.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }, []);

  // Synchroniser une conversation spécifique avec le serveur
  const syncConversation = useCallback(async (conversationId: string, serverId?: string) => {
    if (!isAuthenticated || !serverId) return null;
    
    try {
      const token = getToken();
      const response = await axios.get<ServerConversation>(
        `http://localhost:8080/conversations/${serverId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Convertir la conversation du serveur
      const updatedConversation = convertServerConversation(response.data);
      
      // Préserver l'ID local
      updatedConversation.id = conversationId;
      
      // Mettre à jour l'état avec les données complètes du serveur
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === conversationId ? updatedConversation : conv
        )
      );
      
      // Mettre à jour la conversation active si nécessaire
      if (currentConversation && currentConversation.id === conversationId) {
        setCurrentConversation(updatedConversation);
      }
      
      return updatedConversation;
    } catch (error) {
      console.error('Error syncing conversation with server:', error);
      return null;
    }
  }, [isAuthenticated, getToken, convertServerConversation, currentConversation]);

  // Créer une nouvelle conversation
  const createNewConversation = useCallback(async () => {
    const newConversation: Conversation = {
      id: uuidv4(),
      title: 'Nouvelle conversation',
      messages: [
        {
          id: uuidv4(),
          content: 'Bonjour ! Comment puis-je vous aider avec la comptabilité OHADA aujourd\'hui ?',
          role: 'assistant',
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      syncedWithServer: false,
    };

    // Si l'utilisateur est authentifié, créer la conversation sur le serveur
    if (isAuthenticated) {
      try {
        const token = getToken();
        const response = await axios.post<{conversation_id: string}>(
          'http://localhost:8080/conversations',
          {
            title: newConversation.title
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        // Mettre à jour avec l'ID du serveur
        newConversation.serverId = response.data.conversation_id;
        newConversation.syncedWithServer = true;
      } catch (error) {
        console.error('Error creating conversation on server:', error);
      }
    }

    // Mettre à jour l'état
    const updatedConversations = [newConversation, ...conversations];
    setConversations(updatedConversations);
    setCurrentConversation(newConversation);
  }, [isAuthenticated, getToken, conversations]);

  // Sélectionner une conversation et charger son contenu complet depuis le serveur
  const selectConversation = useCallback(async (id: string) => {
    // Trouver la conversation localement
    const conversation = conversations.find(conv => conv.id === id);
    if (!conversation) return;
    
    // Mettre à jour immédiatement avec ce que nous avons localement
    setCurrentConversation(conversation);
    
    // Si la conversation est synchronisée avec le serveur et que l'utilisateur est authentifié
    if (isAuthenticated && conversation.serverId) {
      setIsLoadingConversations(true);
      
      try {
        // Synchroniser avec le serveur pour obtenir les données les plus récentes
        await syncConversation(id, conversation.serverId);
      } finally {
        setIsLoadingConversations(false);
      }
    }
  }, [isAuthenticated, conversations, syncConversation]);

  // Vérifier si un message avec un contenu spécifique existe dans une conversation
  const hasMessageWithContent = useCallback((conversation: Conversation, content: string, role: 'user' | 'assistant' | 'system'): boolean => {
    return conversation.messages.some(msg => 
      msg.role === role && msg.content === content
    );
  }, []);

  // Ajouter un message à la conversation courante
  const addMessage = useCallback(async (content: string, role: 'user' | 'assistant' | 'system', sources?: Source[], force: boolean = false) => {
    if (!currentConversation) return;
    
    console.log(`Adding message as ${role}: ${content.substring(0, 50)}...`);
    
    // Créer une copie profonde de la conversation actuelle
    const updatedConversation = JSON.parse(JSON.stringify(currentConversation)) as Conversation;
    
    // Vérifier si un message identique existe déjà (éviter les doublons)
    if (!force && hasMessageWithContent(updatedConversation, content, role)) {
      console.log(`Message with identical content already exists, skipping addition`);
      return;
    }
    
    const newMessage: Message = {
      id: uuidv4(),
      content,
      role,
      timestamp: new Date(),
      sources,
    };

    // Mise à jour du titre s'il s'agit du premier message de l'utilisateur
    let updatedTitle = updatedConversation.title;
    if (role === 'user' && updatedConversation.messages.filter(m => m.role === 'user').length === 0) {
      // Limiter le titre à 30 caractères
      updatedTitle = content.length > 30 ? `${content.substring(0, 27)}...` : content;
      updatedConversation.title = updatedTitle;
    }

    // Ajouter le nouveau message
    updatedConversation.messages.push(newMessage);
    updatedConversation.updatedAt = new Date();

    // Mettre à jour l'état AVANT d'effectuer des opérations asynchrones
    setCurrentConversation(updatedConversation);
    
    // Mettre à jour la liste des conversations
    setConversations(conversations.map(conv => 
      conv.id === updatedConversation.id ? updatedConversation : conv
    ));

    // Si l'utilisateur est authentifié, synchroniser avec le serveur
    if (isAuthenticated) {
      try {
        const token = getToken();
        
        if (updatedConversation.serverId) {
          // La conversation existe déjà sur le serveur
          try {
            // Ajouter le message au serveur
            const response = await axios.post<{
              conversation_id: string;
              user_message_id: string;
              ia_message_id: string;
            }>(
              `http://localhost:8080/conversations/${updatedConversation.serverId}/messages`,
              {
                content: content
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );
            
            // Mettre à jour les IDs des messages avec ceux du serveur
            if (response.data.user_message_id && response.data.ia_message_id) {
              newMessage.serverId = role === 'user' ? response.data.user_message_id : response.data.ia_message_id;
              
              // Mettre à jour l'état à nouveau avec les IDs du serveur
              const updatedWithServerIds = {...updatedConversation};
              const messageIndex = updatedWithServerIds.messages.findIndex(m => m.id === newMessage.id);
              if (messageIndex !== -1) {
                updatedWithServerIds.messages[messageIndex].serverId = newMessage.serverId;
              }
              
              setCurrentConversation(updatedWithServerIds);
              setConversations(conversations.map(conv => 
                conv.id === updatedWithServerIds.id ? updatedWithServerIds : conv
              ));
            }
            
            // Mettre à jour le titre sur le serveur si nécessaire
            if (updatedTitle !== currentConversation.title) {
              await axios.put(
                `http://localhost:8080/conversations/${updatedConversation.serverId}`,
                {
                  title: updatedTitle
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`
                  }
                }
              );
            }
          } catch (error) {
            console.error('Error adding message to server:', error);
          }
        } else {
          // Créer une nouvelle conversation sur le serveur avec le message
          try {
            const response = await axios.post<{
              conversation_id: string;
              user_message_id: string;
              ia_message_id: string;
            }>(
              'http://localhost:8080/conversations/messages',
              {
                content: content,
                conversation_id: null,
                conversation_title: updatedTitle
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );
            
            // Mettre à jour avec l'ID du serveur
            const updatedWithServerIds = {...updatedConversation};
            updatedWithServerIds.serverId = response.data.conversation_id;
            updatedWithServerIds.syncedWithServer = true;
            
            // Mettre à jour les IDs des messages
            if (response.data.user_message_id && response.data.ia_message_id) {
              const messageIndex = updatedWithServerIds.messages.findIndex(m => m.id === newMessage.id);
              if (messageIndex !== -1) {
                updatedWithServerIds.messages[messageIndex].serverId = 
                  role === 'user' ? response.data.user_message_id : response.data.ia_message_id;
              }
            }
            
            // Mettre à jour l'état avec les nouvelles informations
            setCurrentConversation(updatedWithServerIds);
            setConversations(conversations.map(conv => 
              conv.id === updatedWithServerIds.id ? updatedWithServerIds : conv
            ));

            // Rafraîchir les conversations pour s'assurer que tout est synchronisé
            await refreshConversations();
          } catch (error) {
            console.error('Error creating conversation with message on server:', error);
          }
        }
      } catch (error) {
        console.error('Error syncing with server:', error);
      }
    }
  }, [currentConversation, conversations, hasMessageWithContent, isAuthenticated, getToken, refreshConversations]);

  // Mettre à jour le titre d'une conversation
  const updateConversationTitle = useCallback(async (id: string, title: string) => {
    const conversation = conversations.find(conv => conv.id === id);
    if (!conversation) return;
    
    const updatedConversation = {
      ...conversation,
      title,
      updatedAt: new Date()
    };
    
    // Mettre à jour l'état immédiatement
    setConversations(conversations.map(conv => 
      conv.id === id ? updatedConversation : conv
    ));
    
    if (currentConversation && currentConversation.id === id) {
      setCurrentConversation(updatedConversation);
    }
    
    // Mettre à jour sur le serveur si authentifié et synchronisé
    if (isAuthenticated && conversation.serverId) {
      try {
        const token = getToken();
        await axios.put(
          `http://localhost:8080/conversations/${conversation.serverId}`,
          {
            title: title
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      } catch (error) {
        console.error('Error updating conversation title on server:', error);
      }
    }
  }, [conversations, currentConversation, isAuthenticated, getToken]);

  // Supprimer une conversation
  const deleteConversation = useCallback(async (id: string) => {
    const conversation = conversations.find(conv => conv.id === id);
    if (!conversation) return;
    
    // Mettre à jour l'état immédiatement
    const updatedConversations = conversations.filter(conv => conv.id !== id);
    setConversations(updatedConversations);
    
    // Si la conversation supprimée était la conversation actuelle,
    // sélectionner la première conversation de la liste ou null si la liste est vide
    if (currentConversation && currentConversation.id === id) {
      setCurrentConversation(updatedConversations.length > 0 ? updatedConversations[0] : null);
    }
    
    // Supprimer sur le serveur si authentifié et synchronisé
    if (isAuthenticated && conversation.serverId) {
      try {
        const token = getToken();
        await axios.delete(
          `http://localhost:8080/conversations/${conversation.serverId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      } catch (error) {
        console.error('Error deleting conversation on server:', error);
      }
    }
  }, [conversations, currentConversation, isAuthenticated, getToken]);

  // Ajouter un feedback à un message
  const addFeedback = useCallback(async (messageId: string, rating: number, comment?: string) => {
    if (!currentConversation) return;
    
    // Trouver le message
    const messageIndex = currentConversation.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;
    
    const message = currentConversation.messages[messageIndex];
    
    // Mettre à jour le message avec le feedback
    const updatedMessage = {
      ...message,
      feedback: {
        rating,
        comment
      }
    };
    
    // Créer une copie profonde de la conversation pour éviter les problèmes de référence
    const updatedConversation = JSON.parse(JSON.stringify(currentConversation)) as Conversation;
    updatedConversation.messages[messageIndex] = updatedMessage;
    updatedConversation.updatedAt = new Date();
    
    // Mettre à jour l'état immédiatement
    setCurrentConversation(updatedConversation);
    setConversations(conversations.map(conv => 
      conv.id === currentConversation.id ? updatedConversation : conv
    ));
    
    // Envoyer le feedback au serveur si authentifié et le message est synchronisé
    if (isAuthenticated && message.serverId) {
      try {
        const token = getToken();
        await axios.post(
          `http://localhost:8080/conversations/messages/${message.serverId}/feedback`,
          {
            rating,
            comment
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      } catch (error) {
        console.error('Error adding feedback on server:', error);
        throw error;
      }
    }
  }, [currentConversation, conversations, isAuthenticated, getToken]);

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