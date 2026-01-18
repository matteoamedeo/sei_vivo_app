Ecco tutte le funzionalità e le schermate principali dell’app Sileme (nota anche come “Are You Dead?” / 死了么 in Cina), così come emerge dalla descrizione ufficiale e dalle fonti di settore — con spiegazioni specifiche e dettagliate su cosa fa e come è strutturata l’esperienza utente.

📌 1. Schermata di Benvenuto e Onboarding

Quando installi l’app per la prima volta:

Insert Contatto di Emergenza: Prima configurazione obbligatoria in cui inserisci il nome del contatto e l’email del tuo referente di emergenza.

Non serve un login o creazione di account complesso: molti utenti possono usare l’app senza password o login formali.

📋 2. Home / Dashboard Principale

La schermata principale è molto semplice e minimale:

Un grande pulsante di check-in (solitamente centrale sullo schermo).

Una scritta tipo “Sei vivo?” / “I’m alive”.

Indicazioni su quanti giorni consecutivi hai fatto check-in.

Questa schermata serve a:

confermare che sei vivo oggi;

mantenere attivo il monitoraggio quotidiano.

🕐 3. Funzionalità di Check-in Giornaliero

Funzione primaria dell’app:

Ogni giorno premi il pulsante per dire “sono vivo”.

Se non lo fai entro il tempo limite (tipicamente 48 ore), l’app considera l’assenza di check-in come un possibile segnale di emergenza.

Se la soglia viene superata, l’app invia automaticamente una notifica/email di allarme al tuo contatto di emergenza preimpostato.

Questa procedura è il cuore dell’app e non richiede altre schermate complesse.

📧 4. Notifiche e Allerta Automatica

Se non fai il check-in:

Sileme identifica un’anomalia (assenza di segnale).

Invia automaticamente una email al contatto di emergenza con un messaggio pre-impostato.

La notifica può includere frasi tipo “Non ho sentito da te in 48 ore — controlla se va tutto bene”.

Nota: Non tutte le versioni inviano SMS o chiamate — molte si limitano alle email, almeno nella versione principale distribuita in Cina.

🔒 5. Impostazioni Privacy e Dati

L’app è concepita per essere leggera e non invasiva:

Non richiede GPS continuo o tracciamento della posizione.

Tutte le informazioni vengono crittografate e salvate in funzione del minimo necessario.

L’app tenta di non raccogliere più dati del necessario per funzionare.

📅 6. Registro Stato / Storico Check-in

Alcune versioni mostrano:

Una cronologia o lista dei giorni in cui hai fatto check-in.

Questo aiuta a vedere se stai mantenendo regolare conferma di attività.

🛠️ 7. Funzionalità Premium / Piani a Pagamento

In alcune regioni o versioni locali (come in Cina), esiste un piano a pagamento che può offrire:

notifiche più frequenti;

messaggi via SMS oltre alle email;

messaggistica interna;

supporto per più contatti di emergenza.

📌 Schema di Pagine dell’App (semplificato)

Ecco una visione di massima delle pagine tipiche nell’app:

1. Onboarding iniziale

Inserisci contatto di emergenza

Accetta termini & privacy

2. Home / Check-in

Pulsante “Sono vivo”

Indicatore giorni consecutivi

3. Cronologia Check-in

Lista di conferme passate

4. Notifiche / Avvisi

Email inviate

Eventuali impostazioni di alert

5. Impostazioni (se presenti)

Modifica contatto di emergenza

Opzioni di notifica

6. Sezione Premium / Abbonamento (se implementata)

🧠 Come Funziona in Sostanza

Non è un tradizionale SOS con localizzazione GPS o allarmi sonori.

È un sistema di monitoraggio “status vivente” che segnala ai tuoi contatti se non riceve conferme entro un certo periodo.

Ti preparo una specifica completa “tipo prodotto” dell’app (come se dovessi rifarla da zero): pagine, flussi, funzionalità, stati, dati e logica. Niente fuffa.

📱 APP “SILEME / SILEMA” — SPECIFICA COMPLETA
🎯 OBIETTIVO DELL’APP

