import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { tokenService } from '../services/authService';

interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  isPremium?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  validateSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// SecureStore keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved auth data when app starts
  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const savedUser = await SecureStore.getItemAsync(USER_KEY);

      if (savedToken && savedUser) {
        // Validasi token sebelum set state
        const isValid = await tokenService.isTokenValid();

        if (isValid) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          console.log('Auth data loaded and validated from SecureStore');
        } else {
          // Token tidak valid, hapus dari SecureStore
          await tokenService.clearInvalidToken();
          console.log('Invalid token removed from SecureStore');
        }
      } else {
        console.log('No auth data found in SecureStore');
      }
    } catch (error) {
      console.error('Error loading auth data from SecureStore:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token: string, user: User) => {
    try {
      // Save to SecureStore
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

      // Update state
      setToken(token);
      setUser(user);

      console.log('Auth data saved to SecureStore');
    } catch (error) {
      console.error('Error saving auth data to SecureStore:', error);
    }
  };

  const logout = async () => {
    try {
      // Remove from SecureStore
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);

      // Clear state
      setToken(null);
      setUser(null);

      console.log('Auth data removed from SecureStore');
    } catch (error) {
      console.error('Error clearing auth data from SecureStore:', error);
    }
  };

  // Fungsi untuk validasi session manual
  const validateSession = async (): Promise<boolean> => {
    try {
      const isValid = await tokenService.isTokenValid();

      if (!isValid) {
        // Session tidak valid, logout otomatis
        await logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
  };

  const isAuthenticated = !!(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isLoading,
        isAuthenticated,
        setUser,
        validateSession,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
