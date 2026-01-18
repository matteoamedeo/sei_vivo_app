import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function InfoScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <ScrollView style={styles.scrollView}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Privacy
        </ThemedText>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.bulletPoint}>• Nessun GPS</ThemedText>
          <ThemedText style={styles.bulletPoint}>• Dati minimi</ThemedText>
          <ThemedText style={styles.bulletPoint}>• Crittografia</ThemedText>
          <ThemedText style={styles.bulletPoint}>• Zero social</ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Come Funziona
          </ThemedText>
          <ThemedText style={styles.description}>
            SILEME è un'app semplice che ti permette di confermare periodicamente che stai bene.
            Se non fai check-in entro il tempo stabilito, l'app invia automaticamente una notifica
            al tuo contatto di emergenza.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Privacy e Sicurezza
          </ThemedText>
          <ThemedText style={styles.description}>
            La tua privacy è importante. L'app non traccia la tua posizione, non accede al
            microfono o alla fotocamera, e raccoglie solo i dati minimi necessari per funzionare.
            Tutti i dati sono crittografati e salvati in modo sicuro.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.versionBox}>
          <ThemedText style={styles.versionText}>Versione 1.0.0</ThemedText>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    gap: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  section: {
    gap: 12,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 16,
    lineHeight: 28,
    opacity: 0.8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
  },
  versionBox: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    marginTop: 16,
  },
  versionText: {
    fontSize: 14,
    opacity: 0.6,
  },
});