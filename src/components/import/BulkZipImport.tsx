import React, { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileArchive, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { importJobsApi } from '@/services/api/client'
import { productionLogger } from '@/utils/productionLogger'

interface ImportJob {
  id: string
  filename: string
  status: 'processing' | 'completed' | 'failed'
  progress: number
  totalFiles: number
  processedFiles: number
  errors: string[]
}

export const BulkZipImport = () => {
  const { toast } = useToast()
  const [jobs, setJobs] = useState<ImportJob[]>([])
  const [uploading, setUploading] = useState(false)

  const onDrop = async (acceptedFiles: File[]) => {
    const zipFile = acceptedFiles[0]
    if (!zipFile) return

    if (!zipFile.name.endsWith('.zip')) {
      toast({
        title: "Format invalide",
        description: "Veuillez sélectionner un fichier ZIP",
        variant: "destructive"
      })
      return
    }

    setUploading(true)
    
    try {
      // Upload the ZIP file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('imports')
        .upload(`bulk-imports/${Date.now()}-${zipFile.name}`, zipFile)

      if (uploadError) throw uploadError

      // Create import job via API V1
      const jobResp = await importJobsApi.create({
        source: 'bulk_zip',
        settings: {
          filename: zipFile.name,
          size: zipFile.size,
          type: 'application/zip',
          source_url: uploadData.path
        }
      })

      const jobId = jobResp.job_id

      // Process the ZIP file using edge function
      const { data: processData, error: processError } = await supabase.functions.invoke('bulk-zip-import', {
        body: {
          filePath: uploadData.path,
          jobId: jobId
        }
      })

      if (processError) throw processError

      const newJob: ImportJob = {
        id: jobId,
        filename: zipFile.name,
        status: 'processing',
        progress: 0,
        totalFiles: processData.totalFiles || 0,
        processedFiles: 0,
        errors: []
      }

      setJobs(prev => [newJob, ...prev])

      toast({
        title: "Import démarré",
        description: `Traitement de ${zipFile.name} en cours...`
      })

    } catch (error) {
      productionLogger.error('Bulk import failed', error as Error, 'BulkZipImport');
      toast({
        title: "Erreur d'import",
        description: "Impossible de démarrer l'import en masse",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip']
    },
    maxFiles: 1
  })

  const getStatusIcon = (status: ImportJob['status']) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusText = (status: ImportJob['status']) => {
    switch (status) {
      case 'processing':
        return 'En cours'
      case 'completed':
        return 'Terminé'
      case 'failed':
        return 'Échec'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileArchive className="h-5 w-5" />
            Import en masse via ZIP
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-primary font-medium">Déposez le fichier ZIP ici...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">Glissez-déposez votre fichier ZIP</p>
                <p className="text-muted-foreground mb-4">
                  ou cliquez pour sélectionner un fichier
                </p>
                <Button variant="outline" disabled={uploading}>
                  {uploading ? 'Upload en cours...' : 'Sélectionner un fichier'}
                </Button>
              </div>
            )}
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p><strong>Format supporté :</strong> Fichiers ZIP contenant des CSV ou XML</p>
            <p><strong>Structure attendue :</strong> products.csv, inventory.csv, images/</p>
          </div>
        </CardContent>
      </Card>

      {jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historique des imports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(job.status)}
                      <span className="font-medium">{job.filename}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {getStatusText(job.status)}
                    </span>
                  </div>
                  
                  {job.status === 'processing' && (
                    <div className="space-y-2">
                      <Progress value={job.progress} className="w-full" />
                      <p className="text-sm text-muted-foreground">
                        {job.processedFiles} / {job.totalFiles} fichiers traités
                      </p>
                    </div>
                  )}
                  
                  {job.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-destructive mb-1">Erreurs :</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {job.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}