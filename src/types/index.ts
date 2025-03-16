// src/types/index.ts
// Interfaces pour les messages et les conversations
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

// Interfaces pour l'authentification
export interface User {
  user_id: string;
  email: string;
  name: string;
  profile_picture?: string;
  created_at: string;
  last_login: string;
  auth_provider: 'internal';
  email_verified: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface ResetPasswordData {
  email: string;
  token: string;
  new_password: string;
}

export interface TokenData {
  access_token: string;
  token_type: string;
  expires_at: string;
}

export interface LoginResponse {
  user: User;
  token: TokenData;
}

// Interfaces pour les API responses
export interface ApiErrorResponse {
  detail?: string;
  message?: string;
  status?: string;
  errors?: Record<string, string[]>;
}

export interface ApiSuccessResponse {
  status: string;
  message: string;
}

// Interfaces pour le feedback
export interface FeedbackData {
  rating: number;
  comment?: string;
}

export interface FeedbackResponse {
  feedback_id: string;
  message_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}