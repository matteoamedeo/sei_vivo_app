# 📧 Setup Edge Function per Invio Email di Emergenza

## ⚠️ IMPORTANTE

**L'invio di email NON può essere fatto dal client** per motivi di sicurezza. Deve essere implementato come **Supabase Edge Function** o **cron job**.

## 🎯 Opzione 1: Supabase Edge Function (Consigliato)

### Passo 1: Installa Supabase CLI

```bash
npm install -g supabase
```

### Passo 2: Login a Supabase

```bash
supabase login
```

### Passo 3: Link al tuo progetto

```bash
supabase link --project-ref your-project-ref
```

### Passo 4: Crea la funzione

```bash
supabase functions new check-expired-users
```

### Passo 5: Copia il codice

Copia il contenuto del file `supabase/functions/check-expired-users/index.ts` nella funzione creata.

### Passo 6: Configura variabili d'ambiente

Nel dashboard Supabase:
1. Vai su **Project Settings** > **Edge Functions**
2. Aggiungi le variabili:
   - `SUPABASE_URL` (già presente)
   - `SUPABASE_SERVICE_ROLE_KEY` (già presente)

### Passo 7: Deploy della funzione

```bash
supabase functions deploy check-expired-users
```

### Passo 8: Configura cron job

Nel dashboard Supabase:
1. Vai su **Database** > **Cron Jobs**
2. Crea un nuovo cron job:
   - **Name**: `check-expired-users-daily`
   - **Schedule**: `*/15 * * * *` (ogni 15 minuti)
   - **Function**: `check-expired-users`
   - **Payload**: `{}`

## 🎯 Opzione 2: Usa pg_cron (Alternativa)

Se preferisci usare pg_cron direttamente nel database:

```sql
-- Abilita pg_cron (se non già abilitato)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Crea funzione per inviare alert
CREATE OR REPLACE FUNCTION send_expired_user_alerts()
RETURNS void AS $$
DECLARE
  expired_user RECORD;
  contact RECORD;
  user_email TEXT;
BEGIN
  -- Trova utenti scaduti
  FOR expired_user IN 
    SELECT * FROM get_expired_users()
  LOOP
    -- Ottieni contatti di emergenza
    FOR contact IN
      SELECT * FROM emergency_contacts
      WHERE user_id = expired_user.user_id
      ORDER BY priority
    LOOP
      -- Qui dovresti chiamare un servizio esterno per inviare email
      -- Esempio: chiamata HTTP a Resend, SendGrid, ecc.
      
      -- Registra l'alert
      INSERT INTO alerts (user_id, contact_id, channel, status)
      VALUES (expired_user.user_id, contact.id, 'email', 'pending');
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crea cron job che esegue ogni 15 minuti
SELECT cron.schedule(
  'check-expired-users',
  '*/15 * * * *',
  $$SELECT send_expired_user_alerts();$$
);
```

## 🎯 Opzione 3: Servizio Esterno (Più Semplice)

### Usa Resend (consigliato per semplicità)

1. Crea account su [resend.com](https://resend.com)
2. Ottieni API key
3. Crea Edge Function che usa Resend:

```typescript
// supabase/functions/send-alert-email/index.ts
import { Resend } from 'https://esm.sh/resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

serve(async (req) => {
  const { to, subject, html } = await req.json();
  
  const { data, error } = await resend.emails.send({
    from: 'SILEME <noreply@sileme.app>',
    to,
    subject,
    html,
  });

  return new Response(JSON.stringify({ data, error }));
});
```

## 📋 Checklist

- [ ] Edge Function creata e deployata
- [ ] Cron job configurato (ogni 15 minuti)
- [ ] Variabili d'ambiente configurate
- [ ] Servizio email configurato (SMTP o Resend/SendGrid)
- [ ] Testato con utente di prova

## 🔍 Test Manuale

Per testare manualmente la funzione:

```bash
curl -X POST \
  'https://your-project.supabase.co/functions/v1/check-expired-users' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

## 📝 Note

- La funzione usa `SUPABASE_SERVICE_ROLE_KEY` per bypassare RLS
- Le email vengono inviate solo se l'utente ha superato l'intervallo di check-in
- Ogni alert viene registrato nella tabella `alerts`
- La funzione è idempotente (può essere eseguita più volte senza problemi)
