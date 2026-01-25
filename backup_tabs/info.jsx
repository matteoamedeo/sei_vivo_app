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
          <ThemedText type="default" style={styles.bulletPoint}>• Nessun GPS</ThemedText>
          <ThemedText type="default" style={styles.bulletPoint}>• Dati minimi</ThemedText>
          <ThemedText type="default" style={styles.bulletPoint}>• Crittografia</ThemedText>
          <ThemedText type="default" style={styles.bulletPoint}>• Zero social</ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Come Funziona
          </ThemedText>
          <ThemedText type="default" style={styles.description}>
            SILEME è un'app semplice che ti permette di confermare periodicamente che stai bene.
            Se non fai check-in entro il tempo stabilito, l'app invia automaticamente una notifica
            al tuo contatto di emergenza.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Privacy e Sicurezza
          </ThemedText>
          <ThemedText type="default" style={styles.description}>
            La tua privacy è importante. L'app non traccia la tua posizione, non accede al
            microfono o alla fotocamera, e raccoglie solo i dati minimi necessari per funzionare.
            Tutti i dati sono crittografati e salvati in modo sicuro.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.versionBox}>
          <ThemedText type="smallMedium" style={styles.versionText}>Versione 1.0.0</ThemedText>
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
    marginBottom: 8,
  },
  section: {
    gap: 12,
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  bulletPoint: {
    opacity: 0.8,
  },
  description: {
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
    opacity: 0.6,
  },
});