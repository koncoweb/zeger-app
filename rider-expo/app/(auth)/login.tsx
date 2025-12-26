import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { COLORS } from '@/lib/constants';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, isLoading, error, clearError } = useAuthStore();
  const toast = useToast();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error('Error', 'Email dan password harus diisi');
      return;
    }

    clearError();
    const result = await signIn(email.trim(), password);

    if (result.error) {
      toast.error('Login Gagal', result.error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>ZEGER</Text>
              <Text style={styles.logoSubtext}>RIDER</Text>
            </View>
            <Text style={styles.title}>Selamat Datang</Text>
            <Text style={styles.subtitle}>Masuk untuk memulai shift Anda</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="Masukkan email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              label="Password"
              placeholder="Masukkan password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Button
              title="Masuk"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              size="lg"
              style={styles.loginButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Aplikasi khusus untuk rider Zeger Coffee
            </Text>
            <Text style={styles.versionText}>v1.0.0</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 2,
  },
  logoSubtext: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.cream,
    textAlign: 'center',
    letterSpacing: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray[500],
  },
  form: {
    marginBottom: 32,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  loginButton: {
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.gray[400],
    textAlign: 'center',
  },
  versionText: {
    fontSize: 12,
    color: COLORS.gray[300],
    marginTop: 4,
  },
});
