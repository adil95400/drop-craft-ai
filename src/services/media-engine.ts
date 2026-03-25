/**
 * Media Engine Service — Phase 1 Client
 * Calls the media-engine edge function
 */
import { supabase } from '@/integrations/supabase/client';

const FN = 'media-engine';

interface MediaScoreBreakdown {
  imageCount: { score: number; max: number; label: string };
  resolution: { score: number; max: number; label: string };
  diversity: { score: number; max: number; label: string };
  quality: { score: number; max: number; label: string };
}

export interface MediaAsset {
  id: string;
  url: string;
  original_url: string;
  source: string;
  asset_type: string;
  image_type?: string;
  is_primary: boolean;
  width?: number;
  height?: number;
  position: number;
}

export interface MediaStatus {
  exists: boolean;
  mediaSetId?: string;
  score: number;
  status: 'ready_to_publish' | 'needs_enrichment' | 'blocked';
  totalAssets: number;
  breakdown: MediaScoreBreakdown | null;
  assets: MediaAsset[];
  lastEnrichedAt?: string;
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(FN, { body });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data as T;
}

/** Collect images from product data into media engine */
export function collectMedia(productId: string) {
  return call<{ success: boolean; score: number; status: string; totalAssets: number; newAssetsAdded: number }>({
    action: 'collect',
    productId,
  });
}

/** Compute/update media score */
export function scoreMedia(productId: string) {
  return call<{ success: boolean; score: number; status: string; breakdown: MediaScoreBreakdown }>({
    action: 'score',
    productId,
  });
}

/** Search for similar images online */
export function searchSimilarImages(productId: string) {
  return call<{ success: boolean; foundImages: number; newImagesAdded: number; score: number; status: string }>({
    action: 'search_similar',
    productId,
  });
}

/** Remove duplicate images */
export function deduplicateMedia(productId: string) {
  return call<{ success: boolean; removed: number }>({
    action: 'deduplicate',
    productId,
  });
}

/** Get current media status for a product */
export function getMediaStatus(productId: string) {
  return call<MediaStatus & { success: boolean }>({
    action: 'get_status',
    productId,
  });
}
