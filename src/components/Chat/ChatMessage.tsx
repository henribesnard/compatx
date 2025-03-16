import React, { useState } from 'react';
import { Message } from '../../types';
import { FaChevronDown, FaChevronUp, FaUser } from 'react-icons/fa';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [showSources, setShowSources] = useState(false);
  
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isSystem = message.role === 'system';
  
  if (isSystem) {
    return (
      <div className="bg-gray-100 rounded-md p-3 text-center max-w-lg mx-auto text-sm text-gray-600">
        {message.content}
      </div>
    );
  }
  
  return (
    <div className={`chat-message ${isUser ? 'justify-end' : ''}`}>
      {isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </div>
      )}
      
      <div className={`flex flex-col ${isUser ? 'items-end' : ''}`}>
        <div className="mb-1">
          <span className="text-xs font-medium text-gray-500">
            {isUser ? 'Vous' : 'Assistant ComptaX'}
          </span>
        </div>
        
        <div className={`message-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}`}>
          <div className="whitespace-pre-wrap">{message.content}</div>
          
          {isAssistant && message.sources && message.sources.length > 0 && (
            <div className="mt-3 border-t border-gray-200 pt-3">
              <button 
                onClick={() => setShowSources(!showSources)}
                className="flex items-center gap-1 text-xs text-primary font-medium"
              >
                Sources {showSources ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
              </button>
              
              {showSources && (
                <div className="mt-2 space-y-2">
                  {message.sources.map((source, index) => (
                    <div key={index} className="bg-white p-2 rounded-sm text-xs border border-gray-200">
                      <div className="font-medium">{source.title}</div>
                      <div className="text-gray-500 text-xs mt-1">
                        {source.metadata.partie && `Partie ${source.metadata.partie}, `}
                        {source.metadata.chapitre && `Chapitre ${source.metadata.chapitre}`}
                      </div>
                      <div className="mt-1 text-gray-700">{source.preview}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
          <FaUser size={14} />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;