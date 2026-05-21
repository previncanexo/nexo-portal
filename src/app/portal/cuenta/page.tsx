import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Affiliate } from '@/lib/types'
import CuentaForm from './CuentaForm'

export const metadata = { title: 'Mi cuenta · Nexo' }

export default async function CuentaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!affiliate) redirect('/portal')

  return (
    <div className="flex flex-col gap-7 pb-10">
      <div className="pt-1 flex items-center gap-3">
        <Link
          href="/portal"
          className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
          style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-dm-sans)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Volver
        </Link>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Mi cuenta
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Actualizá tus datos personales y tu contraseña.
        </p>
      </div>

      <CuentaForm affiliate={affiliate as Affiliate} />
    </div>
  )
}
