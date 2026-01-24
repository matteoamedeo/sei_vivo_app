import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { getAlerts, getProfile } from '@/lib/database';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [alerts, setAlerts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [alertsData, profileData] = await Promise.all([
        getAlerts(user.id),
        getProfile(user.id),
      ]);
      setAlerts(alertsData);
      setProfile(profileData);
    } catch (error) {
      console.error('Errore nel caricamento dati:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={colors.tint} />
      </ThemedView>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Notifiche
      </ThemedText>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Stato Notifiche
        </ThemedText>
        <View style={styles.statusItem}>
          <ThemedText type="subtitle" style={styles.statusIcon}>✔️</ThemedText>
          <ThemedText type="default" style={styles.statusText}>Promemoria attivi</ThemedText>
        </View>
        <View style={styles.statusItem}>
          <ThemedText type="subtitle" style={styles.statusIcon}>✔️</ThemedText>
          <ThemedText type="default" style={styles.statusText}>Ultimo avviso configurato</ThemedText>
        </View>
        <View style={styles.statusItem}>
          <ThemedText type="subtitle" style={styles.statusIcon}>✔️</ThemedText>
          <ThemedText type="default" style={styles.statusText}>Email contatto attiva</ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Ritardo massimo
        </ThemedText>
        <ThemedText type="large" style={styles.intervalText}>
          {profile?.checkin_interval_hours || 48} ore
        </ThemedText>
      </ThemedView>

      {alerts.length > 0 && (
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Alert inviati
          </ThemedText>
          <ScrollView style={styles.alertsList}>
            {alerts.map((alert) => (
              <View key={alert.id} style={styles.alertItem}>
                <ThemedText type="default" style={styles.alertChannel}>
                  {alert.channel === 'email' ? '✉️' : alert.channel === 'sms' ? '📱' : '📞'} {alert.channel}
                </ThemedText>
                <ThemedText type="smallMedium" style={styles.alertDate}>{formatDate(alert.triggered_at)}</ThemedText>
                <ThemedText type="small" style={styles.alertStatus}>Status: {alert.status}</ThemedText>
              </View>
            ))}
          </ScrollView>
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
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
    gap: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  statusIcon: {
  },
  statusText: {
  },
  intervalText: {
    fontWeight: '600',
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    textAlign: 'center',
  },
  alertsList: {
    maxHeight: 300,
  },
  alertItem: {
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    gap: 4,
  },
  alertChannel: {
    fontWeight: '600',
  },
  alertDate: {
    opacity: 0.7,
  },
  alertStatus: {
    opacity: 0.6,
    marginTop: 4,
  },
});