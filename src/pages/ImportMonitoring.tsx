import { ImportMonitoring } from '@/components/admin/ImportMonitoring'
import { AppLayout } from '@/layouts/AppLayout'

const ImportMonitoringPage = () => {
  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4">
        <ImportMonitoring />
      </div>
    </AppLayout>
  )
}

export default ImportMonitoringPage
