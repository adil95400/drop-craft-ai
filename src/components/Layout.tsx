import { Outlet, Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { 
  ShoppingCart, 
  Settings,
  BarChart3,
  Home
} from 'lucide-react'

export function Layout() {
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard/stores', icon: Home },
    { name: 'Intégrations', href: '/dashboard/stores/integrations', icon: BarChart3 },
    { name: 'Connecter', href: '/dashboard/stores/connect', icon: ShoppingCart },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/dashboard/stores" className="flex items-center space-x-2">
                <ShoppingCart className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">StoreSync</span>
              </Link>
            </div>
            
            <nav className="flex space-x-4">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                const Icon = item.icon
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}