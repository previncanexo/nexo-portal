import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Affiliate } from '@/lib/types'
import CredentialCard from './CredentialCard'
import ServiceCards from './ServiceCards'

export default async function PortalPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('*, plan:plans(*)')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="flex flex-col gap-6 pb-8">
      <CredentialCard affiliate={affiliate as Affiliate | null} />
      <ServiceCards affiliate={affiliate as Affiliate | null} />

      {/* Próximamente */}
      <div
        className="glass-card p-6 text-center"
        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3"
          style={{
            background: 'rgba(134,96,239,0.2)',
            border: '1px solid rgba(134,96,239,0.4)',
            color: 'var(--purple)',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: 'var(--purple)' }}
          />
          Próximamente
        </div>
        <h3
          className="text-lg font-semibold text-white mb-1"
          style={{ fontFamily: 'var(--font-dm-serif)' }}
        >
          A la Carta
        </h3>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Muy pronto vas a poder sumar servicios adicionales según tus necesidades.
        </p>
      </div>
    </div>
  )
}
