import React, { createContext, useState, useEffect, useContext } from 'react';
import client, { auth } from '../client';
import { User } from '../types/profile';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      auth.getCurrentUser()
        .then(({ user }) => setUser(user))
        .catch((error) => {
          console.error('Failed to get current user:', error);
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const { user } = await auth.login(email, password);
      setUser(user);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to log in');
      throw error;
    }
  };

  const register = async (email: string, password: string, username: string) => {
    try {
      setError(null);
      const { user } = await auth.register(email, password, username);
      setUser(user);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to register');
      throw error;
    }
  };

  const logout = () => {
    auth.logout();
    setUser(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      setError(null);
      const { user: updatedUser } = await client.profiles.update(data);
      setUser((prev) => prev ? { ...prev, ...updatedUser } : null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update profile');
      throw error;
    }
  };

  // Update axios authorization header when token changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete client.defaults.headers.common['Authorization'];
    }
  }, [user]);

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
  };

  if (loading) {
    // You might want to show a loading spinner here
    return <div>Loading...</div>;
  }

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
