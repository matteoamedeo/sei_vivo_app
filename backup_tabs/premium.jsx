import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { getProfile, updateProfile } from '@/lib/database';

export default function PremiumScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const data = await getProfile(user.id);
      setProfile(data);
    } catch (error) {
      console.error('Errore nel caricamento profilo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!user) return;

    Alert.alert(
      'Premium',
      'Questa è una versione demo. In una versione reale, qui si integrerebbe un sistema di pagamento.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Attiva Demo',
          onPress: async () => {
            setActivating(true);
            try {
              await updateProfile(user.id, { is_premium: true });
              await loadProfile();
              Alert.alert('Successo', 'Premium attivato (demo)');
            } catch (error) {
              Alert.alert('Errore', error.message || 'Errore durante l\'attivazione');
            } finally {
              setActivating(false);
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

  const isPremium = profile?.is_premium || false;

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        ⭐ Premium
      </ThemedText>

      {isPremium ? (
        <ThemedView style={styles.premiumActive}>
          <ThemedText type="subtitle" style={styles.premiumActiveText}>
            ✓ Premium attivo
          </ThemedText>
        </ThemedView>
      ) : (
        <ThemedView style={styles.premiumBox}>
          <ThemedText type="huge" style={styles.price}>€1.99 / mese</ThemedText>
        </ThemedView>
      )}

      <ThemedView style={styles.features}>
        <View style={styles.featureItem}>
          <ThemedText type="subtitle" style={styles.featureIcon}>✔</ThemedText>
          <ThemedText type="medium" style={styles.featureText}>SMS</ThemedText>
        </View>
        <View style={styles.featureItem}>
          <ThemedText type="subtitle" style={styles.featureIcon}>✔</ThemedText>
          <ThemedText type="medium" style={styles.featureText}>Chiamate</ThemedText>
        </View>
        <View style={styles.featureItem}>
          <ThemedText type="subtitle" style={styles.featureIcon}>✔</ThemedText>
          <ThemedText type="medium" style={styles.featureText}>Più contatti (fino a 5)</ThemedText>
        </View>
        <View style={styles.featureItem}>
          <ThemedText type="subtitle" style={styles.featureIcon}>✔</ThemedText>
          <ThemedText type="medium" style={styles.featureText}>Storico completo</ThemedText>
        </View>
      </ThemedView>

      {!isPremium && (
        <TouchableOpacity
          style={[styles.activateButton, { backgroundColor: colors.tint }]}
          onPress={handleActivate}
          disabled={activating}>
          {activating ? (
            <ActivityIndicator color={colorScheme === 'dark' ? colors.text : 'white'} />
          ) : (
            <ThemedText type="medium" style={[styles.activateButtonText, { color: colorScheme === 'dark' ? colors.text : 'white' }]}>Attiva</ThemedText>
          )}
        </TouchableOpacity>
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
    marginBottom: 32,
    textAlign: 'center',
  },
  premiumBox: {
    padding: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 200, 0, 0.1)',
    alignItems: 'center',
    marginBottom: 32,
  },
  price: {
    fontWeight: 'bold',
  },
  premiumActive: {
    padding: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(68, 255, 68, 0.1)',
    alignItems: 'center',
    marginBottom: 32,
  },
  premiumActiveText: {
    fontWeight: '600',
  },
  features: {
    gap: 16,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  featureIcon: {
    color: '#44ff44',
  },
  featureText: {
  },
  activateButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  activateButtonText: {
    fontWeight: '600',
  },
});