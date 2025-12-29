import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';

interface UpdatePromptProps {
  style?: any;
}

export const UpdatePrompt: React.FC<UpdatePromptProps> = ({ style }) => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newServiceWorker, setNewServiceWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Listen for service worker updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Service worker has been updated and is now controlling the page
        window.location.reload();
      });

      // Check for updates
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          if (newWorker) {
            setNewServiceWorker(newWorker);
            
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available
                setShowUpdatePrompt(true);
              }
            });
          }
        });

        // Check for updates immediately
        registration.update();
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          setShowUpdatePrompt(true);
        }
      });
    }
  }, []);

  const handleUpdate = async () => {
    if (!newServiceWorker) {
      // Fallback: reload the page
      window.location.reload();
      return;
    }

    setIsUpdating(true);

    try {
      // Tell the new service worker to skip waiting
      newServiceWorker.postMessage({ type: 'SKIP_WAITING' });
      
      // The controllerchange event will trigger a reload
    } catch (error) {
      console.error('Error updating app:', error);
      // Fallback: reload the page
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
  };

  if (!showUpdatePrompt) {
    return null;
  }

  return (
    <Modal
      visible={showUpdatePrompt}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🔄</Text>
            </View>
            
            <Text style={styles.title}>Update Tersedia</Text>
            <Text style={styles.message}>
              Versi baru Zeger Customer telah tersedia dengan perbaikan dan fitur terbaru.
            </Text>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={handleDismiss}
                disabled={isUpdating}
              >
                <Text style={styles.dismissButtonText}>Nanti</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.updateButton, isUpdating && styles.buttonDisabled]}
                onPress={handleUpdate}
                disabled={isUpdating}
              >
                <Text style={styles.updateButtonText}>
                  {isUpdating ? 'Updating...' : 'Update Sekarang'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  dismissButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  updateButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#EA2831',
    alignItems: 'center',
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default UpdatePrompt;