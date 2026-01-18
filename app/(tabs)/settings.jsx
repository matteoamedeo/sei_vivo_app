import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { getProfile, updateProfile } from '@/lib/database';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkinInterval, setCheckinInterval] = useState(48);
  const [checkinTime, setCheckinTime] = useState('10:00');
  const [timezone, setTimezone] = useState('Europe/Rome');
  const [language, setLanguage] = useState('it');

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const data = await getProfile(user.id);
      if (data) {
        setProfile(data);
        setCheckinInterval(data.checkin_interval_hours);
        setCheckinTime(data.checkin_time);
        setTimezone(data.timezone || 'Europe/Rome');
      }
    } catch (error) {
      console.error('Errore nel caricamento profilo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await updateProfile(user.id, {
        checkin_interval_hours: checkinInterval,
        checkin_time: checkinTime,
        timezone: timezone,
      });
      Alert.alert('Successo', 'Impostazioni salvate');
      await loadProfile();
    } catch (error) {
      Alert.alert('Errore', error.message || 'Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Logout',
      'Sei sicuro di voler uscire?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Esci',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth/login');
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
    <ScrollView style={styles.scrollView}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Impostazioni
        </ThemedText>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Frequenza Check-in
          </ThemedText>

          <ThemedText style={styles.label}>Intervallo (ore)</ThemedText>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.tabIconDefault }]}
            placeholder="48"
            placeholderTextColor={colors.tabIconDefault}
            value={checkinInterval.toString()}
            onChangeText={(text) => {
              const num = parseInt(text);
              if (!isNaN(num) && num > 0) {
                setCheckinInterval(num);
              }
            }}
            keyboardType="numeric"
            editable={!saving}
          />

          <ThemedText style={styles.label}>Orario preferito</ThemedText>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.tabIconDefault }]}
            placeholder="10:00"
            placeholderTextColor={colors.tabIconDefault}
            value={checkinTime}
            onChangeText={setCheckinTime}
            editable={!saving}
          />

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.tint }]}
            onPress={handleSave}
            disabled={saving}>
            {saving ? (
              <ActivityIndicator color={colorScheme === 'dark' ? colors.text : 'white'} />
            ) : (
              <ThemedText style={[styles.saveButtonText, { color: colorScheme === 'dark' ? colors.text : 'white' }]}>Salva</ThemedText>
            )}
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Lingua
          </ThemedText>
          <ThemedText style={styles.label}>Lingua</ThemedText>
          <ThemedText style={styles.infoText}>
            Italiano (IT)
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Fuso orario
          </ThemedText>
          <ThemedText style={styles.label}>Fuso orario</ThemedText>
          <ThemedText style={styles.infoText}>
            {timezone}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Privacy
          </ThemedText>
          <ThemedText style={styles.infoText}>
            • Nessun GPS{'\n'}
            • Dati minimi{'\n'}
            • Crittografia{'\n'}
            • Zero social
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Account
          </ThemedText>
          <TouchableOpacity
            style={[styles.resetButton, { borderColor: '#ffaa00' }]}
            onPress={() => {
              Alert.alert(
                'Reset Account',
                'Sei sicuro di voler resettare il tuo account? Questa azione eliminerà tutti i tuoi dati.',
                [
                  { text: 'Annulla', style: 'cancel' },
                  {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: () => {
                      Alert.alert('Info', 'Funzionalità di reset non ancora implementata');
                    },
                  },
                ]
              );
            }}>
            <ThemedText style={[styles.resetButtonText, { color: '#ffaa00' }]}>
              Reset account
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: '#ff4444' }]}
          onPress={handleSignOut}>
          <ThemedText style={[styles.logoutButtonText, { color: '#ff4444' }]}>
            Esci
          </ThemedText>
        </TouchableOpacity>
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
    gap: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  saveButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.8,
  },
  logoutButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 16,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});