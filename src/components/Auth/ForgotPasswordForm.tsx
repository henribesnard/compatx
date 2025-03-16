// src/components/Auth/ForgotPasswordForm.tsx
import React, { useState } from 'react';
import { FaKey, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

interface ForgotPasswordFormProps {
  onCancel: () => void;
  onLoginClick: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onCancel, onLoginClick }) => {
  const { requestPasswordReset, error, clearError, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setFormError('');
    
    // Effacer l'erreur de l'API
    if (error) {
      clearError();
    }
  };

  const validateForm = (): boolean => {
    if (!email) {
      setFormError('L\'email est requis');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setFormError('Format d\'email invalide');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await requestPasswordReset(email);
      setIsSubmitted(true);
    } catch (error) {
      // Les erreurs sont déjà gérées par le contexte d'authentification
      console.error('Password reset request error:', error);
    }
  };

  if (isSubmitted) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-primary mb-6 text-center">Email envoyé</h2>
        
        <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-700 rounded text-center">
          <p>Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.</p>
          <p className="mt-2">Vérifiez votre boîte de réception et suivez les instructions.</p>
        </div>
        
        <div className="text-center">
          <button
            type="button"
            onClick={onLoginClick}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-primary mb-6 text-center">Réinitialisation du mot de passe</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <p className="mb-4 text-gray-600">
        Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary ${
              formError ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="votre@email.com"
            disabled={isLoading}
          />
          {formError && (
            <p className="mt-1 text-sm text-red-600">{formError}</p>
          )}
        </div>
        
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-2 px-4 bg-primary text-white rounded flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors disabled:bg-gray-400"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Envoi en cours...</span>
              </>
            ) : (
              <>
                <FaKey />
                <span>Réinitialiser le mot de passe</span>
              </>
            )}
          </button>
        </div>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Vous vous souvenez de votre mot de passe ?{' '}
            <button
              type="button"
              onClick={onLoginClick}
              className="text-primary hover:underline"
              disabled={isLoading}
            >
              Se connecter
            </button>
          </p>
        </div>
        
        <div className="text-center">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-gray-500 hover:underline"
            disabled={isLoading}
          >
            Retour
          </button>
        </div>
      </form>
    </div>
  );
};

export default ForgotPasswordForm;