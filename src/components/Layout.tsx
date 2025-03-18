// src/components/Layout.tsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar/Sidebar';
import Header from './Header/Header';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './Auth/AuthModal';

type AuthFormType = 'login' | 'register' | 'forgot-password' | 'reset-password' | null;

const Layout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [initialAuthForm, setInitialAuthForm] = useState<AuthFormType>('login');
  const location = useLocation();

  // Effet pour vérifier les paramètres d'URL pour la réinitialisation de mot de passe
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const token = query.get('token');
    const email = query.get('email');
    
    if (token && email && !isAuthenticated) {
      setInitialAuthForm('reset-password');
      setAuthModalOpen(true);
    } else if (isAuthenticated && authModalOpen) {
      // Fermer le modal si déjà authentifié
      setAuthModalOpen(false);
    }
  }, [location, isAuthenticated, authModalOpen]);

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

  const handleOpenLogin = () => {
    setInitialAuthForm('login');
    setAuthModalOpen(true);
  };
  
  const handleOpenRegister = () => {
    setInitialAuthForm('register');
    setAuthModalOpen(true);
  };

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
            <main className="flex-1 flex flex-col overflow-hidden justify-center items-center">
              <div className="text-center p-8 max-w-lg">
                <h2 className="text-xl font-semibold text-primary mb-4">Module de chat en cours de développement</h2>
                <p className="text-gray-600 mb-6">
                  Notre équipe travaille sur une nouvelle version du module de chat qui offrira une meilleure expérience utilisateur.
                </p>
                <div className="w-24 h-24 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">
                  Restez connecté pour les mises à jour à venir !
                </p>
              </div>
            </main>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
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
            </div>
          </div>
        )}
      </div>
      
      {/* Modal d'authentification */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        initialForm={initialAuthForm}
      />
    </div>
  );
};

export default Layout;