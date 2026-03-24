import { useEffect, useState, useMemo, useCallback } from 'react'
import { productionLogger } from '@/utils/productionLogger'
import { useAdminRole } from '@/hooks/useAdminRole'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Loader2, Shield, User, Crown, CreditCard, Settings, RefreshCw,
  Search, Download, Filter, ChevronUp, ChevronDown, ChevronsUpDown,
  Mail, MoreHorizontal, UserX, Ban, Eye, Activity,
  ChevronLeft, ChevronRight, CheckSquare, X, ArrowUpDown
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

type PlanType = 'standard' | 'pro' | 'ultra_pro'
type SortField = 'full_name' | 'role' | 'plan' | 'created_at' | 'last_login_at' | 'login_count'
type SortDir = 'asc' | 'desc'
type FilterRole = 'all' | 'admin' | 'user'
type FilterPlan = 'all' | 'standard' | 'pro' | 'ultra_pro'
type FilterActivity = 'all' | 'active' | 'inactive' | 'never'

interface EnhancedUser {
  id: string
  email: string
  full_name: string | null
  role: string
  is_admin: boolean
  plan: PlanType | null
  subscription_status: string | null
  last_login_at: string | null
  login_count: number
  created_at: string
  updated_at?: string
}

const ITEMS_PER_PAGE = 10

