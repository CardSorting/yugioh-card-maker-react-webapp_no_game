import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session } from '@supabase/supabase-js';
import { sessionManager } from '../auth/SessionManager';

interface AuthContextType {
  session: Session | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    sessionManager.getSession().then(currentSession => {
      setSession(currentSession);
    });

    const authStateChangeSubscription = sessionManager.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => {
      authStateChangeSubscription.data.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await sessionManager.signOut();
  };

  const value: AuthContextType = {
    session,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { AuthContext };
