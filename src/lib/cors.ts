/**
 * CORS para endpoints públicos consumidos por el onboarding en landing-v2
 * (que vive en otro dominio).
 */

const ALLOWED_ORIGINS = [
  'https://nexo.previncasalud.com.ar',
  'https://nexo-landing.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
]

export function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
}

export function jsonWithCors(body: unknown, init: { status?: number; origin: string | null }) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(init.origin),
    },
  })
}
