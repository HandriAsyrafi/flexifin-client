import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Hook untuk mengelola session persistence dan validasi
 * Otomatis memvalidasi token ketika app kembali ke foreground
 */
export const useSessionManager = () => {
  const { validateSession, isAuthenticated } = useAuth();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Listener untuk app state changes
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // Jika app kembali ke foreground dan user sudah login
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        isAuthenticated
      ) {
        console.log('App returned to foreground, validating session...');
        await validateSession();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [validateSession, isAuthenticated]);

  // Fungsi untuk manual validation yang bisa dipanggil dari komponen
  const checkSession = async (): Promise<boolean> => {
    if (!isAuthenticated) return false;
    return await validateSession();
  };

  return {
    checkSession,
  };
};
