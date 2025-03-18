import React from 'react';
import Layout from './components/Layout';
import { AuthProvider } from './contexts/AuthContext';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  );
};

export default App;