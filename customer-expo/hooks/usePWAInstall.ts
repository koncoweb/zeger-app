import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  canInstall: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  isLoading: boolean;
  error: string | null;
}

export const usePWAInstall = () => {
  const [state, setState] = useState<PWAInstallState>({
    isInstallable: false,
    isInstalled: false,
    isStandalone: false,
    canInstall: false,
    installPrompt: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');

    // Check if PWA is installable
    const checkInstallability = () => {
      setState((prev) => ({
        ...prev,
        isStandalone,
        isInstalled: isStandalone,
        canInstall: !isStandalone && 'serviceWorker' in navigator,
      }));
    };

    checkInstallability();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      
      setState((prev) => ({
        ...prev,
        isInstallable: true,
        installPrompt: installEvent,
        canInstall: true,
      }));
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setState((prev) => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        installPrompt: null,
        canInstall: false,
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPWA = async () => {
    if (!state.installPrompt) {
      setState((prev) => ({
        ...prev,
        error: 'Instalasi tidak tersedia saat ini',
      }));
      return false;
    }

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Show the install prompt
      await state.installPrompt.prompt();

      // Wait for user choice
      const choiceResult = await state.installPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isInstalled: true,
          isInstallable: false,
          installPrompt: null,
        }));
        return true;
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Instalasi dibatalkan',
        }));
        return false;
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Gagal menginstal aplikasi',
      }));
      return false;
    }
  };

  const getInstallInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      return {
        browser: 'Chrome',
        steps: [
          'Tap menu (⋮) di pojok kanan atas',
          'Pilih "Add to Home screen" atau "Install app"',
          'Tap "Add" atau "Install"',
          'Aplikasi akan muncul di home screen Anda',
        ],
      };
    } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      return {
        browser: 'Safari',
        steps: [
          'Tap tombol Share (□↗) di bagian bawah',
          'Scroll dan pilih "Add to Home Screen"',
          'Ubah nama jika diperlukan',
          'Tap "Add"',
          'Aplikasi akan muncul di home screen Anda',
        ],
      };
    } else if (userAgent.includes('firefox')) {
      return {
        browser: 'Firefox',
        steps: [
          'Tap menu (⋮) di pojok kanan atas',
          'Pilih "Install"',
          'Tap "Add to Home Screen"',
          'Aplikasi akan muncul di home screen Anda',
        ],
      };
    } else {
      return {
        browser: 'Browser Anda',
        steps: [
          'Cari opsi "Add to Home Screen" atau "Install" di menu browser',
          'Ikuti instruksi yang muncul',
          'Aplikasi akan muncul di home screen Anda',
        ],
      };
    }
  };

  const clearError = () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  return {
    ...state,
    installPWA,
    getInstallInstructions,
    clearError,
    // Helper properties
    showInstallPrompt: state.canInstall && state.isInstallable && !state.isInstalled,
    showManualInstructions: state.canInstall && !state.isInstallable && !state.isInstalled,
  };
};

export default usePWAInstall;