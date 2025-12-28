import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { 
  Mail, MessageSquare, Plus, Search, MoreVertical, Send, Calendar, 
  Copy, Trash2, Edit, Eye, Loader2, Clock, Users, TrendingUp, 
  BarChart3, Pause, Play
} from 'lucide-react'
import { useEmailCampaigns, EmailCampaign } from '@/hooks/useEmailCampaigns'
import { useEmailTemplates } from '@/hooks/useEmailTemplates'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Brouillon', variant: 'secondary' },
  scheduled: { label: 'Programmé', variant: 'outline' },
  sending: { label: 'Envoi en cours', variant: 'default' },
  sent: { label: 'Envoyé', variant: 'default' },
  paused: { label: 'En pause', variant: 'secondary' },
  cancelled: { label: 'Annulé', variant: 'destructive' }
}

export function CampaignsManager() {
  const { campaigns, stats, campaignStats, isLoading, createCampaign, updateCampaign, deleteCampaign, duplicateCampaign, sendCampaign, scheduleCampaign, isSending } = useEmailCampaigns()
  const { templates } = useEmailTemplates()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null)
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    type: 'email' as 'email' | 'sms',
    template_id: '',
    html_content: ''
  })
  const [scheduleDate, setScheduleDate] = useState('')
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editCampaign, setEditCampaign] = useState<EmailCampaign | null>(null)

  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                         c.subject.toLowerCase().includes(search.toLowerCase())
    const matchesType = filterType === 'all' || c.type === filterType
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const handleCreate = () => {
    if (!newCampaign.name || !newCampaign.subject) return
    
    const template = templates.find(t => t.id === newCampaign.template_id)
    createCampaign({
      name: newCampaign.name,
      subject: newCampaign.subject,
      type: newCampaign.type,
      template_id: newCampaign.template_id || undefined,
      html_content: template?.html_content || newCampaign.html_content
    })
    setShowCreateDialog(false)
    setNewCampaign({ name: '', subject: '', type: 'email', template_id: '', html_content: '' })
  }

  const handleSchedule = () => {
    if (!selectedCampaign || !scheduleDate) return
    scheduleCampaign({ id: selectedCampaign.id, scheduledAt: new Date(scheduleDate) })
    setShowScheduleDialog(false)
    setSelectedCampaign(null)
    setScheduleDate('')
  }

  const handleEditOpen = (campaign: EmailCampaign) => {
    setEditCampaign(campaign)
    setShowEditDialog(true)
  }

  const handleEditSave = () => {
    if (!editCampaign) return
    updateCampaign({
      id: editCampaign.id,
      name: editCampaign.name,
      subject: editCampaign.subject,
      html_content: editCampaign.html_content
    })
    setShowEditDialog(false)
    setEditCampaign(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Campagnes</p>
                <p className="text-2xl font-bold">{stats.totalCampaigns}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Send className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Emails Envoyés</p>
                <p className="text-2xl font-bold">{stats.totalSent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taux d'ouverture</p>
                <p className="text-2xl font-bold">{stats.avgOpenRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taux de clic</p>
                <p className="text-2xl font-bold">{stats.avgClickRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="scheduled">Programmé</SelectItem>
              <SelectItem value="sent">Envoyé</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Campagne
        </Button>
      </div>

      {/* Campaigns List */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Toutes ({campaigns.length})</TabsTrigger>
          <TabsTrigger value="draft">Brouillons ({stats.draftCampaigns})</TabsTrigger>
          <TabsTrigger value="scheduled">Programmées ({stats.scheduledCampaigns})</TabsTrigger>
          <TabsTrigger value="sent">Envoyées ({stats.sentCampaigns})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="space-y-3">
            {filteredCampaigns.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Aucune campagne trouvée</p>
                <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une campagne
                </Button>
              </Card>
            ) : (
              filteredCampaigns.map((campaign) => (
                <CampaignRow 
                  key={campaign.id} 
                  campaign={campaign}
                  stats={campaignStats[campaign.id]}
                  onPreview={() => { setSelectedCampaign(campaign); setShowPreviewDialog(true) }}
                  onEdit={() => handleEditOpen(campaign)}
                  onDuplicate={() => duplicateCampaign(campaign.id)}
                  onDelete={() => deleteCampaign(campaign.id)}
                  onSend={() => sendCampaign(campaign.id)}
                  onSchedule={() => { setSelectedCampaign(campaign); setShowScheduleDialog(true) }}
                  onPause={() => updateCampaign({ id: campaign.id, status: 'paused' })}
                  isSending={isSending}
                />
              ))
            )}
          </div>
        </TabsContent>

        {['draft', 'scheduled', 'sent'].map(status => (
          <TabsContent key={status} value={status} className="mt-4">
            <div className="space-y-3">
              {filteredCampaigns.filter(c => c.status === status).map((campaign) => (
                <CampaignRow 
                  key={campaign.id} 
                  campaign={campaign}
                  stats={campaignStats[campaign.id]}
                  onPreview={() => { setSelectedCampaign(campaign); setShowPreviewDialog(true) }}
                  onEdit={() => handleEditOpen(campaign)}
                  onDuplicate={() => duplicateCampaign(campaign.id)}
                  onDelete={() => deleteCampaign(campaign.id)}
                  onSend={() => sendCampaign(campaign.id)}
                  onSchedule={() => { setSelectedCampaign(campaign); setShowScheduleDialog(true) }}
                  onPause={() => updateCampaign({ id: campaign.id, status: 'paused' })}
                  isSending={isSending}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouvelle Campagne</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom de la campagne</Label>
                <Input 
                  placeholder="Ex: Newsletter Janvier"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select 
                  value={newCampaign.type} 
                  onValueChange={(v: 'email' | 'sms') => setNewCampaign({ ...newCampaign, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Objet</Label>
              <Input 
                placeholder="Objet de l'email"
                value={newCampaign.subject}
                onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Template (optionnel)</Label>
              <Select 
                value={newCampaign.template_id} 
                onValueChange={(v) => setNewCampaign({ ...newCampaign, template_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun template</SelectItem>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!newCampaign.template_id && (
              <div className="space-y-2">
                <Label>Contenu</Label>
                <Textarea 
                  placeholder="Contenu de votre email..."
                  value={newCampaign.html_content}
                  onChange={(e) => setNewCampaign({ ...newCampaign, html_content: e.target.value })}
                  rows={6}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={!newCampaign.name || !newCampaign.subject}>
              Créer la campagne
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Prévisualisation: {selectedCampaign?.name}</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">Objet:</p>
              <p className="font-medium">{selectedCampaign?.subject}</p>
            </div>
            <div 
              className="bg-white rounded border p-4"
              dangerouslySetInnerHTML={{ __html: selectedCampaign?.html_content || '' }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Programmer l'envoi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date et heure d'envoi</Label>
              <Input 
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>Annuler</Button>
            <Button onClick={handleSchedule} disabled={!scheduleDate}>
              <Calendar className="h-4 w-4 mr-2" />
              Programmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier la Campagne</DialogTitle>
          </DialogHeader>
          {editCampaign && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nom de la campagne</Label>
                <Input 
                  value={editCampaign.name}
                  onChange={(e) => setEditCampaign({ ...editCampaign, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Objet</Label>
                <Input 
                  value={editCampaign.subject}
                  onChange={(e) => setEditCampaign({ ...editCampaign, subject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Contenu</Label>
                <Textarea 
                  value={editCampaign.html_content || ''}
                  onChange={(e) => setEditCampaign({ ...editCampaign, html_content: e.target.value })}
                  rows={8}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Annuler</Button>
            <Button onClick={handleEditSave}>
              <Edit className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface CampaignRowProps {
  campaign: EmailCampaign
  stats?: { total_sent: number; total_opened: number; total_clicked: number; open_rate: number; click_rate: number }
  onPreview: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  onSend: () => void
  onSchedule: () => void
  onPause: () => void
  isSending: boolean
}

function CampaignRow({ campaign, stats, onPreview, onEdit, onDuplicate, onDelete, onSend, onSchedule, onPause, isSending }: CampaignRowProps) {
  const statusInfo = STATUS_LABELS[campaign.status] || STATUS_LABELS.draft

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-lg ${campaign.type === 'email' ? 'bg-primary/10' : 'bg-green-500/10'}`}>
            {campaign.type === 'email' ? (
              <Mail className="h-5 w-5 text-primary" />
            ) : (
              <MessageSquare className="h-5 w-5 text-green-500" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{campaign.name}</h4>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{campaign.subject}</p>
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(campaign.created_at), 'dd MMM yyyy', { locale: fr })}
              </span>
              {campaign.scheduled_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Prévu: {format(new Date(campaign.scheduled_at), 'dd MMM à HH:mm', { locale: fr })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {stats && campaign.status === 'sent' && (
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <p className="text-muted-foreground">Envoyés</p>
                <p className="font-semibold">{stats.total_sent}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">Ouverts</p>
                <p className="font-semibold">{Number(stats.open_rate).toFixed(1)}%</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">Cliqués</p>
                <p className="font-semibold">{Number(stats.click_rate).toFixed(1)}%</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {campaign.status === 'draft' && (
              <>
                <Button size="sm" onClick={onSend} disabled={isSending}>
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                  Envoyer
                </Button>
                <Button size="sm" variant="outline" onClick={onSchedule}>
                  <Calendar className="h-4 w-4 mr-1" />
                  Programmer
                </Button>
              </>
            )}
            {campaign.status === 'scheduled' && (
              <Button size="sm" variant="outline" onClick={onPause}>
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
            )}
            {campaign.status === 'paused' && (
              <Button size="sm" onClick={onSend}>
                <Play className="h-4 w-4 mr-1" />
                Reprendre
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onPreview}>
                  <Eye className="h-4 w-4 mr-2" />
                  Prévisualiser
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Dupliquer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </Card>
  )
}
