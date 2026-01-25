import { AppModal } from '@/components/AppModal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React from 'react';
import { StyleSheet, View } from 'react-native';

/**
 * Modale Informazioni: privacy, come funziona, privacy e sicurezza, versione.
 * @param {boolean} visible
 * @param {function} onClose
 * @param {string} [version='1.0.0']
 */
export function InfoModal({ visible, onClose, version = '1.0.0' }) {
  return (
    <AppModal visible={visible} onClose={onClose} title="Informazioni">
      <View style={styles.content}>
        <ThemedText type="default" style={styles.bulletPoint}>• Nessun GPS</ThemedText>
        <ThemedText type="default" style={styles.bulletPoint}>• Dati minimi</ThemedText>
        <ThemedText type="default" style={styles.bulletPoint}>• Crittografia</ThemedText>
        <ThemedText type="default" style={styles.bulletPoint}>• Zero social</ThemedText>

        <ThemedText type="default" style={styles.label}>Come funziona</ThemedText>
        <ThemedText type="default" style={styles.description}>
          SILEME è un'app semplice che ti permette di confermare periodicamente che stai bene.
          Se non fai check-in entro il tempo stabilito, l'app invia automaticamente una notifica
          al tuo contatto di emergenza.
        </ThemedText>

        <ThemedText type="default" style={styles.label}>Privacy e Sicurezza</ThemedText>
        <ThemedText type="default" style={styles.description}>
          La tua privacy è importante. L'app non traccia la tua posizione, non accede al
          microfono o alla fotocamera, e raccoglie solo i dati minimi necessari per funzionare.
          Tutti i dati sono crittografati e salvati in modo sicuro.
        </ThemedText>

        <ThemedView style={styles.versionBox}>
          <ThemedText type="smallMedium" style={styles.versionText}>Versione {version}</ThemedText>
        </ThemedView>
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 4,
  },
  bulletPoint: {
    opacity: 0.8,
  },
  label: {
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 4,
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
