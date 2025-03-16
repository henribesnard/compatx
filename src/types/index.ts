export interface Message {
  id: string;
  serverId?: string;  // ID du message sur le serveur
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  sources?: Source[];
  feedback?: {
    rating: number;
    comment?: string;
  };
}

export interface Source {
  documentId: string;
  title: string;
  metadata: {
    partie?: number;
    chapitre?: number;
    title?: string;
    documentType?: string;
  };
  relevanceScore: number;
  preview: string;
}

export interface Conversation {
  id: string;
  serverId?: string;  // ID de la conversation sur le serveur
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  syncedWithServer?: boolean;  // Indique si la conversation est synchronisée avec le serveur
}