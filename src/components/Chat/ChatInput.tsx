import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaStop } from 'react-icons/fa';

interface ChatInputProps {
  onSubmit: (query: string) => void;
  onCancel: () => void;
  isStreaming: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSubmit, onCancel, isStreaming }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Focus sur l'input au montage
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  // Gérer la soumission du formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim() || isStreaming) return;
    
    onSubmit(query);
    setQuery('');
  };
  
  // Gérer l'appui sur Enter (sans Shift)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  // Ajuster automatiquement la hauteur du textarea
  const adjustHeight = () => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(
        Math.max(textarea.scrollHeight, 40), // Minimum 40px, 
        200 // Maximum 200px
      );
      textarea.style.height = `${newHeight}px`;
    }
  };
  
  // Mettre à jour la hauteur lorsque le contenu change
  useEffect(() => {
    adjustHeight();
  }, [query]);
  
  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-end">
        <textarea
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Posez votre question sur OHADA..."
          className="w-full pr-12 py-3 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
          style={{ minHeight: '40px', maxHeight: '200px' }}
          disabled={isStreaming}
        />
        
        <div className="absolute right-2 bottom-2 flex">
          {isStreaming ? (
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
              title="Arrêter la génération"
            >
              <FaStop size={16} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!query.trim()}
              className={`p-2 rounded-md ${
                query.trim() 
                  ? 'bg-primary text-white hover:bg-primary-dark' 
                  : 'bg-gray-200 text-gray-400'
              } transition-colors`}
              title="Envoyer"
            >
              <FaPaperPlane size={16} />
            </button>
          )}
        </div>
      </div>
      
      {/* Instruction pour l'utilisateur */}
      <div className="text-xs text-gray-500 mt-1 text-right">
        Appuyez sur Entrée pour envoyer, Maj+Entrée pour un saut de ligne
      </div>
    </form>
  );
};

export default ChatInput;