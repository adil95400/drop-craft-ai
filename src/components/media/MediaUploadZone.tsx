import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  Image, 
  Video, 
  File, 
  X, 
  Eye,
  Download,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { logError } from '@/utils/consoleCleanup';

interface UploadedFile {
  id: string
  file: File
  url?: string
  progress?: number
  status: 'uploading' | 'uploaded' | 'error'
  type: 'image' | 'video' | 'document'
}

interface MediaUploadZoneProps {
  onFilesUploaded?: (files: UploadedFile[]) => void
  maxFiles?: number
  acceptedTypes?: string[]
  maxSize?: number // en MB
  showPreview?: boolean
}

const getFileType = (file: File): 'image' | 'video' | 'document' => {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  return 'document'
}

const getFileIcon = (type: 'image' | 'video' | 'document') => {
  switch (type) {
    case 'image': return Image
    case 'video': return Video
    default: return File
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function MediaUploadZone({
  onFilesUploaded,
  maxFiles = 10,
  acceptedTypes = ['image/*', 'video/*', '.pdf', '.doc', '.docx'],
  maxSize = 50, // 50MB par défaut
  showPreview = true
}: MediaUploadZoneProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const uploadToSupabase = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `media/${fileName}`

      const { data, error } = await supabase.storage
        .from('campaign-media')
        .upload(filePath, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('campaign-media')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      logError(error as Error, 'File upload error')
      return null
    }
  }

  const handleFileUpload = useCallback(async (files: File[]) => {
    if (files.length + uploadedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} fichiers autorisés`)
      return
    }

    setIsUploading(true)
    const newFiles: UploadedFile[] = files.map(file => ({
      id: Math.random().toString(36).substring(2),
      file,
      progress: 0,
      status: 'uploading' as const,
      type: getFileType(file)
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])

    // Upload en parallèle avec gestion du progrès
    const uploadPromises = newFiles.map(async (uploadFile) => {
      try {
        // Simulation du progrès
        let progress = 0
        const progressInterval = setInterval(() => {
          progress += Math.random() * 30
          if (progress > 90) {
            clearInterval(progressInterval)
            progress = 90
          }
          
          setUploadedFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, progress }
              : f
          ))
        }, 500)

        const url = await uploadToSupabase(uploadFile.file)
        clearInterval(progressInterval)

        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { 
                ...f, 
                url, 
                progress: 100, 
                status: url ? 'uploaded' : 'error'
              }
            : f
        ))

        return { ...uploadFile, url, status: url ? 'uploaded' as const : 'error' as const }
      } catch (error) {
        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'error' as const }
            : f
        ))
        return { ...uploadFile, status: 'error' as const }
      }
    })

    const results = await Promise.all(uploadPromises)
    setIsUploading(false)

    const successFiles = results.filter(f => f.status === 'uploaded')
    if (onFilesUploaded && successFiles.length > 0) {
      onFilesUploaded(successFiles)
    }

    toast.success(`${successFiles.length} fichier(s) uploadé(s) avec succès`)
  }, [uploadedFiles.length, maxFiles, onFilesUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as Record<string, string[]>),
    maxSize: maxSize * 1024 * 1024,
    disabled: isUploading
  })

  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }, [])

  const previewFile = useCallback((file: UploadedFile) => {
    if (file.url) {
      window.open(file.url, '_blank')
    } else if (file.type === 'image') {
      const url = URL.createObjectURL(file.file)
      window.open(url, '_blank')
    }
  }, [])

  return (
    <div className="space-y-4">
      {/* Zone de drop */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
              ${isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }
              ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">
                  {isDragActive 
                    ? 'Déposez vos fichiers ici...' 
                    : 'Glissez-déposez vos fichiers ou cliquez pour sélectionner'
                  }
                </h3>
                <p className="text-sm text-muted-foreground">
                  Images, vidéos et documents acceptés • Maximum {maxSize}MB par fichier
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="secondary">JPG, PNG, GIF</Badge>
                <Badge variant="secondary">MP4, AVI, MOV</Badge>
                <Badge variant="secondary">PDF, DOC, DOCX</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des fichiers uploadés */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <File className="h-4 w-4" />
              Fichiers ({uploadedFiles.length}/{maxFiles})
            </h4>
            
            <div className="space-y-3">
              {uploadedFiles.map((file) => {
                const FileIcon = getFileIcon(file.type)
                
                return (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center
                      ${file.status === 'uploaded' ? 'bg-green-100 text-green-600' :
                        file.status === 'error' ? 'bg-red-100 text-red-600' :
                        'bg-primary/10 text-primary'
                      }
                    `}>
                      <FileIcon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.file.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatFileSize(file.file.size)}</span>
                        <Badge 
                          variant={
                            file.status === 'uploaded' ? 'default' :
                            file.status === 'error' ? 'destructive' :
                            'secondary'
                          }
                        >
                          {file.status === 'uploaded' ? 'Uploadé' :
                           file.status === 'error' ? 'Erreur' :
                           'En cours...'}
                        </Badge>
                      </div>
                      
                      {file.status === 'uploading' && file.progress !== undefined && (
                        <Progress value={file.progress} className="mt-2 h-1" />
                      )}
                    </div>

                    <div className="flex gap-1">
                      {file.status === 'uploaded' && showPreview && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => previewFile(file)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(file.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}