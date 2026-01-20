/**
 * Configurazione per il reset del bottone di check-in
 * 
 * Opzioni disponibili:
 * - resetType: 'midnight' | 'minutes'
 *   - 'midnight': Il bottone si sblocca dopo la mezzanotte (00:00:00)
 *   - 'minutes': Il bottone si sblocca dopo X minuti dall'ultimo check-in
 * 
 * - resetAfterMinutes: numero (solo se resetType è 'minutes')
 *   - Numero di minuti da attendere prima di poter rifare il check-in
 */

export const CHECKIN_CONFIG = {
  // Tipo di reset: 'midnight' per sbloccare dopo mezzanotte, 'minutes' per sbloccare dopo X minuti
  resetType: 'midnight', // oppure 'minutes'
  
  // Minuti di attesa prima di poter rifare il check-in (solo se resetType è 'minutes')
  resetAfterMinutes: 2,
};
