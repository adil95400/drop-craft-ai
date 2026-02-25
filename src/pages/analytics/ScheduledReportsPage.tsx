import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import {
  FileBarChart, Plus, Download, Clock, Calendar, Mail,
  FileSpreadsheet, FileText, Trash2, Play, Pause, MoreVertical
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

export default function ScheduledReportsPage() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newReport, setNewReport] = useState({
    report_name: '',
    report_type: 'sales',
    schedule: 'weekly',
  })

  const { data: reports = [] } = useQuery({
    queryKey: ['scheduled-reports'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.user) return []
      const { data } = await supabase
        .from('advanced_reports')
        .select('*')
        .eq('user_id', session.session.user.id)
        .order('created_at', { ascending: false })
      return data || []
    }
  })

  const createReport = useMutation({
    mutationFn: async () => {
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.user) throw new Error('Non authentifié')
      const { error } = await supabase.from('advanced_reports').insert({
        user_id: session.session.user.id,
        report_name: newReport.report_name,
        report_type: newReport.report_type,
        schedule: newReport.schedule,
        status: 'active',
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] })
      setIsCreateOpen(false)
      setNewReport({ report_name: '', report_type: 'sales', schedule: 'weekly' })
      toast.success('Rapport planifié créé')
    },
    onError: () => toast.error('Erreur lors de la création'),
  })

  const toggleReport = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === 'active' ? 'paused' : 'active'
      const { error } = await supabase.from('advanced_reports').update({ status: newStatus }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] }),
  })

  const deleteReport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('advanced_reports').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] })
      toast.success('Rapport supprimé')
    },
  })

  const reportTypeLabel: Record<string, string> = {
    sales: 'Ventes',
    inventory: 'Inventaire',
    customers: 'Clients',
    marketing: 'Marketing',
    financial: 'Financier',
  }

  const scheduleLabel: Record<string, string> = {
    daily: 'Quotidien',
    weekly: 'Hebdomadaire',
    monthly: 'Mensuel',
  }

  return (
    <>
      <Helmet>
        <title>Rapports Planifiés - Analytics</title>
        <meta name="description" content="Planifiez et exportez vos rapports d'analyse en PDF et Excel." />
      </Helmet>
      <ChannablePageWrapper
        title="Rapports Planifiés"
        subtitle="Analytics"
        description="Planifiez des rapports automatiques avec export PDF/Excel"
        heroImage="analytics"
        badge={{ label: 'Rapports', icon: FileBarChart }}
      >
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileBarChart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{reports.length}</p>
                <p className="text-xs text-muted-foreground">Rapports configurés</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Play className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {reports.filter((r: any) => r.status === 'active').length}
                </p>
                <p className="text-xs text-muted-foreground">Actifs</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {reports.filter((r: any) => r.last_generated_at).length}
                </p>
                <p className="text-xs text-muted-foreground">Générés récemment</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end mb-4">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Nouveau rapport
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un Rapport Planifié</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Nom du rapport</Label>
                  <Input
                    placeholder="ex: Rapport Ventes Hebdo"
                    value={newReport.report_name}
                    onChange={e => setNewReport({ ...newReport, report_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={newReport.report_type} onValueChange={v => setNewReport({ ...newReport, report_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Ventes</SelectItem>
                      <SelectItem value="inventory">Inventaire</SelectItem>
                      <SelectItem value="customers">Clients</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="financial">Financier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fréquence</Label>
                  <Select value={newReport.schedule} onValueChange={v => setNewReport({ ...newReport, schedule: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Quotidien</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => createReport.mutate()}
                  disabled={!newReport.report_name.trim() || createReport.isPending}
                  className="w-full"
                >
                  Créer le rapport
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Reports List */}
        <Card>
          <CardHeader>
            <CardTitle>Rapports configurés</CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileBarChart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Aucun rapport planifié</p>
                <p className="text-sm">Créez votre premier rapport automatique.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report: any) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileSpreadsheet className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{report.report_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {reportTypeLabel[report.report_type] || report.report_type}
                          </Badge>
                          <Badge variant="outline" className="text-xs gap-1">
                            <Clock className="h-3 w-3" />
                            {scheduleLabel[report.schedule] || report.schedule || 'Manuel'}
                          </Badge>
                          {report.last_generated_at && (
                            <span className="text-xs text-muted-foreground">
                              Dernier: {format(new Date(report.last_generated_at), 'dd MMM yyyy', { locale: fr })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          report.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-muted text-muted-foreground'
                        }
                      >
                        {report.status === 'active' ? 'Actif' : 'En pause'}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toggleReport.mutate({ id: report.id, status: report.status })}>
                            {report.status === 'active' ? <><Pause className="h-4 w-4 mr-2" /> Mettre en pause</> : <><Play className="h-4 w-4 mr-2" /> Activer</>}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info('Export PDF en cours...')}>
                            <FileText className="h-4 w-4 mr-2" /> Exporter PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info('Export Excel en cours...')}>
                            <FileSpreadsheet className="h-4 w-4 mr-2" /> Exporter Excel
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteReport.mutate(report.id)}>
                            <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </ChannablePageWrapper>
    </>
  )
}
