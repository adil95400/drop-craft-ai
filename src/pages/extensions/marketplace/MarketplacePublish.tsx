import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, CheckCircle, AlertCircle, Send } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export default function MarketplacePublish() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    version: '1.0.0',
    category: '',
    source_url: '',
    icon_url: '',
    screenshots: [] as string[]
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const { data, error } = await supabase.functions.invoke('extension-marketplace', {
        body: {
          action: 'publish',
          data: formData
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })

      if (error) throw error

      setSubmitted(true)
      toast({
        title: 'Extension soumise',
        description: 'Votre extension est en cours de review par notre équipe'
      })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Échec de la soumission',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4 py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-2xl font-bold">Extension Soumise !</h3>
            <p className="text-muted-foreground">
              Votre extension est en cours de review. Vous recevrez une notification 
              dès qu'elle sera approuvée et publiée sur le marketplace.
            </p>
            <Button onClick={() => setSubmitted(false)}>
              Soumettre une autre extension
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Publier une Extension</h1>
        <p className="text-muted-foreground mt-2">
          Partagez votre extension avec la communauté Drop Craft AI
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Processus de Review :</strong> Toutes les extensions sont examinées 
          par notre équipe avant publication pour garantir la sécurité et la qualité.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informations de l'Extension</CardTitle>
            <CardDescription>
              Remplissez les détails de votre extension
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'extension *</Label>
              <Input
                id="name"
                required
                placeholder="Mon Extension Géniale"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                required
                rows={4}
                placeholder="Décrivez ce que fait votre extension..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 20 caractères
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="version">Version *</Label>
                <Input
                  id="version"
                  required
                  placeholder="1.0.0"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Catégorie *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="productivity">Productivité</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="automation">Automation</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="integration">Intégration</SelectItem>
                    <SelectItem value="tools">Outils</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source_url">URL Source Code (GitHub, etc.)</Label>
              <Input
                id="source_url"
                type="url"
                placeholder="https://github.com/..."
                value={formData.source_url}
                onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon_url">URL Icône</Label>
              <Input
                id="icon_url"
                type="url"
                placeholder="https://..."
                value={formData.icon_url}
                onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-1">
                <p className="text-sm font-medium">Prêt à soumettre ?</p>
                <p className="text-xs text-muted-foreground">
                  Review estimée : 2-3 jours ouvrés
                </p>
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>Soumission...</>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Soumettre pour Review
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Checklist de Soumission</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              L'extension fonctionne correctement
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Documentation complète incluse
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Pas de code malveillant
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Respect de la vie privée des utilisateurs
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Interface utilisateur claire
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
