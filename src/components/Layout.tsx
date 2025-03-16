import React from 'react';
import Sidebar from './Sidebar/Sidebar';
import ChatContainer from './Chat/ChatContainer';
import Header from './Header/Header';
import { useAuth } from '../contexts/AuthContext';
import GoogleLogin from './Auth/GoogleLogin';

const Layout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

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

  return (
    <div className="flex flex-col h-screen bg-white">
      <Header />
      
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
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-primary mb-2">Bienvenue sur ComptaX</h2>
                <p className="text-gray-600">Assistant expert en comptabilité OHADA</p>
              </div>
              
              <div className="mb-4">
                <GoogleLogin 
                  onLoginSuccess={() => window.location.reload()}
                  onLoginError={(error) => console.error('Login error:', error)}
                />
              </div>
              
              <div className="text-center text-sm text-gray-500 mt-4">
                <p>Connectez-vous pour accéder à toutes les fonctionnalités</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Layout;