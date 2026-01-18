// Supabase Edge Function per verificare utenti scaduti e inviare email di emergenza
// Deploy: supabase functions deploy check-expired-users

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Crea client Supabase con service role key (solo per Edge Functions!)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

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
    const { data: expiredUsers, error: queryError } = await supabaseAdmin.rpc(
      'get_expired_users'
    );

    if (queryError) {
      console.error('Errore query utenti scaduti:', queryError);
      throw queryError;
    }

    if (!expiredUsers || expiredUsers.length === 0) {
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
    for (const expiredUser of expiredUsers) {
      // Ottieni i contatti di emergenza
      const { data: contacts, error: contactsError } = await supabaseAdmin
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', expiredUser.user_id)
        .order('priority', { ascending: true });

      if (contactsError) {
        console.error('Errore recupero contatti per utente', expiredUser.user_id, contactsError);
        results.push({
          user_id: expiredUser.user_id,
          status: 'error',
          reason: 'Errore recupero contatti',
        });
        continue;
      }

      if (!contacts || contacts.length === 0) {
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

        // OPZIONE 1: Usa un servizio email esterno (es. Resend, SendGrid)
        // Scommenta e configura secondo il servizio scelto
        
        // ESEMPIO con Resend (scommenta e configura):
        /*
        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
        if (RESEND_API_KEY) {
          const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'SILEME <noreply@sileme.app>',
              to: contact.email,
              subject: emailSubject,
              html: emailBody.replace(/\n/g, '<br>'),
            }),
          });

          if (resendResponse.ok) {
            // Email inviata con successo
            await supabaseAdmin
              .from('alerts')
              .update({ status: 'sent' })
              .eq('id', alertData.id);
            
            results.push({
              user_id: expiredUser.user_id,
              contact_id: contact.id,
              contact_email: contact.email,
              status: 'sent',
              alert_id: alertData.id,
            });
            alertsCreated.push(alertData.id);
          } else {
            throw new Error('Errore invio email via Resend');
          }
        }
        */

        // OPZIONE 2: Per ora, registra solo l'alert nel database
        // L'email dovrà essere inviata tramite un altro servizio configurato separatamente
        // Oppure puoi configurare SMTP di Supabase (vedi documentazione)
        
        // Marca l'alert come "pending" - sarà inviato da un altro sistema
        // o puoi configurare un webhook che legge gli alert con status='pending'
        // e li invia tramite il tuo servizio email preferito

        results.push({
          user_id: expiredUser.user_id,
          contact_id: contact.id,
          contact_email: contact.email,
          status: 'pending', // Cambia in 'sent' se email inviata con successo
          alert_id: alertData.id,
          email_subject: emailSubject,
          email_body: emailBody,
        });
        alertsCreated.push(alertData.id);
      }
    }

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
    console.error('Errore Edge Function:', error);
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
