import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Message, Source } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const messageService = {
  // Créer un nouveau message localement
  createLocalMessage(content: string, role: 'user' | 'assistant' | 'system', sources?: Source[]): Message {
    return {
      id: uuidv4(),
      content,
      role,
      timestamp: new Date(),
      sources,
    };
  },
  
  // Envoyer un message à une conversation existante
  async addMessageToConversation(
    token: string, 
    conversationId: string, 
    content: string
  ): Promise<{
    conversation_id: string;
    user_message_id: string;
    ia_message_id: string;
  }> {
    try {
      const response = await axios.post<{
        conversation_id: string;
        user_message_id: string;
        ia_message_id: string;
      }>(
        `${API_URL}/conversations/${conversationId}/messages`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error adding message to conversation:', error);
      throw error;
    }
  },
  
  // Créer une nouvelle conversation avec un message
  async createConversationWithMessage(
    token: string,
    content: string,
    title: string
  ): Promise<{
    conversation_id: string;
    user_message_id: string;
    ia_message_id: string;
  }> {
    try {
      const response = await axios.post<{
        conversation_id: string;
        user_message_id: string;
        ia_message_id: string;
      }>(
        `${API_URL}/conversations/messages`,
        {
          content,
          conversation_id: null,
          conversation_title: title
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error creating conversation with message:', error);
      throw error;
    }
  },
  
  // Ajouter un feedback à un message
  async addFeedback(
    token: string,
    messageId: string,
    rating: number,
    comment?: string
  ): Promise<void> {
    try {
      await axios.post(
        `${API_URL}/conversations/messages/${messageId}/feedback`,
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
      console.error('Error adding feedback to message:', error);
      throw error;
    }
  }
};