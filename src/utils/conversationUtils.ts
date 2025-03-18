import { Conversation } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Types spécifiques à l'intégration API
export interface ServerSourceMetadata {
  title?: string;
  partie?: number;
  chapitre?: number;
  document_type?: string;
  [key: string]: unknown;
}

export interface ServerSource {
  document_id: string;
  metadata?: ServerSourceMetadata;
  relevance_score?: number;
  preview?: string;
}

export interface ServerConversation {
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

export interface StoredConversation {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    timestamp: string;
    sources?: {
      documentId: string;
      title: string;
      metadata: Record<string, unknown>;
      relevanceScore: number;
      preview: string;
    }[];
    feedback?: {
      rating: number;
      comment?: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
  syncedWithServer?: boolean;
  serverId?: string;
}

// Constante pour le stockage local
export const STORAGE_KEY = 'comptax_conversations';

// Conversation initiale par défaut
export const initialConversation: Conversation = {
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

// Convertir une conversation du format serveur au format local
export const convertServerConversation = (serverConv: ServerConversation): Conversation => {
  const messages = serverConv.messages || [];
  
  return {
    id: uuidv4(),
    serverId: serverConv.conversation_id,
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
};

// Utilitaire pour vérifier si un message avec un contenu spécifique existe déjà
export const hasMessageWithContent = (conversation: Conversation, content: string, role: 'user' | 'assistant' | 'system'): boolean => {
  return conversation.messages.some(msg => 
    msg.role === role && msg.content === content
  );
};

// Charger les conversations depuis le localStorage
export const loadConversationsFromStorage = (): Conversation[] => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      const parsed = JSON.parse(storedData) as StoredConversation[];
      
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

// Sauvegarder les conversations dans localStorage
export const saveConversationsToStorage = (conversations: Conversation[], isAuthenticated: boolean): void => {
  try {
    if (conversations.length > 0) {
      if (isAuthenticated) {
        const localConversations = conversations.filter(conv => !conv.syncedWithServer);
        if (localConversations.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(localConversations));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
      }
    } else if (conversations.length === 0 && isAuthenticated) {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.error('Error saving conversations to storage:', error);
  }
};