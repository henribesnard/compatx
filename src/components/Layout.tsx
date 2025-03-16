// src/components/Layout.tsx
import React, { useState } from 'react';
import Sidebar from './Sidebar/Sidebar';
import ChatContainer from './Chat/ChatContainer';
import Header from './Header/Header';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from './Auth/LoginForm';
import RegisterForm from './Auth/RegisterForm';
import ForgotPasswordForm from './Auth/ForgotPasswordForm';

type AuthFormType = 'login' | 'register' | 'forgot-password' | null;

const Layout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [authFormType, setAuthFormType] = useState<AuthFormType>(null);

  // Afficher un écran de chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-3 text-lg text-gray-700">Chargement...</p>
        </div>
      </div>
    );
  }

  const handleOpenLogin = () => setAuthFormType('login');
  const handleOpenRegister = () => setAuthFormType('register');
  const handleOpenForgotPassword = () => setAuthFormType('forgot-password');
  const handleCloseForm = () => setAuthFormType(null);

  return (
    <div className="flex flex-col h-screen bg-white">
      <Header 
        onOpenLogin={handleOpenLogin} 
        onOpenRegister={handleOpenRegister} 
      />
      
      <div className="flex flex-1 overflow-hidden">
        {isAuthenticated ? (
          <>
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
              <ChatContainer />
            </main>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
              {authFormType === null && (
                <>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-primary mb-2">Bienvenue sur ComptaX</h2>
                    <p className="text-gray-600">Assistant expert en comptabilité OHADA</p>
                  </div>
                  
                  <div className="mb-4 space-y-3">
                    <button
                      onClick={handleOpenLogin}
                      className="w-full py-2 px-4 bg-primary text-white rounded flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors"
                    >
                      <span>Se connecter</span>
                    </button>
                    <button
                      onClick={handleOpenRegister}
                      className="w-full py-2 px-4 border border-primary text-primary rounded flex items-center justify-center gap-2 hover:bg-primary-light transition-colors"
                    >
                      <span>Créer un compte</span>
                    </button>
                  </div>
                  
                  <div className="text-center text-sm text-gray-500 mt-4">
                    <p>Connectez-vous pour accéder à toutes les fonctionnalités</p>
                  </div>
                </>
              )}

              {authFormType === 'login' && (
                <LoginForm 
                  onCancel={handleCloseForm}
                  onRegisterClick={handleOpenRegister}
                  onForgotPasswordClick={handleOpenForgotPassword}
                />
              )}

              {authFormType === 'register' && (
                <RegisterForm 
                  onCancel={handleCloseForm}
                  onLoginClick={handleOpenLogin}
                />
              )}

              {authFormType === 'forgot-password' && (
                <ForgotPasswordForm 
                  onCancel={handleCloseForm}
                  onLoginClick={handleOpenLogin}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Layout;