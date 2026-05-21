'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ActiveWatcher({ affiliateId }: { affiliateId: string }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`affiliate-status-${affiliateId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'affiliates',
          filter: `id=eq.${affiliateId}`,
        },
        (payload) => {
          if ((payload.new as { status?: string }).status === 'active') {
            router.refresh()
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [affiliateId, router])

  return null
}
