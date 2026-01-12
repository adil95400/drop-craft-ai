import React from 'react'
import { AIAutomationHub } from '@/domains/automation'
import { ChannablePageWrapper } from '@/components/channable'
import { Zap } from 'lucide-react'

const AIAutomationPage: React.FC = () => {
  return (
    <ChannablePageWrapper
      title="Automatisation IA"
      subtitle="Workflows intelligents"
      description="Créez des automatisations puissantes avec l'intelligence artificielle pour optimiser vos opérations."
      heroImage="automation"
      badge={{ label: 'Automatisation', icon: Zap }}
    >
      <AIAutomationHub />
    </ChannablePageWrapper>
  )
}

export default AIAutomationPage
