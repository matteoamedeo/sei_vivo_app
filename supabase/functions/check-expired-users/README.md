# Edge Function: check-expired-users

Questa Edge Function verifica gli utenti che non hanno fatto check-in in tempo e registra gli alert per l'invio email.

## 🚀 Setup e Deploy

### 1. Installa Supabase CLI

```bash
npm install -g supabase
```

### 2. Login e Link

```bash
supabase login
supabase link --project-ref your-project-ref
```

### 3. Deploy

```bash
supabase functions deploy check-expired-users
```

### 4. Configura Cron Job

**📖 Guida Completa:** Vedi il file `CONFIGURAZIONE_CRON_JOB.md` nella root del progetto per istruzioni dettagliate.

**Metodo Rapido (Dashboard):**
1. Vai su **Database** > **Extensions** > Abilita `pg_cron` e `pg_net`
2. Vai su **Database** > **Cron Jobs** > **New Cron Job**
3. Configura:
   - **Name**: `check-expired-users-hourly`
   - **Schedule**: `0 * * * *` (ogni ora)
   - **Command SQL**: Vedi `CONFIGURAZIONE_CRON_JOB.md` per il comando completo

**Metodo SQL (Alternativa):**
Esegui nel SQL Editor (sostituisci `YOUR_PROJECT_REF` e `YOUR_SERVICE_ROLE_KEY`):
```sql
SELECT cron.schedule(
  'check-expired-users-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-expired-users',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

## 📧 Configurazione Invio Email

La funzione attualmente **registra solo gli alert** nel database. Per inviare email reali, configura uno di questi:

### Opzione A: Resend (Consigliato)

1. Crea account su [resend.com](https://resend.com)
2. Ottieni API Key
3. Aggiungi variabile d'ambiente in Supabase:
   - **Name**: `RESEND_API_KEY`
   - **Value**: `re_xxx...`
4. Scommenta il codice Resend in `index.ts` (righe ~120-150)

### Opzione B: SendGrid

Similarmente, configura SendGrid e usa la loro API.

### Opzione C: SMTP Supabase

Configura SMTP nelle impostazioni del progetto Supabase e usa `supabaseAdmin.functions.invoke()` per chiamare un'altra funzione che invia email.

## 📋 Cosa Fa

1. Chiama `get_expired_users()` per trovare utenti scaduti
2. Per ogni utente scaduto:
   - Recupera i contatti di emergenza
   - Crea un alert nella tabella `alerts` (status: 'pending')
   - Preparare contenuto email (non ancora inviato se non configurato)
3. Ritorna un report con tutti gli alert creati

## 🔍 Test

Per testare manualmente:

```bash
curl -X POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/check-expired-users' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

## ⚠️ Nota

Gli alert vengono creati con status `pending`. Per inviare email reali, devi configurare un servizio email esterno (Resend, SendGrid, ecc.) o usare SMTP di Supabase.
