🗄️ DATABASE (POSTGRES)

1️⃣ profiles

Estensione di auth.users

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  checkin_interval_hours int not null default 48,
  checkin_time time not null default '10:00',
  last_checkin_at timestamptz,
  timezone text default 'Europe/Rome',
  is_premium boolean default false,
  created_at timestamptz default now()
);

2️⃣ emergency_contacts
create table emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  priority int default 1,
  created_at timestamptz default now()
);

3️⃣ checkins
create table checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  checkin_at timestamptz default now()
);

4️⃣ alerts
create table alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  contact_id uuid references emergency_contacts(id),
  triggered_at timestamptz default now(),
  channel text check (channel in ('email','sms','call')),
  status text default 'sent'
);


🔐 ROW LEVEL SECURITY (OBBLIGATORIA)
alter table profiles enable row level security;
alter table emergency_contacts enable row level security;
alter table checkins enable row level security;

create policy "user owns profile"
on profiles for select using (auth.uid() = id);

create policy "user owns contacts"
on emergency_contacts for all
using (auth.uid() = user_id);

create policy "user owns checkins"
on checkins for all
using (auth.uid() = user_id);


🔴 Nessuna chiave esposta nel frontend
Usi solo:

anon key (client)

service role solo in Edge Function

🔁 LOGICA DI CHECK-IN
Quando l’utente preme “SONO VIVO”
Client
await supabase
  .from('checkins')
  .insert({ user_id });

await supabase
  .from('profiles')
  .update({ last_checkin_at: new Date() })
  .eq('id', user_id);

⏰ VERIFICA AUTOMATICA (CRON)

Usiamo pg_cron o Supabase Scheduled Function

Query di controllo
select *
from profiles
where now() > last_checkin_at 
  + (checkin_interval_hours || ' hours')::interval;

Se scaduto → TRIGGER ALERT
Pseudologica
for each user expired:
  get emergency_contacts
  for each contact:
    send email
    log alert


👉 Questa parte NON va sul client
👉 Va in Edge Function con SERVICE ROLE

📩 INVIO EMAIL
Contenuto email (neutro)
Oggetto: Nessuna conferma recente

Non abbiamo ricevuto conferma da [Nome] 
nelle ultime 48 ore.

Ultimo check-in: 14/01 ore 09:41


✔ No panico
✔ No dati sensibili
✔ No posizione

🔔 NOTIFICHE PUSH
Reminder locale

6h prima

1h prima

Ultimo avviso

15 minuti prima dell’allarme

⭐ PREMIUM (LOGICA)
alter table emergency_contacts
add constraint premium_limit
check (
  (select count(*) from emergency_contacts where user_id = auth.uid()) <=
  case when (select is_premium from profiles where id = auth.uid())
    then 5 else 1 end
);

🔄 RECOVERY FLOW

Se l’utente fa check-in dopo alert inviato:

Stato torna OK

Nessuna ulteriore notifica

Alert marcato come resolved

🔐 PRIVACY & COMPLIANCE (IMPORTANTISSIMO)

✔ Nessun GPS
✔ Nessun microfono
✔ Nessuna registrazione audio
✔ Dati minimi
✔ GDPR friendly
✔ Server EU

📊 SCALABILITÀ

100k utenti → ok

Cron ogni 15 min

Query indicizzate su last_checkin_at

Email asincrone

🧪 TEST CASE CRITICI

App disinstallata

Telefono spento

Cambio fuso orario

Contatto errato

Falso positivo