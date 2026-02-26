import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft,
  Upload,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  Download,
  Zap
} from 'lucide-react'
import { useSuppliersUnified } from '@/hooks/unified'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface ImportJob {
  id: string
  job_type: string
  status: string
  source_type?: string
  source_id?: string
  processed_products: number
  total_products: number
  created_at: string
  completed_at?: string
  error_log?: any
}

/**
 * SupplierImportPage
 * Page dédiée à l'import des produits depuis un fournisseur spécifique
 * Intégration avec le module Import unifié
 */
export default function SupplierImportPage() {
  const { supplierId } = useParams<{ supplierId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { suppliers } = useSuppliersUnified()
  
  const [importType, setImportType] = useState<'full' | 'category' | 'incremental'>('full')
  
  const supplier = suppliers.find(s => s.id === supplierId)

  // Récupérer les jobs d'import pour ce fournisseur
  const { data: importJobs = [], isLoading } = useQuery({
    queryKey: ['supplier-import-jobs', supplierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (error) throw error
      return (data || []).map(job => ({
        id: job.id,
        job_type: job.job_type,
        status: job.status,
        processed_products: job.successful_imports || 0,
        total_products: job.total_products || 0,
        created_at: job.created_at,
        completed_at: job.completed_at,
        error_log: job.error_log
      })) as ImportJob[]
    },
    enabled: !!supplierId
  })

  // Map import type to valid database job_type values
  const getJobType = (type: string): 'single' | 'bulk' | 'auto' => {
    switch (type) {
      case 'incremental':
        return 'auto'
      case 'category':
        return 'single'
      case 'full':
      default:
        return 'bulk'
    }
  }

  // Mutation pour démarrer un import
  const startImportMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Créer un job d'import with valid job_type
      const { data, error } = await supabase
        .from('import_jobs')
        .insert({
          user_id: user.id,
          job_type: getJobType(importType),
          status: 'queued',
          processed_products: 0,
          total_products: 0
        })
        .select()
        .single()

      if (error) throw error

      // Appeler l'edge function pour synchroniser les produits
      const { error: syncError } = await supabase.functions.invoke('supplier-sync-products', {
        body: {
          supplierId,
          importType,
          jobId: data.id
        }
      })

      if (syncError) throw syncError
      return data
    },
    onSuccess: () => {
      toast.success('Import démarré avec succès')
      queryClient.invalidateQueries({ queryKey: ['supplier-import-jobs'] })
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de l'import: ${error.message}`)
    }
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'running':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  if (!supplier) {
    return (
      <ChannablePageWrapper
        title="Fournisseur introuvable"
        description="Le fournisseur demandé n'existe pas"
        heroImage="suppliers"
        badge={{ label: 'Import', icon: Upload }}
      >
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Fournisseur introuvable</h2>
          <Button onClick={() => navigate('/suppliers')}>
            Retour aux fournisseurs
          </Button>
        </Card>
      </ChannablePageWrapper>
    )
  }

  return (
    <>
      <Helmet>
        <title>Import depuis {supplier.name} - ShopOpti</title>
        <meta name="description" content={`Importez des produits depuis ${supplier.name}`} />
      </Helmet>

      <ChannablePageWrapper
        title={`Import depuis ${supplier.name}`}
        description="Synchronisez les produits de ce fournisseur"
        heroImage="import"
        badge={{ label: 'Import', icon: Upload }}
        actions={
          <Link to="/import/history">
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Historique global
            </Button>
          </Link>
        }
      >

        {/* Configuration Import */}
        <Card>
          <CardHeader>
            <CardTitle>Nouvel Import</CardTitle>
            <CardDescription>
              Configurez et lancez un import de produits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type d'import</label>
                <Select value={importType} onValueChange={(v: any) => setImportType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Import complet
                      </div>
                    </SelectItem>
                    <SelectItem value="incremental">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Mise à jour incrémentale
                      </div>
                    </SelectItem>
                    <SelectItem value="category">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Par catégorie
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  className="w-full"
                  onClick={() => startImportMutation.mutate()}
                  disabled={startImportMutation.isPending}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {startImportMutation.isPending ? 'Démarrage...' : 'Démarrer l\'import'}
                </Button>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
              <p className="font-medium">À propos de l'import :</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <strong>Import complet</strong> : Synchronise tous les produits du fournisseur</li>
                <li>• <strong>Mise à jour incrémentale</strong> : Met à jour uniquement les produits modifiés</li>
                <li>• <strong>Par catégorie</strong> : Importe une catégorie spécifique</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Historique des imports */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des imports</CardTitle>
            <CardDescription>
              Jobs d'import récents pour ce fournisseur
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3 py-4">
                {[1,2,3].map(i => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : importJobs.length === 0 ? (
              <div className="text-center py-8">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">
                  Aucun import effectué pour ce fournisseur
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Progression</TableHead>
                    <TableHead>Produits</TableHead>
                    <TableHead>Durée</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        {new Date(job.created_at).toLocaleString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {job.job_type || 'full'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={`${getStatusColor(job.status)} flex items-center gap-1 w-fit`}
                        >
                          {getStatusIcon(job.status)}
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress value={Math.round((job.processed_products / Math.max(job.total_products, 1)) * 100)} className="h-2" />
                          <span className="text-xs text-muted-foreground">
                            {Math.round((job.processed_products / Math.max(job.total_products, 1)) * 100)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {job.processed_products} / {job.total_products}
                      </TableCell>
                      <TableCell>
                        {job.completed_at ? (
                          <span className="text-sm text-muted-foreground">
                            {Math.round(
                              (new Date(job.completed_at).getTime() - 
                               new Date(job.created_at).getTime()) / 1000
                            )}s
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/suppliers/${supplierId}/catalog`)}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Voir le catalogue</h3>
                  <p className="text-sm text-muted-foreground">
                    Produits importés
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/suppliers/${supplierId}/feeds`)}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Gérer les feeds</h3>
                  <p className="text-sm text-muted-foreground">
                    Publication multi-canaux
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/import/history')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Historique complet</h3>
                  <p className="text-sm text-muted-foreground">
                    Tous les imports
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ChannablePageWrapper>
    </>
  )
}
