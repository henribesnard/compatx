// src/components/Auth/AuthModal.tsx
import React, { useState, useEffect } from 'react';
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
  const { isAuthenticated } = useAuth();
  
  // Effet pour fermer automatiquement le modal lorsque l'utilisateur est authentifié
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      onClose();
    }
  }, [isAuthenticated, isOpen, onClose]);

  if (!isOpen) return null;

  const handleOpenLogin = () => setCurrentForm('login');
  const handleOpenRegister = () => setCurrentForm('register');
  const handleOpenForgotPassword = () => setCurrentForm('forgot-password');
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-primary">
            {currentForm === 'login' && 'Connexion'}
            {currentForm === 'register' && 'Inscription'}
            {currentForm === 'forgot-password' && 'Mot de passe oublié'}
            {currentForm === 'reset-password' && 'Réinitialisation du mot de passe'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {currentForm === 'login' && (
          <LoginForm
            onCancel={onClose}
            onRegisterClick={handleOpenRegister}
            onForgotPasswordClick={handleOpenForgotPassword}
          />
        )}

        {currentForm === 'register' && (
          <RegisterForm
            onCancel={onClose}
            onLoginClick={handleOpenLogin}
          />
        )}

        {currentForm === 'forgot-password' && (
          <ForgotPasswordForm
            onCancel={onClose}
            onLoginClick={handleOpenLogin}
          />
        )}

        {currentForm === 'reset-password' && (
          <PasswordResetForm
            onCancel={onClose}
            onLoginClick={handleOpenLogin}
          />
        )}
      </div>
    </div>
  );
};

export default AuthModal;