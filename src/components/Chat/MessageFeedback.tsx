import React, { useState } from 'react';
import { FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import { useConversation } from '../../hooks/useConversation';

interface MessageFeedbackProps {
  messageId: string;
  existingFeedback?: {
    rating: number;
    comment?: string;
  };
}

const MessageFeedback: React.FC<MessageFeedbackProps> = ({ messageId, existingFeedback }) => {
  const [rating, setRating] = useState<number | null>(existingFeedback?.rating ?? null);
  const [comment, setComment] = useState(existingFeedback?.comment || '');
  const [showComment, setShowComment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(!!existingFeedback);
  
  const { addFeedback } = useConversation();
  
  const handleSubmit = async () => {
    if (rating === null) return;
    
    setIsSubmitting(true);
    
    try {
      const success = await addFeedback(messageId, {
        rating,
        comment: comment.trim() || undefined
      });
      
      if (success) {
        setSubmitted(true);
        setShowComment(false);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (submitted) {
    return (
      <div className="text-xs text-green-600 flex items-center">
        <span>Merci pour votre avis !</span>
      </div>
    );
  }
  
  return (
    <div className="feedback-container">
      <div className="flex items-center">
        <button
          onClick={() => {
            setRating(1);
            !showComment && setShowComment(true);
          }}
          className={`p-1 hover:text-green-600 ${rating === 1 ? 'text-green-600' : ''}`}
          title="Utile"
          disabled={isSubmitting}
        >
          <FaThumbsUp />
        </button>
        
        <button
          onClick={() => {
            setRating(-1);
            !showComment && setShowComment(true);
          }}
          className={`p-1 ml-2 hover:text-red-600 ${rating === -1 ? 'text-red-600' : ''}`}
          title="Pas utile"
          disabled={isSubmitting}
        >
          <FaThumbsDown />
        </button>
        
        {rating !== null && !showComment && (
          <>
            <button
              onClick={() => setShowComment(true)}
              className="ml-2 text-xs text-gray-600 hover:text-gray-800"
              disabled={isSubmitting}
            >
              Ajouter un commentaire
            </button>
            
            <button
              onClick={handleSubmit}
              className="ml-2 text-xs text-primary hover:text-primary-dark"
              disabled={isSubmitting}
            >
              Envoyer
            </button>
          </>
        )}
      </div>
      
      {showComment && (
        <div className="mt-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-sm"
            placeholder="Donnez plus de détails sur votre avis (optionnel)"
            rows={2}
            disabled={isSubmitting}
          />
          
          <div className="flex justify-end mt-1">
            <button
              onClick={() => setShowComment(false)}
              className="text-xs text-gray-500 hover:text-gray-700 mr-2"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            
            <button
              onClick={handleSubmit}
              className="text-xs text-white bg-primary px-2 py-1 rounded hover:bg-primary-dark"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Envoi...' : 'Envoyer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageFeedback;