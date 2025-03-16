import React, { useState } from 'react';
import { FaStar, FaRegStar, FaPaperPlane } from 'react-icons/fa';
import { useChat } from '../../contexts/ChatContext';

interface MessageFeedbackProps {
  messageId: string;
  existingFeedback?: {
    rating: number;
    comment?: string;
  };
}

const MessageFeedback: React.FC<MessageFeedbackProps> = ({ messageId, existingFeedback }) => {
  const [rating, setRating] = useState<number>(existingFeedback?.rating || 0);
  const [comment, setComment] = useState<string>(existingFeedback?.comment || '');
  const [isAddingComment, setIsAddingComment] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(!!existingFeedback);
  const { addFeedback } = useChat();

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    setIsSubmitting(true);
    
    try {
      await addFeedback(messageId, rating, comment || undefined);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex items-center text-xs text-gray-500 mt-2">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star} className="text-primary">
              {star <= (existingFeedback?.rating || rating) ? <FaStar size={12} /> : <FaRegStar size={12} />}
            </span>
          ))}
        </div>
        <span className="ml-2">Merci pour votre évaluation!</span>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className="flex items-center">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-${rating >= star ? 'primary' : 'gray-400'} focus:outline-none`}
              disabled={isSubmitting}
            >
              {rating >= star ? <FaStar size={14} /> : <FaRegStar size={14} />}
            </button>
          ))}
        </div>
        {rating > 0 && !isAddingComment && (
          <button
            onClick={() => setIsAddingComment(true)}
            className="ml-2 text-xs text-primary underline focus:outline-none"
            disabled={isSubmitting}
          >
            Ajouter un commentaire
          </button>
        )}
        {rating > 0 && (
          <button
            onClick={handleSubmit}
            className="ml-2 text-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="text-xs">Envoi...</span>
            ) : (
              <FaPaperPlane size={12} />
            )}
          </button>
        )}
      </div>
      
      {isAddingComment && (
        <div className="mt-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ajouter un commentaire (optionnel)"
            className="w-full p-2 text-xs border border-gray-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary"
            rows={2}
            disabled={isSubmitting}
          />
        </div>
      )}
    </div>
  );
};

export default MessageFeedback;