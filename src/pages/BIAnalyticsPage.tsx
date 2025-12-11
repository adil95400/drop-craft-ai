import { BIDashboard } from '@/components/analytics/BIDashboard'
import { useTranslation } from 'react-i18next'

export default function BIAnalyticsPage() {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('bi.title', 'Business Intelligence')}</h1>
        <p className="text-muted-foreground">
          {t('bi.description', 'Analysez vos données avec des KPIs avancés et des graphiques interactifs')}
        </p>
      </div>
      <BIDashboard />
    </div>
  )
}
