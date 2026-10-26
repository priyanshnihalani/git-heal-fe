import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  hasConnectedRepos: boolean;
  connectedReposCount: number;
  selectedRepo: string;
  setSelectedRepo: (repo: string) => void;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [hasConnectedRepos, setHasConnectedRepos] = useState<boolean>(false);
  const [connectedReposCount, setConnectedReposCount] = useState<number>(0);
  const [selectedRepo, setSelectedRepo] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshSession = async () => {
    try {
      const session = await api.auth.getSession();
      const connected = await api.repos.getConnected();
      setUser(session.user);
      setIsAuthenticated(session.isAuthenticated);
      setHasConnectedRepos(connected.length > 0);
      setConnectedReposCount(connected.length);
    } catch (err) {
      console.error('Failed to load session:', err);
      setUser(null);
      setIsAuthenticated(false);
      setHasConnectedRepos(false);
      setConnectedReposCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const login = async () => {
    const loggedUser = await api.auth.login();
    setUser(loggedUser);
    setIsAuthenticated(true);
    const connected = await api.repos.getConnected();
    setHasConnectedRepos(connected.length > 0);
    setConnectedReposCount(connected.length);
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
    setHasConnectedRepos(false);
    setConnectedReposCount(0);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        hasConnectedRepos,
        connectedReposCount,
        selectedRepo,
        setSelectedRepo,
        isLoading,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
