import React from 'react'
import { AdvancedMonitoring } from '@/domains/observability'
import { ChannablePageWrapper } from '@/components/channable'
import { Activity } from 'lucide-react'

const AdvancedMonitoringPage: React.FC = () => {
  return (
    <ChannablePageWrapper
      title="Monitoring Avancé"
      subtitle="Observabilité"
      description="Surveillez vos performances en temps réel et détectez les anomalies avant qu'elles n'affectent votre activité."
      heroImage="analytics"
      badge={{ label: 'Temps réel', icon: Activity }}
    >
      <AdvancedMonitoring />
    </ChannablePageWrapper>
  )
}

export default AdvancedMonitoringPage
