import React, { useEffect, useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../../contexts/AuthContext';

// Définition de l'interface pour la réponse de Google
interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

// Pour TypeScript, déclarer la variable globale pour l'objet Google
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (element: HTMLElement, config: object) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface GoogleLoginProps {
  onLoginSuccess?: () => void;
  onLoginError?: (error: Error) => void;
}

const GoogleLogin: React.FC<GoogleLoginProps> = ({ onLoginSuccess, onLoginError }) => {
  const { googleLogin, isAuthenticated } = useAuth();
  const [loadingGoogle, setLoadingGoogle] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer l'ID client Google à partir des variables d'environnement de Vite
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  useEffect(() => {
    // Vérifier si l'ID client est configuré
    if (!googleClientId) {
      setError("ID client Google non configuré. Veuillez configurer VITE_GOOGLE_CLIENT_ID.");
      setLoadingGoogle(false);
      return;
    }

    // Charger le script Google
    const loadGoogleScript = () => {
      // Vérifier si le script est déjà chargé
      if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
        initializeGoogleLogin();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = initializeGoogleLogin;
      script.onerror = () => {
        setLoadingGoogle(false);
        setError("Impossible de charger le service de connexion Google.");
        if (onLoginError) onLoginError(new Error("Failed to load Google Sign-In"));
      };
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    };

    // Initialiser Google Sign-In après chargement du script
    const initializeGoogleLogin = () => {
      if (!window.google) {
        setLoadingGoogle(false);
        setError("Service Google non disponible.");
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleResponse,
        auto_select: false,
      });

      setLoadingGoogle(false);
    };

    // Traiter la réponse de Google
    const handleGoogleResponse = async (response: GoogleCredentialResponse) => {
      try {
        if (!response.credential) {
          setError("Authentification échouée. Veuillez réessayer.");
          return;
        }

        await googleLogin(response.credential);
        if (onLoginSuccess) onLoginSuccess();
      } catch (error) {
        setError("Erreur lors de la connexion. Veuillez réessayer.");
        if (onLoginError) onLoginError(error instanceof Error ? error : new Error(String(error)));
      }
    };

    if (!isAuthenticated) {
      loadGoogleScript();
    }

    return () => {
      // Nettoyage si nécessaire
    };
  }, [isAuthenticated, googleLogin, onLoginSuccess, onLoginError, googleClientId]);

  // Rendu du bouton google personnalisé (plutôt que celui par défaut)
  const handleCustomGoogleLogin = () => {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.prompt();
    } else {
      setError("Service Google non disponible. Veuillez réessayer plus tard.");
    }
  };

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="w-full">
      <button
        onClick={handleCustomGoogleLogin}
        disabled={loadingGoogle}
        className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FcGoogle size={20} />
        <span>{loadingGoogle ? "Chargement..." : "Se connecter avec Google"}</span>
      </button>
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
      
      {/* Div invisible pour Google Sign-In (utilisé par l'API Google) */}
      <div id="google-signin-button" style={{ display: 'none' }}></div>
    </div>
  );
};

export default GoogleLogin;