import React from 'react'
import { SupportCenter } from '@/components/support/SupportCenter'
import { ChannablePageWrapper } from '@/components/channable'
import { LifeBuoy } from 'lucide-react'

export default function SupportPage() {
  return (
    <ChannablePageWrapper
      title="Centre de Support"
      subtitle="Assistance"
      description="Obtenez de l'aide rapidement avec notre centre de support dédié et notre équipe d'experts."
      heroImage="support"
      badge={{ label: 'Support 24/7', icon: LifeBuoy }}
    >
      <SupportCenter />
    </ChannablePageWrapper>
  )
}
