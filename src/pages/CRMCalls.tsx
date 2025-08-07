import { useState } from 'react'
import { Phone, PhoneCall, PhoneMissed, Clock, User, Search, Plus, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

interface CallRecord {
  id: string
  customerName: string
  customerPhone: string
  type: 'incoming' | 'outgoing' | 'missed'
  status: 'completed' | 'missed' | 'busy' | 'scheduled'
  duration: number // in seconds
  date: string
  notes?: string
  followUp?: string
}

const mockCalls: CallRecord[] = [
  {
    id: '1',
    customerName: 'Marie Dubois',
    customerPhone: '+33 1 23 45 67 89',
    type: 'outgoing',
    status: 'completed',
    duration: 480,
    date: '2024-01-15T14:30:00',
    notes: 'Intéressée par la nouvelle collection, rappel prévu la semaine prochaine'
  },
  {
    id: '2',
    customerName: 'Pierre Martin',
    customerPhone: '+33 6 12 34 56 78',
    type: 'incoming',
    status: 'completed',
    duration: 245,
    date: '2024-01-15T11:15:00',
    notes: 'Question sur le SAV, problème résolu'
  },
  {
    id: '3',
    customerName: 'Sophie Bernard',
    customerPhone: '+33 7 98 76 54 32',
    type: 'missed',
    status: 'missed',
    duration: 0,
    date: '2024-01-15T09:45:00',
    followUp: 'À rappeler avant 17h'
  },
  {
    id: '4',
    customerName: 'Client Prospect',
    customerPhone: '+33 1 11 22 33 44',
    type: 'outgoing',
    status: 'scheduled',
    duration: 0,
    date: '2024-01-16T10:00:00',
    notes: 'RDV commercial - présentation produits'
  }
]

export default function CRMCalls() {
  const [calls, setCalls] = useState(mockCalls)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [newCall, setNewCall] = useState({
    customerName: '',
    customerPhone: '',
    scheduledDate: '',
    notes: ''
  })

  const filteredCalls = calls.filter(call => {
    const matchesSearch = call.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         call.customerPhone.includes(searchTerm)
    const matchesType = typeFilter === 'all' || call.type === typeFilter
    const matchesStatus = statusFilter === 'all' || call.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const formatDuration = (seconds: number) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'missed': return 'bg-red-100 text-red-800'
      case 'busy': return 'bg-orange-100 text-orange-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const stats = {
    totalCalls: calls.length,
    completedToday: calls.filter(c => c.status === 'completed' && new Date(c.date).toDateString() === new Date().toDateString()).length,
    missedCalls: calls.filter(c => c.status === 'missed').length,
    scheduledCalls: calls.filter(c => c.status === 'scheduled').length,
    avgDuration: calls.filter(c => c.duration > 0).reduce((acc, c) => acc + c.duration, 0) / calls.filter(c => c.duration > 0).length || 0
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Appels & Contacts</h1>
          <p className="text-muted-foreground">Gérez vos appels et contacts clients</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Programmer un Appel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Programmer un appel</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nom du client</label>
                <Input 
                  placeholder="Nom du client"
                  value={newCall.customerName}
                  onChange={(e) => setNewCall({...newCall, customerName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Téléphone</label>
                <Input 
                  placeholder="+33 1 23 45 67 89"
                  value={newCall.customerPhone}
                  onChange={(e) => setNewCall({...newCall, customerPhone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date et heure</label>
                <Input 
                  type="datetime-local"
                  value={newCall.scheduledDate}
                  onChange={(e) => setNewCall({...newCall, scheduledDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <Textarea 
                  placeholder="Objectif de l'appel, informations importantes..."
                  rows={3}
                  value={newCall.notes}
                  onChange={(e) => setNewCall({...newCall, notes: e.target.value})}
                />
              </div>
              <Button className="w-full">Programmer l'appel</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <Clock className="h-4 w-4 text-orange-500" />
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
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
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

      {/* Calls List */}
      <div className="space-y-4">
        {filteredCalls.map((call) => (
          <Card key={call.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getTypeIcon(call.type)}
                    <h3 className="font-semibold">{call.customerName}</h3>
                    <Badge className={getStatusColor(call.status)}>
                      {call.status === 'completed' && 'Terminé'}
                      {call.status === 'missed' && 'Manqué'}
                      {call.status === 'scheduled' && 'Programmé'}
                      {call.status === 'busy' && 'Occupé'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <span>{call.customerPhone}</span>
                    <span>{new Date(call.date).toLocaleDateString('fr-FR')} à {new Date(call.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
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
                  {call.followUp && (
                    <div className="text-sm bg-orange-50 p-3 rounded-md border border-orange-200">
                      <strong>Suivi:</strong> {call.followUp}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Phone className="h-4 w-4 mr-2" />
                    Rappeler
                  </Button>
                  <Button size="sm" variant="outline">Modifier</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCalls.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Phone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun appel trouvé</h3>
            <p className="text-muted-foreground mb-4">Commencez à enregistrer vos appels clients</p>
            <Button>Programmer un appel</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}