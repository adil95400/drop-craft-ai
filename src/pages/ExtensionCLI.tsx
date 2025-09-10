import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Terminal, 
  Download, 
  Play, 
  Square,
  Copy,
  Settings,
  BookOpen,
  Zap,
  Package,
  GitBranch,
  Code2,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ExternalLink
} from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { toast } from 'sonner'

interface CLICommand {
  command: string
  description: string
  category: 'basic' | 'extension' | 'deploy' | 'debug'
}

const cliCommands: CLICommand[] = [
  { command: 'dc-cli --version', description: 'Affiche la version du CLI', category: 'basic' },
  { command: 'dc-cli init', description: 'Initialise un nouveau projet d\'extension', category: 'extension' },
  { command: 'dc-cli create [name]', description: 'Crée une nouvelle extension', category: 'extension' },
  { command: 'dc-cli dev', description: 'Lance le serveur de développement', category: 'extension' },
  { command: 'dc-cli build', description: 'Compile l\'extension pour production', category: 'extension' },
  { command: 'dc-cli test', description: 'Exécute les tests de l\'extension', category: 'debug' },
  { command: 'dc-cli lint', description: 'Vérifie la qualité du code', category: 'debug' },
  { command: 'dc-cli publish', description: 'Publie l\'extension sur le marketplace', category: 'deploy' },
  { command: 'dc-cli deploy', description: 'Déploie l\'extension', category: 'deploy' },
  { command: 'dc-cli login', description: 'Se connecter à Drop Craft AI', category: 'basic' },
  { command: 'dc-cli logout', description: 'Se déconnecter', category: 'basic' },
  { command: 'dc-cli config list', description: 'Liste la configuration actuelle', category: 'basic' }
]

const terminalHistory = [
  '$ dc-cli --version',
  'Drop Craft CLI v2.1.4',
  '$ dc-cli login',
  '✓ Connecté en tant que developer@example.com',
  '$ dc-cli init my-extension',
  '✓ Projet initialisé dans ./my-extension',
  '$ cd my-extension && dc-cli dev',
  '🚀 Serveur de développement démarré sur http://localhost:3001',
  '✓ Extension rechargée automatiquement',
  ''
]

