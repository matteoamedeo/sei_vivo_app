-- ============================================
-- QUERY COMPLETE PER SUPABASE - SILEME APP
-- ============================================
-- Esegui queste query nel SQL Editor di Supabase
-- Vai su: Dashboard > SQL Editor > New Query
-- Copia e incolla tutto questo script e premi Run
-- ============================================

-- ============================================
-- 1. CREAZIONE TABELLE
-- ============================================

-- Tabella profiles (estensione di auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_interval_hours NUMERIC(10, 4) NOT NULL DEFAULT 48,
  checkin_time TIME NOT NULL DEFAULT '10:00',
  last_checkin_at TIMESTAMPTZ,
  timezone TEXT DEFAULT 'Europe/Rome',
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella emergency_contacts
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  priority INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella checkins
CREATE TABLE IF NOT EXISTS checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  checkin_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella alerts
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  contact_id UUID REFERENCES emergency_contacts(id),
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  channel TEXT CHECK (channel IN ('email','sms','call')),
  status TEXT DEFAULT 'sent'
);

-- ============================================
-- 2. INDICI PER PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_last_checkin ON profiles(last_checkin_at);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_user_id ON checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_checkin_at ON checkins(checkin_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Abilita RLS su tutte le tabelle
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. POLICIES RLS
-- ============================================

-- Policies per profiles
DROP POLICY IF EXISTS "user owns profile" ON profiles;
CREATE POLICY "user owns profile"
ON profiles FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "user can update own profile" ON profiles;
CREATE POLICY "user can update own profile"
ON profiles FOR UPDATE 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "user can insert own profile" ON profiles;
CREATE POLICY "user can insert own profile"
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Policies per emergency_contacts
DROP POLICY IF EXISTS "user owns contacts" ON emergency_contacts;
CREATE POLICY "user owns contacts"
ON emergency_contacts FOR ALL
USING (auth.uid() = user_id);

-- Policies per checkins
DROP POLICY IF EXISTS "user owns checkins" ON checkins;
CREATE POLICY "user owns checkins"
ON checkins FOR ALL
USING (auth.uid() = user_id);

-- Policies per alerts
DROP POLICY IF EXISTS "user can read own alerts" ON alerts;
CREATE POLICY "user can read own alerts"
ON alerts FOR SELECT
USING (auth.uid() = user_id);

-- ============================================
-- 5. CONSTRAINT PREMIUM LIMIT
-- ============================================
-- Limita il numero di contatti in base al piano premium

-- Rimuovi constraint esistente se presente
ALTER TABLE emergency_contacts DROP CONSTRAINT IF EXISTS premium_limit;

-- Crea funzione per verificare il limite
CREATE OR REPLACE FUNCTION check_premium_contact_limit()
RETURNS TRIGGER AS $$
DECLARE
  contact_count INT;
  user_is_premium BOOLEAN;
  max_contacts INT;
BEGIN
  -- Conta i contatti esistenti per questo utente
  SELECT COUNT(*) INTO contact_count
  FROM emergency_contacts
  WHERE user_id = NEW.user_id;
  
  -- Verifica se l'utente è premium
  SELECT is_premium INTO user_is_premium
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Determina il limite massimo
  IF user_is_premium THEN
    max_contacts := 5;
  ELSE
    max_contacts := 1;
  END IF;
  
  -- Se stiamo inserendo un nuovo contatto e abbiamo già raggiunto il limite
  IF TG_OP = 'INSERT' AND contact_count >= max_contacts THEN
    RAISE EXCEPTION 'Limite contatti raggiunto. Versione gratuita: massimo 1 contatto. Passa a Premium per più contatti.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crea trigger per verificare il limite
DROP TRIGGER IF EXISTS check_contact_limit_trigger ON emergency_contacts;
CREATE TRIGGER check_contact_limit_trigger
  BEFORE INSERT ON emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION check_premium_contact_limit();

-- ============================================
-- 6. FUNZIONE E TRIGGER PER CREARE PROFILO AUTOMATICO
-- ============================================

-- Funzione per creare automaticamente il profilo quando si crea un utente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger per creare automaticamente il profilo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 7. FUNZIONE PER VERIFICARE UTENTI SCADUTI (per cron job futuro)
-- ============================================
-- Questa funzione può essere usata da un Edge Function o cron job
-- per trovare utenti che non hanno fatto check-in in tempo

CREATE OR REPLACE FUNCTION get_expired_users()
RETURNS TABLE (
  user_id UUID,
  profile_id UUID,
  last_checkin_at TIMESTAMPTZ,
  checkin_interval_hours NUMERIC,
  hours_overdue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.id as profile_id,
    p.last_checkin_at,
    p.checkin_interval_hours,
    EXTRACT(EPOCH FROM (NOW() - (p.last_checkin_at + (p.checkin_interval_hours || ' hours')::interval))) / 3600 as hours_overdue
  FROM profiles p
  WHERE p.last_checkin_at IS NOT NULL
    AND NOW() > (p.last_checkin_at + (p.checkin_interval_hours || ' hours')::interval)
  ORDER BY hours_overdue DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. GRANT PERMESSI (se necessario)
-- ============================================
-- Assicurati che gli utenti autenticati possano usare le funzioni

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON emergency_contacts TO authenticated;
GRANT ALL ON checkins TO authenticated;
GRANT SELECT ON alerts TO authenticated;

-- ============================================
-- FINE SCRIPT
-- ============================================
-- Dopo aver eseguito questo script:
-- 1. Verifica che tutte le tabelle siano state create
-- 2. Controlla che le policies RLS siano attive
-- 3. Testa la registrazione di un nuovo utente
-- 4. Verifica che il profilo venga creato automaticamente
-- ============================================
