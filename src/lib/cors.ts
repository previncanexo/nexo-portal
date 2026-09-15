/**
 * CORS para endpoints públicos consumidos por el onboarding en landing-v2
 * (que vive en otro dominio).
 */

const ALLOWED_ORIGINS = [
  'https://nexo.previncasalud.com.ar',
  'https://nexo-landing.vercel.app',
  'https://nexo-landing-staging.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
]

// Cada preview de Vercel para la landing staging vive en un dominio distinto
// (hash del deploy + slug del team) — sin este comodín habría que agregarlos
// a mano en cada deploy. Solo se acepta el patrón de landing staging, no
// cualquier vercel.app.
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/nexo-landing-staging-[a-z0-9]+-previncanexos-projects\.vercel\.app$/,
  /^https:\/\/nexo-landing-staging-git-[a-z0-9-]+-previncanexos-projects\.vercel\.app$/,
]

function isAllowed(origin: string | null): boolean {
  if (!origin) return false
  if (ALLOWED_ORIGINS.includes(origin)) return true
  return ALLOWED_ORIGIN_PATTERNS.some((rx) => rx.test(origin))
}

export function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = isAllowed(origin) ? (origin as string) : ALLOWED_ORIGINS[0]
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