export default function ExtensionCLI() {
  const [command, setCommand] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [output, setOutput] = useState<string[]>(terminalHistory)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [output])

  const executeCommand = async () => {
    if (!command.trim() || isRunning) return

    setIsRunning(true)
    const newOutput = [...output, `$ ${command}`]
    setOutput(newOutput)

    // Simulate command execution
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mock responses based on command
    let response = ''
    if (command.includes('--version')) {
      response = 'Drop Craft CLI v2.1.4'
    } else if (command.includes('login')) {
      response = '✓ Connecté avec succès'
    } else if (command.includes('init')) {
      response = '✓ Projet d\'extension initialisé'
    } else if (command.includes('build')) {
      response = '✓ Extension compilée avec succès'
    } else if (command.includes('test')) {
      response = '✓ Tous les tests passés (12/12)'
    } else if (command.includes('publish')) {
      response = '✓ Extension publiée sur le marketplace'
    } else {
      response = `Command '${command}' executed successfully`
    }

    setOutput(prev => [...prev, response, ''])
    setCommand('')
    setIsRunning(false)
  }

  const clearTerminal = () => {
    setOutput(['$ # Terminal effacé', ''])
  }

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd)
    toast.success('Commande copiée dans le presse-papiers')
  }

  const filteredCommands = selectedCategory === 'all' 
    ? cliCommands 
    : cliCommands.filter(cmd => cmd.category === selectedCategory)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-background">
      <Helmet>
        <title>CLI Extensions - Drop Craft AI</title>
        <meta name="description" content="Interface en ligne de commande pour développer et gérer vos extensions Drop Craft AI." />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-terminal/10 rounded-full border">
            <Terminal className="w-5 h-5" />
            <span className="font-mono font-medium">Drop Craft CLI</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-terminal to-terminal/60 bg-clip-text text-transparent">
            Interface en Ligne de Commande
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Développez, testez et déployez vos extensions avec notre CLI puissant et intuitif.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Terminal Simulator */}
          <div className="space-y-4">
            <Card className="bg-black/95 border-terminal/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <span className="font-mono text-sm text-white/70">
                      drop-craft-cli
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearTerminal}
                    className="text-white/50 hover:text-white"
                  >
                    Effacer
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea 
                  ref={terminalRef}
                  className="h-80 px-4 pb-4"
                >
                  <div className="font-mono text-sm space-y-1">
                    {output.map((line, idx) => (
                      <div 
                        key={idx} 
                        className={`${
                          line.startsWith('$') 
                            ? 'text-green-400' 
                            : line.startsWith('✓')
                            ? 'text-green-300'
                            : line.startsWith('✗')
                            ? 'text-red-300'
                            : 'text-white/80'
                        }`}
                      >
                        {line}
                      </div>
                    ))}
                    {isRunning && (
                      <div className="text-white/60 animate-pulse">
                        Exécution en cours...
                      </div>
                    )}
                  </div>
                </ScrollArea>
                <div className="border-t border-terminal/20 p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-mono text-sm">$</span>
                    <Input
                      value={command}
                      onChange={(e) => setCommand(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && executeCommand()}
                      placeholder="Tapez votre commande..."
                      className="bg-transparent border-none text-white font-mono text-sm focus:ring-0 focus:border-none px-0"
                      disabled={isRunning}
                    />
                    <Button 
                      size="sm" 
                      onClick={executeCommand}
                      disabled={isRunning || !command.trim()}
                      className="bg-terminal hover:bg-terminal/80"
                    >
                      {isRunning ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <Download className="w-8 h-8 text-primary mx-auto mb-2" />
                  <h3 className="font-semibold text-sm">Installer CLI</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    npm install -g @dropcraft/cli
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    <Copy className="w-3 h-3 mr-1" />
                    Copier
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-sm">Documentation</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Guide complet du CLI
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Ouvrir
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Commands Reference */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="w-5 h-5" />
                  Référence des Commandes
                </CardTitle>
                <CardDescription>
                  Liste complète des commandes disponibles
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Category Filter */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {['all', 'basic', 'extension', 'deploy', 'debug'].map(category => (
                    <Badge
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category === 'all' ? 'Toutes' : 
                       category === 'basic' ? 'Base' :
                       category === 'extension' ? 'Extension' :
                       category === 'deploy' ? 'Déploiement' : 'Debug'}
                    </Badge>
                  ))}
                </div>

                <ScrollArea className="h-80">
                  <div className="space-y-3">
                    {filteredCommands.map((cmd, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
                      >
                        <div className="flex-1">
                          <code className="text-sm font-mono text-terminal bg-black/10 px-2 py-1 rounded">
                            {cmd.command}
                          </code>
                          <p className="text-xs text-muted-foreground mt-1">
                            {cmd.description}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyCommand(cmd.command)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setCommand(cmd.command)}
                          >
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Getting Started */}
        <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Commencer avec le CLI</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Suivez ces étapes simples pour créer votre première extension avec notre CLI.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div className="text-center space-y-3">
                  <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto">
                    <Download className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">1. Installation</h3>
                  <code className="block text-sm bg-black/10 p-2 rounded">
                    npm install -g @dropcraft/cli
                  </code>
                </div>

                <div className="text-center space-y-3">
                  <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">2. Initialisation</h3>
                  <code className="block text-sm bg-black/10 p-2 rounded">
                    dc-cli init mon-extension
                  </code>
                </div>

                <div className="text-center space-y-3">
                  <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">3. Développement</h3>
                  <code className="block text-sm bg-black/10 p-2 rounded">
                    dc-cli dev
                  </code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}