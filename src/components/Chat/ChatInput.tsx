// src/components/Chat/ChatInput.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FaPaperPlane, FaPaperclip, FaTimes } from 'react-icons/fa';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onCancelStreaming?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, onCancelStreaming }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Ajustement automatique de la hauteur du textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);
  
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;
    
    onSendMessage(message);
    setMessage('');
    
    // Réinitialiser la hauteur
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message, isLoading, onSendMessage]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }, [handleSubmit]);
  
  const handleCancelStreaming = useCallback(() => {
    if (onCancelStreaming) {
      onCancelStreaming();
    }
  }, [onCancelStreaming]);
  
  return (
    <div className="border-t border-gray-200 px-6 py-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-end rounded-md border border-gray-300 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Posez votre question sur le plan comptable OHADA..."
            className="flex-1 resize-none max-h-32 py-3 px-4 outline-none rounded-md transition-all duration-200"
            rows={1}
            disabled={isLoading}
          />
          <div className="flex items-center px-3 py-2">
            <button
              type="button"
              className="p-1 text-gray-400 hover:text-gray-600 mr-2"
              disabled={isLoading}
            >
              <FaPaperclip size={16} />
            </button>
            {isLoading ? (
              <button
                type="button"
                className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                onClick={handleCancelStreaming}
              >
                <FaTimes size={14} />
              </button>
            ) : (
              <button
                type="submit"
                className={`p-2 rounded-full ${
                  message.trim()
                    ? 'bg-primary text-white hover:bg-primary-dark'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                } transition-colors`}
                disabled={!message.trim()}
              >
                <FaPaperPlane size={14} />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;