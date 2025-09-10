import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertCircle, Info, CheckCircle, XCircle, Search, Download, Filter, RefreshCw } from 'lucide-react'

export default function LogsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [logLevel, setLogLevel] = useState('all')

  const logs = [
    {
      timestamp: '2024-01-15 14:32:15',
      level: 'error',
      extension: 'Data Scraper Pro',
      message: 'Failed to connect to API endpoint: timeout after 5000ms',
      details: 'Request to https://api.example.com/data failed with ENOTFOUND'
    },
    {
      timestamp: '2024-01-15 14:31:42',
      level: 'warning',
      extension: 'Review Importer',
      message: 'Rate limit approaching: 95/100 requests used',
      details: 'Consider implementing request throttling'
    },
    {
      timestamp: '2024-01-15 14:30:18',
      level: 'info',
      extension: 'Price Monitor',
      message: 'Successfully scraped 245 products from marketplace',
      details: 'Processing completed in 2.3 seconds'
    },
    {
      timestamp: '2024-01-15 14:29:55',
      level: 'success',
      extension: 'SEO Optimizer',
      message: 'Metadata optimization completed for 12 pages',
      details: 'Average improvement: +15% SEO score'
    }
  ]

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />
      case 'warning': return <AlertCircle className="w-4 h-4 text-orange-500" />
      case 'info': return <Info className="w-4 h-4 text-blue-500" />
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
      default: return <Info className="w-4 h-4" />
    }
  }

  const getLevelBadge = (level: string) => {
    const variants = {
      error: 'destructive' as const,
      warning: 'secondary' as const,
      info: 'outline' as const,
      success: 'default' as const
    }
    return <Badge variant={variants[level as keyof typeof variants] || 'outline'}>{level.toUpperCase()}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Logs des Extensions
          </h1>
          <p className="text-muted-foreground mt-2">
            Surveillez l'activité et diagnostiquez les problèmes de vos extensions
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Logs en Temps Réel</CardTitle>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher dans les logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={logLevel} onValueChange={setLogLevel}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="error">Erreurs</SelectItem>
                  <SelectItem value="warning">Warnings</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Succès</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {logs.map((log, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  {getLogIcon(log.level)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-mono text-muted-foreground">{log.timestamp}</span>
                      {getLevelBadge(log.level)}
                      <Badge variant="outline" className="text-xs">{log.extension}</Badge>
                    </div>
                    <p className="text-sm font-medium">{log.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}