import { Conversation, Message } from '../types';
import { ApiConversation, ApiMessage } from '../types/api';

/**
 * Convertit une conversation API en objet Conversation local
 */
export function convertApiConversation(apiConv: ApiConversation): Conversation {
  return {
    id: apiConv.conversation_id,
    serverId: apiConv.conversation_id,
    title: apiConv.title,
    messages: apiConv.messages ? apiConv.messages.map(convertApiMessage) : [],
    createdAt: new Date(apiConv.created_at),
    updatedAt: new Date(apiConv.updated_at),
    syncedWithServer: true
  };
}

/**
 * Convertit un message API en objet Message local
 */
export function convertApiMessage(apiMsg: ApiMessage): Message {
  return {
    id: apiMsg.message_id,
    serverId: apiMsg.message_id,
    content: apiMsg.content,
    role: apiMsg.is_user ? 'user' : 'assistant',
    timestamp: new Date(apiMsg.created_at),
    sources: apiMsg.metadata?.sources?.map(src => ({
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
    })),
    feedback: apiMsg.metadata?.feedback
  };
}

/**
 * Génère un ID temporaire unique
 */
export function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Génère un titre automatique basé sur le premier message
 */
export function generateConversationTitle(content: string): string {
  // Limiter à 30 caractères, finir sur un mot complet
  const maxLength = 30;
  if (content.length <= maxLength) return content;
  
  const truncated = content.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace === -1) return truncated + '...';
  return truncated.substring(0, lastSpace) + '...';
}