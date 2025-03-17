// src/components/Auth/LoginForm.tsx
import React, { useState } from 'react';
import { FaSignInAlt, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { LoginCredentials } from '../../types';

interface LoginFormProps {
  onCancel: () => void;
  onRegisterClick: () => void;
  onForgotPasswordClick: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ 
  onCancel, 
  onRegisterClick, 
  onForgotPasswordClick 
}) => {
  const { login, error, clearError, isLoading } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
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
    
    if (!credentials.email) {
      errors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(credentials.email)) {
      errors.email = 'Format d\'email invalide';
    }
    
    if (!credentials.password) {
      errors.password = 'Le mot de passe est requis';
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
      await login(credentials);
      setTimeout(() => onCancel(), 100);
    } catch (error) {
      // Les erreurs sont déjà gérées par le contexte d'authentification
      console.error('Login error:', error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-primary mb-6 text-center">Connexion</h2>
      
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
            value={credentials.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary ${
              formErrors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="votre@email.com"
            disabled={isLoading}
          />
          {formErrors.email && (
            <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Mot de passe
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary ${
              formErrors.password ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Mot de passe"
            disabled={isLoading}
          />
          {formErrors.password && (
            <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
          )}
        </div>
        
        <div className="text-right">
          <button
            type="button"
            onClick={onForgotPasswordClick}
            className="text-sm text-primary hover:underline"
            disabled={isLoading}
          >
            Mot de passe oublié ?
          </button>
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
                <span>Connexion en cours...</span>
              </>
            ) : (
              <>
                <FaSignInAlt />
                <span>Se connecter</span>
              </>
            )}
          </button>
        </div>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Pas encore de compte ?{' '}
            <button
              type="button"
              onClick={onRegisterClick}
              className="text-primary hover:underline"
              disabled={isLoading}
            >
              S'inscrire
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

export default LoginForm;