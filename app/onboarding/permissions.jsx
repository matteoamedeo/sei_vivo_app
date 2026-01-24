import React from 'react';
import { StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function OnboardingPermissionsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleComplete = () => {
    // L'onboarding è completato, vai alla home
    router.replace('/(tabs)');
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="hugeTitle" style={styles.emoji}>
          🔔
        </ThemedText>
        <ThemedText type="title" style={styles.title}>
          Permessi
        </ThemedText>
        <ThemedText type="medium" style={styles.description}>
          Per funzionare al meglio, l'app ha bisogno di inviarti notifiche quando è il momento di fare check-in.
        </ThemedText>

        <ThemedView style={styles.infoBox}>
          <ThemedText type="default" style={styles.infoText}>
            • Notifiche push per ricordarti il check-in{'\n'}
            • Avvio automatico in background{'\n'}
            • Nessun GPS o tracciamento
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.tint }]}
        onPress={handleComplete}>
        <ThemedText type="medium" style={[styles.buttonText, { color: colorScheme === 'dark' ? colors.text : 'white' }]}>Completa</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  emoji: {
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    opacity: 0.8,
    paddingHorizontal: 16,
  },
  infoBox: {
    marginTop: 32,
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  infoText: {
    opacity: 0.8,
  },
  button: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '600',
  },
});