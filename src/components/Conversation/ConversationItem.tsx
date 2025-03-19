import React, { useState, useRef, useEffect } from 'react';
import { FaComments, FaEllipsisH, FaTrash, FaEdit } from 'react-icons/fa';
import { Conversation } from '../../types';
import { useChat } from '../../contexts/ChatContext';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ 
  conversation, 
  isActive, 
  onClick 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(conversation.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { deleteConversation, updateConversationTitle } = useChat();

  // Gérer le clic en dehors du menu pour le fermer
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus sur l'input lors de l'édition
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setShowMenu(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette conversation?')) {
      deleteConversation(conversation.id);
    }
    setShowMenu(false);
  };

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      updateConversationTitle(conversation.id, title);
    } else {
      setTitle(conversation.title);
    }
    setIsEditing(false);
  };

  // Format de la date relative
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Aujourd'hui";
    } else if (diffDays === 1) {
      return "Hier";
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="relative mb-1">
      {isEditing ? (
        <form onSubmit={handleTitleSubmit} className="px-2">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border border-primary rounded-sm outline-none focus:ring-1 focus:ring-primary text-sm"
            onBlur={handleTitleSubmit}
          />
        </form>
      ) : (
        <div 
          onClick={onClick}
          className={`sidebar-conversation ${isActive ? 'bg-primary-light text-primary' : 'hover:bg-gray-100'}`}
        >
          <FaComments className="flex-shrink-0" />
          <div className="flex-1 overflow-hidden">
            <div className="truncate font-medium">{conversation.title}</div>
            <div className="text-xs text-gray-500 truncate">
              {formatDate(conversation.updatedAt)}
              {conversation.syncedWithServer && ' • Synchronisé'}
            </div>
          </div>
          <button 
            onClick={handleMenuClick}
            className={`p-1 rounded-full ${isActive ? 'text-primary hover:bg-primary-dark hover:text-white' : 'text-gray-400 hover:bg-gray-200 hover:text-gray-700'}`}
          >
            <FaEllipsisH size={14} />
          </button>
        </div>
      )}
      
      {showMenu && (
        <div 
          ref={menuRef}
          className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-20 border border-gray-200"
          style={{ top: '100%' }}
        >
          <button 
            onClick={handleEdit}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
          >
            <FaEdit size={14} />
            <span>Renommer</span>
          </button>
          <button 
            onClick={handleDelete}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-red-600 hover:bg-gray-100"
          >
            <FaTrash size={14} />
            <span>Supprimer</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ConversationItem;