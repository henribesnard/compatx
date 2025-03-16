import React from 'react';
import { useChat } from '../../contexts/ChatContext';
import ConversationsList from './ConversationsList';
import { FaPlus, FaUser, FaCog } from 'react-icons/fa';

const Sidebar: React.FC = () => {
  const { createNewConversation } = useChat();

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
      
      <ConversationsList />
      
      <div className="mt-auto p-4 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <FaUser size={16} className="text-gray-500" />
          </div>
          <span className="text-sm">Mon compte</span>
        </div>
        <button className="text-gray-500 hover:text-primary">
          <FaCog size={18} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;