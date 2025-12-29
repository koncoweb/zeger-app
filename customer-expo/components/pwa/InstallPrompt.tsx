import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface InstallPromptProps {
  style?: any;
  showManualInstructions?: boolean;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({
  style,
  showManualInstructions = true,
}) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const {
    showInstallPrompt,
    showManualInstructions: canShowManual,
    isLoading,
    error,
    installPWA,
    getInstallInstructions,
    clearError,
  } = usePWAInstall();

  if (!showInstallPrompt && (!showManualInstructions || !canShowManual)) {
    return null;
  }

  const handleInstall = async () => {
    const success = await installPWA();
    if (success) {
      // Installation successful, component will hide automatically
    }
  };

  const handleShowInstructions = () => {
    setShowInstructions(true);
  };

  const instructions = getInstallInstructions();

  return (
    <>
      <View style={[styles.container, style]}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📱</Text>
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>Install Zeger Customer</Text>
            <Text style={styles.subtitle}>
              Akses lebih cepat dan mudah dengan menginstall aplikasi di perangkat Anda
            </Text>
          </View>
          
          <View style={styles.buttonContainer}>
            {showInstallPrompt ? (
              <TouchableOpacity
                style={[styles.installButton, isLoading && styles.buttonDisabled]}
                onPress={handleInstall}
                disabled={isLoading}
              >
                <Text style={styles.installButtonText}>
                  {isLoading ? 'Installing...' : 'Install'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.instructionsButton}
                onPress={handleShowInstructions}
              >
                <Text style={styles.instructionsButtonText}>
                  Cara Install
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError}>
              <Text style={styles.errorDismiss}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Manual Instructions Modal */}
      <Modal
        visible={showInstructions}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInstructions(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Cara Install di {instructions.browser}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowInstructions(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.instructionsContainer}>
              {instructions.steps.map((step, index) => (
                <View key={index} style={styles.stepContainer}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
            
            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>Keuntungan Install Aplikasi:</Text>
              <Text style={styles.benefitItem}>• Akses lebih cepat tanpa membuka browser</Text>
              <Text style={styles.benefitItem}>• Notifikasi real-time untuk status pesanan</Text>
              <Text style={styles.benefitItem}>• Bekerja offline untuk melihat menu</Text>
              <Text style={styles.benefitItem}>• Tampilan fullscreen seperti aplikasi native</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    margin: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#A16207',
    lineHeight: 20,
  },
  buttonContainer: {
    marginLeft: 12,
  },
  installButton: {
    backgroundColor: '#EA2831',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  installButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  instructionsButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  instructionsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    flex: 1,
  },
  errorDismiss: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6B7280',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  instructionsContainer: {
    marginBottom: 24,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EA2831',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  benefitsContainer: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  benefitItem: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default InstallPrompt;