import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Terminal, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function ExtensionsCLI() {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(id);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const commands = [
    {
      id: 'install',
      title: 'Installation',
      command: 'npm install -g dropcraft-cli',
      description: 'Installer le CLI globalement'
    },
    {
      id: 'login',
      title: 'Connexion',
      command: 'dropcraft login',
      description: 'Se connecter à votre compte'
    },
    {
      id: 'deploy',
      title: 'Déploiement',
      command: 'dropcraft deploy',
      description: 'Déployer vos modifications'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Outils CLI</h1>
        <p className="text-muted-foreground mt-2">
          Gérez vos extensions en ligne de commande
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Terminal className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Guide de démarrage</h2>
        </div>
        <div className="space-y-4">
          {commands.map((cmd) => (
            <div key={cmd.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{cmd.title}</h3>
                  <p className="text-sm text-muted-foreground">{cmd.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
                <code className="flex-1">{cmd.command}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(cmd.command, cmd.id)}
                >
                  {copiedCommand === cmd.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