export const EnhancedUserManagement = () => {
  const { users, loading, fetchAllUsers, changeUserRole } = useAdminRole()
  const { toast } = useToast()

  // State
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user')
  const [selectedUserForPlan, setSelectedUserForPlan] = useState<EnhancedUser | null>(null)
  const [newPlan, setNewPlan] = useState<PlanType>('standard')
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false)
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false)

  // Search, Filter, Sort, Pagination
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState<FilterRole>('all')
  const [filterPlan, setFilterPlan] = useState<FilterPlan>('all')
  const [filterActivity, setFilterActivity] = useState<FilterActivity>('all')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // User detail drawer
  const [detailUser, setDetailUser] = useState<EnhancedUser | null>(null)

  useEffect(() => { fetchAllUsers() }, [])

  // Reset page on filter/search change
  useEffect(() => { setCurrentPage(1) }, [searchQuery, filterRole, filterPlan, filterActivity])

  const handleRoleChange = async (userId: string, role: 'admin' | 'user') => {
    await changeUserRole(userId, role)
    setSelectedUser(null)
  }

  const handlePlanChange = async (userId: string, plan: PlanType) => {
    setIsUpdatingPlan(true)
    try {
      const { error } = await supabase.rpc('admin_update_user_plan', {
        target_user_id: userId,
        new_plan: plan
      })
      if (error) throw error
      toast({ title: "Plan mis à jour", description: `Plan changé vers ${plan.toUpperCase()}` })
      await fetchAllUsers()
      setIsPlanDialogOpen(false)
      setSelectedUserForPlan(null)
    } catch (error: any) {
      productionLogger.error('Failed to update user plan', error as Error, 'EnhancedUserManagement')
      toast({ title: "Erreur", description: error.message || "Impossible de mettre à jour le plan", variant: "destructive" })
    } finally {
      setIsUpdatingPlan(false)
    }
  }

  const getDaysSinceLogin = (lastLogin: string | null) => {
    if (!lastLogin) return Infinity
    return Math.floor((Date.now() - new Date(lastLogin).getTime()) / 86400000)
  }

  // Filtered & sorted users
  const processedUsers = useMemo(() => {
    let result = [...users] as EnhancedUser[]

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(u =>
        (u.full_name?.toLowerCase().includes(q)) ||
        (u.email?.toLowerCase().includes(q)) ||
        u.id.toLowerCase().includes(q)
      )
    }

    // Filters
    if (filterRole !== 'all') {
      result = result.filter(u => filterRole === 'admin' ? (u.role === 'admin' || u.is_admin) : (u.role !== 'admin' && !u.is_admin))
    }
    if (filterPlan !== 'all') {
      result = result.filter(u => (u.plan || 'standard') === filterPlan)
    }
    if (filterActivity !== 'all') {
      result = result.filter(u => {
        const days = getDaysSinceLogin(u.last_login_at)
        if (filterActivity === 'active') return days <= 7
        if (filterActivity === 'inactive') return days > 7 && days !== Infinity
        return days === Infinity
      })
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'full_name': cmp = (a.full_name || '').localeCompare(b.full_name || ''); break
        case 'role': cmp = (a.role || '').localeCompare(b.role || ''); break
        case 'plan': cmp = (a.plan || 'standard').localeCompare(b.plan || 'standard'); break
        case 'created_at': cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); break
        case 'last_login_at': cmp = (a.last_login_at ? new Date(a.last_login_at).getTime() : 0) - (b.last_login_at ? new Date(b.last_login_at).getTime() : 0); break
        case 'login_count': cmp = (a.login_count || 0) - (b.login_count || 0); break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [users, searchQuery, filterRole, filterPlan, filterActivity, sortField, sortDir])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(processedUsers.length / ITEMS_PER_PAGE))
  const paginatedUsers = processedUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  // Bulk
  const allOnPageSelected = paginatedUsers.length > 0 && paginatedUsers.every(u => selectedIds.has(u.id))
  const toggleAll = () => {
    if (allOnPageSelected) {
      setSelectedIds(prev => { const n = new Set(prev); paginatedUsers.forEach(u => n.delete(u.id)); return n })
    } else {
      setSelectedIds(prev => { const n = new Set(prev); paginatedUsers.forEach(u => n.add(u.id)); return n })
    }
  }
  const toggleOne = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const handleBulkRoleChange = async (role: 'admin' | 'user') => {
    for (const id of selectedIds) {
      await changeUserRole(id, role)
    }
    setSelectedIds(new Set())
    toast({ title: "Succès", description: `${selectedIds.size} utilisateur(s) mis à jour` })
  }

  // Export CSV
  const handleExport = () => {
    const headers = ['Nom', 'Email', 'Rôle', 'Plan', 'Statut', 'Dernière connexion', 'Connexions', 'Inscription']
    const rows = processedUsers.map(u => [
      u.full_name || 'N/A',
      u.email || 'N/A',
      u.role === 'admin' || u.is_admin ? 'Admin' : 'User',
      (u.plan || 'standard').toUpperCase(),
      u.subscription_status || 'N/A',
      u.last_login_at ? new Date(u.last_login_at).toLocaleString('fr-FR') : 'Jamais',
      String(u.login_count || 0),
      new Date(u.created_at).toLocaleString('fr-FR')
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `utilisateurs_${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
    toast({ title: "Export terminé", description: `${processedUsers.length} utilisateur(s) exportés` })
  }

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field); setSortDir('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="h-3 w-3 ml-1 opacity-40" />
    return sortDir === 'asc' ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais'
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const getRoleBadge = (role: string, isAdmin: boolean) => {
    if (role === 'admin' || isAdmin) return (
      <Badge variant="destructive" className="flex items-center gap-1 w-fit"><Crown className="h-3 w-3" />Administrateur</Badge>
    )
    return (
      <Badge variant="secondary" className="flex items-center gap-1 w-fit"><User className="h-3 w-3" />Utilisateur</Badge>
    )
  }

  const getPlanBadge = (plan: PlanType | null, subscriptionStatus?: string | null) => {
    const planConfig = {
      standard: { label: 'STANDARD', className: 'bg-muted text-muted-foreground' },
      pro: { label: 'PRO', className: 'bg-primary/10 text-primary' },
      ultra_pro: { label: 'ULTRA PRO', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' }
    }
    const config = planConfig[plan as keyof typeof planConfig] || planConfig.standard
    const isActive = subscriptionStatus === 'active'
    return (
      <div className="flex items-center gap-1.5">
        <Badge className={config.className}>{config.label}</Badge>
        {plan !== 'standard' && (
          <Badge variant={isActive ? 'default' : 'destructive'} className="text-[10px] h-5">{isActive ? 'ACTIF' : 'INACTIF'}</Badge>
        )}
      </div>
    )
  }

  const getActivityStatus = (lastLogin: string | null, loginCount: number) => {
    if (!lastLogin) return { status: 'Jamais connecté', color: 'text-muted-foreground', dot: 'bg-muted-foreground' }
    const days = getDaysSinceLogin(lastLogin)
    if (days === 0) return { status: 'Actif aujourd\'hui', color: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' }
    if (days <= 7) return { status: `Actif il y a ${days}j`, color: 'text-primary', dot: 'bg-primary' }
    if (days <= 30) return { status: `Inactif ${days}j`, color: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' }
    return { status: `Inactif +${days}j`, color: 'text-destructive', dot: 'bg-destructive' }
  }

  const activeFiltersCount = [filterRole !== 'all', filterPlan !== 'all', filterActivity !== 'all'].filter(Boolean).length

  if (loading && users.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Chargement des utilisateurs...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Total', value: users.length, icon: User, accent: 'text-foreground' },
          { label: 'Administrateurs', value: users.filter(u => u.role === 'admin' || u.is_admin).length, icon: Crown, accent: 'text-destructive' },
          { label: 'Premium', value: users.filter(u => u.plan === 'pro' || u.plan === 'ultra_pro').length, icon: CreditCard, accent: 'text-primary' },
          { label: 'Actifs (7j)', value: users.filter(u => u.last_login_at && getDaysSinceLogin(u.last_login_at) <= 7).length, icon: Activity, accent: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Jamais connectés', value: users.filter(u => !u.last_login_at).length, icon: UserX, accent: 'text-muted-foreground' },
        ].map(s => (
          <Card key={s.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center bg-muted/50 ${s.accent}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <div className={`text-xl font-bold ${s.accent}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <Button variant={showFilters ? 'secondary' : 'outline'} size="sm" onClick={() => setShowFilters(!showFilters)} className="relative h-9">
                <Filter className="h-4 w-4 mr-1" />
                Filtres
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 bg-primary text-primary-foreground rounded-full text-[10px] font-bold flex items-center justify-center px-1">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="sm" className="h-9">
                      <CheckSquare className="h-4 w-4 mr-1" />
                      {selectedIds.size} sélectionné(s)
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleBulkRoleChange('admin')}>
                      <Crown className="h-4 w-4 mr-2" />Passer Admin
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkRoleChange('user')}>
                      <User className="h-4 w-4 mr-2" />Passer Utilisateur
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSelectedIds(new Set())} className="text-muted-foreground">
                      <X className="h-4 w-4 mr-2" />Tout désélectionner
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Button variant="outline" size="sm" onClick={handleExport} className="h-9">
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>

              <Button onClick={fetchAllUsers} disabled={loading} size="sm" className="h-9">
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>

          {/* Filters panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <Separator className="my-3" />
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Rôle</label>
                    <Select value={filterRole} onValueChange={v => setFilterRole(v as FilterRole)}>
                      <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="admin">Admins</SelectItem>
                        <SelectItem value="user">Utilisateurs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Plan</label>
                    <Select value={filterPlan} onValueChange={v => setFilterPlan(v as FilterPlan)}>
                      <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="ultra_pro">Ultra Pro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Activité</label>
                    <Select value={filterActivity} onValueChange={v => setFilterActivity(v as FilterActivity)}>
                      <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="active">Actifs (7j)</SelectItem>
                        <SelectItem value="inactive">Inactifs</SelectItem>
                        <SelectItem value="never">Jamais connectés</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" className="h-8 text-xs mt-4" onClick={() => { setFilterRole('all'); setFilterPlan('all'); setFilterActivity('all') }}>
                      <X className="h-3 w-3 mr-1" />Réinitialiser
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>{processedUsers.length} utilisateur(s) trouvé(s){searchQuery && ` pour "${searchQuery}"`}</span>
        <span>Page {currentPage}/{totalPages}</span>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10">
                    <Checkbox checked={allOnPageSelected} onCheckedChange={toggleAll} />
                  </TableHead>
                  <TableHead>
                    <button onClick={() => handleSort('full_name')} className="flex items-center text-xs font-semibold hover:text-foreground transition-colors">
                      Utilisateur <SortIcon field="full_name" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button onClick={() => handleSort('role')} className="flex items-center text-xs font-semibold hover:text-foreground transition-colors">
                      Rôle <SortIcon field="role" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button onClick={() => handleSort('plan')} className="flex items-center text-xs font-semibold hover:text-foreground transition-colors">
                      Plan & Statut <SortIcon field="plan" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button onClick={() => handleSort('last_login_at')} className="flex items-center text-xs font-semibold hover:text-foreground transition-colors">
                      Activité <SortIcon field="last_login_at" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button onClick={() => handleSort('created_at')} className="flex items-center text-xs font-semibold hover:text-foreground transition-colors">
                      Inscription <SortIcon field="created_at" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <UserX className="h-10 w-10 mx-auto mb-2 opacity-40" />
                      <p className="font-medium">Aucun utilisateur trouvé</p>
                      <p className="text-xs mt-1">Modifiez vos filtres ou votre recherche</p>
                    </TableCell>
                  </TableRow>
                ) : paginatedUsers.map((user) => {
                  const activity = getActivityStatus(user.last_login_at, user.login_count)
                  return (
                    <TableRow key={user.id} className={`group ${selectedIds.has(user.id) ? 'bg-primary/5' : ''}`}>
                      <TableCell>
                        <Checkbox checked={selectedIds.has(user.id)} onCheckedChange={() => toggleOne(user.id)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary">
                              {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{user.full_name || 'Nom non renseigné'}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                              <Mail className="h-3 w-3 shrink-0" />
                              {user.email || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role, user.is_admin)}</TableCell>
                      <TableCell>{getPlanBadge(user.plan as PlanType, user.subscription_status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full shrink-0 ${activity.dot}`} />
                          <div>
                            <div className={`text-xs font-medium ${activity.color}`}>{activity.status}</div>
                            <div className="text-[10px] text-muted-foreground">{user.login_count || 0} connexions</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">{formatDate(user.created_at)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => setDetailUser(user as EnhancedUser)}>
                                <Eye className="h-4 w-4 mr-2" />Voir le profil
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                setSelectedUser(user.id)
                                setNewRole(user.role === 'admin' || user.is_admin ? 'user' : 'admin')
                              }}>
                                <Settings className="h-4 w-4 mr-2" />
                                {user.role === 'admin' || user.is_admin ? 'Retirer Admin' : 'Passer Admin'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedUserForPlan(user as EnhancedUser)
                                setNewPlan(user.plan as PlanType || 'standard')
                                setIsPlanDialogOpen(true)
                              }}>
                                <CreditCard className="h-4 w-4 mr-2" />Modifier le plan
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground">
            Affichage {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, processedUsers.length)} sur {processedUsers.length}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let page: number
              if (totalPages <= 5) { page = i + 1 }
              else if (currentPage <= 3) { page = i + 1 }
              else if (currentPage >= totalPages - 2) { page = totalPages - 4 + i }
              else { page = currentPage - 2 + i }
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8 text-xs"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              )
            })}
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Role change confirmation dialog */}
      {selectedUser && (
        <AlertDialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Changer le rôle</AlertDialogTitle>
              <AlertDialogDescription>
                Voulez-vous changer le rôle vers <strong>{newRole === 'admin' ? 'Administrateur' : 'Utilisateur'}</strong> ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleRoleChange(selectedUser, newRole)}>Confirmer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Plan change dialog */}
      <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le plan de {selectedUserForPlan?.full_name}</DialogTitle>
            <DialogDescription>
              Plan actuel: <strong>{(selectedUserForPlan?.plan || 'standard').toUpperCase()}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={newPlan} onValueChange={(v: PlanType) => setNewPlan(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">STANDARD</SelectItem>
                <SelectItem value="pro">PRO — €29/mois</SelectItem>
                <SelectItem value="ultra_pro">ULTRA PRO — €99/mois</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsPlanDialogOpen(false)} disabled={isUpdatingPlan}>Annuler</Button>
              <Button onClick={() => selectedUserForPlan && handlePlanChange(selectedUserForPlan.id, newPlan)} disabled={isUpdatingPlan || newPlan === selectedUserForPlan?.plan}>
                {isUpdatingPlan && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Mettre à jour
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Detail Sheet (Drawer) */}
      <Sheet open={!!detailUser} onOpenChange={(open) => !open && setDetailUser(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {detailUser && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {(detailUser.full_name || detailUser.email || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <SheetTitle className="text-left">{detailUser.full_name || 'Nom non renseigné'}</SheetTitle>
                    <SheetDescription className="text-left flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {detailUser.email || 'N/A'}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                <div className="flex gap-2">
                  {getRoleBadge(detailUser.role, detailUser.is_admin)}
                  {getPlanBadge(detailUser.plan, detailUser.subscription_status)}
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'ID', value: detailUser.id.slice(0, 8) + '...' },
                    { label: 'Inscription', value: formatDate(detailUser.created_at) },
                    { label: 'Dernière connexion', value: formatDate(detailUser.last_login_at) },
                    { label: 'Connexions totales', value: String(detailUser.login_count || 0) },
                    { label: 'Statut abonnement', value: (detailUser.subscription_status || 'N/A').toUpperCase() },
                    { label: 'Plan actuel', value: (detailUser.plan || 'standard').toUpperCase() },
                  ].map(item => (
                    <div key={item.label} className="space-y-1">
                      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{item.label}</p>
                      <p className="text-sm font-medium">{item.value}</p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Activity timeline placeholder */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Activité récente
                  </h4>
                  <div className="space-y-2">
                    {detailUser.last_login_at ? (
                      <div className="flex items-start gap-3 text-xs">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="font-medium">Dernière connexion</p>
                          <p className="text-muted-foreground">{formatDate(detailUser.last_login_at)}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Aucune activité enregistrée</p>
                    )}
                    <div className="flex items-start gap-3 text-xs">
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div>
                        <p className="font-medium">Compte créé</p>
                        <p className="text-muted-foreground">{formatDate(detailUser.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setDetailUser(null)
                    setSelectedUser(detailUser.id)
                    setNewRole(detailUser.role === 'admin' || detailUser.is_admin ? 'user' : 'admin')
                  }}>
                    <Settings className="h-4 w-4 mr-2" />
                    {detailUser.role === 'admin' || detailUser.is_admin ? 'Retirer Admin' : 'Passer Admin'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    setDetailUser(null)
                    setSelectedUserForPlan(detailUser)
                    setNewPlan(detailUser.plan || 'standard')
                    setIsPlanDialogOpen(true)
                  }}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Modifier le plan
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
