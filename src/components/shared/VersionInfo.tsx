import { VERSION_INFO, isStaging, isProduction } from '@/config/version';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, GitCommit, Calendar, Globe } from 'lucide-react';

export function VersionInfo() {
  const staging = isStaging();
  const production = isProduction();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          À propos
        </CardTitle>
        <CardDescription>
          Informations sur la version de l'application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {staging && (
          <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
            <p className="text-sm text-warning font-medium">
              ⚠️ Environnement de staging - Cette version peut contenir des fonctionnalités en cours de développement.
            </p>
          </div>
        )}
        
        <div className="grid gap-3">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Environnement
            </span>
            <Badge variant={production ? 'default' : staging ? 'secondary' : 'outline'}>
              {VERSION_INFO.environment.toUpperCase()}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">Version</span>
            <span className="font-mono text-sm">{VERSION_INFO.version}</span>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <GitCommit className="h-4 w-4" />
              Commit SHA
            </span>
            <span className="font-mono text-sm">
              {VERSION_INFO.sha === 'dev' ? 'N/A' : VERSION_INFO.sha.slice(0, 7)}
            </span>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date de build
            </span>
            <span className="text-sm">
              {new Date(VERSION_INFO.buildDate).toLocaleString('fr-FR')}
            </span>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Version complète</span>
            <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
              {VERSION_INFO.fullVersion}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
