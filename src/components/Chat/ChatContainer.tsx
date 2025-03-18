// src/components/Chat/ChatContainer.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { ohadaApi, Source as ApiSource } from '../../api/ohada';
import { Source } from '../../types';
import ProgressBar from '../Shared/ProgressBar';

const ChatContainer: React.FC = () => {
  const { currentConversation, addMessage, isLoadingConversations } = useChat();
  const { isAuthenticated, getToken } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [streamingTextClass, setStreamingTextClass] = useState('');
  const abortControllerRef = useRef<(() => void) | null>(null);
  const finalResponseRef = useRef<{answer: string, sources?: ApiSource[]}>({answer: ''});
  const userMessageRef = useRef<string>('');
  const [streamingProgress, setStreamingProgress] = useState(0);
  const [streamingStatus, setStreamingStatus] = useState<string | null>(null);
  
  // Fonction pour adapter le format des sources API -> App
  const adaptSources = useCallback((apiSources: ApiSource[]): Source[] => {
    return apiSources.map(source => ({
      documentId: source.document_id,
      title: source.metadata?.title || 'Document sans titre',
      metadata: {
        partie: source.metadata?.partie,
        chapitre: source.metadata?.chapitre,
        title: source.metadata?.title,
        documentType: source.metadata?.document_type
      },
      relevanceScore: source.relevance_score || 0,
      preview: source.preview || ''
    }));
  }, []);

  // Fonction pour faire défiler jusqu'au bas
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Effet pour scrolling automatique
  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages, streamingText, scrollToBottom]);

  // Nettoyer le streaming lors du démontage
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        console.log("Cleaning up streaming on component unmount");
        abortControllerRef.current();
      }
    };
  }, []);

  // Fonction pour annuler le streaming en cours
  const cancelStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      console.log("User manually cancelled streaming");
      abortControllerRef.current();
      abortControllerRef.current = null;
      
      // Ajouter la réponse partielle avec note d'annulation
      const partialResponse = finalResponseRef.current.answer;
      if (partialResponse && partialResponse.length > 0) {
        addMessage(
          partialResponse + "\n\n(Remarque: Génération interrompue par l'utilisateur.)",
          'assistant'
        );
      }
      
      // Réinitialiser les états
      setStreamingText('');
      setStreamingTextClass('');
      setStreamingStatus(null);
      setStreamingProgress(0);
      setIsLoading(false);
    }
  }, [addMessage]);

  // Fonction pour envoyer un message
  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return;
    
    console.log("Sending message:", message);
    
    // Stocker le message de l'utilisateur
    userMessageRef.current = message;
    
    // Ajouter le message utilisateur à la conversation
    addMessage(message, 'user', undefined, true);
    
    // Préparer pour le streaming
    setIsLoading(true);
    setStreamingText('');
    setStreamingTextClass('');
    setStreamingProgress(0);
    setStreamingStatus('Initialisation');
    
    // Annuler tout streaming en cours
    if (abortControllerRef.current) {
      console.log("Aborting previous streaming session");
      abortControllerRef.current();
      abortControllerRef.current = null;
    }
    
    // Réinitialiser la référence
    finalResponseRef.current = {answer: ''};
    
    try {
      // Token d'authentification
      const token = isAuthenticated ? getToken() : null;
      
      // Options pour l'API
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
            setStreamingStatus('Connexion établie');
          },
          onProgress: (data) => {
            console.log('Progress update:', data);
            setStreamingProgress(data.completion || 0);
            setStreamingStatus(data.status === 'retrieving' 
              ? 'Recherche d\'informations' 
              : data.status === 'analyzing' 
                ? 'Analyse des documents' 
                : data.status === 'generating' 
                  ? 'Génération de la réponse' 
                  : 'Traitement en cours');
          },
          onChunk: (text, completion) => {
            console.log(`Received chunk (${Math.round(completion * 100)}%)`);
            setStreamingText(prev => {
              const newText = prev + text;
              finalResponseRef.current.answer = newText;
              return newText;
            });
            setStreamingProgress(completion || 0);
          },
          onComplete: (data) => {
            console.log('Streaming complete, full answer received');
            
            // Stocker la réponse complète
            finalResponseRef.current = {
              answer: data.answer || finalResponseRef.current.answer,
              sources: data.sources
            };
            
            // Effet de transition
            setStreamingTextClass('fade-out');
            setStreamingStatus('Réponse complète');
            
            // Délai pour l'effet visuel
            setTimeout(() => {
              try {
                // Récupérer les données finales
                const finalAnswer = finalResponseRef.current.answer;
                const adaptedSources = finalResponseRef.current.sources 
                  ? adaptSources(finalResponseRef.current.sources) 
                  : undefined;
                
                // Ajouter le message assistant
                if (finalAnswer) {
                  console.log('Adding final assistant message');
                  addMessage(finalAnswer, 'assistant', adaptedSources);
                }
                
                // Réinitialiser les états
                setStreamingText('');
                setStreamingTextClass('');
                setStreamingStatus(null);
                setStreamingProgress(0);
                
              } catch (error) {
                console.error('Error adding final message:', error);
              } finally {
                setIsLoading(false);
                abortControllerRef.current = null;
              }
            }, 350);
          },
          onError: (error) => {
            console.error('Streaming error:', error);
            
            // Récupérer la réponse partielle si disponible
            const partialResponse = finalResponseRef.current.answer;
            
            if (partialResponse && partialResponse.length > 0) {
              // Utiliser la réponse partielle avec avertissement
              addMessage(
                partialResponse + "\n\n(Remarque: La génération a été interrompue en raison d'une erreur.)",
                'assistant'
              );
            } else {
              // Message d'erreur générique
              addMessage(
                "Désolé, une erreur s'est produite lors de la génération de la réponse. Veuillez réessayer.",
                'assistant'
              );
            }
            
            // Réinitialiser les états
            setStreamingText('');
            setStreamingTextClass('');
            setStreamingStatus(null);
            setStreamingProgress(0);
            setIsLoading(false);
            abortControllerRef.current = null;
          }
        },
        token
      );
      
      // Stocker la fonction pour annuler le stream
      abortControllerRef.current = closeStream;
      
    } catch (error) {
      console.error('Error initiating streaming:', error);
      
      // Message d'erreur
      addMessage(
        "Désolé, une erreur s'est produite lors de l'envoi de votre message. Veuillez réessayer.",
        'assistant'
      );
      
      // Réinitialiser
      setIsLoading(false);
      setStreamingText('');
      setStreamingTextClass('');
      setStreamingStatus(null);
      setStreamingProgress(0);
    }
  }, [isLoading, currentConversation, isAuthenticated, getToken, addMessage, adaptSources]);

  // Rendu pour les états de chargement et les conversions vides
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
        <h2 className="text-lg font-semibold">{currentConversation.title}</h2>
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
        
        {/* Message en streaming */}
        {streamingText && (
          <div className="chat-message">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            
            <div className="flex flex-col">
              <div className="mb-1 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-gray-500">
                    Assistant ComptaX
                  </span>
                  {streamingStatus && (
                    <span className="ml-2 text-xs text-gray-400">
                      {streamingStatus}
                    </span>
                  )}
                </div>
                {isLoading && (
                  <button 
                    onClick={cancelStreaming}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    Annuler
                  </button>
                )}
              </div>
              
              <div className={`message-bubble assistant-bubble ${streamingTextClass}`}>
                <div className="whitespace-pre-wrap">{streamingText}</div>
                {!streamingTextClass && <span className="typing-indicator inline-block ml-1">▌</span>}
                
                {/* Barre de progression */}
                {streamingProgress > 0 && (
                  <div className="mt-2">
                    <ProgressBar 
                      progress={streamingProgress} 
                      size="sm" 
                      variant={
                        streamingStatus?.includes('Recherche') ? 'info' :
                        streamingStatus?.includes('Analyse') ? 'warning' :
                        'default'
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Indicateur de chargement initial */}
        {isLoading && !streamingText && (
          <div className="flex items-center gap-2 text-gray-500">
            <div className="animate-pulse flex space-x-1">
              <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
              <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
              <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
            </div>
            <span className="text-sm">Initialisation...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <ChatInput 
        onSendMessage={handleSendMessage} 
        isLoading={isLoading} 
        onCancelStreaming={cancelStreaming}
      />
    </>
  );
};

export default ChatContainer;