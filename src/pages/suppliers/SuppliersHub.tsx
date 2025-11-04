import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import {
  Store,
  ShoppingCart,
  Settings,
  TrendingUp,
  Package,
  Globe,
  Zap,
  BarChart3,
  Users,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useRealSuppliers } from '@/hooks/useRealSuppliers'

export default function SuppliersHub() {
  const navigate = useNavigate()
  const { suppliers, stats, isLoading } = useRealSuppliers()

  const recentSuppliers = suppliers.slice(0, 5)

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
          <Store className="h-10 w-10 text-primary" />
          Hub Fournisseurs
        </h1>
        <p className="text-muted-foreground">
          Centre de gestion complet de vos fournisseurs et catalogues
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Fournisseurs</p>
                <p className="text-3xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.active} actifs
                </p>
              </div>
              <Store className="h-12 w-12 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Actifs</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((stats.active / stats.total) * 100)}% du total
                </p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Note Moyenne</p>
                <p className="text-3xl font-bold">{stats.averageRating.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  / 5 étoiles
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pays</p>
                <p className="text-3xl font-bold">
                  {Object.keys(stats.topCountries).length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  pays représentés
                </p>
              </div>
              <Globe className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Marketplace Card */}
        <Card 
          className="cursor-pointer hover:shadow-xl transition-all hover:scale-105 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20"
          onClick={() => navigate('/suppliers/marketplace')}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-primary/10">
                <ShoppingCart className="h-8 w-8 text-primary" />
              </div>
              <Badge variant="secondary">Catalogue</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h3 className="text-xl font-bold mb-2">Marketplace Fournisseurs</h3>
              <p className="text-sm text-muted-foreground">
                Découvrez et connectez-vous aux meilleurs fournisseurs mondiaux
              </p>
            </div>
            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>Milliers de fournisseurs</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span>Connexion en 1 clic</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span>International</span>
              </div>
            </div>
            <Button className="w-full mt-4">
              Explorer le Marketplace
            </Button>
          </CardContent>
        </Card>

        {/* Manage Card */}
        <Card 
          className="cursor-pointer hover:shadow-xl transition-all hover:scale-105 bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20"
          onClick={() => navigate('/suppliers/manage')}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-green-500/10">
                <Settings className="h-8 w-8 text-green-600" />
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Gestion
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h3 className="text-xl font-bold mb-2">Mes Fournisseurs</h3>
              <p className="text-sm text-muted-foreground">
                Gérez vos fournisseurs connectés et leurs catalogues
              </p>
            </div>
            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Store className="h-4 w-4 text-muted-foreground" />
                <span>{stats.total} fournisseurs</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span>{stats.active} actifs</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span>Suivi des performances</span>
              </div>
            </div>
            <Button className="w-full mt-4" variant="outline">
              Gérer mes fournisseurs
            </Button>
          </CardContent>
        </Card>

        {/* Admin Card */}
        <Card 
          className="cursor-pointer hover:shadow-xl transition-all hover:scale-105 bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20"
          onClick={() => navigate('/suppliers/admin')}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                Admin
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h3 className="text-xl font-bold mb-2">Administration</h3>
              <p className="text-sm text-muted-foreground">
                Configuration avancée et gestion des accès
              </p>
            </div>
            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>Configuration système</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Gestion des droits</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span>Monitoring avancé</span>
              </div>
            </div>
            <Button className="w-full mt-4" variant="outline">
              Accéder à l'admin
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Suppliers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Fournisseurs Récents
            </CardTitle>
            <Button variant="link" onClick={() => navigate('/suppliers/manage')}>
              Voir tout
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : recentSuppliers.length === 0 ? (
            <div className="text-center py-8">
              <Store className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">Aucun fournisseur pour le moment</p>
              <Button 
                className="mt-4" 
                onClick={() => navigate('/suppliers/marketplace')}
              >
                Ajouter un fournisseur
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSuppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => navigate(`/suppliers/manage?supplier=${supplier.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Store className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{supplier.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        <span>{supplier.country || 'Non spécifié'}</span>
                        {supplier.rating && (
                          <>
                            <span>•</span>
                            <span>⭐ {supplier.rating}/5</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                      {supplier.status === 'active' ? (
                        <><CheckCircle className="h-3 w-3 mr-1" /> Actif</>
                      ) : (
                        <><AlertCircle className="h-3 w-3 mr-1" /> Inactif</>
                      )}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
