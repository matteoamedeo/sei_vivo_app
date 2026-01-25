import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

/**
 * Modale riutilizzabile con titolo, pulsante Chiudi e contenuto scrollabile.
 * @param {boolean} visible - Mostra/nasconde la modale
 * @param {function} onClose - Chiamata alla chiusura (tap su Chiudi o sullo sfondo)
 * @param {string} title - Titolo in header
 * @param {React.ReactNode} children - Contenuto della modale
 */
export function AppModal({ visible, onClose, title, children }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <ThemedView style={styles.card}>
          <View style={styles.header}>
            <ThemedText type="subtitle" style={styles.title}>{title}</ThemedText>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <ThemedText type="default" style={styles.closeText}>Chiudi</ThemedText>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  title: {
    flex: 1,
  },
  closeText: {
    opacity: 0.8,
  },
  body: {
    padding: 16,
  },
});
