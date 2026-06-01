function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function optionalEnv(name: string, fallback = ''): string {
  return process.env[name] ?? fallback
}

export const env = {
  // Supabase
  supabaseUrl: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),

  // MercadoPago
  mpAccessToken: optionalEnv('MP_ACCESS_TOKEN'),
  mpWebhookSecret: optionalEnv('MP_WEBHOOK_SECRET'),

  // Resend
  resendApiKey: optionalEnv('RESEND_API_KEY'),
  resendFrom: optionalEnv('RESEND_FROM', 'Previnca Nexo <onboarding@resend.dev>'),

  // App
  appUrl: optionalEnv('NEXT_PUBLIC_APP_URL', 'https://nexo.portal.previncasalud.com.ar'),
  adminEmails: optionalEnv('ADMIN_EMAILS').split(',').map(e => e.trim()).filter(Boolean),
  internalNotificationEmails: optionalEnv('INTERNAL_NOTIFICATION_EMAILS').split(',').map(e => e.trim()).filter(Boolean),
  internalBccEmails: optionalEnv('INTERNAL_BCC_EMAILS').split(',').map(e => e.trim()).filter(Boolean),
} as const
