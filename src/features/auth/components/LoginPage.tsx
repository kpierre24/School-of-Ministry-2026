import React from 'react';
import { authService } from '../services/authService';

export const LoginPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-8">HTEIM Portal</h1>
      <button 
        onClick={() => authService.signIn()}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Sign in with Google
      </button>
    </div>
  );
};
