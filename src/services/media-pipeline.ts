/**
 * Service client pour le Media Pipeline Processor
 * Gère l'upload, le batch, les variantes et les stats via Cloudinary
 */
import { supabase } from '@/integrations/supabase/client';

const FUNCTION_NAME = 'media-pipeline-processor';

interface UploadOptions {
  imageData: string; // base64 ou URL
  productId?: string;
  fileName?: string;
  folder?: string;
  tags?: string[];
}

interface BatchUploadOptions {
  images: string[];
  productId?: string;
  folder?: string;
  tags?: string[];
}

interface PipelineStats {
  totalAssets: number;
  totalOriginalSize: number;
  totalOptimizedSize: number;
  savedBytes: number;
  savedPercent: number;
  averageOptimizationScore: number;
  pipelineStats: Record<string, number>;
}

interface CloudinaryResult {
  public_id: string;
  url: string;
  cdn_url: string;
  thumbnail: string;
  srcset: string;
  variants_count: number;
  optimization_score: number;
}

interface UploadResult {
  success: boolean;
  asset: any;
  cloudinary: CloudinaryResult;
}

interface BatchResult {
  success: boolean;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  results: Array<{ success: boolean; asset?: any; error?: string; imageUrl?: string }>;
}

async function callPipeline<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body,
  });

  if (error) {
    throw new Error(`Pipeline error: ${error.message}`);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as T;
}

/**
 * Upload une image vers le pipeline Cloudinary
 */
export async function uploadMedia(options: UploadOptions): Promise<UploadResult> {
  return callPipeline<UploadResult>({
    action: 'upload',
    ...options,
  });
}

/**
 * Upload par lot (max 50 images)
 */
export async function batchUploadMedia(options: BatchUploadOptions): Promise<BatchResult> {
  return callPipeline<BatchResult>({
    action: 'batch_upload',
    ...options,
  });
}

/**
 * Générer des variantes responsive pour un asset existant
 */
export async function generateVariants(
  mediaAssetId: string, 
  widths?: number[]
): Promise<{ success: boolean; variants: Array<{ url: string; width: number }> }> {
  return callPipeline({
    action: 'generate_variants',
    mediaAssetId,
    widths,
  });
}

/**
 * Obtenir les statistiques du pipeline média
 */
export async function getMediaPipelineStats(): Promise<PipelineStats> {
  return callPipeline<PipelineStats>({
    action: 'stats',
  });
}

/**
 * Convertir un fichier en base64 pour l'upload
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Formater la taille d'un fichier
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
