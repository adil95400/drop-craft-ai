/**
 * APIDocsBrowser — Documentation API interactive avec endpoints, méthodes et réponses
 */
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion, AnimatePresence } from 'framer-motion'
import { Book, Search, ChevronRight, Lock, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  summary: string
  auth: boolean
  tags: string[]
  params?: Array<{ name: string; type: string; required: boolean; description: string }>
  responseExample: string
}

const ENDPOINTS: APIEndpoint[] = [
  { method: 'GET', path: '/v1/products', summary: 'Lister tous les produits avec pagination', auth: true, tags: ['Products'], params: [{ name: 'page', type: 'number', required: false, description: 'Numéro de page (défaut: 1)' }, { name: 'limit', type: 'number', required: false, description: 'Éléments par page (défaut: 50)' }, { name: 'status', type: 'string', required: false, description: 'Filtrer par statut: active, draft, archived' }], responseExample: '{ "items": [...], "total": 150, "page": 1 }' },
  { method: 'GET', path: '/v1/products/:id', summary: 'Récupérer un produit par ID', auth: true, tags: ['Products'], params: [{ name: 'id', type: 'uuid', required: true, description: 'ID du produit' }], responseExample: '{ "id": "...", "name": "...", "price": 29.99 }' },
  { method: 'POST', path: '/v1/products', summary: 'Créer un nouveau produit', auth: true, tags: ['Products'], params: [{ name: 'name', type: 'string', required: true, description: 'Nom du produit' }, { name: 'price', type: 'number', required: true, description: 'Prix en euros' }, { name: 'sku', type: 'string', required: false, description: 'Référence SKU' }], responseExample: '{ "id": "...", "created_at": "..." }' },
  { method: 'PUT', path: '/v1/products/:id', summary: 'Mettre à jour un produit', auth: true, tags: ['Products'], responseExample: '{ "id": "...", "updated_at": "..." }' },
  { method: 'DELETE', path: '/v1/products/:id', summary: 'Supprimer un produit', auth: true, tags: ['Products'], responseExample: '{ "success": true }' },
  { method: 'GET', path: '/v1/orders', summary: 'Lister les commandes', auth: true, tags: ['Orders'], params: [{ name: 'status', type: 'string', required: false, description: 'pending, processing, delivered, cancelled' }], responseExample: '{ "items": [...], "total": 42 }' },
  { method: 'POST', path: '/v1/orders', summary: 'Créer une commande', auth: true, tags: ['Orders'], responseExample: '{ "id": "...", "order_number": "ORD-001" }' },
  { method: 'GET', path: '/v1/customers', summary: 'Lister les clients', auth: true, tags: ['Customers'], responseExample: '{ "items": [...], "total": 89 }' },
  { method: 'GET', path: '/v1/dashboard/stats', summary: 'KPIs du dashboard', auth: true, tags: ['Dashboard'], responseExample: '{ "revenue": 12500, "orders": 42, "growth": 12.5 }' },
  { method: 'POST', path: '/v1/imports', summary: 'Lancer un import CSV/URL', auth: true, tags: ['Imports'], params: [{ name: 'source_type', type: 'string', required: true, description: 'csv, url, api' }, { name: 'source_url', type: 'string', required: false, description: 'URL source' }], responseExample: '{ "job_id": "...", "status": "queued" }' },
  { method: 'GET', path: '/v1/seo/audit/:productId', summary: 'Lancer un audit SEO produit', auth: true, tags: ['SEO'], responseExample: '{ "score": 72, "issues": [...] }' },
  { method: 'POST', path: '/v1/webhooks', summary: 'Enregistrer un webhook', auth: true, tags: ['Webhooks'], params: [{ name: 'url', type: 'string', required: true, description: 'URL de callback' }, { name: 'events', type: 'string[]', required: true, description: 'Events à écouter' }], responseExample: '{ "id": "...", "secret": "whsec_..." }' },
]

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  POST: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  PATCH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

export function APIDocsBrowser() {
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const tags = [...new Set(ENDPOINTS.flatMap(e => e.tags))]
  const filtered = ENDPOINTS.filter(e => {
    const matchSearch = !search || e.path.includes(search) || e.summary.toLowerCase().includes(search.toLowerCase())
    const matchTag = !selectedTag || e.tags.includes(selectedTag)
    return matchSearch && matchTag
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Book className="h-5 w-5 text-primary" />
          API Reference
          <Badge variant="outline" className="ml-auto text-xs">{ENDPOINTS.length} endpoints</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Search + Tags */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Rechercher un endpoint..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            <Badge
              variant={selectedTag === null ? 'default' : 'outline'}
              className="cursor-pointer text-xs"
              onClick={() => setSelectedTag(null)}
            >
              Tous
            </Badge>
            {tags.map(tag => (
              <Badge
                key={tag}
                variant={selectedTag === tag ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Endpoints list */}
        <ScrollArea className="h-[450px] pr-2">
          <div className="space-y-1.5">
            {filtered.map((ep, i) => {
              const key = `${ep.method}-${ep.path}`
              const isOpen = expanded === key
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <div
                    className={cn(
                      'flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors',
                      isOpen ? 'bg-muted/50 border-primary/30' : 'hover:bg-muted/30'
                    )}
                    onClick={() => setExpanded(isOpen ? null : key)}
                  >
                    <Badge className={cn('text-[10px] font-mono px-1.5 w-14 justify-center', METHOD_COLORS[ep.method])}>
                      {ep.method}
                    </Badge>
                    <code className="text-xs font-mono flex-1 truncate">{ep.path}</code>
                    {ep.auth && <Lock className="h-3 w-3 text-muted-foreground" />}
                    <ChevronRight className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', isOpen && 'rotate-90')} />
                  </div>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 ml-4 border-l-2 border-primary/20 space-y-3">
                          <p className="text-sm text-muted-foreground">{ep.summary}</p>

                          {ep.params && ep.params.length > 0 && (
                            <div>
                              <h5 className="text-xs font-semibold mb-1.5">Paramètres</h5>
                              <div className="space-y-1">
                                {ep.params.map(p => (
                                  <div key={p.name} className="flex items-center gap-2 text-xs">
                                    <code className="bg-muted px-1.5 py-0.5 rounded font-mono">{p.name}</code>
                                    <Badge variant="outline" className="text-[9px]">{p.type}</Badge>
                                    {p.required && <Badge variant="destructive" className="text-[9px] h-4">requis</Badge>}
                                    <span className="text-muted-foreground">{p.description}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <h5 className="text-xs font-semibold mb-1.5">Réponse</h5>
                            <pre className="bg-muted p-2 rounded text-[11px] font-mono overflow-x-auto">
                              {ep.responseExample}
                            </pre>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
