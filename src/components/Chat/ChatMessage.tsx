import React, { useState } from 'react';
import { FaThumbsUp, FaThumbsDown, FaInfoCircle } from 'react-icons/fa';
import { Message } from '../../types';
import { useConversation } from '../../hooks/useConversation';
import MessageSources from './MessageSources';
import { useAuth } from '../../contexts/AuthContext';
import TypingIndicator from './TypingIndicator';
import { useStream } from '../../contexts/StreamContext';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [showSources, setShowSources] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState('');
  
  const { isAuthenticated } = useAuth();
  const { addFeedback } = useConversation();
  // Récupérer l'état de streaming pour savoir si ce message est en cours de streaming
  const { isStreaming, streamingMessageId } = useStream();
  
  const hasSources = message.sources && message.sources.length > 0;
  const isAssistantMessage = message.role === 'assistant';
  // Vérifier si ce message spécifique est en streaming
  const isMessageStreaming = isStreaming && streamingMessageId === message.id;
  
  const handleFeedbackSubmit = async (rating: number) => {
    if (!isAuthenticated || !isAssistantMessage) return;
    
    try {
      const success = await addFeedback(message.id, { 
        rating, 
        comment: feedbackComment.trim() || undefined 
      });
      
      if (success) {
        setFeedbackSubmitted(true);
        setShowFeedback(false);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du feedback:', error);
    }
  };
  
  return (
    <div className={`chat-message ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`message-bubble ${
          message.role === 'user' ? 'user-bubble' : 'assistant-bubble'
        } ${isMessageStreaming ? 'animate-pulse' : ''}`}
      >
        {/* Contenu du message */}
        <div className="message-content whitespace-pre-wrap">
          {message.content ? (
            <div dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }} />
          ) : (
            message.role === 'assistant' && <TypingIndicator />
          )}
        </div>
        
        {/* Boutons d'action (uniquement pour les messages de l'assistant et quand pas en streaming) */}
        {isAssistantMessage && message.content && !isMessageStreaming && (
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              {/* Bouton de sources */}
              {hasSources && (
                <button 
                  onClick={() => setShowSources(!showSources)}
                  className="flex items-center mr-3 text-blue-600 hover:text-blue-800"
                >
                  <FaInfoCircle className="mr-1" />
                  <span>{showSources ? 'Masquer les sources' : 'Voir les sources'}</span>
                </button>
              )}
            </div>
            
            {/* Feedback (uniquement si authentifié) */}
            {isAuthenticated && !feedbackSubmitted && (
              <div className="flex items-center">
                {!showFeedback ? (
                  <button 
                    onClick={() => setShowFeedback(true)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Donner un avis
                  </button>
                ) : (
                  <div className="flex items-center">
                    <button 
                      onClick={() => handleFeedbackSubmit(1)}
                      className="p-1 hover:text-green-600"
                      title="Utile"
                    >
                      <FaThumbsUp />
                    </button>
                    <button 
                      onClick={() => handleFeedbackSubmit(-1)}
                      className="p-1 ml-2 hover:text-red-600"
                      title="Pas utile"
                    >
                      <FaThumbsDown />
                    </button>
                    <button 
                      onClick={() => setShowFeedback(false)}
                      className="ml-2 text-gray-500 hover:text-gray-700 text-xs"
                    >
                      Annuler
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {feedbackSubmitted && (
              <span className="text-green-600 text-xs">Merci pour votre avis !</span>
            )}
          </div>
        )}
        
        {/* Zone de commentaire pour le feedback */}
        {showFeedback && (
          <div className="mt-2">
            <textarea
              className="w-full p-2 border border-gray-300 rounded text-sm"
              placeholder="Ajouter un commentaire (optionnel)"
              rows={2}
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
            />
          </div>
        )}
        
        {/* Affichage des sources */}
        {showSources && hasSources && (
          <MessageSources sources={message.sources!} />
        )}
      </div>
    </div>
  );
};

// Fonction pour formater le contenu du message
// Cette fonction convertit les URLs en liens cliquables et préserve les sauts de ligne
const formatMessageContent = (content: string): string => {
  // Remplacer les URLs par des liens cliquables
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const contentWithLinks = content.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>');
  
  // Conserver les sauts de ligne
  return contentWithLinks;
};

export default React.memo(ChatMessage);