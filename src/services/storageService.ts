import { Conversation } from '../types';

const CONVERSATIONS_KEY = 'comptax_conversations';

class StorageService {
  /**
   * Sauvegarde les conversations dans le localStorage
   */
  saveConversations(conversations: Conversation[]): void {
    try {
      // Ne sauvegarder que les conversations non synchronisées avec le serveur
      const localConversations = conversations.filter(conv => !conv.syncedWithServer);
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(localConversations));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des conversations:', error);
    }
  }
  
  /**
   * Charge les conversations depuis le localStorage
   */
  loadConversations(): Conversation[] {
    try {
      const storedConversations = localStorage.getItem(CONVERSATIONS_KEY);
      if (!storedConversations) {
        return [];
      }
      
      const parsedData = JSON.parse(storedConversations);
      
      // Convertir les chaînes de date en objets Date
      return parsedData.map((conv: any) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: (conv.messages || []).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error);
      return [];
    }
  }
  
  /**
   * Sauvegarde une conversation spécifique
   */
  saveConversation(conversation: Conversation): void {
    try {
      const conversations = this.loadConversations();
      const existingIndex = conversations.findIndex(c => c.id === conversation.id);
      
      if (existingIndex >= 0) {
        conversations[existingIndex] = conversation;
      } else {
        conversations.push(conversation);
      }
      
      this.saveConversations(conversations);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la conversation:', error);
    }
  }
  
  /**
   * Supprime une conversation du localStorage
   */
  deleteConversation(conversationId: string): void {
    try {
      const conversations = this.loadConversations();
      const filteredConversations = conversations.filter(c => c.id !== conversationId);
      this.saveConversations(filteredConversations);
    } catch (error) {
      console.error('Erreur lors de la suppression de la conversation:', error);
    }
  }
  
  /**
   * Efface toutes les conversations du localStorage
   */
  clearAllConversations(): void {
    try {
      localStorage.removeItem(CONVERSATIONS_KEY);
    } catch (error) {
      console.error('Erreur lors de la suppression de toutes les conversations:', error);
    }
  }
}

// Exporter une instance unique du service
export const storageService = new StorageService();