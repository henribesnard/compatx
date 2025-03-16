import React from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import ConversationsList from './ConversationsList';
import { FaPlus, FaUser, FaCog } from 'react-icons/fa';

const Sidebar: React.FC = () => {
  const { createNewConversation, isLoadingConversations, conversations } = useChat();
  const { isAuthenticated, user } = useAuth();

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-primary mb-4">ComptaX</h1>
        <button 
          onClick={createNewConversation}
          className="w-full py-2 px-4 bg-primary text-white rounded-sm flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors"
        >
          <FaPlus size={14} />
          <span>Nouvelle conversation</span>
        </button>
      </div>
      
      {isLoadingConversations ? (
        <div className="flex-1 flex items-center justify-center p-4 text-gray-500">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm">Chargement...</p>
          </div>
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4 text-gray-500">
          <div className="text-center">
            <p className="mb-2">Aucune conversation</p>
            <p className="text-sm">Commencez par créer une nouvelle conversation.</p>
          </div>
        </div>
      ) : (
        <ConversationsList />
      )}
      
      <div className="mt-auto p-4 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <>
              {user.profile_picture ? (
                <img src={user.profile_picture} alt={user.name} className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary">
                  <FaUser size={14} />
                </div>
              )}
              <div className="overflow-hidden">
                <span className="text-sm font-medium block truncate">{user.name}</span>
                <span className="text-xs text-gray-500 block truncate">{user.email}</span>
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <FaUser size={16} className="text-gray-500" />
              </div>
              <span className="text-sm">Invité</span>
            </>
          )}
        </div>
        <button className="text-gray-500 hover:text-primary">
          <FaCog size={18} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;