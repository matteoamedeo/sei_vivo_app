// Supabase Edge Function per verificare utenti scaduti e inviare email di emergenza
// Deploy: supabase functions deploy check-expired-users

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🚀 Edge Function avviata:', new Date().toISOString());
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Crea client Supabase con service role key (solo per Edge Functions!)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    console.log('📋 Configurazione Supabase:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variabili d\'ambiente Supabase mancanti');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Trova utenti scaduti usando la funzione SQL
    console.log('🔍 Cerca utenti scaduti...');
    const { data: expiredUsers, error: queryError } = await supabaseAdmin.rpc(
      'get_expired_users'
    );

    if (queryError) {
      console.error('❌ Errore query utenti scaduti:', queryError);
      throw queryError;
    }

    console.log('📊 Utenti scaduti trovati:', expiredUsers?.length || 0);
    
    if (!expiredUsers || expiredUsers.length === 0) {
      console.log('✅ Nessun utente scaduto trovato, funzione terminata');
      return new Response(
        JSON.stringify({ 
          message: 'Nessun utente scaduto trovato', 
          count: 0,
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const results = [];
    const alertsCreated = [];

    // Per ogni utente scaduto
    console.log('👥 Inizio elaborazione utenti scaduti...');
    for (const expiredUser of expiredUsers) {
      console.log(`\n📧 Elabora utente: ${expiredUser.user_id}`);
      console.log(`   - Ultimo check-in: ${expiredUser.last_checkin_at}`);
      console.log(`   - Intervallo: ${expiredUser.checkin_interval_hours} ore`);
      console.log(`   - Ore scadute: ${expiredUser.hours_overdue}`);
      
      // Ottieni i contatti di emergenza
      const { data: contacts, error: contactsError } = await supabaseAdmin
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', expiredUser.user_id)
        .order('priority', { ascending: true });

      if (contactsError) {
        console.error('❌ Errore recupero contatti per utente', expiredUser.user_id, contactsError);
        results.push({
          user_id: expiredUser.user_id,
          status: 'error',
          reason: 'Errore recupero contatti',
        });
        continue;
      }

      console.log(`   📇 Contatti trovati: ${contacts?.length || 0}`);

      if (!contacts || contacts.length === 0) {
        console.log(`   ⏭️  Nessun contatto di emergenza trovato, salta utente`);
        results.push({
          user_id: expiredUser.user_id,
          status: 'skipped',
          reason: 'Nessun contatto di emergenza trovato',
        });
        continue;
      }

      // Ottieni informazioni utente
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(
        expiredUser.user_id
      );

      const userName = userData?.user?.email?.split('@')[0] || 'Utente';

      // Invia email a ogni contatto
      for (const contact of contacts) {
        const lastCheckInDate = expiredUser.last_checkin_at
          ? new Date(expiredUser.last_checkin_at).toLocaleDateString('it-IT', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Mai';

        const hoursOverdue = Math.floor(expiredUser.hours_overdue);
        const intervalHours = expiredUser.checkin_interval_hours;

        // Prepara il contenuto email (neutro, come da requisiti)
        const emailSubject = 'Nessuna conferma recente';
        const emailBody = `
Ciao ${contact.name},

Non abbiamo ricevuto conferma da ${userName} nelle ultime ${hoursOverdue} ore.

Ultimo check-in: ${lastCheckInDate}
Intervallo configurato: ogni ${intervalHours} ore

Questa è una notifica automatica dall'app SILEME.
Ti preghiamo di verificare che tutto sia a posto.

Cordiali saluti,
Team SILEME
        `.trim();

        // Registra l'alert nel database PRIMA di inviare email
        // Questo serve per tracciare gli alert inviati
        const { data: alertData, error: alertError } = await supabaseAdmin
          .from('alerts')
          .insert({
            user_id: expiredUser.user_id,
            contact_id: contact.id,
            channel: 'email',
            status: 'pending', // Cambierà in 'sent' se email va a buon fine
          })
          .select()
          .single();

        if (alertError) {
          console.error('Errore creazione alert:', alertError);
          results.push({
            user_id: expiredUser.user_id,
            contact_id: contact.id,
            contact_email: contact.email,
            status: 'error',
            reason: 'Errore creazione alert nel database',
          });
          continue;
        }

        // Invia email usando SMTP configurato in Supabase
        console.log(`\n   📬 Prepara email per contatto: ${contact.email}`);
        
        const smtpHost = Deno.env.get('SMTP_HOST');
        const smtpPort = Deno.env.get('SMTP_PORT') || '465';
        const smtpUser = Deno.env.get('SMTP_USER');
        const smtpPass = Deno.env.get('SMTP_PASS');
        const smtpFrom = Deno.env.get('SMTP_FROM') || 'SILEME <noreply@sileme.app>';

        console.log('   🔧 Configurazione SMTP:', {
          hasHost: !!smtpHost,
          hasUser: !!smtpUser,
          hasPass: !!smtpPass,
          host: smtpHost || 'NON CONFIGURATO',
          port: smtpPort,
          from: smtpFrom,
          smtpUser,
          smtpPass
        });

        let emailSent = false;
        let emailError = null;

        if (smtpHost && smtpUser && smtpPass) {
          console.log('   ✅ Configurazione SMTP completa, procedo con invio...');
          try {
            // Crea transporter SMTP
            // Port 465 usa secure: true (SSL/TLS diretto)
            // Port 587 usa secure: false con STARTTLS
            const portNumber = Number(smtpPort);
            const useSecure = portNumber === 465; // Solo porta 465 usa secure: true
            
            console.log('   🔌 Creazione transporter SMTP...', {
              host: smtpHost,
              port: portNumber,
              secure: useSecure,
            });
            
            const transporter = nodemailer.createTransport({
              host: smtpHost,
              port: portNumber,
              secure: useSecure, // true per 465 (SSL), false per 587 (STARTTLS)
              auth: {
                user: smtpUser,
                pass: smtpPass,
              },
              // Aggiungi timeout per evitare hang
              connectionTimeout: 10000,
              greetingTimeout: 10000,
              socketTimeout: 10000,
              // Opzioni per STARTTLS (porta 587)
              requireTLS: !useSecure, // Richiedi TLS per porta 587
              tls: {
                rejectUnauthorized: false, // Non rifiutare certificati self-signed (utile per test)
              },
            });

            // Verifica la connessione SMTP
            console.log('   🔍 Verifica connessione SMTP...');
            await transporter.verify();
            console.log('   ✅ Connessione SMTP verificata con successo!');

            // Invia email
            console.log(`   📤 Invio email a: ${contact.email}`);
            const mailResult = await transporter.sendMail({
              from: smtpFrom,
              to: contact.email,
              subject: emailSubject,
              text: emailBody,
              html: emailBody.replace(/\n/g, '<br>'),
            });

            console.log('   📨 Risultato invio email:', {
              accepted: mailResult.accepted,
              rejected: mailResult.rejected,
              messageId: mailResult.messageId,
            });

            if (mailResult.accepted && mailResult.accepted.length > 0) {
              emailSent = true;
              console.log('   ✅ Email inviata con successo!');
              
              // Aggiorna alert come inviato
              await supabaseAdmin
                .from('alerts')
                .update({ status: 'sent' })
                .eq('id', alertData.id);
            } else {
              emailError = 'Email non accettata dal server SMTP';
              console.error('   ❌ Email non accettata:', mailResult);
            }
          } catch (smtpError) {
            console.error('   ❌ Errore invio email SMTP:', smtpError);
            console.error('   📋 Dettagli errore:', {
              message: smtpError.message,
              code: smtpError.code,
              command: smtpError.command,
              response: smtpError.response,
            });
            emailError = smtpError.message || 'Errore invio email via SMTP';
            
            // Aggiorna alert come fallito
            await supabaseAdmin
              .from('alerts')
              .update({ status: 'failed' })
              .eq('id', alertData.id);
          }
        } else {
          emailError = 'Variabili SMTP non configurate. Configura SMTP_HOST, SMTP_USER, SMTP_PASS nelle impostazioni della funzione.';
          console.warn('   ⚠️  SMTP non configurato, alert rimane in stato pending');
          console.warn('   📋 Variabili mancanti:', {
            hasHost: !!smtpHost,
            hasUser: !!smtpUser,
            hasPass: !!smtpPass,
          });
        }

        const resultStatus = emailSent ? 'sent' : (emailError ? 'failed' : 'pending');
        console.log(`   📊 Risultato per ${contact.email}: ${resultStatus}`, { emailError });
        
        results.push({
          user_id: expiredUser.user_id,
          contact_id: contact.id,
          contact_email: contact.email,
          status: resultStatus,
          alert_id: alertData.id,
          error: emailError || undefined,
        });
        alertsCreated.push(alertData.id);
      }
    }

    console.log('\n✅ Processo completato:', {
      expired_users_count: expiredUsers.length,
      alerts_created: alertsCreated.length,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        message: 'Processo completato',
        expired_users_count: expiredUsers.length,
        alerts_created: alertsCreated.length,
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ ERRORE CRITICO Edge Function:', error);
    console.error('📋 Stack trace:', error.stack);
    console.error('📋 Error details:', {
      message: error.message,
      name: error.name,
      cause: error.cause,
    });
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
