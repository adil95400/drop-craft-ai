import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Edit, Trash2, TrendingUp, Globe, Target, Eye, BarChart3, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

// Mock data pour SEO
const mockSEOData = [
  {
    id: '1',
    userId: 'user-1',
    userEmail: 'john.doe@example.com',
    domain: 'example-store.com',
    pages: 45,
    keywords: 123,
    avgPosition: 12.5,
    organicTraffic: 2340,
    backlinks: 89,
    techScore: 85,
    contentScore: 72,
    lastAudit: '2024-01-15',
    status: 'optimized'
  },
  {
    id: '2',
    userId: 'user-2', 
    userEmail: 'marie.martin@example.com',
    domain: 'boutique-marie.fr',
    pages: 23,
    keywords: 67,
    avgPosition: 18.2,
    organicTraffic: 1560,
    backlinks: 34,
    techScore: 92,
    contentScore: 65,
    lastAudit: '2024-01-12',
    status: 'needs_work'
  }
];

// Mock data pour les mots-clés
const mockKeywords = [
  {
    id: '1',
    keyword: 'chaussures de sport',
    position: 5,
    searchVolume: 8900,
    difficulty: 65,
    traffic: 234,
    trend: 'up',
    lastUpdate: '2024-01-15'
  },
  {
    id: '2',
    keyword: 'sneakers femme',
    position: 12,
    searchVolume: 5600,
    difficulty: 42,
    traffic: 156,
    trend: 'stable',
    lastUpdate: '2024-01-15'
  },
  {
    id: '3',
    keyword: 'basket running',
    position: 8,
    searchVolume: 12000,
    difficulty: 78,
    traffic: 445,
    trend: 'up',
    lastUpdate: '2024-01-15'
  }
];

// Mock data pour les pages
const mockPages = [
  {
    id: '1',
    url: '/products/chaussures-sport',
    title: 'Chaussures de Sport - Collection 2024',
    metaDescription: 'Découvrez notre collection de chaussures de sport...',
    h1: 'Chaussures de Sport Premium',
    wordCount: 450,
    seoScore: 85,
    issues: ['meta description trop courte'],
    status: 'good'
  },
  {
    id: '2',
    url: '/categories/sneakers',
    title: 'Sneakers Femme et Homme',
    metaDescription: 'Large choix de sneakers pour femme et homme...',
    h1: 'Sneakers Tendance',
    wordCount: 320,
    seoScore: 72,
    issues: ['contenu insuffisant', 'balises alt manquantes'],
    status: 'warning'
  }
];

const AdminSEO = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'optimized': return 'bg-green-100 text-green-800';
      case 'needs_work': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch(trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      default: return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const seoStats = {
    totalDomains: mockSEOData.length,
    avgTraffic: Math.round(mockSEOData.reduce((acc, item) => acc + item.organicTraffic, 0) / mockSEOData.length),
    avgPosition: (mockSEOData.reduce((acc, item) => acc + item.avgPosition, 0) / mockSEOData.length).toFixed(1),
    totalKeywords: mockSEOData.reduce((acc, item) => acc + item.keywords, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion SEO</h1>
          <p className="text-muted-foreground">Optimisation et suivi SEO pour tous les sites clients</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Audit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Lancer un Audit SEO</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="domain">Domaine</Label>
                  <Input id="domain" placeholder="example.com" />
                </div>
                <div>
                  <Label htmlFor="auditType">Type d'Audit</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Audit Complet</SelectItem>
                      <SelectItem value="technical">Technique Seulement</SelectItem>
                      <SelectItem value="content">Contenu Seulement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full">Lancer l'Audit</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Domaines Suivis</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{seoStats.totalDomains}</div>
            <p className="text-xs text-muted-foreground">+2 ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trafic Organique Moyen</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{seoStats.avgTraffic}</div>
            <p className="text-xs text-muted-foreground">+15% ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Position Moyenne</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{seoStats.avgPosition}</div>
            <p className="text-xs text-muted-foreground">-2.3 ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mots-clés Total</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{seoStats.totalKeywords}</div>
            <p className="text-xs text-muted-foreground">+45 ce mois</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="domains" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="domains">Domaines</TabsTrigger>
          <TabsTrigger value="keywords">Mots-clés</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
        </TabsList>
        
        <TabsContent value="domains" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par domaine..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="optimized">Optimisé</SelectItem>
                    <SelectItem value="needs_work">À améliorer</SelectItem>
                    <SelectItem value="critical">Critique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Domains List */}
          <div className="space-y-4">
            {mockSEOData.map((domain) => (
              <Card key={domain.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Globe className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{domain.domain}</h3>
                        <p className="text-sm text-muted-foreground">{domain.userEmail}</p>
                        <p className="text-xs text-muted-foreground">Dernier audit: {domain.lastAudit}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-lg font-semibold">{domain.pages}</p>
                        <p className="text-xs text-muted-foreground">Pages</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">{domain.keywords}</p>
                        <p className="text-xs text-muted-foreground">Mots-clés</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">{domain.organicTraffic}</p>
                        <p className="text-xs text-muted-foreground">Trafic</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-lg font-semibold ${getScoreColor(domain.techScore)}`}>{domain.techScore}%</p>
                        <p className="text-xs text-muted-foreground">Score Tech</p>
                      </div>
                      <Badge className={getStatusColor(domain.status)}>
                        {domain.status}
                      </Badge>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-4">
          <div className="space-y-4">
            {mockKeywords.map((keyword) => (
              <Card key={keyword.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-semibold text-lg">{keyword.keyword}</h3>
                        <p className="text-sm text-muted-foreground">Mis à jour: {keyword.lastUpdate}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">#{keyword.position}</p>
                        <p className="text-xs text-muted-foreground">Position</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">{keyword.searchVolume.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Volume</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">{keyword.difficulty}%</p>
                        <p className="text-xs text-muted-foreground">Difficulté</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-green-600">{keyword.traffic}</p>
                        <p className="text-xs text-muted-foreground">Trafic</p>
                      </div>
                      <div className="flex items-center">
                        {getTrendIcon(keyword.trend)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          <div className="space-y-4">
            {mockPages.map((page) => (
              <Card key={page.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{page.title}</h3>
                        <p className="text-sm text-primary">{page.url}</p>
                        <p className="text-sm text-muted-foreground mt-1">{page.metaDescription}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className={`text-2xl font-bold ${getScoreColor(page.seoScore)}`}>{page.seoScore}</p>
                          <p className="text-xs text-muted-foreground">Score SEO</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold">{page.wordCount}</p>
                          <p className="text-xs text-muted-foreground">Mots</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {page.issues.map((issue, index) => (
                          <Badge key={index} variant="destructive" className="text-xs">
                            {issue}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center space-x-2">
                        {page.status === 'good' && <CheckCircle className="w-5 h-5 text-green-600" />}
                        {page.status === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-600" />}
                        {page.status === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Progress value={page.seoScore} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSEO;