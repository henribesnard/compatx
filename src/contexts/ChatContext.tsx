import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Conversation, Message, Source } from '../types';

interface ChatContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  createNewConversation: () => void;
  selectConversation: (id: string) => void;
  addMessage: (content: string, role: 'user' | 'assistant' | 'system', sources?: Source[]) => void;
  updateConversationTitle: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;
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
  }>;
  createdAt: string;
  updatedAt: string;
}

interface StoredSource {
  documentId: string;
  title: string;
  metadata: Record<string, unknown>;
  relevanceScore: number;
  preview: string;
}

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Charger les conversations depuis le localStorage lors de l'initialisation
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
          messages: conv.messages.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
            sources: msg.sources ? msg.sources.map(source => ({
              ...source,
              // Conversion explicite au besoin
              documentId: source.documentId,
              title: source.title,
              metadata: source.metadata,
              relevanceScore: source.relevanceScore,
              preview: source.preview
            })) : undefined
          }))
        }));
      }
    } catch (error) {
      console.error('Error loading conversations from storage:', error);
    }
    return [initialConversation];
  };

  const [conversations, setConversations] = useState<Conversation[]>(loadConversationsFromStorage);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(
    conversations.length > 0 ? conversations[0] : null
  );

  // Sauvegarder les conversations dans localStorage quand elles changent
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (error) {
      console.error('Error saving conversations to storage:', error);
    }
  }, [conversations]);

  const createNewConversation = () => {
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
    };

    setConversations([newConversation, ...conversations]);
    setCurrentConversation(newConversation);
  };

  const selectConversation = (id: string) => {
    const conversation = conversations.find(conv => conv.id === id) || null;
    setCurrentConversation(conversation);
  };

  const addMessage = (content: string, role: 'user' | 'assistant' | 'system', sources?: Source[]) => {
    if (!currentConversation) return;

    const newMessage: Message = {
      id: uuidv4(),
      content,
      role,
      timestamp: new Date(),
      sources: sources,
    };

    // Mise à jour du titre s'il s'agit du premier message de l'utilisateur
    let updatedTitle = currentConversation.title;
    if (role === 'user' && currentConversation.messages.filter(m => m.role === 'user').length === 0) {
      // Limiter le titre à 30 caractères
      updatedTitle = content.length > 30 ? `${content.substring(0, 27)}...` : content;
    }

    const updatedConversation: Conversation = {
      ...currentConversation,
      title: updatedTitle,
      messages: [...currentConversation.messages, newMessage],
      updatedAt: new Date(),
    };

    setCurrentConversation(updatedConversation);
    setConversations(conversations.map(conv => 
      conv.id === currentConversation.id ? updatedConversation : conv
    ));
  };

  const updateConversationTitle = (id: string, title: string) => {
    const updatedConversations = conversations.map(conv => 
      conv.id === id ? { ...conv, title, updatedAt: new Date() } : conv
    );
    
    setConversations(updatedConversations);
    
    if (currentConversation && currentConversation.id === id) {
      setCurrentConversation({ ...currentConversation, title, updatedAt: new Date() });
    }
  };

  const deleteConversation = (id: string) => {
    const updatedConversations = conversations.filter(conv => conv.id !== id);
    setConversations(updatedConversations);
    
    // Si la conversation supprimée était la conversation actuelle,
    // sélectionner la première conversation de la liste ou null si la liste est vide
    if (currentConversation && currentConversation.id === id) {
      setCurrentConversation(updatedConversations.length > 0 ? updatedConversations[0] : null);
    }
  };

  return (
    <ChatContext.Provider value={{
      conversations,
      currentConversation,
      createNewConversation,
      selectConversation,
      addMessage,
      updateConversationTitle,
      deleteConversation,
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