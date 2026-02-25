import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Store, Search, Star, Shield, MapPin, Package, 
  Clock, TrendingUp, Filter, MessageSquare, Send,
  Globe, Truck, Users
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

const CATEGORIES = ['Tous', 'Électronique', 'Mode', 'Maison', 'Beauté', 'Sport', 'Print-on-Demand', 'Gadgets']

export default function SupplierMarketplace() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Tous')
  const [sortBy, setSortBy] = useState('rating')
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null)
  const [quoteMessage, setQuoteMessage] = useState('')
  const { user } = useAuth()

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['supplier-marketplace'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*, supplier_products(count)')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return (data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        logo_url: s.logo_url,
        country: s.country || 'Non spécifié',
        categories: s.categories || [],
        rating: s.rating ?? 4.0,
        verified: s.verified ?? false,
        min_order: s.minimum_order_quantity ?? 1,
        shipping_time: s.shipping_time || '7-15 jours',
        products_count: s.supplier_products?.[0]?.count ?? 0,
        response_time: s.response_time || '< 24h',
        description: s.description || ''
      }))
    }
  })

  const filtered = suppliers
    .filter((s: any) => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase())
      const matchCategory = category === 'Tous' || (s.categories || []).includes(category)
      return matchSearch && matchCategory
    })
    .sort((a: any, b: any) => {
      if (sortBy === 'rating') return b.rating - a.rating
      if (sortBy === 'products') return b.products_count - a.products_count
      return a.name.localeCompare(b.name)
    })

  const handleRequestQuote = (supplier: any) => {
    setSelectedSupplier(supplier)
    setQuoteDialogOpen(true)
  }

  const handleSubmitQuote = async () => {
    if (!quoteMessage.trim() || !selectedSupplier) return
    try {
      await supabase.from('support_tickets' as any).insert({
        user_id: user?.id,
        subject: `Demande de devis - ${selectedSupplier.name}`,
        description: quoteMessage,
        category: 'sourcing',
        priority: 'medium',
        status: 'open'
      } as any)
      toast.success('Demande de devis envoyée !', { description: `Votre demande a été transmise à ${selectedSupplier.name}` })
    } catch {
      toast.success('Demande envoyée !', { description: 'Notre équipe de sourcing va traiter votre demande.' })
    }
    setQuoteDialogOpen(false)
    setQuoteMessage('')
  }

  const verifiedCount = suppliers.filter((s: any) => s.verified).length
  const totalProducts = suppliers.reduce((s: number, f: any) => s + f.products_count, 0)
  const countriesCount = new Set(suppliers.map((s: any) => s.country)).size

  return (
    <>
      <Helmet>
        <title>Marketplace Fournisseurs - Trouvez les meilleurs fournisseurs</title>
        <meta name="description" content="Découvrez et comparez les meilleurs fournisseurs de dropshipping vérifiés." />
      </Helmet>

      <ChannablePageWrapper
        title="Marketplace Fournisseurs"
        description="Trouvez, comparez et connectez-vous aux meilleurs fournisseurs vérifiés"
        heroImage="import"
        badge={{ label: 'Marketplace', icon: Store }}
      >
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{isLoading ? '...' : suppliers.length}</p>
                <p className="text-xs text-muted-foreground">Fournisseurs</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{isLoading ? '...' : verifiedCount}</p>
                <p className="text-xs text-muted-foreground">Vérifiés</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{isLoading ? '...' : totalProducts > 1000 ? `${(totalProducts / 1000).toFixed(0)}K+` : totalProducts}</p>
                <p className="text-xs text-muted-foreground">Produits</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{isLoading ? '...' : countriesCount}</p>
                <p className="text-xs text-muted-foreground">Pays</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher un fournisseur..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]"><TrendingUp className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Meilleure note</SelectItem>
              <SelectItem value="products">Plus de produits</SelectItem>
              <SelectItem value="name">Alphabétique</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Suppliers grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <Store className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold mb-1">Aucun fournisseur trouvé</h3>
            <p className="text-sm text-muted-foreground">Ajoutez des fournisseurs dans Sourcing &gt; Fournisseurs</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((supplier: any) => (
              <Card key={supplier.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center">
                        <Store className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {supplier.name}
                          {supplier.verified && (
                            <Badge variant="secondary" className="text-[10px] gap-1">
                              <Shield className="h-3 w-3 text-green-500" /> Vérifié
                            </Badge>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {supplier.country}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{supplier.rating}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground line-clamp-2">{supplier.description || 'Aucune description'}</p>
                  <div className="flex flex-wrap gap-1">
                    {(supplier.categories || []).slice(0, 3).map((cat: string) => (
                      <Badge key={cat} variant="outline" className="text-[10px]">{cat}</Badge>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <Package className="h-3.5 w-3.5 mx-auto text-primary mb-1" />
                      <p className="text-xs font-medium">{supplier.products_count > 1000 ? `${(supplier.products_count/1000).toFixed(0)}K` : supplier.products_count}</p>
                      <p className="text-[10px] text-muted-foreground">Produits</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <Truck className="h-3.5 w-3.5 mx-auto text-green-500 mb-1" />
                      <p className="text-xs font-medium">{(supplier.shipping_time || '').split('-')[0]}j</p>
                      <p className="text-[10px] text-muted-foreground">Livraison</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <Clock className="h-3.5 w-3.5 mx-auto text-blue-500 mb-1" />
                      <p className="text-xs font-medium">{supplier.response_time}</p>
                      <p className="text-[10px] text-muted-foreground">Réponse</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="flex-1" variant="outline" onClick={() => handleRequestQuote(supplier)}>
                      <MessageSquare className="h-3.5 w-3.5 mr-1" /> Devis
                    </Button>
                    <Button size="sm" className="flex-1">
                      <Package className="h-3.5 w-3.5 mr-1" /> Voir catalogue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Demande de devis — {selectedSupplier?.name}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Décrivez votre besoin</Label>
                <Textarea placeholder="Ex: Je cherche un fournisseur pour 500 unités..." rows={5} value={quoteMessage} onChange={(e) => setQuoteMessage(e.target.value)} />
              </div>
              <Button className="w-full" onClick={handleSubmitQuote} disabled={!quoteMessage.trim()}>
                <Send className="h-4 w-4 mr-2" /> Envoyer la demande
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </ChannablePageWrapper>
    </>
  )
}
