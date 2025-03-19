import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onDismiss }) => {
  return (
    <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded relative mb-4 flex items-start">
      <div className="flex-shrink-0 mr-2 mt-0.5">
        <FaExclamationTriangle />
      </div>
      <div className="flex-1">
        {message}
      </div>
      {onDismiss && (
        <button
          className="ml-4 text-red-700 hover:text-red-900"
          onClick={onDismiss}
          aria-label="Fermer"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;