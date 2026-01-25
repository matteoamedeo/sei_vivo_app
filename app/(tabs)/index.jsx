import { Spinner } from '@/components/Spinner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CHECKIN_CONFIG } from '@/constants/checkinConfig';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  getCheckInStatus,
  getHoursUntilNextCheckIn,
  getProfile,
  hasCheckedInToday,
  performCheckIn,
  updateProfile,
} from '@/lib/database';
import { useIsFocused } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isFocused = useIsFocused();
  
  const [status, setStatus] = useState('OK');
  const [hoursRemaining, setHoursRemaining] = useState(null);
  const [lastCheckIn, setLastCheckIn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [profile, setProfile] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [canCheckIn, setCanCheckIn] = useState(true);
  const [resuming, setResuming] = useState(false);

  useEffect(() => {
    if (isFocused) {
      if (user) {
        loadStatus();
      }
  
    }
  }, [isFocused]);

  // Timer che aggiorna ogni secondo
  useEffect(() => {
    const updateTimer = () => {
      if (!lastCheckIn || !profile?.checkin_interval_hours) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const lastCheckInDate = new Date(lastCheckIn);
      const intervalHours = parseFloat(profile.checkin_interval_hours) || 48;
      const nextCheckInTime = new Date(lastCheckInDate.getTime() + intervalHours * 60 * 60 * 1000);
      const now = new Date();
      const diffMs = nextCheckInTime.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeRemaining({ hours, minutes, seconds });
    };

    updateTimer(); // Aggiorna immediatamente
    const timerInterval = setInterval(updateTimer, 1000); // Aggiorna ogni secondo

    return () => clearInterval(timerInterval);
  }, [lastCheckIn, profile?.checkin_interval_hours]);

  // Controlla se il bottone può essere cliccato in base alla configurazione
  useEffect(() => {
    const checkCanCheckIn = () => {
      if (!lastCheckIn) {
        setCanCheckIn(true);
        return;
      }

      const now = new Date();
      const lastCheckInDate = new Date(lastCheckIn);

      if (CHECKIN_CONFIG.resetType === 'midnight') {
        // Modalità mezzanotte: controlla se l'ultimo check-in è di oggi
        const lastCheckInDay = new Date(lastCheckInDate);
        lastCheckInDay.setHours(0, 0, 0, 0);
        
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        
        // Se sono giorni diversi, significa che è passata la mezzanotte
        setCanCheckIn(lastCheckInDay.getTime() < today.getTime());
      } else if (CHECKIN_CONFIG.resetType === 'minutes') {
        // Modalità minuti: controlla se sono passati almeno resetAfterMinutes minuti
        const diffMs = now.getTime() - lastCheckInDate.getTime();
        const diffMinutes = diffMs / (1000 * 60);
        setCanCheckIn(diffMinutes >= CHECKIN_CONFIG.resetAfterMinutes);
      } else {
        setCanCheckIn(true);
      }
    };

    checkCanCheckIn();
    const checkInterval = setInterval(checkCanCheckIn, 1000); // Controlla ogni secondo

    return () => clearInterval(checkInterval);
  }, [lastCheckIn]);

  const loadStatus = async () => {
    if (!user) return;

    setLoading(true);
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
      
      // Aggiorna anche canCheckIn in base alla configurazione
      if (CHECKIN_CONFIG.resetType === 'midnight') {
        setCanCheckIn(!hasCheckedIn);
      } else {
        // Per 'minutes', il controllo viene fatto nel useEffect dedicato
        // qui impostiamo solo uno stato iniziale
        if (profile?.last_checkin_at) {
          const now = new Date();
          const lastCheckInDate = new Date(profile.last_checkin_at);
          const diffMs = now.getTime() - lastCheckInDate.getTime();
          const diffMinutes = diffMs / (1000 * 60);
          setCanCheckIn(diffMinutes >= CHECKIN_CONFIG.resetAfterMinutes);
        } else {
          setCanCheckIn(true);
        }
      }
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

  const handleResumeMonitoring = async () => {
    if (!user || resuming) return;
    setResuming(true);
    try {
      await updateProfile(user.id, { monitoring_enabled: true });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadStatus();
    } catch (error) {
      Alert.alert('Errore', error.message || 'Impossibile riattivare');
    } finally {
      setResuming(false);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  const getStatusColor = () => {
    if (status === 'PAUSED') return '#888';
    if (status === 'OK') return '#44ff44';
    if (status === 'WARNING') return '#ffaa00';
    return '#ff4444';
  };

  const getStatusEmoji = () => {
    if (status === 'PAUSED') return '⏸';
    if (status === 'OK') return '🟢';
    if (status === 'WARNING') return '🟡';
    return '🔴';
  };

  const getStatusText = () => {
    if (status === 'PAUSED') return 'In pausa';
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

  const formatTimerCountdown = () => {
    if (!lastCheckIn || !profile?.checkin_interval_hours) {
      return '--:--:--';
    }

    const { hours, minutes, seconds } = timeRemaining;
    
    // Se il tempo è scaduto
    if (hours === 0 && minutes === 0 && seconds === 0) {
      return '00:00:00';
    }

    // Mostra formato HH:MM:SS se ci sono ore, altrimenti MM:SS
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else {
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.statusContainer}>
        <ThemedText type="bigTitle">{getStatusEmoji()}</ThemedText>
        <ThemedText type="large" style={[{ color: getStatusColor() }, styles.statusText]}>
          {getStatusText()}
        </ThemedText>
      </View>

      {status !== 'PAUSED' && lastCheckIn && profile?.checkin_interval_hours && (
        <View style={styles.countdownContainer}>
          <ThemedText type="smallMedium" style={styles.countdownLabel}>Prossimo check-in</ThemedText>
          <ThemedText type="title" style={[styles.countdownTime, { fontFamily: 'monospace' }]}>
            {formatTimerCountdown()}
          </ThemedText>
          {hoursRemaining !== null && profile?.checkin_interval_hours && (
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${Math.max(0, Math.min(100, 
                      ((parseFloat(profile.checkin_interval_hours) - hoursRemaining) / parseFloat(profile.checkin_interval_hours)) * 100
                    ))}%`,
                    backgroundColor: status === 'CRITICAL' ? '#ff4444' : status === 'WARNING' ? '#ffaa00' : '#44ff44',
                  },
                ]}
              />
            </View>
          )}
        </View>
      )}

      <View style={styles.checkInContainer}>
        {status === 'PAUSED' ? (
          <>
            <ThemedText type="subtitle" style={styles.questionText}>Monitoraggio in pausa</ThemedText>
            <ThemedText type="default" style={[styles.questionText, { opacity: 0.7 }]}>
              I tuoi contatti non riceveranno avvisi. Riattiva quando vuoi.
            </ThemedText>
            <TouchableOpacity
              style={[styles.checkInButton, { backgroundColor: colors.tint, opacity: resuming ? 0.6 : 1 }]}
              onPress={handleResumeMonitoring}
              disabled={resuming}>
              {resuming ? (
                <ActivityIndicator color={colorScheme === 'dark' ? colors.text : 'white'} />
              ) : (
                <ThemedText type="large" style={[styles.checkInButtonText, { color: colorScheme === 'dark' ? colors.text : 'white' }]}>
                  Riattiva monitoraggio
                </ThemedText>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <ThemedText type="subtitle" style={styles.questionText}>Tutto bene oggi?</ThemedText>
            <TouchableOpacity
              style={[
                styles.checkInButton,
                {
                  backgroundColor: canCheckIn ? colors.tint : colors.tabIconDefault,
                  opacity: checkingIn ? 0.6 : 1,
                },
              ]}
              onPress={handleCheckIn}
              disabled={!canCheckIn || checkingIn}>
              {checkingIn ? (
                <ActivityIndicator color={
                  canCheckIn 
                    ? (colorScheme === 'dark' ? colors.text : 'white')
                    : colors.text
                } />
              ) : (
                <ThemedText type="large" style={[
                  styles.checkInButtonText,
                  canCheckIn 
                    ? { color: colorScheme === 'dark' ? colors.text : 'white' }
                    : { color: colors.text }
                ]}>
                  {canCheckIn ? 'SONO VIVO' : (CHECKIN_CONFIG.resetType === 'midnight' ? '✓ Già fatto oggi' : `Attendi ${CHECKIN_CONFIG.resetAfterMinutes} minuti`)}
                </ThemedText>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.lastCheckInContainer}>
        <ThemedText type="smallMedium" style={styles.lastCheckInLabel}>Ultimo check-in</ThemedText>
        <ThemedText type="default" style={styles.lastCheckInTime}>{formatLastCheckIn()}</ThemedText>
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
  statusText: {
    fontWeight: 'bold',
  },
  countdownContainer: {
    alignItems: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 16,
  },
  countdownLabel: {
    opacity: 0.7,
  },
  countdownTime: {
    fontWeight: '600',
    letterSpacing: 2,
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
    opacity: 0.8,
  },
  checkInButton: {
    width: '100%',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
  },
  checkInButtonText: {
    fontWeight: 'bold',
  },
  lastCheckInContainer: {
    alignItems: 'center',
    gap: 4,
    marginTop: 'auto',
  },
  lastCheckInLabel: {
    opacity: 0.6,
  },
  lastCheckInTime: {
    opacity: 0.8,
  },
});