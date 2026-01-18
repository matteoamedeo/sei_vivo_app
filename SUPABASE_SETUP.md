# Setup Supabase per l'app "Sei Morto?"

Questa guida ti aiuterà a configurare Supabase per l'app.

## 1. Crea un progetto Supabase

1. Vai su [supabase.com](https://supabase.com)
2. Crea un account (se non ne hai già uno)
3. Crea un nuovo progetto
4. Prendi nota della **URL** e della **anon key** dal dashboard

## 2. Configura le variabili d'ambiente

Crea un file `.env` nella root del progetto con:

```
EXPO_PUBLIC_SUPABASE_URL=la_tua_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=la_tua_anon_key
```

Oppure modifica direttamente `lib/supabase.js` con le tue credenziali.

## 3. Crea le tabelle nel database

**⚠️ IMPORTANTE:** Usa il file **`SUPABASE_QUERIES.sql`** che contiene tutte le query complete!

Vai alla sezione **SQL Editor** nel dashboard Supabase ed esegui il contenuto del file `SUPABASE_QUERIES.sql`.

**Istruzioni rapide:**
1. Apri il file `SUPABASE_QUERIES.sql` dal progetto
2. Copia TUTTO il contenuto
3. Vai su Supabase Dashboard > SQL Editor > New Query
4. Incolla e clicca Run

**Oppure** esegui manualmente questo script (versione base):

```sql
-- 1. Tabella profiles (estensione di auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_interval_hours INT NOT NULL DEFAULT 48,
  checkin_time TIME NOT NULL DEFAULT '10:00',
  last_checkin_at TIMESTAMPTZ,
  timezone TEXT DEFAULT 'Europe/Rome',
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabella emergency_contacts
CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  priority INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabella checkins
CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  checkin_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabella alerts
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  contact_id UUID REFERENCES emergency_contacts(id),
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  channel TEXT CHECK (channel IN ('email','sms','call')),
  status TEXT DEFAULT 'sent'
);

-- Indici per performance
CREATE INDEX idx_profiles_id ON profiles(id);
CREATE INDEX idx_profiles_last_checkin ON profiles(last_checkin_at);
CREATE INDEX idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX idx_checkins_user_id ON checkins(user_id);
CREATE INDEX idx_checkins_checkin_at ON checkins(checkin_at DESC);
CREATE INDEX idx_alerts_user_id ON alerts(user_id);

-- RLS (Row Level Security) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Policy: user owns profile
CREATE POLICY "user owns profile"
ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "user can update own profile"
ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "user can insert own profile"
ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy: user owns contacts
CREATE POLICY "user owns contacts"
ON emergency_contacts FOR ALL
USING (auth.uid() = user_id);

-- Policy: user owns checkins
CREATE POLICY "user owns checkins"
ON checkins FOR ALL
USING (auth.uid() = user_id);

-- Policy: user can read own alerts
CREATE POLICY "user can read own alerts"
ON alerts FOR SELECT
USING (auth.uid() = user_id);
```

## 4. Configura l'autenticazione

Nel dashboard Supabase:
1. Vai su **Authentication** > **Providers**
2. Assicurati che **Email** sia abilitato
3. (Opzionale) Configura email templates se vuoi personalizzarle

## 5. Funzionalità future: Edge Functions per alert

Per implementare l'invio automatico di email quando un utente non fa check-in per 2 giorni, puoi creare una Supabase Edge Function o un cron job.

## Note

- L'app usa Row Level Security (RLS) per garantire che ogni utente possa accedere solo ai propri dati
- Le email di emergenza non vengono inviate automaticamente dall'app base - dovrai implementare una funzione backend per questo
- I check-in vengono salvati con timestamp automatico nel fuso orario UTC

## 📄 File SQL Completo

Il file **`SUPABASE_QUERIES.sql`** contiene:
- ✅ Creazione di tutte le tabelle
- ✅ Indici per performance
- ✅ RLS policies complete
- ✅ Constraint per limite contatti premium
- ✅ Trigger per creazione profilo automatica
- ✅ Funzione helper per utenti scaduti

**Usa sempre `SUPABASE_QUERIES.sql` per una configurazione completa!**

Per istruzioni dettagliate passo-passo, vedi anche `ISTRUZIONI_SUPABASE.md`.
