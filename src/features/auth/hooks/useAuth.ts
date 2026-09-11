import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../services/firebaseAuth';
import { AuthState } from '../types';

export const useAuth = (): AuthState => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthState({
        user: user as any,
        isAuthenticated: !!user,
        isLoading: false,
      });
    });

    return unsubscribe;
  }, []);

  return authState;
};
