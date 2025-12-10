'use client';

import { AuthProvider as CustomAuthProvider } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  return <CustomAuthProvider>{children}</CustomAuthProvider>;
};
