import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { addEmergencyContact, getOrCreateProfile } from '@/lib/database';

export default function OnboardingContactScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!user) {
      Alert.alert('Errore', 'Utente non autenticato');
      return;
    }

    if (!email || !email.includes('@')) {
      Alert.alert('Errore', 'Inserisci un indirizzo email valido');
      return;
    }

    setLoading(true);
    try {
      // Assicurati che il profilo esista prima di aggiungere il contatto
      await getOrCreateProfile(user.id);
      
      await addEmergencyContact(user.id, {
        name: name || 'Contatto di emergenza',
        email,
        phone: phone || null,
      });
      router.push('/onboarding/frequency');
    } catch (error) {
      Alert.alert('Errore', error.message || 'Errore durante il salvataggio del contatto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ThemedView style={styles.content}>
        <ThemedText type="xlarge" style={styles.title}>
          Contatto fidato
        </ThemedText>
        <ThemedText type="default" style={styles.description}>
          Questa persona verrà avvisata solo se non rispondi entro il tempo stabilito.
        </ThemedText>

        <ThemedView style={styles.form}>
          <ThemedText type="default" style={styles.label}>Nome</ThemedText>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.tabIconDefault }]}
            placeholder="Nome del contatto"
            placeholderTextColor={colors.tabIconDefault}
            value={name}
            onChangeText={setName}
            editable={!loading}
          />

          <ThemedText type="default" style={styles.label}>
            Email <ThemedText style={styles.required}>*</ThemedText>
          </ThemedText>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.tabIconDefault }]}
            placeholder="email@esempio.com"
            placeholderTextColor={colors.tabIconDefault}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          <ThemedText type="default" style={styles.label}>Telefono (opzionale)</ThemedText>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.tabIconDefault }]}
            placeholder="+39 123 456 7890"
            placeholderTextColor={colors.tabIconDefault}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!loading}
          />
        </ThemedView>
      </ThemedView>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: email ? colors.tint : colors.tabIconDefault },
        ]}
        onPress={handleContinue}
        disabled={!email || loading}>
        <ThemedText type="medium" style={[
          styles.buttonText,
          !email && { color: colors.text }
        ]}>Avanti</ThemedText>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    gap: 24,
  },
  title: {
    marginTop: 32,
  },
  description: {
    opacity: 0.7,
  },
  form: {
    gap: 16,
    marginTop: 16,
  },
  label: {
    fontWeight: '500',
  },
  required: {
    color: '#ff4444',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
  },
  button: {
    padding: 18,
    margin: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});