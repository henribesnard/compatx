import React from 'react';
import Layout from './components/Layout';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { StreamProvider } from './contexts/StreamContext';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ChatProvider>
        <StreamProvider>
          <Layout />
        </StreamProvider>
      </ChatProvider>
    </AuthProvider>
  );
};

export default App;