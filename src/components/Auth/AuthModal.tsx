// src/components/Auth/AuthModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes } from 'react-icons/fa';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import PasswordResetForm from './PasswordResetForm';
import { useAuth } from '../../contexts/AuthContext';

type AuthFormType = 'login' | 'register' | 'forgot-password' | 'reset-password' | null;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialForm?: AuthFormType;
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialForm = 'login' 
}) => {
  const [currentForm, setCurrentForm] = useState<AuthFormType>(initialForm);
  const [isClosing, setIsClosing] = useState(false);
  const { isAuthenticated } = useAuth();
  
  // Mise à jour du formulaire actif lorsque initialForm change
  useEffect(() => {
    if (isOpen && initialForm) {
      setCurrentForm(initialForm);
    }
  }, [isOpen, initialForm]);
  
  // Effet pour fermer le modal lorsque l'utilisateur est authentifié
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      handleClose();
    }
  }, [isAuthenticated, isOpen]);

  // Si le modal n'est pas ouvert, ne pas le rendre du tout
  if (!isOpen && !isClosing) return null;
  
  // Fonction pour fermer avec animation
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  }, [onClose]);

  const handleOpenLogin = () => setCurrentForm('login');
  const handleOpenRegister = () => setCurrentForm('register');
  const handleOpenForgotPassword = () => setCurrentForm('forgot-password');
  
  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleClose}></div>
      <div 
        className={`bg-white rounded-lg shadow-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto relative transition-transform duration-300 ${
          isClosing ? 'transform scale-95' : 'transform scale-100'
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-primary">
            {currentForm === 'login' && 'Connexion'}
            {currentForm === 'register' && 'Inscription'}
            {currentForm === 'forgot-password' && 'Mot de passe oublié'}
            {currentForm === 'reset-password' && 'Réinitialisation du mot de passe'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {currentForm === 'login' && (
          <LoginForm
            onCancel={handleClose}
            onRegisterClick={handleOpenRegister}
            onForgotPasswordClick={handleOpenForgotPassword}
          />
        )}

        {currentForm === 'register' && (
          <RegisterForm
            onCancel={handleClose}
            onLoginClick={handleOpenLogin}
          />
        )}

        {currentForm === 'forgot-password' && (
          <ForgotPasswordForm
            onCancel={handleClose}
            onLoginClick={handleOpenLogin}
          />
        )}

        {currentForm === 'reset-password' && (
          <PasswordResetForm
            onCancel={handleClose}
            onLoginClick={handleOpenLogin}
          />
        )}
      </div>
    </div>
  );
};

export default AuthModal;