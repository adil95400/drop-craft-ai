import { WarehouseManager } from '@/components/warehouse/WarehouseManager'
import { useTranslation } from 'react-i18next'

export default function WarehousePage() {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('warehouse.title', 'Gestion Multi-Entrepôts')}</h1>
        <p className="text-muted-foreground">
          {t('warehouse.description', 'Gérez vos entrepôts, fournisseurs 3PL et règles d\'allocation')}
        </p>
      </div>
      <WarehouseManager />
    </div>
  )
}
