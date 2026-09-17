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
  // Códigos ISO / picklist confirmados por Nespon (2026-09-16). SF acepta
  // tanto texto ("Santa Fe" / "Argentina") como código ("S" / "AR"). Usamos
  // código: es más robusto ante cambios de nombre / capitalización.
  state: 'S',
  country: 'AR',
  declaredMembersCount: 1,
  seniorMembersCount: 0,
} as const
