import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getOrCreateProfile, updateProfile } from '@/lib/database';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function OnboardingFrequencyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [intervalHours, setIntervalHours] = useState(48);
  const [checkinTime, setCheckinTime] = useState('10:00');
  const [loading, setLoading] = useState(false);
  const [customInterval, setCustomInterval] = useState('');
  const [selectedOption, setSelectedOption] = useState('48'); // '5min', '24', '48', 'custom'

  const handleContinue = async () => {
    if (!user) {
      Alert.alert('Errore', 'Utente non autenticato');
      return;
    }

    let finalInterval = intervalHours;
    if (selectedOption === '5min') {
      // 5 minuti = 5/60 = 0.083 ore
      finalInterval = 5 / 60;
    } else if (selectedOption === 'custom') {
      const custom = parseFloat(customInterval);
      if (isNaN(custom) || custom <= 0) {
        Alert.alert('Errore', 'Inserisci un numero valido per l\'intervallo personalizzato');
        return;
      }
      finalInterval = custom;
    }

    setLoading(true);
    try {
      await getOrCreateProfile(user.id);
      await updateProfile(user.id, {
        checkin_interval_hours: finalInterval,
        checkin_time: checkinTime,
      });
      router.push('/onboarding/permissions');
    } catch (error) {
      Alert.alert('Errore', error.message || 'Errore durante il salvataggio delle impostazioni');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Ogni quanto?
        </ThemedText>
        <ThemedText style={styles.description}>
          Scegli ogni quanto tempo devi fare check-in per rimanere attivo.
        </ThemedText>

        <ThemedView style={styles.options}>
          <TouchableOpacity
            style={[
              styles.option,
              selectedOption === '5min' && { backgroundColor: colors.tint, borderColor: colors.tint },
              { borderColor: colors.tabIconDefault },
            ]}
            onPress={() => {
              setSelectedOption('5min');
              setIntervalHours(5 / 60);
            }}>
            <View style={styles.radio}>
              {selectedOption === '5min' && <View style={styles.radioInner} />}
            </View>
            <ThemedText
              style={[
                styles.optionText,
                selectedOption === '5min' && { color: 'white', fontWeight: '600' },
              ]}>
              5 minuti (test)
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.option,
              selectedOption === '24' && { backgroundColor: colors.tint, borderColor: colors.tint },
              { borderColor: colors.tabIconDefault },
            ]}
            onPress={() => {
              setSelectedOption('24');
              setIntervalHours(24);
            }}>
            <View style={styles.radio}>
              {selectedOption === '24' && <View style={styles.radioInner} />}
            </View>
            <ThemedText
              style={[
                styles.optionText,
                selectedOption === '24' && { color: 'white', fontWeight: '600' },
              ]}>
              Ogni 24 ore
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.option,
              selectedOption === '48' && { backgroundColor: colors.tint, borderColor: colors.tint },
              { borderColor: colors.tabIconDefault },
            ]}
            onPress={() => {
              setSelectedOption('48');
              setIntervalHours(48);
            }}>
            <View style={styles.radio}>
              {selectedOption === '48' && <View style={styles.radioInner} />}
            </View>
            <ThemedText
              style={[
                styles.optionText,
                selectedOption === '48' && { color: 'white', fontWeight: '600' },
              ]}>
              Ogni 48 ore (consigliato)
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.option,
              selectedOption === 'custom' && { backgroundColor: colors.tint, borderColor: colors.tint },
              { borderColor: colors.tabIconDefault },
            ]}
            onPress={() => setSelectedOption('custom')}>
            <View style={styles.radio}>
              {selectedOption === 'custom' && <View style={styles.radioInner} />}
            </View>
            <ThemedText
              style={[
                styles.optionText,
                selectedOption === 'custom' && { color: 'white', fontWeight: '600' },
              ]}>
              Personalizzato
            </ThemedText>
          </TouchableOpacity>

          {selectedOption === 'custom' && (
            <View style={styles.customInputContainer}>
              <ThemedText style={styles.customLabel}>Intervallo personalizzato (ore)</ThemedText>
              <TextInput
                style={[styles.customInput, { color: colors.text, borderColor: colors.tabIconDefault }]}
                placeholder="es. 72"
                placeholderTextColor={colors.tabIconDefault}
                value={customInterval}
                onChangeText={setCustomInterval}
                keyboardType="decimal-pad"
              />
            </View>
          )}
        </ThemedView>

        <ThemedText style={styles.label}>Orario preferito</ThemedText>
        <ThemedText style={styles.timeHint}>
          {checkinTime} - Puoi modificarlo nelle impostazioni
        </ThemedText>
      </ThemedView>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.tint }]}
        onPress={handleContinue}
        disabled={loading}>
        <ThemedText style={[styles.buttonText, { color: colorScheme === 'dark' ? colors.text : 'white' }]}>Conferma</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    gap: 24,
    marginTop: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    opacity: 0.7,
    lineHeight: 22,
  },
  options: {
    gap: 16,
    marginTop: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
  },
  optionText: {
    fontSize: 18,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
  },
  timeHint: {
    fontSize: 14,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  button: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  customInputContainer: {
    marginTop: 16,
    gap: 8,
  },
  customLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  customInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
  },
});