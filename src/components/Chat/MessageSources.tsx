import React from 'react';
import { Source } from '../../types';

interface MessageSourcesProps {
  sources: Source[];
}

const MessageSources: React.FC<MessageSourcesProps> = ({ sources }) => {
  // Trier les sources par score de pertinence (décroissant)
  const sortedSources = [...sources].sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  return (
    <div className="message-sources mt-3 pt-3 border-t border-gray-200">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Sources ({sources.length})</h4>
      <div className="space-y-3">
        {sortedSources.map((source, index) => (
          <div key={index} className="text-sm bg-gray-50 p-3 rounded">
            <div className="flex justify-between items-start mb-1">
              <span className="font-medium text-gray-800">{source.title}</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                Score: {source.relevanceScore.toFixed(2)}
              </span>
            </div>
            
            {source.metadata.partie && (
              <div className="text-xs text-gray-600 mb-1">
                {source.metadata.partie && `Partie ${source.metadata.partie}`}
                {source.metadata.chapitre && ` - Chapitre ${source.metadata.chapitre}`}
              </div>
            )}
            
            {source.preview && (
              <div className="text-gray-600 mt-1 text-xs italic border-l-2 border-gray-300 pl-2">
                "{source.preview}"
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MessageSources;