Verificare periodicamente che l’utente stia bene.
Se non conferma entro un tempo definito, l’app avvisa automaticamente uno o più contatti.

Non è un SOS attivo, ma un monitoraggio passivo dello stato di vita.

🧭 STRUTTURA GENERALE DELL’APP
Pagine principali (MVP)

1. Splash / Avvio

2. Onboarding iniziale

3. Home (Check-in)

4. Stato & Countdown

5. Storico Check-in

6. Contatti di emergenza

7. Notifiche & Alert

8. Impostazioni

9. Premium (opzionale)

10. Info / Privacy

1️⃣ SPLASH / AVVIO

Funzione

Caricamento app

Verifica stato utente

Logica

Se prima apertura → Onboarding

Se utente configurato → Home

2️⃣ ONBOARDING INIZIALE (OBBLIGATORIO)
Pagina 1 – Introduzione

Spiegazione semplice:

“Conferma periodicamente che stai bene. Se non lo fai, avvisiamo qualcuno.”

Pagina 2 – Contatto di emergenza

Campi:

Nome

Email (obbligatoria)

Telefono (opzionale / premium)

⚠️ Senza almeno 1 contatto, non si può continuare.

Pagina 3 – Regole di check-in

Scelte:

Frequenza:

Ogni 24h

Ogni 48h (default)

Personalizzata

Orario preferito (es. 10:00)

Pagina 4 – Permessi

Notifiche push

Avvio automatico in background

3️⃣ HOME — CHECK-IN (CUORE DELL’APP)
UI

Schermata minimal

Pulsante centrale gigante

“✅ Sono vivo”

oppure “I’m OK”

Elementi visivi

Stato attuale:

🟢 Tutto ok

🟡 Check-in in scadenza

🔴 Allarme attivo

Ultimo check-in (data + ora)

Azione

👉 Tap sul pulsante:

Salva timestamp

Reset countdown

Feedback visivo (animazione)

4️⃣ STATO & COUNTDOWN
Contenuto

Timer visivo:

“Mancano 18h 32m al prossimo check-in”

Barra di avanzamento

Stati

OK → Nessuna azione

Warning → Notifica di promemoria

Critical → Trigger allarme

5️⃣ STORICO CHECK-IN
Funzioni

Lista giornaliera:

✔️ Check-in fatto

❌ Check-in mancato

Calendario mensile

Utilità

Mostrare affidabilità

Storico consultabile dal contatto (premium)

6️⃣ CONTATTI DI EMERGENZA
Funzioni

Aggiungi / rimuovi contatti

Ordine di priorità

Tipo di notifica:

Email

SMS (premium)

Chiamata automatica (premium)

Esempio escalation

Email dopo 48h

SMS dopo 52h

Chiamata dopo 60h

7️⃣ NOTIFICHE & ALERT
Notifiche locali

“Ricordati di confermare che stai bene”

“Ultimo avviso prima dell’allarme”

Notifica al contatto

Contenuto tipico email:

“⚠️ Nessun check-in da 48 ore.
Ultimo segnale: ieri alle 09:42.”

(Niente panico, tono neutro)

8️⃣ IMPOSTAZIONI

Frequenza check-in

Orari

Lingua

Fuso orario

Backup / ripristino

Reset account

9️⃣ PREMIUM (FACOLTATIVO)

Funzioni avanzate:

Più contatti

SMS & chiamate

Storico condiviso

Report settimanale

Supporto prioritario

💰 Prezzo tipico:

1–3 €/mese

🔐 PRIVACY & SICUREZZA (PUNTO CHIAVE)

❌ NO GPS continuo

❌ NO tracking

✔️ Solo timestamp check-in

✔️ Dati minimi

✔️ Crittografia

✔️ Zero social

Questo è il motivo per cui l’app ha avuto successo.

🧠 LOGICA TECNICA (SEMPLIFICATA)
Dati minimi
User:
- id
- last_checkin_at
- checkin_interval_hours

EmergencyContact:
- name
- email
- phone?

Pseudologica
if (now - last_checkin > interval) {
  sendAlert()
}

🚀 PERCHÉ È GENIALE

Risolve un problema reale

UX ultra semplice

Nessuna ansia

Zero complessità tecnica