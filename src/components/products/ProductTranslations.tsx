import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Languages, Plus, Save, Trash2, Globe } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' }
]

interface Translation {
  language: string
  name: string
  description: string
  short_description?: string
  meta_title?: string
  meta_description?: string
}

interface ProductTranslationsProps {
  productId: string
  currentTranslations?: Translation[]
}

export function ProductTranslations({ productId, currentTranslations = [] }: ProductTranslationsProps) {
  const { toast } = useToast()
  const [translations, setTranslations] = useState<Translation[]>(currentTranslations)
  const [selectedLanguage, setSelectedLanguage] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  const addTranslation = () => {
    if (!selectedLanguage) {
      toast({
        title: "Sélectionnez une langue",
        variant: "destructive"
      })
      return
    }

    if (translations.find(t => t.language === selectedLanguage)) {
      toast({
        title: "Traduction déjà existante",
        variant: "destructive"
      })
      return
    }

    setTranslations([...translations, {
      language: selectedLanguage,
      name: '',
      description: '',
      short_description: '',
      meta_title: '',
      meta_description: ''
    }])
    setSelectedLanguage('')
  }

  const updateTranslation = (index: number, field: keyof Translation, value: string) => {
    const updated = [...translations]
    updated[index] = { ...updated[index], [field]: value }
    setTranslations(updated)
  }

  const removeTranslation = (index: number) => {
    setTranslations(translations.filter((_, i) => i !== index))
  }

  const saveTranslations = async () => {
    setIsSaving(true)
    try {
      // TODO: Appel API pour sauvegarder les traductions
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Traductions sauvegardées",
        description: `${translations.length} traduction(s) enregistrée(s)`
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les traductions",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getLanguageInfo = (code: string) => {
    return LANGUAGES.find(l => l.code === code) || { name: code, flag: '🌍' }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-primary" />
              Traductions Multi-langues
            </CardTitle>
            <Badge variant="secondary">
              {translations.length} langue(s)
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Sélectionner une langue..." />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={addTranslation} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>

          {translations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucune traduction ajoutée</p>
              <p className="text-sm">Sélectionnez une langue pour commencer</p>
            </div>
          )}

          {translations.map((translation, index) => {
            const langInfo = getLanguageInfo(translation.language)
            return (
              <Card key={index} className="border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{langInfo.flag}</span>
                      <span className="font-semibold">{langInfo.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTranslation(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nom du produit</Label>
                    <Input
                      value={translation.name}
                      onChange={(e) => updateTranslation(index, 'name', e.target.value)}
                      placeholder="Nom traduit..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description courte</Label>
                    <Input
                      value={translation.short_description || ''}
                      onChange={(e) => updateTranslation(index, 'short_description', e.target.value)}
                      placeholder="Description courte..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description complète</Label>
                    <Textarea
                      value={translation.description}
                      onChange={(e) => updateTranslation(index, 'description', e.target.value)}
                      placeholder="Description détaillée..."
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Meta titre (SEO)</Label>
                      <Input
                        value={translation.meta_title || ''}
                        onChange={(e) => updateTranslation(index, 'meta_title', e.target.value)}
                        placeholder="Titre SEO..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Meta description (SEO)</Label>
                      <Input
                        value={translation.meta_description || ''}
                        onChange={(e) => updateTranslation(index, 'meta_description', e.target.value)}
                        placeholder="Description SEO..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {translations.length > 0 && (
            <Button 
              onClick={saveTranslations} 
              disabled={isSaving}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder toutes les traductions'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
