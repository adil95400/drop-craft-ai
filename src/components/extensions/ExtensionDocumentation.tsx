import React, { useState } from 'react'
import DOMPurify from 'dompurify'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BookOpen, FileText, Code2, Download, Eye, Wand2, Copy,
  Globe, Share2, Settings, Lightbulb, Zap, Image, Video,
  ChevronRight, ExternalLink, Search, Filter, Save
} from 'lucide-react'
import { toast } from 'sonner'

interface DocumentationSection {
  id: string
  title: string
  content: string
  type: 'markdown' | 'code' | 'api' | 'example'
  order: number
  auto_generated: boolean
}

interface DocumentationTemplate {
  id: string
  name: string
  description: string
  sections: string[]
  language: string
  format: 'markdown' | 'html' | 'pdf'
}

const DOC_TEMPLATES: DocumentationTemplate[] = [
  {
    id: 'basic',
    name: 'Documentation de base',
    description: 'Template simple avec installation, configuration et utilisation',
    sections: ['introduction', 'installation', 'configuration', 'usage', 'troubleshooting'],
    language: 'fr',
    format: 'markdown'
  },
  {
    id: 'api',
    name: 'Documentation API',
    description: 'Documentation technique complète avec endpoints et exemples',
    sections: ['overview', 'authentication', 'endpoints', 'examples', 'errors', 'sdk'],
    language: 'fr',
    format: 'markdown'
  },
  {
    id: 'developer',
    name: 'Guide développeur',
    description: 'Guide complet pour les développeurs avec architecture et API',
    sections: ['getting-started', 'architecture', 'api-reference', 'hooks', 'examples', 'best-practices'],
    language: 'fr',
    format: 'markdown'
  },
  {
    id: 'user',
    name: 'Guide utilisateur',
    description: 'Documentation orientée utilisateur final avec captures d\'écran',
    sections: ['introduction', 'first-steps', 'features', 'tutorials', 'faq', 'support'],
    language: 'fr',
    format: 'html'
  }
]

const SAMPLE_SECTIONS: DocumentationSection[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    content: `# Extension AI Product Optimizer

L'Extension AI Product Optimizer utilise l'intelligence artificielle pour optimiser automatiquement vos fiches produits, améliorer votre référencement SEO et augmenter vos conversions.

## Fonctionnalités principales

- **Optimisation automatique des titres** : Génération de titres accrocheurs et optimisés SEO
- **Descriptions intelligentes** : Création de descriptions produits personnalisées  
- **Analyse des mots-clés** : Identification et intégration des mots-clés pertinents
- **Optimisation des images** : Suggestions d'amélioration pour vos visuels
- **Score de qualité** : Évaluation en temps réel de vos fiches produits`,
    type: 'markdown',
    order: 1,
    auto_generated: true
  },
  {
    id: 'installation',
    title: 'Installation',
    content: `## Installation

### Prérequis

- Drop Craft AI version 3.0 ou supérieure
- Clé API OpenAI (optionnel pour les fonctionnalités IA avancées)

### Installation depuis le marketplace

1. Rendez-vous dans le marketplace d'extensions
2. Recherchez "AI Product Optimizer"
3. Cliquez sur "Installer"
4. Activez l'extension dans les paramètres

### Installation manuelle

\`\`\`bash
# Téléchargez le package
curl -L https://github.com/your-org/ai-optimizer/releases/latest/download/ai-optimizer.zip -o ai-optimizer.zip

# Décompressez et installez
unzip ai-optimizer.zip
cd ai-optimizer
npm install
\`\`\``,
    type: 'markdown',
    order: 2,
    auto_generated: true
  },
  {
    id: 'api-reference',
    title: 'Référence API',
    content: `## API Reference

### Optimiser un produit

\`\`\`javascript
POST /api/extensions/ai-optimizer/optimize

{
  "product_id": "12345",
  "options": {
    "optimize_title": true,
    "optimize_description": true,
    "seo_analysis": true
  }
}
\`\`\`

### Réponse

\`\`\`json
{
  "success": true,
  "optimizations": {
    "title": {
      "before": "Chaussures de sport",
      "after": "Chaussures de Running Nike Air - Confort et Performance",
      "seo_score": 85
    },
    "description": {
      "before": "Bonnes chaussures",
      "after": "Découvrez nos chaussures de running haute performance...",
      "readability_score": 92
    }
  }
}
\`\`\``,
    type: 'api',
    order: 3,
    auto_generated: false
  }
]

