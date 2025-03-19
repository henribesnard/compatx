import React from 'react';
import { useChat } from '../../contexts/ChatContext';
import ConversationItem from './ConversationItem';
import { FaPlus } from 'react-icons/fa';

const ConversationsList: React.FC = () => {
  const { 
    conversations, 
    currentConversation, 
    selectConversation, 
    createConversation,
    isLoading 
  } = useChat();
  
  const handleNewConversation = async () => {
    try {
      await createConversation('Nouvelle conversation');
    } catch (error) {
      console.error('Erreur lors de la création d\'une nouvelle conversation:', error);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Bouton nouvelle conversation */}
      <div className="p-4">
        <button
          onClick={handleNewConversation}
          className="w-full py-2 px-4 bg-primary text-white rounded-md flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors"
        >
          <FaPlus size={14} />
          <span>Nouvelle conversation</span>
        </button>
      </div>
      
      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <p>Aucune conversation</p>
            <p className="text-sm mt-1">Commencez par poser une question</p>
          </div>
        ) : (
          conversations.map(conversation => (
            <ConversationItem 
              key={conversation.id}
              conversation={conversation}
              isActive={currentConversation?.id === conversation.id}
              onClick={() => selectConversation(conversation.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationsList;