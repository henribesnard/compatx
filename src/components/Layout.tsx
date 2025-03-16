import React from 'react';
import Sidebar from './Sidebar/Sidebar';
import ChatContainer from './Chat/ChatContainer';

const Layout: React.FC = () => {
  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <ChatContainer />
      </main>
    </div>
  );
};

export default Layout;