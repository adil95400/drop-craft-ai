import { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface ImportZoneProps {
  onFileSelect: (file: File) => void;
  acceptedFormats?: string[];
  maxSize?: number; // in MB
  disabled?: boolean;
}

export function ImportZone({
  onFileSelect,
  acceptedFormats = ['.csv', '.json', '.xlsx', '.xls'],
  maxSize = 10,
  disabled = false,
}: ImportZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): boolean => {
    setError(null);

    // Check format
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(extension)) {
      setError(`Format non supporté. Formats acceptés : ${acceptedFormats.join(', ')}`);
      return false;
    }

    // Check size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSize) {
      setError(`Fichier trop volumineux. Taille maximale : ${maxSize}MB`);
      return false;
    }

    return true;
  }, [acceptedFormats, maxSize]);

  const handleFile = useCallback((file: File) => {
    if (validateFile(file)) {
      onFileSelect(file);
    }
  }, [validateFile, onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [disabled, handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <Card
      className={cn(
        "relative border-2 border-dashed transition-all duration-200",
        isDragging && !disabled && "border-primary bg-primary/5 scale-[1.02]",
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && "hover:border-primary/50 cursor-pointer",
        error && "border-destructive"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <label
        className={cn(
          "flex flex-col items-center justify-center p-8 gap-4",
          !disabled && "cursor-pointer"
        )}
      >
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
          isDragging ? "bg-primary/20" : "bg-muted"
        )}>
          {error ? (
            <AlertCircle className="w-8 h-8 text-destructive" />
          ) : isDragging ? (
            <Upload className="w-8 h-8 text-primary animate-bounce" />
          ) : (
            <FileText className="w-8 h-8 text-muted-foreground" />
          )}
        </div>

        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">
            {isDragging ? 'Déposez le fichier ici' : 'Importer un fichier'}
          </p>
          <p className="text-sm text-muted-foreground">
            Glissez-déposez ou cliquez pour sélectionner
          </p>
          <p className="text-xs text-muted-foreground">
            Formats : {acceptedFormats.join(', ')} • Max {maxSize}MB
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive font-medium">
            {error}
          </p>
        )}

        <input
          type="file"
          className="hidden"
          accept={acceptedFormats.join(',')}
          onChange={handleFileInput}
          disabled={disabled}
        />
      </label>
    </Card>
  );
}
