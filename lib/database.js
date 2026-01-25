import { CHECKIN_CONFIG } from '@/constants/checkinConfig';
import { supabase } from './supabase';

// ===== PROFILES =====

// Ottieni o crea profilo utente
export async function getOrCreateProfile(userId) {
  // Prova a leggere il profilo esistente
  const { data: existing, error: readError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (existing && !readError) {
    return existing;
  }

  // Se non esiste, crea un nuovo profilo
  const { data, error } = await supabase
    .from('profiles')
    .insert([{ id: userId }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Ottieni profilo utente
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

// Aggiorna profilo
export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ===== CHECKINS =====

// Esegui check-in
export async function performCheckIn(userId) {
  // Inserisci check-in
  const { data: checkIn, error: checkInError } = await supabase
    .from('checkins')
    .insert([{ user_id: userId }])
    .select()
    .single();

  if (checkInError) throw checkInError;

  // Aggiorna last_checkin_at nel profilo
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ last_checkin_at: new Date().toISOString() })
    .eq('id', userId);

  if (profileError) throw profileError;

  return checkIn;
}

// Verifica se ha fatto check-in oggi
export async function hasCheckedInToday(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.toISOString();

  const { data, error } = await supabase
    .from('checkins')
    .select('id')
    .eq('user_id', userId)
    .gte('checkin_at', todayStart)
    .limit(1);

  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

// Ottieni giorni senza check-in
export async function getDaysWithoutCheckIn(userId) {
  const profile = await getProfile(userId);
  if (!profile || !profile.last_checkin_at) {
    // Mai fatto check-in
    if (profile?.created_at) {
      const daysDiff = Math.floor(
        (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysDiff;
    }
    return 0;
  }

  const lastCheckIn = new Date(profile.last_checkin_at);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  lastCheckIn.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor((today.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24));
  return daysDiff;
}

// Ottieni giorni decimali senza check-in (a partire dai minuti)
export async function getDaysDecimalWithoutCheckIn(userId) {
  const profile = await getProfile(userId);

  if (!profile || !profile.last_checkin_at) {
    // Mai fatto check-in
    if (profile?.created_at) {
      const diffMs = Date.now() - new Date(profile.created_at).getTime();
      const minutes = diffMs / (1000 * 60);
      return minutes / (60 * 24);
    }
    return 0;
  }

  const lastCheckIn = new Date(profile.last_checkin_at);
  const diffMs = Date.now() - lastCheckIn.getTime();
  const minutes = diffMs / (1000 * 60);

  return minutes / (60 * 24);
}

// Calcola ore rimanenti al prossimo check-in
export async function getHoursUntilNextCheckIn(userId) {
  const profile = await getProfile(userId);
  if (!profile) return null;

  const intervalHours = profile.checkin_interval_hours;
  const lastCheckIn = profile.last_checkin_at ? new Date(profile.last_checkin_at) : null;

  if (!lastCheckIn) {
    // Non ha mai fatto check-in, deve farlo subito
    return 0;
  }

  const nextCheckInTime = new Date(lastCheckIn);
  nextCheckInTime.setHours(nextCheckInTime.getHours() + intervalHours);

  const now = new Date();
  const diffMs = nextCheckInTime.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  return Math.max(0, diffHours);
}

// Ottieni stato check-in (OK, WARNING, CRITICAL)
export async function getCheckInStatus(userId) {
  const profile = await getProfile(userId);
  let daysWithout = false;
  if (!profile) return 'CRITICAL';

  if (CHECKIN_CONFIG.resetType === 'midnight') {
    daysWithout = await getDaysWithoutCheckIn(userId);
  } else {
    daysWithout = await getDaysDecimalWithoutCheckIn(userId);
  }

  const intervalDays = profile.checkin_interval_hours / 24;

  if (daysWithout && daysWithout >= intervalDays) {
    return 'CRITICAL';
  } else if (daysWithout && daysWithout >= intervalDays * 0.75) {
    return 'WARNING';
  }
  return 'OK';
}

// Ottieni ultimi check-in
export async function getRecentCheckIns(userId, limit = 30) {
  const { data, error } = await supabase
    .from('checkins')
    .select('*')
    .eq('user_id', userId)
    .order('checkin_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// ===== EMERGENCY CONTACTS =====

// Ottieni tutti i contatti di emergenza
export async function getEmergencyContacts(userId) {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('user_id', userId)
    .order('priority', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Aggiungi contatto di emergenza
export async function addEmergencyContact(userId, contact) {
  // Assicurati che il profilo esista prima di aggiungere il contatto
  // Riprova fino a 3 volte in caso di problemi di timing
  let profile = await getProfile(userId);
  if (!profile) {
    await getOrCreateProfile(userId);
    // Aspetta un attimo per assicurarsi che il profilo sia stato creato
    await new Promise(resolve => setTimeout(resolve, 100));
    profile = await getProfile(userId);
    
    if (!profile) {
      throw new Error('Impossibile creare il profilo. Riprova tra un momento.');
    }
  }
  
  // Verifica limiti premium
  const existingContacts = await getEmergencyContacts(userId);
  const maxContacts = profile.is_premium ? 5 : 1;

  if (existingContacts.length >= maxContacts) {
    throw new Error(
      profile.is_premium
        ? 'Hai raggiunto il limite massimo di 5 contatti'
        : 'Versione gratuita: massimo 1 contatto. Passa a Premium per più contatti.'
    );
  }

  const { data, error } = await supabase
    .from('emergency_contacts')
    .insert([
      {
        user_id: userId,
        name: contact.name,
        email: contact.email,
        phone: contact.phone || null,
        priority: contact.priority || existingContacts.length + 1,
      },
    ])
    .select()
    .single();

  if (error) {
    // Se l'errore è relativo alla foreign key, significa che il profilo non esiste ancora
    if (error.message && error.message.includes('foreign key constraint')) {
      throw new Error('Profilo non trovato. Riprova tra un momento.');
    }
    throw error;
  }
  return data;
}

// Aggiorna contatto di emergenza
export async function updateEmergencyContact(contactId, updates) {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .update(updates)
    .eq('id', contactId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Elimina contatto di emergenza
export async function deleteEmergencyContact(contactId) {
  const { error } = await supabase
    .from('emergency_contacts')
    .delete()
    .eq('id', contactId);

  if (error) throw error;
}

// Verifica se ha almeno un contatto configurato
export async function hasEmergencyContact(userId) {
  const contacts = await getEmergencyContacts(userId);
  return contacts.length > 0;
}

// Verifica se onboarding è completato
export async function isOnboardingComplete(userId) {
  const profile = await getProfile(userId);
  if (!profile) return false;
  
  const contacts = await getEmergencyContacts(userId);
  return contacts.length > 0;
}

// ===== ALERTS =====

// Ottieni tutti gli alert dell'utente
export async function getAlerts(userId, limit = 100) {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('user_id', userId)
    .order('triggered_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}