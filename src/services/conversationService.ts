import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Conversation } from '../types';
import { 
  convertServerConversation, 
  ServerConversation 
} from '../utils/conversationUtils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const conversationService = {
  // Récupérer toutes les conversations depuis le serveur
  async fetchConversations(token: string): Promise<Conversation[]> {
    try {
      const response = await axios.get<ServerConversation[]>(`${API_URL}/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 8000
      });
      
      return response.data.map(serverConv => convertServerConversation(serverConv));
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },
  
  // Récupérer une conversation spécifique depuis le serveur
  async fetchConversation(token: string, serverId: string): Promise<Conversation> {
    try {
      const response = await axios.get<ServerConversation>(
        `${API_URL}/conversations/${serverId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return convertServerConversation(response.data);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  },
  
  // Créer une nouvelle conversation sur le serveur
  async createConversation(token: string, title: string): Promise<{ conversation_id: string }> {
    try {
      const response = await axios.post<{ conversation_id: string }>(
        `${API_URL}/conversations`,
        { title },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  },
  
  // Mettre à jour le titre d'une conversation sur le serveur
  async updateConversationTitle(token: string, serverId: string, title: string): Promise<void> {
    try {
      await axios.put(
        `${API_URL}/conversations/${serverId}`,
        { title },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
    } catch (error) {
      console.error('Error updating conversation title:', error);
      throw error;
    }
  },
  
  // Supprimer une conversation sur le serveur
  async deleteConversation(token: string, serverId: string): Promise<void> {
    try {
      await axios.delete(
        `${API_URL}/conversations/${serverId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  },
  
  // Créer une nouvelle conversation localement
  createLocalConversation(): Conversation {
    return {
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
  }
};