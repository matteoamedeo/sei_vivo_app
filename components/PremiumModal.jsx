import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { AppModal } from '@/components/AppModal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';

/**
 * Modale Premium: stato abbonamento, prezzo, benefit, bottone Attiva.
 * @param {boolean} visible
 * @param {function} onClose
 * @param {boolean} isPremium
 * @param {function} onActivate - Callback per attivare (es. apre Alert e poi updateProfile)
 * @param {boolean} activating
 */
export function PremiumModal({ visible, onClose, isPremium, onActivate, activating }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <AppModal visible={visible} onClose={onClose} title="⭐ Premium">
      {isPremium ? (
        <ThemedView style={styles.premiumActive}>
          <ThemedText type="subtitle" style={styles.premiumActiveText}>
            ✓ Premium attivo
          </ThemedText>
        </ThemedView>
      ) : (
        <View style={styles.content}>
          <ThemedView style={styles.premiumBox}>
            <ThemedText type="huge" style={styles.price}>€1.99 / mese</ThemedText>
          </ThemedView>
          <View style={styles.features}>
            <View style={styles.featureItem}>
              <ThemedText type="subtitle" style={styles.featureIcon}>✔</ThemedText>
              <ThemedText type="medium" style={styles.featureText}>SMS</ThemedText>
            </View>
            <View style={styles.featureItem}>
              <ThemedText type="subtitle" style={styles.featureIcon}>✔</ThemedText>
              <ThemedText type="medium" style={styles.featureText}>Chiamate</ThemedText>
            </View>
            <View style={styles.featureItem}>
              <ThemedText type="subtitle" style={styles.featureIcon}>✔</ThemedText>
              <ThemedText type="medium" style={styles.featureText}>Più contatti (fino a 5)</ThemedText>
            </View>
            <View style={styles.featureItem}>
              <ThemedText type="subtitle" style={styles.featureIcon}>✔</ThemedText>
              <ThemedText type="medium" style={styles.featureText}>Storico completo</ThemedText>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.activateButton, { backgroundColor: colors.tint }]}
            onPress={onActivate}
            disabled={activating}>
            {activating ? (
              <ActivityIndicator color={colorScheme === 'dark' ? colors.text : 'white'} />
            ) : (
              <ThemedText type="medium" style={[styles.activateButtonText, { color: colorScheme === 'dark' ? colors.text : 'white' }]}>
                Attiva
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      )}
    </AppModal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 4,
  },
  premiumBox: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 200, 0, 0.1)',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontWeight: 'bold',
  },
  premiumActive: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(68, 255, 68, 0.1)',
    alignItems: 'center',
  },
  premiumActiveText: {
    fontWeight: '600',
  },
  features: {
    gap: 12,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  featureIcon: {
    color: '#44ff44',
  },
  featureText: {},
  activateButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  activateButtonText: {
    fontWeight: '600',
  },
});
