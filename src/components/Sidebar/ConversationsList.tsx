import React from 'react';
import { useChat } from '../../contexts/ChatContext';
import ConversationItem from './ConversationItem';

const ConversationsList: React.FC = () => {
  const { conversations, currentConversation, selectConversation } = useChat();

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {conversations.map(conversation => (
        <ConversationItem 
          key={conversation.id}
          conversation={conversation}
          isActive={currentConversation?.id === conversation.id}
          onClick={() => selectConversation(conversation.id)}
        />
      ))}
    </div>
  );
};

export default ConversationsList;