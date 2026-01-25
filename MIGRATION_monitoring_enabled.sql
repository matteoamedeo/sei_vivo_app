-- ============================================
-- MIGRAZIONE: Attiva/Disattiva monitoraggio
-- ============================================
-- Esegui nel SQL Editor di Supabase (Dashboard > SQL Editor)
-- ============================================

-- 1. Aggiungi colonna
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS monitoring_enabled BOOLEAN NOT NULL DEFAULT true;

-- 2. Aggiorna get_expired_users per escludere utenti in pausa
DROP FUNCTION IF EXISTS get_expired_users();

CREATE FUNCTION get_expired_users()
RETURNS TABLE (
  user_id UUID,
  profile_id UUID,
  last_checkin_at TIMESTAMPTZ,
  checkin_interval_hours NUMERIC,
  hours_overdue NUMERIC
) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $func$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.id,
    p.last_checkin_at,
    p.checkin_interval_hours,
    EXTRACT(EPOCH FROM (NOW() - (p.last_checkin_at + (p.checkin_interval_hours || ' hours')::interval))) / 3600
  FROM profiles p
  WHERE p.last_checkin_at IS NOT NULL
    AND NOW() > (p.last_checkin_at + (p.checkin_interval_hours || ' hours')::interval)
    AND (p.monitoring_enabled IS NULL OR p.monitoring_enabled = true)
  ORDER BY 5 DESC;
END;
$func$;

-- Quando monitoring_enabled = false: nessun avviso ai contatti.
