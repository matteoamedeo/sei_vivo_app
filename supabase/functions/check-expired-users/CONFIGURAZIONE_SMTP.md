# 📧 Configurazione SMTP per Edge Function

## Configura SMTP nel Dashboard Supabase

### Passo 1: Vai alle Impostazioni della Funzione

1. Nel dashboard Supabase, vai su **Edge Functions**
2. Seleziona la funzione `check-expired-users`
3. Vai su **Settings** > **Secrets**

### Passo 2: Aggiungi le Variabili SMTP

Aggiungi questi secrets (variabili d'ambiente):

| Nome | Descrizione | Esempio |
|------|-------------|---------|
| `SMTP_HOST` | Host SMTP | `smtp.gmail.com` o `smtp.mailtrap.io` |
| `SMTP_PORT` | Porta SMTP | `465` (TLS) o `587` (STARTTLS) |
| `SMTP_USER` | Username SMTP | `tuo-email@gmail.com` |
| `SMTP_PASS` | Password SMTP | `tua-password-app` |
| `SMTP_FROM` | Email mittente | `SILEME <noreply@sileme.app>` |

### Passo 3: Configurazioni Comuni

#### Gmail SMTP
```
SMTP_HOST: smtp.gmail.com
SMTP_PORT: 465
SMTP_USER: tuo-email@gmail.com
SMTP_PASS: password-app (non la password normale!)
SMTP_FROM: SILEME <tuo-email@gmail.com>
```

**Nota Gmail**: Devi usare una "App Password" non la password normale.
- Vai su Google Account > Sicurezza > Password delle app
- Genera una password per "Mail"

#### Mailtrap (per test)
```
SMTP_HOST: sandbox.smtp.mailtrap.io
SMTP_PORT: 465
SMTP_USER: (dal tuo account Mailtrap)
SMTP_PASS: (dal tuo account Mailtrap)
SMTP_FROM: SILEME <test@sileme.app>
```

#### SendGrid SMTP
```
SMTP_HOST: smtp.sendgrid.net
SMTP_PORT: 587
SMTP_USER: apikey
SMTP_PASS: (la tua API key SendGrid)
SMTP_FROM: SILEME <verified-email@tuodominio.com>
```

#### Mailgun SMTP
```
SMTP_HOST: smtp.mailgun.org
SMTP_PORT: 587
SMTP_USER: (dal tuo account Mailgun)
SMTP_PASS: (dal tuo account Mailgun)
SMTP_FROM: SILEME <noreply@tuodominio.com>
```

### Passo 4: Testa la Funzione

Dopo aver configurato le variabili:

1. Salva le impostazioni
2. Ridistribuisci la funzione (opzionale ma consigliato)
3. Chiama la funzione manualmente per testare:
   ```bash
   curl -X POST \
     'https://YOUR_PROJECT.supabase.co/functions/v1/check-expired-users' \
     -H 'Authorization: Bearer YOUR_ANON_KEY' \
     -H 'Content-Type: application/json'
   ```

### ⚠️ Note Importanti

1. **Port 465** è consigliato per Supabase Edge Functions (usa `secure: true`)
2. Se usi **Port 587**, cambia `secure: false` nel codice e usa STARTTLS
3. **Non committare** mai le credenziali SMTP nel codice
4. Usa sempre le **variabili d'ambiente/secrets** del dashboard
5. Per Gmail, usa una **App Password**, non la password normale

### 🔍 Troubleshooting

**Errore: "Connection timeout"**
- Verifica che SMTP_HOST e SMTP_PORT siano corretti
- Prova con port 465 invece di 587

**Errore: "Authentication failed"**
- Verifica SMTP_USER e SMTP_PASS
- Per Gmail, usa App Password

**Email non arriva**
- Controlla la cartella spam
- Verifica che SMTP_FROM sia un indirizzo valido
- Controlla i log della funzione per errori dettagliati
