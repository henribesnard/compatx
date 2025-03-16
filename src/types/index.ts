export interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    timestamp: Date;
    sources?: Source[];
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
    title: string;
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
  }