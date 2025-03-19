import React, { useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { useStreamQuery } from '../../hooks/useStreamQuery';

const ChatContainer: React.FC = () => {
  const { currentConversation } = useChat();
  const { submitQuery, cancelQuery, isStreaming } = useStreamQuery();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Défiler vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);
  
  return (
    <div className="flex flex-col h-full">
      {/* Entête de la conversation */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h3 className="text-xl font-semibold text-primary truncate">
          {currentConversation?.title || 'Nouvelle conversation'}
        </h3>
      </div>
      
      {/* Zone des messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {!currentConversation ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center max-w-md p-6 rounded-lg bg-primary-light">
              <h3 className="text-xl font-bold text-primary mb-3">Assistant Comptable OHADA</h3>
              <p className="text-gray-600 mb-4">
                Posez vos questions sur le plan comptable OHADA et les normes SYSCOHADA.
              </p>
              <p className="text-sm text-gray-500">
                Exemple: "Comment fonctionne l'amortissement dégressif dans le SYSCOHADA?"
              </p>
            </div>
          </div>
        ) : (
          <>
            {currentConversation.messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center max-w-md p-6 rounded-lg bg-primary-light">
                  <h3 className="text-xl font-bold text-primary mb-3">Commencez votre conversation</h3>
                  <p className="text-gray-600 mb-4">
                    Posez vos questions sur le plan comptable OHADA et les normes SYSCOHADA.
                  </p>
                  <p className="text-sm text-gray-500">
                    Exemple: "Comment fonctionne l'amortissement dégressif dans le SYSCOHADA?"
                  </p>
                </div>
              </div>
            ) : (
              <>
                {currentConversation.messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </>
        )}
      </div>
      
      {/* Zone de saisie */}
      <div className="bg-white border-t border-gray-200 p-4">
        <ChatInput 
          onSubmit={submitQuery} 
          onCancel={cancelQuery}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
};

export default ChatContainer;