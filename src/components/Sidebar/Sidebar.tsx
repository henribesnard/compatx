import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaUser, FaCog } from 'react-icons/fa';

const Sidebar: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-primary mb-4">ComptaX</h1>
        {/* Le bouton Nouvelle conversation a été retiré */}
      </div>
      
      {/* Contenu principal du sidebar - placeholder en attendant la nouvelle implémentation */}
      <div className="flex-1 flex items-center justify-center p-4 text-gray-500">
        <div className="text-center">
          <p className="mb-2">Fonctionnalité en cours de développement</p>
          <p className="text-sm">De nouvelles fonctionnalités seront bientôt disponibles.</p>
        </div>
      </div>
      
      {/* Section utilisateur - conservée */}
      <div className="mt-auto p-4 border-t border-gray-200 flex items-center justify-between">
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
        <button className="text-gray-500 hover:text-primary">
          <FaCog size={18} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;