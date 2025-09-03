import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Link, FileText, Server, Calendar, Zap } from 'lucide-react';

const ImportAdvanced: React.FC = () => {
  const importMethods = [
    {
      id: 'url',
      title: 'Import par URL',
      description: 'Importez directement depuis une URL de produit',
      icon: Link,
      action: () => window.location.href = '/import/url-config'
    },
    {
      id: 'xml',
      title: 'Import XML',
      description: 'Flux XML/RSS compatibles Google Shopping',
      icon: FileText,
      action: () => window.location.href = '/import/xml-config'
    },
    {
      id: 'ftp',
      title: 'Import FTP/SFTP',
      description: 'Connexion automatique aux serveurs FTP',
      icon: Server,
      action: () => window.location.href = '/import/ftp-config'
    },
    {
      id: 'scheduled',
      title: 'Import Programmé',
      description: 'Planifiez vos imports automatiques',
      icon: Calendar,
      action: () => window.location.href = '/import/scheduled-config'
    },
    {
      id: 'bulk',
      title: 'Import en Masse',
      description: 'Traitez plusieurs fichiers simultanément',
      icon: Upload,
      action: () => window.location.href = '/import/bulk-config'
    },
    {
      id: 'ai',
      title: 'Import IA',
      description: 'Import automatisé avec intelligence artificielle',
      icon: Zap,
      action: () => window.location.href = '/import/ai-config'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {importMethods.map((method) => {
        const Icon = method.icon;
        return (
          <Card key={method.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-lg">{method.title}</CardTitle>
              <CardDescription>{method.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={method.action}
                className="w-full"
                variant="outline"
              >
                Configurer
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ImportAdvanced;