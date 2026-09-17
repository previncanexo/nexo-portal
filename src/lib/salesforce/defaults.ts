/**
 * Constantes del canal Nexo para el payload que va a Salesforce.
 *
 * El landing manda estos mismos valores en el body del POST/PATCH (mantiene
 * al backend agnóstico del canal), pero también los tenemos server-side como
 * fallback: si un cliente los omite se aplica el default del canal.
 */

export const SF_NEXO_DEFAULTS = {
  salesChannel: 'Nexo',
  documentType: 'DNI',
  // Picklist SF UAT: solo acepta el TEXTO ("Santa Fe" / "Argentina").
  // Los códigos ISO ("S" / "AR") que sugería Nespon fueron rechazados por
  // la org con `FIELD_INTEGRITY_EXCEPTION There's a problem with this state`
  // (verificado empíricamente 2026-09-16).
  state: 'Santa Fe',
  country: 'Argentina',
  declaredMembersCount: 1,
  seniorMembersCount: 0,
} as const
