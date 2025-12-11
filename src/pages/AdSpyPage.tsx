import { AdSpyModule } from '@/components/research/AdSpyModule'
import { useTranslation } from 'react-i18next'

export default function AdSpyPage() {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('adspy.title', 'AdSpy - Découverte Produits')}</h1>
        <p className="text-muted-foreground">
          {t('adspy.description', 'Découvrez les produits tendance et les publicités performantes')}
        </p>
      </div>
      <AdSpyModule />
    </div>
  )
}
