import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Save, Play, Brain, Sparkles, Target, Zap, Settings, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const AIImportConfig = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [config, setConfig] = useState({
    ai_engine: {
      model: 'gpt-4' as 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3' | 'gemini-pro',
      temperature: 0.3,
      max_tokens: 2000,
      context_window: 4000
    },
    automation: {
      auto_categorize: true,
      auto_optimize_titles: true,
      auto_optimize_descriptions: true,
      auto_generate_tags: true,
      auto_set_pricing: true,
      auto_translate: false,
      target_languages: [] as string[],
      quality_threshold: 0.8
    },
    content_enhancement: {
      seo_optimization: true,
      keyword_density: 2.5,
      readability_target: 'intermediate' as 'basic' | 'intermediate' | 'advanced',
      tone: 'professional' as 'professional' | 'casual' | 'persuasive' | 'technical',
      length_target: 'medium' as 'short' | 'medium' | 'long',
      include_benefits: true,
      include_specifications: true
    },
    market_analysis: {
      competitor_analysis: true,
      price_optimization: true,
      trend_analysis: true,
      demand_forecasting: false,
      profit_margin_target: 30,
      market_position: 'competitive' as 'budget' | 'competitive' | 'premium'
    },
    quality_control: {
      content_moderation: true,
      fact_checking: true,
      brand_compliance: true,
      duplicate_detection: true,
      quality_score_minimum: 0.7,
      human_review_threshold: 0.5
    },
    learning: {
      feedback_learning: true,
      performance_tracking: true,
      A_B_testing: false,
      continuous_improvement: true,
      user_preference_learning: true
    }
  });

  const [testResults, setTestResults] = useState<any>(null);
  const [isTraining, setIsTraining] = useState(false);

  const availableLanguages = [
    { code: 'en', name: 'Anglais' },
    { code: 'es', name: 'Espagnol' },
    { code: 'de', name: 'Allemand' },
    { code: 'it', name: 'Italien' },
    { code: 'pt', name: 'Portugais' },
    { code: 'nl', name: 'Néerlandais' }
  ];

  const handleSave = () => {
    toast({
      title: "Configuration IA sauvegardée",
      description: "Les paramètres d'import intelligent ont été enregistrés.",
    });
  };

  const handleTestAI = async () => {
    setIsTraining(true);
    toast({
      title: "Test IA en cours",
      description: "L'IA analyse un échantillon de produits...",
    });

    // Simuler le test IA
    setTimeout(() => {
      setTestResults({
        processed: 10,
        improved_titles: 8,
        optimized_descriptions: 9,
        generated_tags: 10,
        seo_score: 0.85,
        quality_score: 0.92,
        time_saved: '2h 15min'
      });
      setIsTraining(false);
      
      toast({
        title: "Test IA terminé",
        description: "L'IA a traité 10 produits avec un score de qualité de 92%.",
      });
    }, 3000);
  };

  const handleStartAIImport = () => {
    toast({
      title: "Import IA démarré",
      description: "L'import automatisé avec intelligence artificielle a été lancé.",
    });
  };

  const toggleLanguage = (langCode: string) => {
    setConfig(prev => ({
      ...prev,
      automation: {
        ...prev.automation,
        target_languages: prev.automation.target_languages.includes(langCode)
          ? prev.automation.target_languages.filter(l => l !== langCode)
          : [...prev.automation.target_languages, langCode]
      }
    }));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/import')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Configuration Import IA</h1>
          <p className="text-muted-foreground">Import automatisé avec intelligence artificielle</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Configuration du moteur IA */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Moteur d'Intelligence Artificielle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ai_model">Modèle IA</Label>
                  <Select value={config.ai_engine.model} onValueChange={(value) => setConfig({
                    ...config,
                    ai_engine: {...config.ai_engine, model: value as any}
                  })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4 (Recommandé)</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      <SelectItem value="claude-3">Claude 3</SelectItem>
                      <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="max_tokens">Tokens maximum</Label>
                  <Input
                    id="max_tokens"
                    type="number"
                    min="500"
                    max="4000"
                    value={config.ai_engine.max_tokens}
                    onChange={(e) => setConfig({
                      ...config,
                      ai_engine: {...config.ai_engine, max_tokens: parseInt(e.target.value)}
                    })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="temperature">Créativité (Temperature): {config.ai_engine.temperature}</Label>
                <Slider
                  value={[config.ai_engine.temperature]}
                  onValueChange={([value]) => setConfig({
                    ...config,
                    ai_engine: {...config.ai_engine, temperature: value}
                  })}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Plus précis</span>
                  <span>Plus créatif</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Automatisation intelligente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Automatisation intelligente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto_categorize">Catégorisation automatique</Label>
                  <Switch
                    id="auto_categorize"
                    checked={config.automation.auto_categorize}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      automation: {...config.automation, auto_categorize: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="auto_optimize_titles">Optimisation des titres</Label>
                  <Switch
                    id="auto_optimize_titles"
                    checked={config.automation.auto_optimize_titles}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      automation: {...config.automation, auto_optimize_titles: checked}
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto_optimize_descriptions">Optimisation descriptions</Label>
                  <Switch
                    id="auto_optimize_descriptions"
                    checked={config.automation.auto_optimize_descriptions}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      automation: {...config.automation, auto_optimize_descriptions: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="auto_generate_tags">Génération de tags</Label>
                  <Switch
                    id="auto_generate_tags"
                    checked={config.automation.auto_generate_tags}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      automation: {...config.automation, auto_generate_tags: checked}
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto_set_pricing">Optimisation des prix</Label>
                  <Switch
                    id="auto_set_pricing"
                    checked={config.automation.auto_set_pricing}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      automation: {...config.automation, auto_set_pricing: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="auto_translate">Traduction automatique</Label>
                  <Switch
                    id="auto_translate"
                    checked={config.automation.auto_translate}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      automation: {...config.automation, auto_translate: checked}
                    })}
                  />
                </div>
              </div>

              {config.automation.auto_translate && (
                <div>
                  <Label>Langues cibles</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableLanguages.map((lang) => (
                      <Button
                        key={lang.code}
                        type="button"
                        size="sm"
                        variant={config.automation.target_languages.includes(lang.code) ? "default" : "outline"}
                        onClick={() => toggleLanguage(lang.code)}
                      >
                        {lang.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="quality_threshold">Seuil de qualité: {config.automation.quality_threshold}</Label>
                <Slider
                  value={[config.automation.quality_threshold]}
                  onValueChange={([value]) => setConfig({
                    ...config,
                    automation: {...config.automation, quality_threshold: value}
                  })}
                  max={1}
                  min={0.5}
                  step={0.05}
                  className="w-full mt-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Optimisation du contenu */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Optimisation du contenu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="seo_optimization">Optimisation SEO</Label>
                <Switch
                  id="seo_optimization"
                  checked={config.content_enhancement.seo_optimization}
                  onCheckedChange={(checked) => setConfig({
                    ...config,
                    content_enhancement: {...config.content_enhancement, seo_optimization: checked}
                  })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="readability">Niveau de lecture</Label>
                  <Select value={config.content_enhancement.readability_target} onValueChange={(value) => setConfig({
                    ...config,
                    content_enhancement: {...config.content_enhancement, readability_target: value as any}
                  })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basique</SelectItem>
                      <SelectItem value="intermediate">Intermédiaire</SelectItem>
                      <SelectItem value="advanced">Avancé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tone">Ton rédactionnel</Label>
                  <Select value={config.content_enhancement.tone} onValueChange={(value) => setConfig({
                    ...config,
                    content_enhancement: {...config.content_enhancement, tone: value as any}
                  })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professionnel</SelectItem>
                      <SelectItem value="casual">Décontracté</SelectItem>
                      <SelectItem value="persuasive">Persuasif</SelectItem>
                      <SelectItem value="technical">Technique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="keyword_density">Densité de mots-clés: {config.content_enhancement.keyword_density}%</Label>
                <Slider
                  value={[config.content_enhancement.keyword_density]}
                  onValueChange={([value]) => setConfig({
                    ...config,
                    content_enhancement: {...config.content_enhancement, keyword_density: value}
                  })}
                  max={5}
                  min={1}
                  step={0.1}
                  className="w-full mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="include_benefits">Inclure les bénéfices</Label>
                  <Switch
                    id="include_benefits"
                    checked={config.content_enhancement.include_benefits}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      content_enhancement: {...config.content_enhancement, include_benefits: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="include_specifications">Inclure les specs</Label>
                  <Switch
                    id="include_specifications"
                    checked={config.content_enhancement.include_specifications}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      content_enhancement: {...config.content_enhancement, include_specifications: checked}
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analyse de marché */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Analyse de marché IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="competitor_analysis">Analyse concurrentielle</Label>
                  <Switch
                    id="competitor_analysis"
                    checked={config.market_analysis.competitor_analysis}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      market_analysis: {...config.market_analysis, competitor_analysis: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="price_optimization">Optimisation prix</Label>
                  <Switch
                    id="price_optimization"
                    checked={config.market_analysis.price_optimization}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      market_analysis: {...config.market_analysis, price_optimization: checked}
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="trend_analysis">Analyse des tendances</Label>
                  <Switch
                    id="trend_analysis"
                    checked={config.market_analysis.trend_analysis}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      market_analysis: {...config.market_analysis, trend_analysis: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="demand_forecasting">Prévision demande</Label>
                  <Switch
                    id="demand_forecasting"
                    checked={config.market_analysis.demand_forecasting}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      market_analysis: {...config.market_analysis, demand_forecasting: checked}
                    })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="profit_margin">Marge bénéficiaire cible: {config.market_analysis.profit_margin_target}%</Label>
                <Slider
                  value={[config.market_analysis.profit_margin_target]}
                  onValueChange={([value]) => setConfig({
                    ...config,
                    market_analysis: {...config.market_analysis, profit_margin_target: value}
                  })}
                  max={100}
                  min={10}
                  step={5}
                  className="w-full mt-2"
                />
              </div>

              <div>
                <Label htmlFor="market_position">Position marché</Label>
                <Select value={config.market_analysis.market_position} onValueChange={(value) => setConfig({
                  ...config,
                  market_analysis: {...config.market_analysis, market_position: value as any}
                })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="budget">Budget/Économique</SelectItem>
                    <SelectItem value="competitive">Compétitif</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Contrôle qualité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Contrôle qualité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="content_moderation">Modération contenu</Label>
                  <Switch
                    id="content_moderation"
                    checked={config.quality_control.content_moderation}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      quality_control: {...config.quality_control, content_moderation: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="fact_checking">Vérification des faits</Label>
                  <Switch
                    id="fact_checking"
                    checked={config.quality_control.fact_checking}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      quality_control: {...config.quality_control, fact_checking: checked}
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="brand_compliance">Conformité marque</Label>
                  <Switch
                    id="brand_compliance"
                    checked={config.quality_control.brand_compliance}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      quality_control: {...config.quality_control, brand_compliance: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="duplicate_detection">Détection doublons</Label>
                  <Switch
                    id="duplicate_detection"
                    checked={config.quality_control.duplicate_detection}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      quality_control: {...config.quality_control, duplicate_detection: checked}
                    })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="quality_minimum">Score qualité minimum: {config.quality_control.quality_score_minimum}</Label>
                <Slider
                  value={[config.quality_control.quality_score_minimum]}
                  onValueChange={([value]) => setConfig({
                    ...config,
                    quality_control: {...config.quality_control, quality_score_minimum: value}
                  })}
                  max={1}
                  min={0.3}
                  step={0.05}
                  className="w-full mt-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panneau latéral */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleSave} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </Button>
              
              <Button 
                onClick={handleTestAI} 
                variant="outline" 
                className="w-full"
                disabled={isTraining}
              >
                <Brain className="w-4 h-4 mr-2" />
                {isTraining ? 'Test en cours...' : 'Tester l\'IA'}
              </Button>
              
              <Button onClick={handleStartAIImport} variant="default" className="w-full">
                <Play className="w-4 h-4 mr-2" />
                Démarrer import IA
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modèle:</span>
                  <Badge variant="outline">{config.ai_engine.model}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Créativité:</span>
                  <span>{config.ai_engine.temperature}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seuil qualité:</span>
                  <span>{Math.round(config.automation.quality_threshold * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SEO:</span>
                  <Badge variant={config.content_enhancement.seo_optimization ? "default" : "secondary"}>
                    {config.content_enhancement.seo_optimization ? "Activé" : "Désactivé"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Traduction:</span>
                  <Badge variant={config.automation.auto_translate ? "default" : "secondary"}>
                    {config.automation.auto_translate ? `${config.automation.target_languages.length} langues` : "Désactivée"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {testResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Résultats du test
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Produits traités:</span>
                    <span className="text-green-600">{testResults.processed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Titres optimisés:</span>
                    <span className="text-blue-600">{testResults.improved_titles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Descriptions améliorées:</span>
                    <span className="text-blue-600">{testResults.optimized_descriptions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Score SEO:</span>
                    <Badge variant="default">{Math.round(testResults.seo_score * 100)}%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Score qualité:</span>
                    <Badge variant="default">{Math.round(testResults.quality_score * 100)}%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Temps économisé:</span>
                    <span className="text-green-600">{testResults.time_saved}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIImportConfig;