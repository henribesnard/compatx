import React from 'react';
import Layout from './components/Layout';
import { ChatProvider } from './contexts/ChatContext';
import { AuthProvider } from './contexts/AuthContext';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ChatProvider>
        <Layout />
      </ChatProvider>
    </AuthProvider>
  );
};

export default App;