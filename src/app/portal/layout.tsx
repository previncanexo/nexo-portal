import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Affiliate } from '@/lib/types'
import PortalHeader from './PortalHeader'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="portal-claro min-h-screen flex flex-col relative overflow-hidden">
      {/*
        Profundidad por orbes de marca difuminados, no por una foto de fondo.
        La foto obligaba a un overlay oscuro para que el texto se leyera, y ese
        overlay era el que peleaba con la identidad clara de la landing.

        `hidden sm:block`: los blur grandes son de lo mas caro que puede pedir un
        telefono. En mobile el degrade del fondo alcanza y sobra.
      */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div
          className="hidden sm:block absolute -top-40 -right-32 w-[520px] h-[520px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(134,96,239,0.28) 0%, transparent 70%)', filter: 'blur(60px)' }}
        />
        <div
          className="hidden sm:block absolute top-1/3 -left-40 w-[440px] h-[440px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(238,92,208,0.20) 0%, transparent 70%)', filter: 'blur(60px)' }}
        />
      </div>

      <PortalHeader affiliate={affiliate as Affiliate | null} />
      <main className="flex-1 relative z-10 pt-20 sm:pt-24 px-4 sm:px-6 pb-10 max-w-[680px] mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
