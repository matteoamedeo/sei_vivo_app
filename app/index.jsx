import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { isOnboardingComplete } from '@/lib/database';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

export default function SplashScreen() {
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const checkAndNavigate = async () => {
      // Aspetta 1-2 secondi per mostrare lo splash
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (!session) {
        router.replace('/auth/login');
        return;
      }

      try {
        const completed = await isOnboardingComplete(session.user.id);
        if (!completed) {
          router.replace('/onboarding/intro');
        } else {
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('Errore verifica onboarding:', error);
        router.replace('/(tabs)');
      }
    };

    checkAndNavigate();
  }, [session, loading]);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="bigTitle" style={styles.title}>
        SILEME
      </ThemedText>
      <ThemedText type="subtitle" style={styles.subtitle}>
        Are you alive?
      </ThemedText>
      <ActivityIndicator size="large" style={styles.loader} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  title: {
  },
  subtitle: {
    opacity: 0.7,
  },
  loader: {
    marginTop: 32,
  },
});