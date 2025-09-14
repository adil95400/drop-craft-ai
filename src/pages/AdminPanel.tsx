import { AdminRoute } from '@/components/admin/AdminRoute'
import AdminPanelContent from './AdminPanelContent'

const AdminPanel = () => {
  return (
    <AdminRoute>
      <AdminPanelContent />
    </AdminRoute>
  )
}

export default AdminPanel