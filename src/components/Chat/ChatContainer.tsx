import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { ohadaApi, Source as ApiSource } from '../../api/ohada';
import { Source } from '../../types'; // Utilisez votre définition de type locale

const ChatContainer: React.FC = () => {
  const { currentConversation, addMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const abortControllerRef = useRef<(() => void) | null>(null);

  // Fonction pour adapter le format des sources de l'API au format de notre app
  const adaptSources = (apiSources: ApiSource[]): Source[] => {
    return apiSources.map(source => ({
      documentId: source.document_id,
      title: source.metadata?.title || 'Document sans titre',
      metadata: source.metadata || {},
      relevanceScore: source.relevance_score || 0,
      preview: source.preview || ''
    }));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages, streamingText]);

  // Annuler le streaming lors du démontage du composant
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current();
      }
    };
  }, []);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;
    
    // Ajouter le message de l'utilisateur
    addMessage(message, 'user');
    
    // Préparer pour le streaming
    setIsLoading(true);
    setStreamingText('');
    
    // Vérifier s'il y a un streaming en cours et l'annuler
    if (abortControllerRef.current) {
      abortControllerRef.current();
    }
    
    try {
      // Utiliser l'API avec streaming
      const closeStream = ohadaApi.streamQuery(
        message,
        { include_sources: true },
        {
          onStart: (data) => {
            console.log('Streaming started:', data);
          },
          onProgress: (data) => {
            console.log('Progress:', data);
            // Visualisation de la progression possible ici
          },
          onChunk: (text, completion) => {
            setStreamingText(prev => prev + text);
            // Utiliser completion pour visualiser la progression si nécessaire
            console.log(`Progression: ${Math.round(completion * 100)}%`);
          },
          onComplete: (data) => {
            // Streaming terminé, adapter les sources et ajouter le message complet
            const adaptedSources = data.sources ? adaptSources(data.sources) : undefined;
            addMessage(data.answer, 'assistant', adaptedSources);
            setStreamingText('');
            setIsLoading(false);
          },
          onError: (error) => {
            console.error('Streaming error:', error);
            addMessage("Désolé, une erreur s'est produite lors de la génération de la réponse.", 'assistant');
            setStreamingText('');
            setIsLoading(false);
          }
        }
      );
      
      // Stocker la fonction pour fermer le stream
      abortControllerRef.current = closeStream;
      
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage("Désolé, une erreur s'est produite lors de l'envoi de votre message.", 'assistant');
      setIsLoading(false);
    }
  };

  if (!currentConversation) {
    return <div className="flex-1 flex items-center justify-center">Aucune conversation sélectionnée</div>;
  }

  return (
    <>
      <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Assistant comptable OHADA</h2>
        <div className="flex gap-2">
          <button className="text-gray-500 hover:text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {currentConversation.messages.map(message => (
          <ChatMessage 
            key={message.id} 
            message={message} 
          />
        ))}
        
        {/* Affichage du texte en streaming */}
        {streamingText && (
          <div className="chat-message">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            
            <div className="flex flex-col">
              <div className="mb-1">
                <span className="text-xs font-medium text-gray-500">
                  Assistant ComptaX
                </span>
              </div>
              
              <div className="message-bubble assistant-bubble">
                <div className="whitespace-pre-wrap">{streamingText}</div>
                {/* L'indicateur de saisie clignotant */}
                <span className="animate-pulse">▌</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Indicateur de chargement */}
        {isLoading && !streamingText && (
          <div className="flex items-center gap-2 text-gray-500">
            <div className="animate-pulse flex space-x-1">
              <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
              <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
              <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
            </div>
            <span className="text-sm">Génération en cours...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </>
  );
};

export default ChatContainer;