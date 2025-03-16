// src/components/Auth/RegisterForm.tsx
import React, { useState } from 'react';
import { FaUserPlus, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { RegisterData } from '../../types';

interface RegisterFormProps {
  onCancel: () => void;
  onLoginClick: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onCancel, onLoginClick }) => {
  const { register, error, clearError, isLoading } = useAuth();
  const [formData, setFormData] = useState<RegisterData & { confirmPassword: string }>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
    
    if (!formData.name) {
      errors.name = 'Le nom est requis';
    }
    
    if (!formData.email) {
      errors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Format d\'email invalide';
    }
    
    if (!formData.password) {
      errors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 8) {
      errors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
    }
    
    if (formData.password !== formData.confirmPassword) {
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
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
    } catch (error) {
      // Les erreurs sont déjà gérées par le contexte d'authentification
      console.error('Registration error:', error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-primary mb-6 text-center">Créer un compte</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nom
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary ${
              formErrors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Votre nom"
            disabled={isLoading}
          />
          {formErrors.name && (
            <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
          )}
        </div>
        
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
            value={formData.password}
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
                <span>Inscription en cours...</span>
              </>
            ) : (
              <>
                <FaUserPlus />
                <span>S'inscrire</span>
              </>
            )}
          </button>
        </div>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Déjà un compte ?{' '}
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

export default RegisterForm;