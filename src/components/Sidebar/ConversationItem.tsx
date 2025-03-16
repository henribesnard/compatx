import React from 'react';
import { FaComments } from 'react-icons/fa';
import { Conversation } from '../../types';

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
  return (
    <div 
      onClick={onClick}
      className={`sidebar-conversation ${isActive ? 'active' : ''}`}
    >
      <FaComments />
      <span className="truncate">{conversation.title}</span>
    </div>
  );
};

export default ConversationItem;