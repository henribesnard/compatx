import React from 'react';
import Layout from './components/Layout';
import { ChatProvider } from './contexts/ChatContext';

const App: React.FC = () => {
  return (
    <ChatProvider>
      <Layout />
    </ChatProvider>
  );
};

export default App;