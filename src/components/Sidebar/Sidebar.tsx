import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaUser, FaCog, FaSignOutAlt, FaQuestionCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import ConversationsList from '../Conversation/ConversationList';

const Sidebar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter?')) {
      logout();
      setShowUserMenu(false);
    }
  };

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-primary mb-2">ComptaX</h1>
        <div className="flex items-center">
          <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">OHADA</span>
          <span className="ml-2 text-xs text-gray-500">Expert-comptable</span>
        </div>
      </div>
      
      {/* Contenu principal du sidebar - liste des conversations */}
      <div className="flex-1 overflow-hidden">
        <ConversationsList />
      </div>
      
      {/* Fonctionnalités supplémentaires */}
      <div className="p-3 border-t border-gray-200">
        <button 
          className="w-full text-left py-2 px-3 rounded text-gray-600 hover:bg-gray-100 flex items-center gap-2 text-sm"
          onClick={() => window.open('https://ohada.com/', '_blank')}
        >
          <FaQuestionCircle size={14} />
          <span>Aide et documentation OHADA</span>
        </button>
      </div>
      
      {/* Section utilisateur */}
      <div className="p-4 border-t border-gray-200">
        <div className="relative">
          <button 
            className="w-full flex items-center justify-between p-2 rounded hover:bg-gray-100"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="flex items-center gap-2">
              {isAuthenticated && user ? (
                <>
                  {user.profile_picture ? (
                    <img src={user.profile_picture} alt={user.name} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary">
                      <FaUser size={14} />
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <span className="text-sm font-medium block truncate">{user.name}</span>
                    <span className="text-xs text-gray-500 block truncate">{user.email}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <FaUser size={16} className="text-gray-500" />
                  </div>
                  <span className="text-sm">Invité</span>
                </>
              )}
            </div>
            <div>
              {showUserMenu ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
            </div>
          </button>
          
          {/* Menu utilisateur */}
          {showUserMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              {isAuthenticated ? (
                <>
                  <button 
                    className="w-full text-left py-2 px-4 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FaCog size={14} />
                    <span>Paramètres</span>
                  </button>
                  <button 
                    className="w-full text-left py-2 px-4 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt size={14} />
                    <span>Déconnexion</span>
                  </button>
                </>
              ) : (
                <div className="py-2 px-4 text-sm text-gray-500">
                  Connectez-vous pour accéder à toutes les fonctionnalités
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;