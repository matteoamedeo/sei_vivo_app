-- ============================================
-- SCHEMA DATABASE SILEME
-- Esegui questo script nel SQL Editor di Supabase
-- ============================================

-- 1. Tabella profiles (estensione di auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_interval_hours INT NOT NULL DEFAULT 48,
  checkin_time TIME NOT NULL DEFAULT '10:00',
  last_checkin_at TIMESTAMPTZ,
  timezone TEXT DEFAULT 'Europe/Rome',
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabella emergency_contacts
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  priority INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabella checkins
CREATE TABLE IF NOT EXISTS checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  checkin_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabella alerts
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  contact_id UUID REFERENCES emergency_contacts(id),
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  channel TEXT CHECK (channel IN ('email','sms','call')),
  status TEXT DEFAULT 'sent'
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_last_checkin ON profiles(last_checkin_at);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_user_id ON checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_checkin_at ON checkins(checkin_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);

-- RLS (Row Level Security) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Policy: user owns profile
DROP POLICY IF EXISTS "user owns profile" ON profiles;
CREATE POLICY "user owns profile"
ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "user can update own profile" ON profiles;
CREATE POLICY "user can update own profile"
ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "user can insert own profile" ON profiles;
CREATE POLICY "user can insert own profile"
ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy: user owns contacts
DROP POLICY IF EXISTS "user owns contacts" ON emergency_contacts;
CREATE POLICY "user owns contacts"
ON emergency_contacts FOR ALL
USING (auth.uid() = user_id);

-- Policy: user owns checkins
DROP POLICY IF EXISTS "user owns checkins" ON checkins;
CREATE POLICY "user owns checkins"
ON checkins FOR ALL
USING (auth.uid() = user_id);

-- Policy: user can read own alerts
DROP POLICY IF EXISTS "user can read own alerts" ON alerts;
CREATE POLICY "user can read own alerts"
ON alerts FOR SELECT
USING (auth.uid() = user_id);

-- Funzione per creare automaticamente il profilo quando si crea un utente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger per creare automaticamente il profilo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();