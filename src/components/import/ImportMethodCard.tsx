import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Settings, CheckCircle, AlertCircle, Infinity } from 'lucide-react';
import { toast } from 'sonner';

interface ImportMethodCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isActive?: boolean;
  isConnected?: boolean;
  onTest: () => void;
  onConfigure: () => void;
  testLoading?: boolean;
}

export const ImportMethodCard = ({ 
  id, 
  title, 
  description, 
  icon, 
  isActive = true, 
  isConnected = false, 
  onTest, 
  onConfigure,
  testLoading = false
}: ImportMethodCardProps) => {
  const handleTest = () => {
    if (!isActive) {
      toast.error('Cette méthode d\'import n\'est pas encore disponible');
      return;
    }
    onTest();
  };

  const handleConfigure = () => {
    if (!isActive) {
      toast.error('Configuration non disponible pour cette méthode');
      return;
    }
    onConfigure();
  };

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-lg group">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 opacity-95" />
      
      {/* Content */}
      <CardContent className="relative p-6 text-white">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-blue-400 text-xl">
              {icon}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">{title}</h3>
              <p className="text-gray-300 text-sm mt-1">{description}</p>
            </div>
          </div>
          
          {/* Status badges */}
          <div className="flex flex-col gap-2">
            {isConnected && (
              <Badge className="bg-green-600 text-white">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connecté
              </Badge>
            )}
            <Badge className="bg-green-600 text-white">
              <Infinity className="w-3 h-3 mr-1" />
              Actif
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={testLoading}
            className="bg-black/20 border-gray-600 text-white hover:bg-black/40 hover:text-white"
          >
            <Eye className="w-4 h-4 mr-2" />
            Tester
          </Button>
          
          <Button
            size="sm"
            onClick={handleConfigure}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};