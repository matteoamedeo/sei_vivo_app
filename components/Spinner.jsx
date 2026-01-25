import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

/**
 * Spinner centralizzato.
 * @param {string} [message] - Messaggio sotto lo spinner (solo in fullScreen)
 * @param {boolean} [fullScreen=true] - true = schermata intera centrata; false = solo ActivityIndicator (es. bottoni)
 * @param {'small'|'large'} [size='large'] - Dimensione
 * @param {string} [color] - Colore: se non passato usa colors.tint
 */
export function Spinner({ message, fullScreen = true, size = 'large', color }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const spinnerColor = color ?? colors.tint;

  if (!fullScreen) {
    return <ActivityIndicator size={size} color={spinnerColor} />;
  }

  return (
    <ThemedView style={styles.container}>
      <ActivityIndicator size={size} color={spinnerColor} />
      {message ? (
        <ThemedText type="default" style={styles.message}>
          {message}
        </ThemedText>
      ) : null}
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
  message: {
    opacity: 0.8,
  },
});