export const ExtensionDocumentation = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentationTemplate>(DOC_TEMPLATES[0])
  const [sections, setSections] = useState<DocumentationSection[]>(SAMPLE_SECTIONS)
  const [isGenerating, setIsGenerating] = useState(false)
  const [docConfig, setDocConfig] = useState({
    title: 'AI Product Optimizer',
    version: '1.0.0',
    author: 'TechCorp Solutions',
    language: 'fr',
    logo_url: '',
    github_url: '',
    demo_url: ''
  })

  const generateDocumentation = async () => {
    setIsGenerating(true)
    toast.info('Génération de la documentation en cours...')
    
    // Simulation de génération IA
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const generatedSections: DocumentationSection[] = [
      ...SAMPLE_SECTIONS,
      {
        id: 'configuration',
        title: 'Configuration',
        content: `## Configuration

### Configuration de base

L'extension peut être configurée via l'interface d'administration ou par fichier de configuration.

#### Interface d'administration

1. Allez dans Extensions > AI Product Optimizer
2. Cliquez sur "Paramètres"
3. Configurez vos préférences

#### Fichier de configuration

\`\`\`json
{
  "ai_provider": "openai",
  "api_key": "your-api-key",
  "optimization_level": "balanced",
  "languages": ["fr", "en"],
  "auto_optimize": false
}
\`\`\``,
        type: 'markdown',
        order: 4,
        auto_generated: true
      },
      {
        id: 'examples',
        title: 'Exemples d\'utilisation',
        content: `## Exemples d'utilisation

### Optimisation manuelle d'un produit

\`\`\`javascript
const optimizer = new AIProductOptimizer({
  apiKey: 'your-api-key'
});

// Optimiser un produit spécifique
const result = await optimizer.optimizeProduct('product-123', {
  title: true,
  description: true,
  tags: true
});

console.log('Optimisations:', result.optimizations);
\`\`\`

### Optimisation en lot

\`\`\`javascript
// Optimiser plusieurs produits
const products = ['product-1', 'product-2', 'product-3'];
const results = await optimizer.optimizeBatch(products);

results.forEach(result => {
  console.log(\`Produit \${result.id} optimisé avec score: \${result.score}\`);
});
\`\`\``,
        type: 'code',
        order: 5,
        auto_generated: true
      }
    ]

    setSections(generatedSections)
    toast.success('Documentation générée avec succès!')
    setIsGenerating(false)
  }

  const exportDocumentation = (format: 'markdown' | 'html' | 'pdf') => {
    const content = sections
      .sort((a, b) => a.order - b.order)
      .map(section => section.content)
      .join('\n\n---\n\n')

    const blob = new Blob([content], { 
      type: format === 'html' ? 'text/html' : 'text/markdown' 
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${docConfig.title.toLowerCase().replace(/\s+/g, '-')}-docs.${format === 'html' ? 'html' : 'md'}`
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast.success(`Documentation exportée en ${format.toUpperCase()}`)
  }

  const publishDocumentation = () => {
    toast.success('Documentation publiée sur le portail développeur!')
  }

  const previewDocumentation = async () => {
    // Ouvrir dans un nouvel onglet une prévisualisation avec sanitization
    const content = sections
      .sort((a, b) => a.order - b.order)
      .map(section => section.content)
      .join('\n\n')
    
    // Sanitize title to prevent XSS
    const sanitizedTitle = DOMPurify.sanitize(docConfig.title, { ALLOWED_TAGS: [] })
    
    // Convert markdown to HTML safely using marked and then sanitize
    // Load marked dynamically to parse markdown, then sanitize the output
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${sanitizedTitle} - Documentation</title>
          <meta charset="UTF-8">
          <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline';">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
            pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
            h1, h2, h3 { color: #333; }
          </style>
        </head>
        <body>
          <div id="content"></div>
          <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js"></script>
          <script>
            // Parse markdown and sanitize the output to prevent XSS
            const rawContent = ${JSON.stringify(content)};
            const parsedHtml = marked.parse(rawContent);
            const sanitizedHtml = DOMPurify.sanitize(parsedHtml, {
              ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'u', 'code', 'pre', 'ul', 'ol', 'li', 'a', 'blockquote', 'hr'],
              ALLOWED_ATTR: ['href', 'target', 'rel', 'class']
            });
            document.getElementById('content').innerHTML = sanitizedHtml;
          </script>
        </body>
      </html>
    `
    
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = window.URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-green-600">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            Générateur de Documentation
          </h1>
          <p className="text-muted-foreground mt-1">
            Créez une documentation professionnelle pour vos extensions automatiquement
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={previewDocumentation}>
            <Eye className="w-4 h-4 mr-2" />
            Aperçu
          </Button>
          <Button 
            onClick={generateDocumentation}
            disabled={isGenerating}
            className="bg-gradient-to-r from-blue-600 to-green-600"
          >
            {isGenerating ? (
              <>
                <Wand2 className="w-4 h-4 mr-2 animate-pulse" />
                Génération...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Générer avec IA
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Configuration */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre de l'extension</Label>
                <Input
                  id="title"
                  value={docConfig.title}
                  onChange={(e) => setDocConfig(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={docConfig.version}
                    onChange={(e) => setDocConfig(prev => ({ ...prev, version: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Langue</Label>
                  <Select value={docConfig.language} onValueChange={(value) => setDocConfig(prev => ({ ...prev, language: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="author">Auteur</Label>
                <Input
                  id="author"
                  value={docConfig.author}
                  onChange={(e) => setDocConfig(prev => ({ ...prev, author: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="github">URL GitHub</Label>
                <Input
                  id="github"
                  placeholder="https://github.com/..."
                  value={docConfig.github_url}
                  onChange={(e) => setDocConfig(prev => ({ ...prev, github_url: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {DOC_TEMPLATES.map(template => (
                <div 
                  key={template.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedTemplate.id === template.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="font-medium text-sm mb-1">{template.name}</div>
                  <div className="text-xs text-muted-foreground mb-2">{template.description}</div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">{template.format}</Badge>
                    <Badge variant="outline" className="text-xs">{template.sections.length} sections</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Documentation Editor */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-5 h-5" />
                  Sections de documentation
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportDocumentation('markdown')}>
                    <Download className="w-4 h-4 mr-2" />
                    Markdown
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportDocumentation('html')}>
                    <Download className="w-4 h-4 mr-2" />
                    HTML
                  </Button>
                  <Button size="sm" onClick={publishDocumentation}>
                    <Globe className="w-4 h-4 mr-2" />
                    Publier
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="editor" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="editor">Éditeur</TabsTrigger>
                  <TabsTrigger value="preview">Aperçu</TabsTrigger>
                  <TabsTrigger value="structure">Structure</TabsTrigger>
                </TabsList>

                <TabsContent value="editor" className="space-y-4">
                  {sections.sort((a, b) => a.order - b.order).map(section => (
                    <Card key={section.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {section.type === 'code' && <Code2 className="w-4 h-4" />}
                            {section.type === 'api' && <Zap className="w-4 h-4" />}
                            {section.type === 'markdown' && <FileText className="w-4 h-4" />}
                            {section.title}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            {section.auto_generated && (
                              <Badge variant="secondary" className="text-xs">
                                <Wand2 className="w-3 h-3 mr-1" />
                                IA
                              </Badge>
                            )}
                            <Button variant="ghost" size="sm">
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          value={section.content}
                          onChange={(e) => {
                            setSections(prev => prev.map(s => 
                              s.id === section.id ? { ...s, content: e.target.value } : s
                            ))
                          }}
                          className="font-mono text-sm min-h-[200px]"
                          placeholder="Contenu de la section..."
                        />
                      </CardContent>
                    </Card>
                  ))}

                  {sections.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Aucune section</p>
                      <p className="text-sm mb-4">Cliquez sur "Générer avec IA" pour créer votre documentation</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="preview" className="space-y-4">
                  <div className="prose max-w-none">
                    <h1>{docConfig.title} - Documentation</h1>
                    <p className="text-muted-foreground">Version {docConfig.version} par {docConfig.author}</p>
                    
                    {sections.sort((a, b) => a.order - b.order).map(section => (
                      <div key={section.id} className="mb-8">
                        <div className="bg-muted/30 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
                          {section.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="structure" className="space-y-4">
                  <div className="space-y-2">
                    {sections.sort((a, b) => a.order - b.order).map((section, index) => (
                      <div key={section.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="text-sm font-medium text-muted-foreground">
                          {index + 1}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="font-medium">{section.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {section.type} • {section.content.length} caractères
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {section.auto_generated && (
                            <Badge variant="secondary" className="text-xs">IA</Badge>
                          )}
                          <Button variant="ghost" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Generation Progress */}
      {isGenerating && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Wand2 className="w-6 h-6 text-primary animate-pulse" />
              <div className="flex-1">
                <div className="font-medium mb-1">Génération de la documentation en cours...</div>
                <div className="text-sm text-muted-foreground">
                  L'IA analyse votre extension et crée une documentation professionnelle
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ExtensionDocumentation