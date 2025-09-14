import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, AlertCircle, Copy, ExternalLink } from 'lucide-react'

interface ProductSEOContentProps {
  seoData: any
  setSeoData: (data: any) => void
  analysis: any
  competitorData: any
  keywordSuggestions: string[]
  contentSuggestions: any
  activeTab: string
  onAnalyzeCompetitors: () => void
}

export function ProductSEOContent({
  seoData,
  setSeoData,
  analysis,
  competitorData,
  keywordSuggestions,
  contentSuggestions,
  activeTab,
  onAnalyzeCompetitors
}: ProductSEOContentProps) {
  
  const updateSeoData = (field: string, value: string) => {
    setSeoData((prev: any) => ({ ...prev, [field]: value }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const applySuggestion = (field: string, value: string) => {
    updateSeoData(field, value)
  }

  if (activeTab === 'basics') {
    return (
      <>
        {/* Mot-clé principal */}
        <div className="space-y-2">
          <Label htmlFor="focus-keyword">Mot-clé principal</Label>
          <Input
            id="focus-keyword"
            value={seoData.focusKeyword}
            onChange={(e) => updateSeoData('focusKeyword', e.target.value)}
            placeholder="mot-clé principal"
          />
          <div className="text-xs text-muted-foreground">
            Le mot-clé sur lequel vous voulez vous positionner
          </div>
        </div>

        {/* Titre SEO */}
        <div className="space-y-2">
          <Label htmlFor="seo-title">Titre SEO</Label>
          <Input
            id="seo-title"
            value={seoData.title}
            onChange={(e) => updateSeoData('title', e.target.value)}
            placeholder="Titre optimisé pour les moteurs de recherche"
          />
          <div className="flex justify-between text-xs">
            <span className={seoData.title.length > 60 ? 'text-red-500' : seoData.title.length < 30 ? 'text-orange-500' : 'text-green-500'}>
              {seoData.title.length} caractères
            </span>
            <span className="text-muted-foreground">30-60 recommandé</span>
          </div>
        </div>

        {/* Description SEO */}
        <div className="space-y-2">
          <Label htmlFor="seo-description">Description SEO</Label>
          <Textarea
            id="seo-description"
            value={seoData.description}
            onChange={(e) => updateSeoData('description', e.target.value)}
            placeholder="Description qui apparaîtra dans les résultats de recherche"
            rows={3}
          />
          <div className="flex justify-between text-xs">
            <span className={seoData.description.length > 160 ? 'text-red-500' : seoData.description.length < 120 ? 'text-orange-500' : 'text-green-500'}>
              {seoData.description.length} caractères
            </span>
            <span className="text-muted-foreground">120-160 recommandé</span>
          </div>
        </div>

        {/* URL/Slug */}
        <div className="space-y-2">
          <Label htmlFor="slug">URL du produit</Label>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">votresite.com/produits/</span>
            <Input
              id="slug"
              value={seoData.slug}
              onChange={(e) => updateSeoData('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              placeholder="url-optimisee"
              className="flex-1"
            />
          </div>
        </div>

        {/* Mots-clés */}
        <div className="space-y-2">
          <Label htmlFor="keywords">Mots-clés</Label>
          <Input
            id="keywords"
            value={seoData.keywords}
            onChange={(e) => updateSeoData('keywords', e.target.value)}
            placeholder="mot-clé1, mot-clé2, mot-clé3"
          />
          <div className="text-xs text-muted-foreground">
            Séparez les mots-clés par des virgules
          </div>
        </div>
      </>
    )
  }

  if (activeTab === 'advanced') {
    return (
      <>
        {/* Meta données */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Meta Données</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meta-title">Meta Titre</Label>
              <Input
                id="meta-title"
                value={seoData.metaTitle}
                onChange={(e) => updateSeoData('metaTitle', e.target.value)}
                placeholder="Titre pour les onglets du navigateur"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta-description">Meta Description</Label>
              <Textarea
                id="meta-description"
                value={seoData.metaDescription}
                onChange={(e) => updateSeoData('metaDescription', e.target.value)}
                placeholder="Description pour les réseaux sociaux"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Open Graph */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Open Graph (Réseaux Sociaux)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="og-title">Titre Open Graph</Label>
              <Input
                id="og-title"
                value={seoData.ogTitle}
                onChange={(e) => updateSeoData('ogTitle', e.target.value)}
                placeholder="Titre pour les partages sociaux"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="og-description">Description Open Graph</Label>
              <Textarea
                id="og-description"
                value={seoData.ogDescription}
                onChange={(e) => updateSeoData('ogDescription', e.target.value)}
                placeholder="Description pour les partages sociaux"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="og-image">Image Open Graph</Label>
              <Input
                id="og-image"
                value={seoData.ogImage}
                onChange={(e) => updateSeoData('ogImage', e.target.value)}
                placeholder="URL de l'image pour les partages"
              />
            </div>
          </CardContent>
        </Card>

        {/* Données techniques */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Données Techniques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="canonical-url">URL Canonique</Label>
              <Input
                id="canonical-url"
                value={seoData.canonicalUrl}
                onChange={(e) => updateSeoData('canonicalUrl', e.target.value)}
                placeholder="https://votresite.com/produits/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alt-text">Texte Alternatif Images</Label>
              <Input
                id="alt-text"
                value={seoData.altText}
                onChange={(e) => updateSeoData('altText', e.target.value)}
                placeholder="Description des images pour l'accessibilité"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="structured-data">Données Structurées (JSON-LD)</Label>
              <Textarea
                id="structured-data"
                value={seoData.structuredData}
                onChange={(e) => updateSeoData('structuredData', e.target.value)}
                placeholder='{"@context": "https://schema.org/", "@type": "Product", ...}'
                rows={4}
                className="font-mono text-xs"
              />
            </div>
          </CardContent>
        </Card>
      </>
    )
  }

  if (activeTab === 'competitors') {
    return (
      <>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Analyse Concurrentielle</h3>
          <Button onClick={onAnalyzeCompetitors} variant="outline" size="sm">
            Analyser les concurrents
          </Button>
        </div>

        {competitorData ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Moyennes du marché</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 border rounded">
                  <div className="text-2xl font-bold">{competitorData.avgTitleLength}</div>
                  <div className="text-sm text-muted-foreground">Longueur titre moyenne</div>
                </div>
                <div className="text-center p-3 border rounded">
                  <div className="text-2xl font-bold">{competitorData.avgDescriptionLength}</div>
                  <div className="text-sm text-muted-foreground">Longueur description moyenne</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mots-clés populaires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {competitorData.commonKeywords.map((keyword: string, index: number) => (
                    <Badge key={index} variant="outline" className="cursor-pointer"
                           onClick={() => {
                             const currentKeywords = seoData.keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
                             if (!currentKeywords.includes(keyword)) {
                               updateSeoData('keywords', [...currentKeywords, keyword].join(', '))
                             }
                           }}>
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Performers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {competitorData.topPerformers.map((competitor: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{competitor.title}</span>
                    <Badge variant="secondary">Score: {competitor.score}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Cliquez sur "Analyser les concurrents" pour obtenir des insights
          </div>
        )}
      </>
    )
  }

  if (activeTab === 'suggestions') {
    return (
      <>
        <div className="space-y-6">
          {/* Suggestions de mots-clés */}
          {keywordSuggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Suggestions de mots-clés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {keywordSuggestions.map((keyword, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => {
                        const currentKeywords = seoData.keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
                        if (!currentKeywords.includes(keyword)) {
                          updateSeoData('keywords', [...currentKeywords, keyword].join(', '))
                        }
                      }}
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggestions de contenu */}
          {contentSuggestions && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Variantes de titre</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {contentSuggestions.titleVariants?.map((title: string, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm flex-1">{title}</span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(title)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => applySuggestion('title', title)}>
                          Utiliser
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Variantes de description</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {contentSuggestions.descriptionVariants?.map((desc: string, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm flex-1">{desc}</span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(desc)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => applySuggestion('description', desc)}>
                          Utiliser
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}

          {/* Analyse des performances */}
          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Checklist SEO</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.checks?.map((check: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      {check.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                      )}
                      <span className={`text-sm ${check.passed ? 'text-green-700' : 'text-orange-700'}`}>
                        {check.name}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </>
    )
  }

  return null
}