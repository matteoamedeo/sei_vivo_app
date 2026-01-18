# ⏰ Configurazione Cron Job per Edge Function

Guida per configurare un cron job che chiama automaticamente la funzione `check-expired-users` a intervalli regolari.

---

## 📋 Metodo 1: Tramite Dashboard Supabase (Consigliato)

### Passo 1: Abilita le Estensioni Necessarie

1. Vai su **Dashboard Supabase** > **Database** > **Extensions**
2. Cerca e abilita:
   - ✅ **`pg_cron`** (per schedulare i job)
   - ✅ **`pg_net`** (per fare chiamate HTTP all'Edge Function)

Se non le trovi, abilita via SQL (vedi Metodo 2).

### Passo 2: Crea il Cron Job dal Dashboard

1. Vai su **Database** > **Cron Jobs** (o **Integrations** > **Cron**)
2. Clicca **Create a new cron job** o **New Cron Job**
3. Compila i campi:

   **Nome:**
   ```
   check-expired-users-daily
   ```

   **Schedule (cron expression):**
   ```
   0 * * * *     (ogni ora)
   ```
   Oppure:
   ```
   */15 * * * *  (ogni 15 minuti - per test)
   ```
   Oppure:
   ```
   0 9 * * *     (ogni giorno alle 9:00 UTC)
   ```

   **Command SQL:**
   ```sql
   SELECT
     net.http_post(
       url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-expired-users',
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
       ),
       body := '{}'::jsonb
     ) as request_id;
   ```

   ⚠️ **SOSTITUISCI:**
   - `YOUR_PROJECT_REF`: il tuo project reference (lo trovi in Project Settings > General)
   - `YOUR_SERVICE_ROLE_KEY`: la tua Service Role Key (Project Settings > API > Service Role Key)

4. Clicca **Save** o **Create**

---

## 📋 Metodo 2: Tramite SQL Editor (Alternativa)

Se preferisci usare SQL direttamente o il dashboard non ha l'interfaccia Cron Jobs:

### Passo 1: Abilita Estensioni

Vai su **SQL Editor** ed esegui:

```sql
-- Abilita pg_cron (per schedulare job)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Abilita pg_net (per chiamate HTTP)
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### Passo 2: Crea il Cron Job

**⚠️ PRIMA:** Sostituisci questi valori:
- `YOUR_PROJECT_REF`: il tuo project reference
- `YOUR_SERVICE_ROLE_KEY`: la tua Service Role Key

Poi esegui:

```sql
-- Cron job che esegue ogni ora (modifica lo schedule se vuoi)
SELECT cron.schedule(
  'check-expired-users-hourly',  -- Nome del job
  '0 * * * *',                   -- Ogni ora (minuto 0)
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-expired-users',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);
```

### Esempi di Schedule

| Espressione Cron | Significato |
|------------------|-------------|
| `*/15 * * * *` | Ogni 15 minuti |
| `0 * * * *` | Ogni ora (minuto 0) |
| `0 9 * * *` | Ogni giorno alle 9:00 UTC |
| `0 9,21 * * *` | Alle 9:00 e 21:00 UTC ogni giorno |
| `0 9 * * 1` | Ogni lunedì alle 9:00 UTC |

---

## 🔍 Verifica che il Cron Job Funzioni

### 1. Controlla lo Stato del Job

**Tramite SQL:**
```sql
-- Vedi tutti i cron job schedulati
SELECT * FROM cron.job;

-- Vedi l'ultima esecuzione e i dettagli
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

### 2. Test Manuale della Edge Function

Prima di aspettare il cron, testa manualmente la funzione:

```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-expired-users' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
```

Oppure dal dashboard: **Edge Functions** > `check-expired-users` > **Invoke**

### 3. Controlla i Log

Vai su **Edge Functions** > `check-expired-users` > **Logs** per vedere se ci sono errori.

---

## 🛠️ Gestione del Cron Job

### Vedere tutti i Cron Job

```sql
SELECT jobid, jobname, schedule, command 
FROM cron.job;
```

### Modificare lo Schedule

```sql
-- Cambia lo schedule di un job esistente
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'check-expired-users-hourly'),
  schedule := '*/30 * * * *'  -- Nuovo schedule: ogni 30 minuti
);
```

### Rimuovere un Cron Job

```sql
-- Rimuovi un job
SELECT cron.unschedule('check-expired-users-hourly');
```

Oppure dal dashboard: **Cron Jobs** > trova il job > **Delete**

---

## 🔐 Sicurezza: Usa Supabase Vault (Opzionale ma Consigliato)

Per evitare di hardcodare la Service Role Key nel cron job, puoi salvarla in **Supabase Vault**:

### Passo 1: Salva la Key nel Vault

1. Vai su **Project Settings** > **Vault**
2. Crea un secret:
   - **Name**: `service_role_key`
   - **Value**: incolla la tua Service Role Key

### Passo 2: Usa il Vault nel Cron Job

```sql
SELECT cron.schedule(
  'check-expired-users-hourly',
  '0 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-expired-users',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || vault.get('service_role_key')
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);
```

---

## ⚠️ Note Importanti

1. **Timezone**: I cron job su Supabase usano **UTC**. Se vuoi eseguire alle 9:00 in Italia, usa `8:00 UTC` (ora legale) o `7:00 UTC` (ora solare).

2. **Service Role Key**: Usa sempre la **Service Role Key** (non l'Anon Key) per chiamare l'Edge Function dal cron, perché l'Edge Function ha bisogno di accesso admin al database.

3. **Frequenza Consigliata**: Per controllare utenti scaduti, un'esecuzione ogni ora è sufficiente. Evita esecuzioni troppo frequenti (es. ogni minuto) per non sprecare risorse.

4. **Edge Function Deployata**: Assicurati che l'Edge Function `check-expired-users` sia deployata prima di configurare il cron job.

5. **SMTP Configurato**: Se l'Edge Function deve inviare email, configura le variabili SMTP nelle impostazioni della funzione (vedi `CONFIGURAZIONE_SMTP.md`).

---

## 📚 Risorse

- [Documentazione Supabase Cron](https://supabase.com/docs/guides/cron)
- [Guida Edge Functions](https://supabase.com/docs/guides/functions)
- [pg_cron Documentation](https://github.com/citusdata/pg_cron)
