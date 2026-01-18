import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, ActivityIndicator, Alert, TextInput } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { getEmergencyContacts, deleteEmergencyContact, getProfile, addEmergencyContact } from '@/lib/database';

export default function ContactsScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (user) {
      loadContacts();
    }
  }, [user]);

  const loadContacts = async () => {
    if (!user) return;

    try {
      const [contactsData, profile] = await Promise.all([
        getEmergencyContacts(user.id),
        getProfile(user.id),
      ]);
      setContacts(contactsData);
      setIsPremium(profile?.is_premium || false);
    } catch (error) {
      console.error('Errore nel caricamento contatti:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!newContactEmail || !newContactEmail.includes('@')) {
      Alert.alert('Errore', 'Inserisci un indirizzo email valido');
      return;
    }

    setAdding(true);
    try {
      await addEmergencyContact(user.id, {
        name: newContactName || 'Contatto di emergenza',
        email: newContactEmail,
        phone: newContactPhone || null,
      });
      setNewContactName('');
      setNewContactEmail('');
      setNewContactPhone('');
      setShowAddForm(false);
      await loadContacts();
      Alert.alert('Successo', 'Contatto aggiunto');
    } catch (error) {
      Alert.alert('Errore', error.message || 'Errore durante l\'aggiunta del contatto');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (contactId, contactName) => {
    Alert.alert(
      'Elimina contatto',
      `Sei sicuro di voler eliminare ${contactName}?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEmergencyContact(contactId);
              await loadContacts();
            } catch (error) {
              Alert.alert('Errore', error.message || 'Errore durante l\'eliminazione');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={colors.tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Contatti
      </ThemedText>

      {contacts.length === 0 ? (
        <ThemedView style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>Nessun contatto configurato</ThemedText>
        </ThemedView>
      ) : (
        <ScrollView style={styles.list}>
          {contacts.map((contact) => (
            <View key={contact.id} style={styles.contactItem}>
              <View style={styles.contactInfo}>
                <ThemedText style={styles.contactName}>👤 {contact.name}</ThemedText>
                <ThemedText style={styles.contactEmail}>✉️ {contact.email}</ThemedText>
                {contact.phone && (
                  <ThemedText style={styles.contactPhone}>📞 {contact.phone}</ThemedText>
                )}
                <ThemedText style={styles.contactPriority}>
                  Priorità: {contact.priority}
                </ThemedText>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(contact.id, contact.name)}>
                <ThemedText style={styles.deleteButtonText}>Elimina</ThemedText>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {showAddForm ? (
        <ThemedView style={styles.addForm}>
          <ThemedText type="subtitle" style={styles.formTitle}>Aggiungi Contatto</ThemedText>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.tabIconDefault }]}
            placeholder="Nome"
            placeholderTextColor={colors.tabIconDefault}
            value={newContactName}
            onChangeText={setNewContactName}
          />
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.tabIconDefault }]}
            placeholder="Email *"
            placeholderTextColor={colors.tabIconDefault}
            value={newContactEmail}
            onChangeText={setNewContactEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.tabIconDefault }]}
            placeholder="Telefono (opzionale)"
            placeholderTextColor={colors.tabIconDefault}
            value={newContactPhone}
            onChangeText={setNewContactPhone}
            keyboardType="phone-pad"
          />
          <View style={styles.formButtons}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.tabIconDefault }]}
              onPress={() => {
                setShowAddForm(false);
                setNewContactName('');
                setNewContactEmail('');
                setNewContactPhone('');
              }}>
              <ThemedText style={[styles.cancelButtonText, { color: colors.text }]}>Annulla</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.tint }]}
              onPress={handleAddContact}
              disabled={adding || !newContactEmail}>
              {adding ? (
                <ActivityIndicator color={colorScheme === 'dark' ? colors.text : 'white'} />
              ) : (
                <ThemedText style={[styles.addButtonText, { color: colorScheme === 'dark' ? colors.text : 'white' }]}>Aggiungi</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </ThemedView>
      ) : (
        <TouchableOpacity
          style={[styles.addButtonMain, { backgroundColor: colors.tint }]}
          onPress={() => {
            if (!isPremium && contacts.length >= 1) {
              Alert.alert('Premium richiesto', 'Versione gratuita: massimo 1 contatto. Passa a Premium per più contatti.');
              return;
            }
            setShowAddForm(true);
          }}>
          <ThemedText style={[styles.addButtonMainText, { color: colorScheme === 'dark' ? colors.text : 'white' }]}>+ Aggiungi</ThemedText>
        </TouchableOpacity>
      )}

      {!isPremium && contacts.length >= 1 && !showAddForm && (
        <ThemedView style={styles.premiumHint}>
          <ThemedText style={styles.premiumText}>
            Versione gratuita: massimo 1 contatto. Passa a Premium per più contatti.
          </ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  list: {
    flex: 1,
  },
  contactItem: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    gap: 12,
  },
  contactInfo: {
    gap: 4,
  },
  contactName: {
    fontSize: 18,
    fontWeight: '600',
  },
  contactEmail: {
    fontSize: 14,
    opacity: 0.8,
  },
  contactPhone: {
    fontSize: 14,
    opacity: 0.8,
  },
  contactPriority: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#ff4444',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  premiumHint: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 200, 0, 0.1)',
    marginTop: 16,
  },
  premiumText: {
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
  },
  addForm: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginTop: 16,
    gap: 12,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButtonMain: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  addButtonMainText: {
    fontSize: 18,
    fontWeight: '600',
  },
});