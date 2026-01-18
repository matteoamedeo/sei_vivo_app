import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import {
  performCheckIn,
  getCheckInStatus,
  getHoursUntilNextCheckIn,
  getProfile,
  hasCheckedInToday,
} from '@/lib/database';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [status, setStatus] = useState('OK');
  const [hoursRemaining, setHoursRemaining] = useState(null);
  const [lastCheckIn, setLastCheckIn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (user) {
      loadStatus();
      const interval = setInterval(loadStatus, 60000); // Aggiorna ogni minuto
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadStatus = async () => {
    if (!user) return;

    try {
      const [currentStatus, hours, profile, hasCheckedIn] = await Promise.all([
        getCheckInStatus(user.id),
        getHoursUntilNextCheckIn(user.id),
        getProfile(user.id),
        hasCheckedInToday(user.id),
      ]);

      setStatus(currentStatus);
      setHoursRemaining(hours);
      setLastCheckIn(profile?.last_checkin_at);
      setCheckedInToday(hasCheckedIn);
      setProfile(profile);
    } catch (error) {
      console.error('Errore nel caricamento stato:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!user || checkingIn) return;

    setCheckingIn(true);
    try {
      await performCheckIn(user.id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadStatus();
      Alert.alert('✅', 'Check-in completato!');
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Errore', error.message || 'Errore durante il check-in');
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={colors.tint} />
      </ThemedView>
    );
  }

  const getStatusColor = () => {
    if (status === 'OK') return '#44ff44';
    if (status === 'WARNING') return '#ffaa00';
    return '#ff4444';
  };

  const getStatusEmoji = () => {
    if (status === 'OK') return '🟢';
    if (status === 'WARNING') return '🟡';
    return '🔴';
  };

  const getStatusText = () => {
    if (status === 'OK') return 'OK';
    if (status === 'WARNING') return 'Attento';
    return 'Allarme attivo';
  };

  const formatLastCheckIn = () => {
    if (!lastCheckIn) return 'Mai';
    const date = new Date(lastCheckIn);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours < 1) return `oggi alle ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
    if (diffHours < 24) return `oggi alle ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const formatTimeRemaining = () => {
    if (hoursRemaining === null) return '';
    if (hoursRemaining === 0) return 'Ora';
    
    const hours = Math.floor(hoursRemaining);
    const minutes = Math.floor((hoursRemaining - hours) * 60);
    
    if (hours > 0 && minutes > 0) {
      return `tra ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `tra ${hours}h`;
    } else {
      return `tra ${minutes}m`;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.statusContainer}>
        <ThemedText style={styles.statusEmoji}>{getStatusEmoji()}</ThemedText>
        <ThemedText type="title" style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </ThemedText>
      </View>

      {status === 'WARNING' && hoursRemaining !== null && (
        <View style={styles.countdownContainer}>
          <ThemedText style={styles.countdownLabel}>Prossimo check-in</ThemedText>
          <ThemedText style={styles.countdownTime}>{formatTimeRemaining()}</ThemedText>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.max(0, Math.min(100, (hoursRemaining / (profile?.checkin_interval_hours || 48)) * 100))}%`,
                },
              ]}
            />
          </View>
        </View>
      )}

      <View style={styles.checkInContainer}>
        <ThemedText style={styles.questionText}>Tutto bene oggi?</ThemedText>
        
        <TouchableOpacity
          style={[
            styles.checkInButton,
            {
              backgroundColor: checkedInToday ? colors.tabIconDefault : colors.tint,
              opacity: checkingIn ? 0.6 : 1,
            },
          ]}
          onPress={handleCheckIn}
          disabled={checkedInToday || checkingIn}>
          {checkingIn ? (
            <ActivityIndicator color={
              checkedInToday 
                ? colors.text 
                : (colorScheme === 'dark' ? colors.text : 'white')
            } />
          ) : (
            <ThemedText style={[
              styles.checkInButtonText,
              checkedInToday 
                ? { color: colors.text }
                : { color: colorScheme === 'dark' ? colors.text : 'white' }
            ]}>
              {checkedInToday ? '✓ Già fatto oggi' : 'SONO VIVO'}
            </ThemedText>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.lastCheckInContainer}>
        <ThemedText style={styles.lastCheckInLabel}>Ultimo check-in</ThemedText>
        <ThemedText style={styles.lastCheckInTime}>{formatLastCheckIn()}</ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  statusContainer: {
    alignItems: 'center',
    gap: 8,
  },
  statusEmoji: {
    fontSize: 48,
  },
  statusText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  countdownContainer: {
    alignItems: 'center',
    gap: 4,
  },
  countdownLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  countdownTime: {
    fontSize: 20,
    fontWeight: '600',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#ffaa00',
    borderRadius: 4,
  },
  checkInContainer: {
    alignItems: 'center',
    gap: 24,
    width: '100%',
  },
  questionText: {
    fontSize: 20,
    opacity: 0.8,
  },
  checkInButton: {
    width: '100%',
    padding: 28,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  checkInButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  lastCheckInContainer: {
    alignItems: 'center',
    gap: 4,
    marginTop: 'auto',
  },
  lastCheckInLabel: {
    fontSize: 14,
    opacity: 0.6,
  },
  lastCheckInTime: {
    fontSize: 16,
    opacity: 0.8,
  },
});