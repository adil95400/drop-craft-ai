import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileSpreadsheet, Link as LinkIcon, Database, Code, Settings, Globe } from 'lucide-react'
import CSVImportPage from './CSVImportPage'
import URLImportPage from './URLImportPage'
import APIImportPage from './APIImportPage'
import DatabaseImportPage from './DatabaseImportPage'

export default function ImportConfigPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Configurations d'Import</h1>
        <p className="text-muted-foreground">
          Configurez vos sources d'import par type
        </p>
      </div>

      <Tabs defaultValue="csv" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="csv" className="gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            CSV
          </TabsTrigger>
          <TabsTrigger value="url" className="gap-2">
            <LinkIcon className="w-4 h-4" />
            URL
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-2">
            <Code className="w-4 h-4" />
            API
          </TabsTrigger>
          <TabsTrigger value="database" className="gap-2">
            <Database className="w-4 h-4" />
            Database
          </TabsTrigger>
          <TabsTrigger value="xml" className="gap-2">
            <Settings className="w-4 h-4" />
            XML
          </TabsTrigger>
          <TabsTrigger value="ftp" className="gap-2">
            <Globe className="w-4 h-4" />
            FTP
          </TabsTrigger>
        </TabsList>

        <TabsContent value="csv">
          <CSVImportPage />
        </TabsContent>

        <TabsContent value="url">
          <URLImportPage />
        </TabsContent>

        <TabsContent value="api">
          <APIImportPage />
        </TabsContent>

        <TabsContent value="database">
          <DatabaseImportPage />
        </TabsContent>

        <TabsContent value="xml">
          <Card>
            <CardHeader>
              <CardTitle>Import XML</CardTitle>
              <CardDescription>Configuration pour imports XML</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Configuration XML à venir...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ftp">
          <Card>
            <CardHeader>
              <CardTitle>Import FTP</CardTitle>
              <CardDescription>Configuration pour imports FTP</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Configuration FTP à venir...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
