// src/components/Auth/PasswordResetForm.tsx
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FaKey, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { ResetPasswordData } from '../../types';

interface PasswordResetFormProps {
  onCancel: () => void;
  onLoginClick: () => void;
}

const PasswordResetForm: React.FC<PasswordResetFormProps> = ({ onCancel, onLoginClick }) => {
  // Extraire le token et l'email des query params si présents
  const useQuery = () => new URLSearchParams(useLocation().search);
  const query = useQuery();
  const tokenFromUrl = query.get('token');
  const emailFromUrl = query.get('email');
  
  const { resetPassword, error, clearError, isLoading } = useAuth();
  const [formData, setFormData] = useState<ResetPasswordData & { confirmPassword: string }>({
    email: emailFromUrl || '',
    token: tokenFromUrl || '',
    new_password: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer les erreurs lors de la modification
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Effacer l'erreur de l'API
    if (error) {
      clearError();
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.email) {
      errors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Format d\'email invalide';
    }
    
    if (!formData.token) {
      errors.token = 'Le token est requis';
    }
    
    if (!formData.new_password) {
      errors.new_password = 'Le nouveau mot de passe est requis';
    } else if (formData.new_password.length < 8) {
      errors.new_password = 'Le mot de passe doit contenir au moins 8 caractères';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.new_password)) {
      errors.new_password = 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
    }
    
    if (formData.new_password !== formData.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const { confirmPassword, ...resetData } = formData;
      await resetPassword(resetData);
      setIsSubmitted(true);
    } catch (error) {
      // Les erreurs sont déjà gérées par le contexte d'authentification
      console.error('Password reset error:', error);
    }
  };

  if (isSubmitted) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-primary mb-6 text-center">Mot de passe réinitialisé</h2>
        
        <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-700 rounded text-center">
          <p>Votre mot de passe a été réinitialisé avec succès.</p>
          <p className="mt-2">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
        </div>
        
        <div className="text-center">
          <button
            type="button"
            onClick={onLoginClick}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
          >
            Se connecter
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
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary ${
              formErrors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="votre@email.com"
            disabled={isLoading || !!emailFromUrl}
          />
          {formErrors.email && (
            <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
            Token de réinitialisation
          </label>
          <input
            type="text"
            id="token"
            name="token"
            value={formData.token}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary ${
              formErrors.token ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="token-de-reinitialisation"
            disabled={isLoading || !!tokenFromUrl}
          />
          {formErrors.token && (
            <p className="mt-1 text-sm text-red-600">{formErrors.token}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
            Nouveau mot de passe
          </label>
          <input
            type="password"
            id="new_password"
            name="new_password"
            value={formData.new_password}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary ${
              formErrors.new_password ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Nouveau mot de passe"
            disabled={isLoading}
          />
          {formErrors.new_password && (
            <p className="mt-1 text-sm text-red-600">{formErrors.new_password}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirmer le mot de passe
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary ${
              formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Confirmez votre mot de passe"
            disabled={isLoading}
          />
          {formErrors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
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
                <span>Réinitialisation en cours...</span>
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

export default PasswordResetForm;