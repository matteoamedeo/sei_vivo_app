# 🔒 Sicurezza delle Credenziali Supabase

## ✅ È SICURO usare `EXPO_PUBLIC_` per Supabase?

**SÌ**, per l'URL e l'Anon Key di Supabase è **sicuro e previsto** usare `EXPO_PUBLIC_`.

## Come funziona la sicurezza con Supabase

### Credenziali Pubbliche (Sicure da esporre)

Le seguenti credenziali **SONO PROGETTATE** per essere incluse nel bundle JavaScript:

1. **`EXPO_PUBLIC_SUPABASE_URL`** ✅
   - È solo l'URL del tuo progetto
   - Non contiene informazioni sensibili
   - È necessaria per connettersi a Supabase

2. **`EXPO_PUBLIC_SUPABASE_ANON_KEY`** ✅
   - È una chiave pubblica e non privilegiata
   - Funziona solo con le policy RLS (Row Level Security) che hai configurato
   - Non può bypassare le policy di sicurezza del database
   - **Tutti** i client Supabase la espongono pubblicamente

### 🔐 Credenziali Private (MAI esporre!)

**`SUPABASE_SERVICE_ROLE_KEY`** ❌ **PERICOLOSA**
- **NON usare mai** `EXPO_PUBLIC_` per questa chiave
- Bypassa TUTTE le policy RLS
- Ha accesso completo al database
- Usa solo su server/backend (Edge Functions, server Node.js, ecc.)
- **Se esposta pubblicamente, chiunque può accedere a TUTTI i dati**

## Perché è sicuro usare l'Anon Key pubblicamente?

Supabase usa il concetto di **Row Level Security (RLS)**:

1. L'Anon Key può fare query solo attraverso le policy RLS che hai definito
2. Le policy limitano l'accesso ai dati solo all'utente autenticato
3. Anche se qualcuno vede la tua Anon Key, non può:
   - Accedere ai dati di altri utenti
   - Modificare dati senza autenticazione
   - Bypassare le policy di sicurezza

Esempio di policy RLS che abbiamo configurato:
```sql
-- Solo l'utente autenticato può vedere i propri check-in
CREATE POLICY "Users can read own check-ins"
  ON check_ins FOR SELECT
  USING (auth.uid() = user_id);
```

## Best Practices

### ✅ Cosa fare

1. **Usa `EXPO_PUBLIC_` per URL e Anon Key** - È il modo corretto
2. **Aggiungi `.env` al `.gitignore`** - Proteggi le tue credenziali dal repository
3. **Usa sempre RLS** - Configura policy per tutte le tabelle sensibili
4. **Service Role Key solo su backend** - Mai nel codice client

### ❌ Cosa NON fare

1. **Non committare `.env`** - Il file `.gitignore` dovrebbe includerlo
2. **Non usare `EXPO_PUBLIC_` per Service Role Key** - Pericolosissimo!
3. **Non disabilitare RLS** - Lasciare tabelle senza policy è pericoloso
4. **Non condividere la Service Role Key** - Mai inviarla via email, chat, ecc.

## File `.env` - Struttura Consigliata

```env
# ✅ PUBBLICHE - Sicure da esporre nel bundle
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# ❌ PRIVATA - Solo per uso server/backend
# NON aggiungere EXPO_PUBLIC_ davanti!
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Usa solo in Edge Functions o server
```

## Verifica RLS

Nel dashboard Supabase, verifica sempre che:
- ✅ RLS sia abilitato su tutte le tabelle sensibili
- ✅ Le policy siano configurate correttamente
- ✅ Hai testato che un utente non possa accedere ai dati di altri

## Conclusione

**È perfettamente sicuro** usare `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` nel codice React Native. Questo è il pattern standard raccomandato da Supabase per le applicazioni client.

La sicurezza dipende dalle **policy RLS**, non dalla segretezza dell'Anon Key. Anche se qualcuno la vede, non può fare nulla di dannoso grazie alle policy che hai configurato.
