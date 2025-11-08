import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Server, Loader2 } from 'lucide-react'
import { ImportFromFtpOptions } from '@/domains/commerce/services/importAdvancedService'

interface FTPImportCardProps {
  onImport: (options: ImportFromFtpOptions) => void
  isLoading?: boolean
}

export const FTPImportCard = ({ onImport, isLoading }: FTPImportCardProps) => {
  const [formData, setFormData] = useState({
    ftpUrl: '',
    username: '',
    password: '',
    filePath: '',
    fileType: 'csv' as 'csv' | 'xml' | 'json'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.ftpUrl || !formData.username || !formData.password || !formData.filePath) return
    
    onImport(formData)
  }

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Connexion FTP
        </CardTitle>
        <CardDescription>
          Configurez un connecteur FTP pour importer automatiquement vos fichiers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ftp-url">Serveur FTP</Label>
            <Input
              id="ftp-url"
              type="text"
              placeholder="ftp://ftp.example.com"
              value={formData.ftpUrl}
              onChange={(e) => updateField('ftpUrl', e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <Input
                id="username"
                type="text"
                placeholder="username"
                value={formData.username}
                onChange={(e) => updateField('username', e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-path">Chemin du fichier</Label>
            <Input
              id="file-path"
              type="text"
              placeholder="/exports/products.csv"
              value={formData.filePath}
              onChange={(e) => updateField('filePath', e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-type">Type de fichier</Label>
            <Select
              value={formData.fileType}
              onValueChange={(value) => updateField('fileType', value)}
              disabled={isLoading}
            >
              <SelectTrigger id="file-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xml">XML</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !formData.ftpUrl || !formData.username || !formData.password || !formData.filePath}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              'Créer le connecteur'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
