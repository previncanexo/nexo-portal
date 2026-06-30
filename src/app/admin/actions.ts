'use server'

// Este archivo quedó vacío al remover la feature de altas manuales de afiliados
// (quickApproveAffiliate). Los affiliates ahora solo se activan vía webhook MP
// cuando el pago se confirma. "pending" = abandonó el checkout, "active" = pagó.
//
// Se mantiene el archivo (en vez de borrarlo) por si en el futuro se agregan
// otras server actions del admin.
export {}
