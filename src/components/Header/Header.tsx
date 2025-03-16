// src/components/Header/Header.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaUser, FaSignOutAlt, FaCog, FaLock, FaSignInAlt, FaUserPlus } from 'react-icons/fa';

interface HeaderProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenLogin, onOpenRegister }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="border-b border-gray-200 px-6 py-3 flex items-center justify-between bg-white">
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-primary">ComptaX</h1>
        <span className="ml-2 text-xs bg-primary text-white px-2 py-0.5 rounded-full">OHADA</span>
      </div>
      
      <div className="flex items-center gap-4">
        {!isAuthenticated ? (
          <div className="flex gap-2">
            <button
              onClick={onOpenLogin}
              className="px-3 py-1.5 text-sm border border-primary text-primary rounded hover:bg-primary-light transition-colors flex items-center gap-1"
            >
              <FaSignInAlt size={14} />
              <span>Connexion</span>
            </button>
            <button
              onClick={onOpenRegister}
              className="px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-primary-dark transition-colors flex items-center gap-1"
            >
              <FaUserPlus size={14} />
              <span>Inscription</span>
            </button>
          </div>
        ) : (
          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-md"
            >
              {user?.profile_picture ? (
                <img 
                  src={user.profile_picture} 
                  alt={user.name} 
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary">
                  <FaUser size={14} />
                </div>
              )}
              <span className="text-sm font-medium">{user?.name || 'Utilisateur'}</span>
            </button>
            
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                <div className="py-1">
                  <div className="px-4 py-2 text-xs text-gray-500">{user?.email}</div>
                  <hr className="my-1" />
                  <button 
                    onClick={() => {
                      setShowProfileMenu(false);
                      // Naviguer vers paramètres (à implémenter)
                    }}
                    className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FaCog size={14} />
                    <span>Paramètres</span>
                  </button>
                  <button 
                    onClick={() => {
                      setShowProfileMenu(false);
                      // Naviguer vers changement de mot de passe (à implémenter)
                    }}
                    className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FaLock size={14} />
                    <span>Changer mot de passe</span>
                  </button>
                  <button 
                    onClick={() => {
                      logout();
                      setShowProfileMenu(false);
                    }}
                    className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FaSignOutAlt size={14} />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;