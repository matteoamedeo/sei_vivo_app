# 🚀 ISTRUZIONI COMPLETE PER CONFIGURARE SUPABASE

## Passo 1: Crea un progetto Supabase

1. Vai su [supabase.com](https://supabase.com)
2. Crea un account (se non ne hai già uno)
3. Clicca su **New Project**
4. Compila i dati:
   - **Name**: Sileme (o il nome che preferisci)
   - **Database Password**: scegli una password sicura (salvala!)
   - **Region**: scegli la regione più vicina (es. Europe West)
5. Clicca su **Create new project**
6. Aspetta 2-3 minuti che il progetto venga creato

## Passo 2: Ottieni le credenziali

1. Nel dashboard Supabase, vai su **Settings** (icona ingranaggio in basso a sinistra)
2. Clicca su **API**
3. Trova la sezione **Project API keys**
4. Copia questi valori:
   - **Project URL** (es: `https://xxxxx.supabase.co`)
   - **anon public** key (la chiave che inizia con `eyJ...`)

## Passo 3: Configura le credenziali nell'app

### Opzione A: File .env (consigliato)

Crea un file `.env` nella root del progetto:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Opzione B: Modifica direttamente il file

Apri `lib/supabase.js` e sostituisci:
```javascript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
```

Con:
```javascript
const supabaseUrl = 'https://xxxxx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

## Passo 4: Esegui le query SQL

1. Nel dashboard Supabase, vai su **SQL Editor** (menu laterale)
2. Clicca su **New Query**
3. Apri il file **`SUPABASE_QUERIES.sql`** dal progetto
4. **Copia TUTTO il contenuto** del file
5. **Incolla** nel SQL Editor di Supabase
6. Clicca su **Run** (o premi `Cmd/Ctrl + Enter`)

### ✅ Verifica che tutto sia stato creato

Dopo aver eseguito le query, verifica:

1. Vai su **Table Editor** nel menu laterale
2. Dovresti vedere 4 tabelle:
   - ✅ `profiles`
   - ✅ `emergency_contacts`
   - ✅ `checkins`
   - ✅ `alerts`

3. Vai su **Authentication** > **Policies**
4. Verifica che le policies RLS siano attive per tutte le tabelle

## Passo 5: Configura l'autenticazione

1. Nel dashboard Supabase, vai su **Authentication** > **Providers**
2. Assicurati che **Email** sia abilitato (dovrebbe esserlo di default)
3. (Opzionale) Configura **Email Templates** se vuoi personalizzare le email di conferma

## Passo 6: Testa l'app

1. Avvia l'app: `npm start` o `expo start`
2. Registra un nuovo utente
3. Verifica che:
   - Il profilo venga creato automaticamente
   - L'onboarding funzioni
   - I check-in vengano salvati

## 🔍 Troubleshooting

### Errore: "relation does not exist"
- Verifica di aver eseguito TUTTE le query del file `SUPABASE_QUERIES.sql`
- Controlla che le tabelle siano state create in **Table Editor**

### Errore: "permission denied"
- Verifica che le RLS policies siano state create correttamente
- Controlla in **Authentication** > **Policies**

### Errore: "invalid API key"
- Verifica di aver copiato correttamente la **anon key** (non la service_role key!)
- Controlla che l'URL di Supabase sia corretto

### L'app non si connette a Supabase
- Verifica che le credenziali in `.env` o `lib/supabase.js` siano corrette
- Riavvia l'app dopo aver modificato le credenziali
- Controlla la console per eventuali errori

## 📝 Note Importanti

- ⚠️ **NON condividere mai** la `service_role` key - è segreta!
- ✅ Usa solo la `anon` key nel frontend
- ✅ Le RLS policies proteggono i dati - ogni utente vede solo i propri dati
- ✅ Il profilo viene creato automaticamente quando un utente si registra

## 🎉 Fatto!

Ora l'app dovrebbe funzionare correttamente. Se hai problemi, controlla i log nella console dell'app o nel dashboard Supabase.
