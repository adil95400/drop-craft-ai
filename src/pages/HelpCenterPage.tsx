import React from 'react'
import { HelpCenter } from '@/components/support/HelpCenter'
import { ChannablePageWrapper } from '@/components/channable'
import { HelpCircle } from 'lucide-react'

export default function HelpCenterPage() {
  return (
    <ChannablePageWrapper
      title="Centre d'Aide"
      subtitle="Documentation"
      description="Trouvez des réponses à vos questions et apprenez à maîtriser toutes les fonctionnalités de la plateforme."
      heroImage="support"
      badge={{ label: 'Guides & Tutoriels', icon: HelpCircle }}
    >
      <HelpCenter />
    </ChannablePageWrapper>
  )
}
