import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAddCJCredentials } from '@/hooks/useAddCJCredentials'
import { Package, ExternalLink } from 'lucide-react'

export function AddCJCredentialsButton() {
  const [open, setOpen] = useState(false)
  const [accessToken, setAccessToken] = useState('')
  const [email, setEmail] = useState('')
  const { mutate: addCredentials, isPending } = useAddCJCredentials()

  const handleSubmit = () => {
    if (!accessToken.trim() || !email.trim()) return
    
    addCredentials({ accessToken: accessToken.trim(), email: email.trim() }, {
      onSuccess: () => {
        setOpen(false)
        setAccessToken('')
        setEmail('')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Package className="h-4 w-4" />
          Connecter CJ Dropshipping
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connecter CJ Dropshipping</DialogTitle>
          <DialogDescription>
            Entrez votre Access Token CJ Dropshipping pour synchroniser les produits automatiquement.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email du compte CJ</Label>
            <Input
              id="email"
              type="email"
              placeholder="lookandstyle59@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accessToken">API Key CJ</Label>
            <Input
              id="accessToken"
              type="password"
              placeholder="Ex: CJ123456@api@xxxxx"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Obtenez votre API Key depuis{' '}
              <a 
                href="https://developers.cjdropshipping.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                CJ Developer Portal
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !accessToken.trim() || !email.trim()}>
            {isPending ? 'Connexion...' : 'Connecter et Synchroniser'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
