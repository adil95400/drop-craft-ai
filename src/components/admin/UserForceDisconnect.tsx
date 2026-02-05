import { useState } from 'react'
import { productionLogger } from '@/utils/productionLogger';
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserX, AlertTriangle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface UserForceDisconnectProps {
  userId?: string
  userEmail?: string
  userName?: string
  onSuccess?: () => void
}

export const UserForceDisconnect = ({ 
  userId, 
  userEmail, 
  userName, 
  onSuccess 
}: UserForceDisconnectProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [targetUserId, setTargetUserId] = useState(userId || '')
  const [reason, setReason] = useState('')
  const { toast } = useToast()

  const handleForceDisconnect = async () => {
    if (!targetUserId.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez fournir un ID utilisateur valide",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        throw new Error('No active session')
      }

      const response = await fetch('/functions/v1/force-disconnect-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify({
          targetUserId: targetUserId.trim(),
          reason: reason || 'force_disconnect'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`)
      }

      toast({
        title: "Utilisateur déconnecté",
        description: result.message || "L'utilisateur a été déconnecté avec succès",
      })

      // Reset form
      setTargetUserId(userId || '')
      setReason('')
      setIsOpen(false)
      setShowConfirm(false)
      onSuccess?.()

    } catch (error) {
      productionLogger.error('Failed to force disconnect user', error as Error, 'UserForceDisconnect');
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const openConfirmDialog = () => {
    if (!targetUserId.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez fournir un ID utilisateur valide",
        variant: "destructive"
      })
      return
    }
    setShowConfirm(true)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <UserX className="h-4 w-4 mr-2" />
            Déconnecter l'utilisateur
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-destructive" />
              Déconnexion forcée
            </DialogTitle>
            <DialogDescription>
              Cette action va immédiatement déconnecter l'utilisateur de toutes ses sessions actives.
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Cette action est immédiate et irréversible. L'utilisateur devra se reconnecter 
              pour accéder à nouveau à l'application.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="targetUserId">ID Utilisateur *</Label>
              <Input
                id="targetUserId"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="Entrez l'ID de l'utilisateur"
                disabled={!!userId} // Disable if userId is provided
              />
              {userEmail && (
                <p className="text-sm text-muted-foreground">
                  Email: {userEmail}
                </p>
              )}
              {userName && (
                <p className="text-sm text-muted-foreground">
                  Nom: {userName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Raison (optionnel)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Raison de la déconnexion forcée..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={openConfirmDialog}>
              Déconnecter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la déconnexion forcée</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir déconnecter cet utilisateur ?
              <br />
              <strong>ID:</strong> {targetUserId}
              {userEmail && (
                <>
                  <br />
                  <strong>Email:</strong> {userEmail}
                </>
              )}
              {reason && (
                <>
                  <br />
                  <strong>Raison:</strong> {reason}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceDisconnect}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Déconnexion...
                </>
              ) : (
                'Confirmer la déconnexion'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}