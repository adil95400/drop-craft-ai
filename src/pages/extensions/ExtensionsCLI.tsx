import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Terminal, Copy, Check, Code, ArrowRight, ExternalLink, Zap, Settings, Upload, Download, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function ExtensionsCLI() {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const navigate = useNavigate();

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(id);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const commands = [
    {
      id: 'install',
      title: 'Installation',
      command: 'npm install -g @shopopti/cli',
      description: 'Installer le CLI globalement sur votre machine',
      icon: <Download className="h-5 w-5" />
    },
    {
      id: 'login',
      title: 'Connexion',
      command: 'shopopti login',
      description: 'Se connecter à votre compte ShopOpti',
      icon: <Zap className="h-5 w-5" />
    },
    {
      id: 'init',
      title: 'Initialisation',
      command: 'shopopti init my-extension',
      description: 'Créer un nouveau projet d\'extension',
      icon: <Code className="h-5 w-5" />
    },
    {
      id: 'dev',
      title: 'Développement',
      command: 'shopopti dev',
      description: 'Lancer le serveur de développement avec hot-reload',
      icon: <RefreshCw className="h-5 w-5" />
    },
    {
      id: 'build',
      title: 'Compilation',
      command: 'shopopti build',
      description: 'Compiler l\'extension pour la production',
      icon: <Settings className="h-5 w-5" />
    },
    {
      id: 'deploy',
      title: 'Déploiement',
      command: 'shopopti deploy',
      description: 'Déployer votre extension sur le marketplace',
      icon: <Upload className="h-5 w-5" />
    },
    {
      id: 'test',
      title: 'Tests',
      command: 'shopopti test',
      description: 'Exécuter les tests automatisés',
      icon: <Check className="h-5 w-5" />
    },
    {
      id: 'logs',
      title: 'Logs',
      command: 'shopopti logs --tail',
      description: 'Afficher les logs en temps réel',
      icon: <Terminal className="h-5 w-5" />
    }
  ];

  const advancedCommands = [
    {
      command: 'shopopti config set api-key <KEY>',
      description: 'Configurer votre clé API'
    },
    {
      command: 'shopopti extension list',
      description: 'Lister toutes vos extensions'
    },
    {
      command: 'shopopti extension publish --version 1.0.0',
      description: 'Publier une version spécifique'
    },
    {
      command: 'shopopti doctor',
      description: 'Diagnostiquer les problèmes de configuration'
    }
  ];

  return (
    <ChannablePageWrapper
      title="Outils CLI ShopOpti"
      subtitle="Ligne de Commande"
      description="Développez et déployez vos extensions en ligne de commande avec notre CLI puissant et flexible."
      heroImage="extensions"
      badge={{
        label: "Pro",
        icon: Terminal
      }}
      actions={
        <Button onClick={() => navigate('/extensions/developer')}>
          <Code className="h-4 w-4 mr-2" />
          Documentation Développeur
        </Button>
      }
    >
      {/* Quick Install */}
      <Card className="p-6 border-primary/20 bg-gradient-to-r from-primary/5 to-blue-500/5">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1">
            <Badge className="mb-2">Installation Rapide</Badge>
            <h3 className="text-xl font-semibold mb-2">Installez le CLI en une commande</h3>
            <p className="text-muted-foreground">
              Commencez à développer des extensions en quelques secondes
            </p>
          </div>
          <div className="flex items-center gap-2 p-4 bg-slate-900 rounded-lg font-mono text-sm text-white">
            <code>npm install -g @shopopti/cli</code>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={() => copyToClipboard('npm install -g @shopopti/cli', 'quick-install')}
            >
              {copiedCommand === 'quick-install' ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Commands Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {commands.map((cmd) => (
          <Card key={cmd.id} className="p-4 border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                {cmd.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{cmd.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{cmd.description}</p>
                <div className="flex items-center gap-2 p-2 bg-muted rounded-lg font-mono text-sm">
                  <code className="flex-1 text-xs">{cmd.command}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard(cmd.command, cmd.id)}
                  >
                    {copiedCommand === cmd.id ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Advanced Commands */}
      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Commandes Avancées</h2>
        </div>
        <div className="space-y-3">
          {advancedCommands.map((cmd, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex-1">
                <code className="font-mono text-sm">{cmd.command}</code>
                <p className="text-xs text-muted-foreground mt-1">{cmd.description}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(cmd.command, `adv-${index}`)}
              >
                {copiedCommand === `adv-${index}` ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Links */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card 
          className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => navigate('/extensions/developer')}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <Code className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Developer Portal</h3>
              <p className="text-sm text-muted-foreground">SDK, API et exemples</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>
        <Card 
          className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => navigate('/extensions/documentation')}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <ExternalLink className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Documentation</h3>
              <p className="text-sm text-muted-foreground">Guide complet du CLI</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>
      </div>
    </ChannablePageWrapper>
  );
}
