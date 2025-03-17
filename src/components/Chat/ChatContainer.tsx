import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { ohadaApi, Source as ApiSource } from '../../api/ohada';
import { Source } from '../../types';

const ChatContainer: React.FC = () => {
  const { currentConversation, addMessage, isLoadingConversations } = useChat();
  const { isAuthenticated, getToken } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [streamingTextClass, setStreamingTextClass] = useState('');
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
        console.log("Cleaning up streaming on component unmount");
        abortControllerRef.current();
      }
    };
  }, []);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;
    
    console.log("Sending message:", message);
    
    // Ajouter le message de l'utilisateur
    addMessage(message, 'user');
    
    // Préparer pour le streaming
    setIsLoading(true);
    setStreamingText('');
    setStreamingTextClass('');
    
    // Vérifier s'il y a un streaming en cours et l'annuler
    if (abortControllerRef.current) {
      console.log("Aborting previous streaming session");
      abortControllerRef.current();
      abortControllerRef.current = null;
    }
    
    try {
      // Récupérer le token si authentifié
      const token = isAuthenticated ? getToken() : null;
      
      // Préparer les options pour l'API
      const options = {
        include_sources: true,
        save_to_conversation: currentConversation?.serverId || null
      };
      
      console.log("Starting streaming request with options:", options);
      
      // Utiliser l'API avec streaming
      const closeStream = ohadaApi.streamQuery(
        message,
        options,
        {
          onStart: (data) => {
            console.log('Streaming started:', data);
          },
          onProgress: (data) => {
            console.log('Progress update:', data);
            // Mettre à jour la barre de progression ou autres indicateurs visuels ici
          },
          onChunk: (text, completion) => {
            console.log(`Received chunk: "${text}" (${Math.round(completion * 100)}%)`);
            setStreamingText(prev => {
              const newText = prev + text;
              return newText;
            });
          },
          onComplete: (data) => {
            console.log('Streaming complete, full answer:', data.answer);
            
            // Streaming terminé, adapter les sources et ajouter le message complet
            const adaptedSources = data.sources ? adaptSources(data.sources) : undefined;
            
            // Ajouter le message complet de l'assistant à la conversation
            addMessage(data.answer, 'assistant', adaptedSources);
            
            // Ajouter la classe de transition pour un effet de fondu
            setStreamingTextClass('fade-out');
            
            // Réinitialiser l'état de streaming avec un délai pour une transition fluide
            setTimeout(() => {
              setStreamingText('');
              setStreamingTextClass('');
              setIsLoading(false);
              
              // Nettoyer la référence
              abortControllerRef.current = null;
            }, 300); // Délai correspondant à la durée de la transition CSS
          },
          onError: (error) => {
            console.error('Streaming error:', error);
            
            // Ajouter un message d'erreur à la conversation
            addMessage(
              "Désolé, une erreur s'est produite lors de la génération de la réponse. Veuillez réessayer.",
              'assistant'
            );
            
            // Réinitialiser l'état de streaming
            setStreamingText('');
            setStreamingTextClass('');
            setIsLoading(false);
            
            // Nettoyer la référence
            abortControllerRef.current = null;
          }
        },
        token
      );
      
      // Stocker la fonction pour fermer le stream
      abortControllerRef.current = closeStream;
      
    } catch (error) {
      console.error('Error initiating streaming:', error);
      
      // Ajouter un message d'erreur à la conversation
      addMessage(
        "Désolé, une erreur s'est produite lors de l'envoi de votre message. Veuillez réessayer.",
        'assistant'
      );
      
      // Réinitialiser l'état de streaming
      setIsLoading(false);
      setStreamingText('');
      setStreamingTextClass('');
    }
  };

  // Si les conversations sont en cours de chargement
  if (isLoadingConversations) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-3 text-gray-600">Chargement des conversations...</p>
        </div>
      </div>
    );
  }

  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-lg text-gray-600 mb-4">Aucune conversation sélectionnée</p>
          <p className="text-gray-500">Commencez une nouvelle conversation ou sélectionnez-en une existante.</p>
        </div>
      </div>
    );
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
              
              <div className={`message-bubble assistant-bubble ${streamingTextClass}`}>
                <div className="whitespace-pre-wrap">{streamingText}</div>
                {/* L'indicateur de saisie clignotant - ne pas afficher pendant la transition */}
                {!streamingTextClass && <span className="animate-pulse inline-block ml-1">▌</span>}
              </div>
            </div>
          </div>
        )}
        
        {/* Indicateur de chargement quand il n'y a pas encore de streaming */}
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