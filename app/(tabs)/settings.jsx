import React, { useState, useEffect } from 'react';
import { StyleSheet, Switch, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, View } from 'react-native';
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
  const [selectedIntervalOption, setSelectedIntervalOption] = useState('48'); // '5min', '24', '48', 'custom'
  const [customInterval, setCustomInterval] = useState('');
  const [monitoringEnabled, setMonitoringEnabled] = useState(true);
  const [updatingMonitoring, setUpdatingMonitoring] = useState(false);

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
        const interval = parseFloat(data.checkin_interval_hours) || 48;
        setCheckinInterval(interval);
        setCheckinTime(data.checkin_time);
        setTimezone(data.timezone || 'Europe/Rome');
        setMonitoringEnabled(data.monitoring_enabled !== false);

        // Determina quale opzione selezionare in base all'intervallo corrente
        if (interval === 5 / 60 || Math.abs(interval - (5 / 60)) < 0.001) {
          setSelectedIntervalOption('5min');
        } else if (interval === 24) {
          setSelectedIntervalOption('24');
        } else if (interval === 48) {
          setSelectedIntervalOption('48');
        } else {
          setSelectedIntervalOption('custom');
          setCustomInterval(interval.toString());
        }
      }
    } catch (error) {
      console.error('Errore nel caricamento profilo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    let finalInterval = checkinInterval;
    if (selectedIntervalOption === '5min') {
      finalInterval = 5 / 60; // 0.083 ore
    } else if (selectedIntervalOption === 'custom') {
      const custom = parseFloat(customInterval);
      if (isNaN(custom) || custom <= 0) {
        Alert.alert('Errore', 'Inserisci un numero valido per l\'intervallo personalizzato');
        return;
      }
      finalInterval = custom;
    }

    setSaving(true);
    try {
      await updateProfile(user.id, {
        checkin_interval_hours: finalInterval,
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

  const handleMonitoringToggle = async (value) => {
    if (!user) return;
    setUpdatingMonitoring(true);
    try {
      await updateProfile(user.id, { monitoring_enabled: value });
      setMonitoringEnabled(value);
    } catch (e) {
      Alert.alert('Errore', e.message || 'Impossibile aggiornare');
    } finally {
      setUpdatingMonitoring(false);
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
            Monitoraggio
          </ThemedText>
          <View style={styles.row}>
            <ThemedText type="default" style={styles.label}>Monitoraggio attivo</ThemedText>
            <Switch
              value={monitoringEnabled}
              onValueChange={handleMonitoringToggle}
              disabled={updatingMonitoring}
              trackColor={{ false: colors.tabIconDefault, true: colors.tint }}
              thumbColor="#fff"
            />
          </View>
          <ThemedText type="smallMedium" style={styles.hint}>
            {monitoringEnabled
              ? 'Se non fai check-in in tempo, i tuoi contatti verranno avvisati.'
              : 'In pausa: nessun avviso ai contatti. Riattiva quando vuoi.'}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Frequenza Check-in
          </ThemedText>

          <ThemedText type="default" style={styles.label}>Intervallo</ThemedText>
          
          <ThemedView style={styles.intervalOptions}>
            <TouchableOpacity
              style={[
                styles.intervalOption,
                selectedIntervalOption === '5min' && { backgroundColor: colors.tint, borderColor: colors.tint },
                { borderColor: colors.tabIconDefault },
              ]}
              onPress={() => {
                setSelectedIntervalOption('5min');
                setCheckinInterval(5 / 60);
              }}>
              <View style={styles.radio}>
                {selectedIntervalOption === '5min' && <View style={styles.radioInner} />}
              </View>
              <ThemedText
                type="default"
                style={[
                  styles.intervalOptionText,
                  selectedIntervalOption === '5min' && { color: 'white', fontWeight: '600' },
                ]}>
                5 minuti (test)
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.intervalOption,
                selectedIntervalOption === '24' && { backgroundColor: colors.tint, borderColor: colors.tint },
                { borderColor: colors.tabIconDefault },
              ]}
              onPress={() => {
                setSelectedIntervalOption('24');
                setCheckinInterval(24);
              }}>
              <View style={styles.radio}>
                {selectedIntervalOption === '24' && <View style={styles.radioInner} />}
              </View>
              <ThemedText
                type="default"
                style={[
                  styles.intervalOptionText,
                  selectedIntervalOption === '24' && { color: 'white', fontWeight: '600' },
                ]}>
                24 ore
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.intervalOption,
                selectedIntervalOption === '48' && { backgroundColor: colors.tint, borderColor: colors.tint },
                { borderColor: colors.tabIconDefault },
              ]}
              onPress={() => {
                setSelectedIntervalOption('48');
                setCheckinInterval(48);
              }}>
              <View style={styles.radio}>
                {selectedIntervalOption === '48' && <View style={styles.radioInner} />}
              </View>
              <ThemedText
                type="default"
                style={[
                  styles.intervalOptionText,
                  selectedIntervalOption === '48' && { color: 'white', fontWeight: '600' },
                ]}>
                48 ore (consigliato)
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.intervalOption,
                selectedIntervalOption === 'custom' && { backgroundColor: colors.tint, borderColor: colors.tint },
                { borderColor: colors.tabIconDefault },
              ]}
              onPress={() => setSelectedIntervalOption('custom')}>
              <View style={styles.radio}>
                {selectedIntervalOption === 'custom' && <View style={styles.radioInner} />}
              </View>
              <ThemedText
                type="default"
                style={[
                  styles.intervalOptionText,
                  selectedIntervalOption === 'custom' && { color: 'white', fontWeight: '600' },
                ]}>
                Personalizzato
              </ThemedText>
            </TouchableOpacity>

            {selectedIntervalOption === 'custom' && (
              <View style={styles.customInputContainer}>
                <ThemedText type="smallMedium" style={styles.customLabel}>Intervallo personalizzato (ore)</ThemedText>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.tabIconDefault }]}
                  placeholder="es. 72"
                  placeholderTextColor={colors.tabIconDefault}
                  value={customInterval}
                  onChangeText={setCustomInterval}
                  keyboardType="decimal-pad"
                  editable={!saving}
                />
              </View>
            )}
          </ThemedView>

          <ThemedText type="default" style={styles.label}>Orario preferito</ThemedText>
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
              <ThemedText type="default" style={[styles.saveButtonText, { color: colorScheme === 'dark' ? colors.text : 'white' }]}>Salva</ThemedText>
            )}
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Lingua
          </ThemedText>
          <ThemedText type="default" style={styles.label}>Lingua</ThemedText>
          <ThemedText type="smallMedium" style={styles.infoText}>
            Italiano (IT)
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Fuso orario
          </ThemedText>
          <ThemedText type="default" style={styles.label}>Fuso orario</ThemedText>
          <ThemedText type="smallMedium" style={styles.infoText}>
            {timezone}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Privacy
          </ThemedText>
          <ThemedText type="smallMedium" style={styles.infoText}>
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
            <ThemedText type="default" style={[styles.resetButtonText, { color: '#ffaa00' }]}>
              Reset account
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: '#ff4444' }]}
          onPress={handleSignOut}>
          <ThemedText type="default" style={[styles.logoutButtonText, { color: '#ff4444' }]}>
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
    marginBottom: 8,
  },
  section: {
    gap: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hint: {
    opacity: 0.7,
    marginTop: 4,
  },
  label: {
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  saveButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontWeight: '600',
  },
  infoText: {
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
    fontWeight: '600',
  },
  resetButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  resetButtonText: {
    fontWeight: '600',
  },
  intervalOptions: {
    gap: 12,
    marginTop: 8,
  },
  intervalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    gap: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  intervalOptionText: {
  },
  customInputContainer: {
    marginTop: 12,
    gap: 8,
  },
  customLabel: {
    fontWeight: '500',
  },
});