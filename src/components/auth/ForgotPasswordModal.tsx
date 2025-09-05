/**
 * Modal pour la réinitialisation du mot de passe
 */
import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { SecureInput } from '@/components/common/SecureInput'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Mail, ArrowLeft } from 'lucide-react'

interface ForgotPasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ForgotPasswordModal({ open, onOpenChange }: ForgotPasswordModalProps) {
  const { resetPassword } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await resetPassword(email)
      
      if (error) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive"
        })
      } else {
        setEmailSent(true)
        toast({
          title: "Email envoyé",
          description: "Vérifiez votre boîte email pour réinitialiser votre mot de passe."
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setEmailSent(false)
    setLoading(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {emailSent ? (
              <>
                <Mail className="h-5 w-5 text-green-500" />
                Email envoyé
              </>
            ) : (
              <>
                <ArrowLeft className="h-5 w-5" />
                Mot de passe oublié
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {emailSent ? (
              "Un email de réinitialisation a été envoyé à votre adresse. Vérifiez votre boîte de réception et suivez les instructions."
            ) : (
              "Entrez votre email pour recevoir un lien de réinitialisation de mot de passe."
            )}
          </DialogDescription>
        </DialogHeader>
        
        {!emailSent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <SecureInput
                  id="reset-email"
                  type="email"
                  placeholder="votre@email.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={254}
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || !email}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  'Envoyer le lien'
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex justify-end">
            <Button onClick={handleClose} variant="default">
              Compris
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}