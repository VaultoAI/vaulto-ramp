import React from 'react';

interface PageProps {
  children: React.ReactNode;
}

export const Page: React.FC<PageProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 pt-2 sm:pt-4 pb-6 sm:pb-12 px-4 sm:px-6 lg:px-8">
      {children}
    </div>
  );
};

