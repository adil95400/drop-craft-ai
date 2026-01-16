/**
 * Page Appels CRM - 100% connectée aux données réelles
 */
import { useState } from 'react'
import { Phone, PhoneCall, PhoneMissed, Clock, Search, Plus, Filter, Loader2, RefreshCw, CheckCircle2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useCRMCalls } from '@/hooks/useCRMCalls'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function CRMCalls() {
  const { calls, stats, isLoading, logCall, scheduleCall, deleteCall, updateCall, refetch } = useCRMCalls()
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newCall, setNewCall] = useState({
    customerName: '',
    customerPhone: '',
    type: 'outgoing' as 'incoming' | 'outgoing' | 'missed',
    status: 'scheduled' as 'completed' | 'scheduled',
    duration: 0,
    notes: '',
    follow_up: ''
  })

  const filteredCalls = calls.filter(call => {
    const matchesSearch = call.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         call.customer_phone.includes(searchTerm)
    const matchesType = typeFilter === 'all' || call.type === typeFilter
    const matchesStatus = statusFilter === 'all' || call.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return '-'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'incoming': return <Phone className="h-4 w-4 text-green-500" />
      case 'outgoing': return <PhoneCall className="h-4 w-4 text-blue-500" />
      case 'missed': return <PhoneMissed className="h-4 w-4 text-red-500" />
      default: return <Phone className="h-4 w-4" />
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed': return { label: 'Terminé', color: 'bg-green-100 text-green-800' }
      case 'missed': return { label: 'Manqué', color: 'bg-red-100 text-red-800' }
      case 'busy': return { label: 'Occupé', color: 'bg-orange-100 text-orange-800' }
      case 'scheduled': return { label: 'Programmé', color: 'bg-blue-100 text-blue-800' }
      case 'in_progress': return { label: 'En cours', color: 'bg-purple-100 text-purple-800 animate-pulse' }
      default: return { label: status, color: 'bg-gray-100 text-gray-800' }
    }
  }

  const handleAddCall = async () => {
    if (!newCall.customerName.trim() || !newCall.customerPhone.trim()) return

    setIsSubmitting(true)
    try {
      await logCall({
        customer_name: newCall.customerName,
        customer_phone: newCall.customerPhone,
        type: newCall.type,
        status: newCall.status,
        duration: newCall.duration * 60, // Convert to seconds
        notes: newCall.notes,
        follow_up: newCall.follow_up
      })
      setIsAddDialogOpen(false)
      setNewCall({
        customerName: '',
        customerPhone: '',
        type: 'outgoing',
        status: 'scheduled',
        duration: 0,
        notes: '',
        follow_up: ''
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMarkCompleted = async (id: string) => {
    await updateCall(id, { status: 'completed' })
  }

  const handleDeleteCall = async (id: string) => {
    if (confirm('Supprimer cet appel ?')) {
      await deleteCall(id)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    )
  }

  return (
    <ChannablePageWrapper
      title="Appels & Contacts"
      subtitle="Gestion CRM"
      description="Gérez vos appels et contacts clients"
      heroImage="support"
      badge={{ label: 'CRM', icon: Phone }}
      actions={
        <>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-primary">
                <Plus className="h-4 w-4" />
                Programmer un Appel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Programmer un appel</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nom du client *</Label>
                  <Input 
                    placeholder="Nom du client"
                    value={newCall.customerName}
                    onChange={(e) => setNewCall({...newCall, customerName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone *</Label>
                  <Input 
                    placeholder="+33 1 23 45 67 89"
                    value={newCall.customerPhone}
                    onChange={(e) => setNewCall({...newCall, customerPhone: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={newCall.type} onValueChange={(v) => setNewCall({...newCall, type: v as any})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="outgoing">Sortant</SelectItem>
                        <SelectItem value="incoming">Entrant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Statut</Label>
                    <Select value={newCall.status} onValueChange={(v) => setNewCall({...newCall, status: v as any})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Programmé</SelectItem>
                        <SelectItem value="completed">Terminé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {newCall.status === 'completed' && (
                  <div className="space-y-2">
                    <Label>Durée (minutes)</Label>
                    <Input 
                      type="number"
                      placeholder="5"
                      value={newCall.duration || ''}
                      onChange={(e) => setNewCall({...newCall, duration: parseInt(e.target.value) || 0})}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea 
                    placeholder="Objectif de l'appel, informations importantes..."
                    rows={3}
                    value={newCall.notes}
                    onChange={(e) => setNewCall({...newCall, notes: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Suivi</Label>
                  <Input 
                    placeholder="Action de suivi..."
                    value={newCall.follow_up}
                    onChange={(e) => setNewCall({...newCall, follow_up: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleAddCall} 
                  disabled={isSubmitting || !newCall.customerName.trim() || !newCall.customerPhone.trim()}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Enregistrer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4 text-blue-500" />
              Total Appels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCalls}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-green-500" />
              Terminés Aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedToday}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PhoneMissed className="h-4 w-4 text-red-500" />
              Appels Manqués
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.missedCalls}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              Programmés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduledCalls}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              Durée Moyenne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(Math.round(stats.avgDuration))}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type d'appel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="incoming">Entrants</SelectItem>
                <SelectItem value="outgoing">Sortants</SelectItem>
                <SelectItem value="missed">Manqués</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="completed">Terminés</SelectItem>
                <SelectItem value="missed">Manqués</SelectItem>
                <SelectItem value="scheduled">Programmés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Calls List */}
      <div className="space-y-4">
        {filteredCalls.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Phone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun appel trouvé</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Aucun appel ne correspond à vos critères'
                  : 'Commencez à enregistrer vos appels clients'
                }
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Programmer un appel
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredCalls.map((call, index) => {
            const statusConfig = getStatusConfig(call.status)
            return (
              <motion.div
                key={call.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-muted">
                            {getTypeIcon(call.type)}
                          </div>
                          <div>
                            <h3 className="font-semibold">{call.customer_name}</h3>
                            <p className="text-sm text-muted-foreground">{call.customer_phone}</p>
                          </div>
                          <Badge className={statusConfig.color}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <span>
                            {new Date(call.date).toLocaleDateString('fr-FR')} à {new Date(call.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {call.duration > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(call.duration)}
                            </span>
                          )}
                        </div>
                        {call.notes && (
                          <div className="text-sm bg-muted/50 p-3 rounded-md mb-2">
                            <strong>Notes:</strong> {call.notes}
                          </div>
                        )}
                        {call.follow_up && (
                          <div className="text-sm bg-orange-50 dark:bg-orange-900/20 p-3 rounded-md border border-orange-200 dark:border-orange-800">
                            <strong>Suivi:</strong> {call.follow_up}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {call.status === 'scheduled' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleMarkCompleted(call.id)}
                            title="Marquer comme terminé"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Phone className="h-4 w-4 mr-2" />
                          Rappeler
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleDeleteCall(call.id)}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })
        )}
      </div>
    </ChannablePageWrapper>
  )
}
