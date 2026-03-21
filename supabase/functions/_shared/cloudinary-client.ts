/**
 * Client Cloudinary unifié pour le pipeline média
 * Gestion de l'upload, transformations et optimisation
 */

const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1';

export interface CloudinaryUploadOptions {
  folder?: string;
  publicId?: string;
  transformation?: string;
  tags?: string[];
  eager?: string[];
  resourceType?: 'image' | 'video' | 'raw';
}

export interface CloudinaryResult {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  resource_type: string;
  eager?: Array<{
    url: string;
    secure_url: string;
    width: number;
    height: number;
    format: string;
    bytes: number;
  }>;
}

function getCloudinaryConfig() {
  const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME');
  const apiKey = Deno.env.get('CLOUDINARY_API_KEY');
  const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');
  
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials not configured (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)');
  }
  
  return { cloudName, apiKey, apiSecret };
}

/**
 * Générer une signature Cloudinary pour l'upload
 */
async function generateSignature(params: Record<string, string>, apiSecret: string): Promise<string> {
  const sortedKeys = Object.keys(params).sort();
  const stringToSign = sortedKeys.map(k => `${k}=${params[k]}`).join('&');
  
  const encoder = new TextEncoder();
  const data = encoder.encode(stringToSign + apiSecret);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Upload une image vers Cloudinary avec optimisation automatique
 */
export async function uploadToCloudinary(
  imageData: string | Uint8Array,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryResult> {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const resourceType = options.resourceType || 'image';
  
  const timestamp = Math.floor(Date.now() / 1000).toString();
  
  const params: Record<string, string> = {
    timestamp,
    ...(options.folder && { folder: options.folder }),
    ...(options.publicId && { public_id: options.publicId }),
    ...(options.tags && { tags: options.tags.join(',') }),
  };
  
  // Eager transformations pour pré-générer les variantes
  if (options.eager && options.eager.length > 0) {
    params.eager = options.eager.join('|');
    params.eager_async = 'true';
  }
  
  const signature = await generateSignature(params, apiSecret);
  
  const formData = new FormData();
  
  if (typeof imageData === 'string') {
    // Base64 ou URL
    formData.append('file', imageData);
  } else {
    // Binary
    const blob = new Blob([imageData], { type: 'image/png' });
    formData.append('file', blob);
  }
  
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  
  for (const [key, value] of Object.entries(params)) {
    if (key !== 'timestamp') {
      formData.append(key, value);
    }
  }
  
  const response = await fetch(
    `${CLOUDINARY_UPLOAD_URL}/${cloudName}/${resourceType}/upload`,
    { method: 'POST', body: formData }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudinary upload failed [${response.status}]: ${error}`);
  }
  
  return await response.json();
}

/**
 * Générer l'URL optimisée d'une image Cloudinary
 */
export function getOptimizedUrl(
  publicId: string, 
  options: {
    width?: number;
    height?: number;
    format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
    quality?: 'auto' | number;
    crop?: 'fill' | 'fit' | 'limit' | 'thumb' | 'scale';
    gravity?: 'auto' | 'face' | 'center';
    dpr?: 'auto' | number;
  } = {}
): string {
  const { cloudName } = getCloudinaryConfig();
  
  const transforms: string[] = [];
  if (options.format) transforms.push(`f_${options.format}`);
  if (options.quality) transforms.push(`q_${options.quality}`);
  if (options.width) transforms.push(`w_${options.width}`);
  if (options.height) transforms.push(`h_${options.height}`);
  if (options.crop) transforms.push(`c_${options.crop}`);
  if (options.gravity) transforms.push(`g_${options.gravity}`);
  if (options.dpr) transforms.push(`dpr_${options.dpr}`);
  
  const transformStr = transforms.length > 0 ? transforms.join(',') + '/' : '';
  
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformStr}${publicId}`;
}

/**
 * Générer un srcset pour responsive images
 */
export function generateSrcSet(publicId: string, widths: number[] = [320, 640, 960, 1280, 1920]): string {
  return widths.map(w => {
    const url = getOptimizedUrl(publicId, { width: w, format: 'auto', quality: 'auto', crop: 'limit' });
    return `${url} ${w}w`;
  }).join(', ');
}

/**
 * Preset de transformations eagres pour les imports produits
 */
export const PRODUCT_EAGER_TRANSFORMS = [
  'w_800,h_800,c_limit,f_auto,q_auto',     // Thumbnail
  'w_1200,h_1200,c_limit,f_auto,q_auto',   // Standard
  'w_2048,h_2048,c_limit,f_auto,q_auto',   // High-res
  'w_150,h_150,c_thumb,g_auto,f_auto,q_auto', // Mini thumb
];

/**
 * Supprimer une image de Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  
  const params = { public_id: publicId, timestamp };
  const signature = await generateSignature(params, apiSecret);
  
  const formData = new FormData();
  formData.append('public_id', publicId);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  
  const response = await fetch(
    `${CLOUDINARY_UPLOAD_URL}/${cloudName}/image/destroy`,
    { method: 'POST', body: formData }
  );
  
  const result = await response.json();
  return result.result === 'ok';
}
