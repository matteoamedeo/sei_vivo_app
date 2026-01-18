-- ============================================
-- MIGRAZIONE: Supporto intervallo 5 minuti
-- ============================================
-- Esegui questa query per supportare intervalli decimali (es. 5 minuti = 0.083 ore)
-- Vai su: Dashboard > SQL Editor > New Query
-- ============================================

-- 1. Modifica il tipo della colonna da INT a NUMERIC per supportare decimali
ALTER TABLE profiles 
ALTER COLUMN checkin_interval_hours TYPE NUMERIC(10, 4);

-- 2. Rimuovi la funzione esistente (necessario per cambiare il tipo di ritorno)
DROP FUNCTION IF EXISTS get_expired_users();

-- 3. Ricrea la funzione get_expired_users() con NUMERIC invece di INT
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
    p.id as user_id,
    p.id as profile_id,
    p.last_checkin_at,
    p.checkin_interval_hours,
    EXTRACT(EPOCH FROM (NOW() - (p.last_checkin_at + (p.checkin_interval_hours || ' hours')::interval))) / 3600 as hours_overdue
  FROM profiles p
  WHERE p.last_checkin_at IS NOT NULL
    AND NOW() > (p.last_checkin_at + (p.checkin_interval_hours || ' hours')::interval)
  ORDER BY hours_overdue DESC;
END;
$func$;

-- ============================================
-- Verifica che la modifica sia stata applicata
-- (la colonna ora può contenere valori decimali come 0.083 per 5 minuti)
-- Esempi:
--   0.083 = 5 minuti
--   24.0  = 24 ore
--   48.0  = 48 ore
-- 
-- Nota: I valori esistenti vengono automaticamente convertiti (es. 48 → 48.0)
-- ============================================
