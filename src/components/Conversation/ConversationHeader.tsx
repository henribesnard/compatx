import React, { useState, useRef, useEffect } from 'react';
import { FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import { useConversation } from '../../hooks/useConversation';

interface ConversationHeaderProps {
  conversationId?: string;
}

const ConversationHeader: React.FC<ConversationHeaderProps> = ({ conversationId }) => {
  const { conversation, updateTitle } = useConversation(conversationId);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(conversation?.title || 'Nouvelle conversation');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Mettre à jour le titre local quand la conversation change
  useEffect(() => {
    setTitle(conversation?.title || 'Nouvelle conversation');
  }, [conversation]);
  
  // Focus sur l'input quand on passe en mode édition
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  const handleEditClick = () => {
    setIsEditing(true);
  };
  
  const handleSaveClick = async () => {
    if (title.trim() && conversation) {
      await updateTitle(title);
    } else {
      setTitle(conversation?.title || 'Nouvelle conversation');
    }
    setIsEditing(false);
  };
  
  const handleCancelClick = () => {
    setTitle(conversation?.title || 'Nouvelle conversation');
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveClick();
    } else if (e.key === 'Escape') {
      handleCancelClick();
    }
  };
  
  return (
    <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
      {isEditing ? (
        <div className="flex items-center w-full">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 p-1 border border-primary rounded focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button 
            onClick={handleSaveClick}
            className="ml-2 p-1 text-green-600 hover:text-green-800"
            title="Enregistrer"
          >
            <FaCheck />
          </button>
          <button 
            onClick={handleCancelClick}
            className="ml-1 p-1 text-red-600 hover:text-red-800"
            title="Annuler"
          >
            <FaTimes />
          </button>
        </div>
      ) : (
        <>
          <h3 className="text-xl font-semibold text-primary truncate">
            {conversation?.title || 'Nouvelle conversation'}
          </h3>
          <button
            onClick={handleEditClick}
            className="p-1 text-gray-500 hover:text-primary"
            title="Modifier le titre"
          >
            <FaEdit />
          </button>
        </>
      )}
    </div>
  );
};

export default ConversationHeader;