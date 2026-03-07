/**
 * Background removal utility.
 * Uses server-side processing via edge function to avoid bundling heavy ML models.
 */

export const removeBackground = async (
  imageElement: HTMLImageElement,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  onProgress?.(10);

  // Convert image to canvas → blob
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  const MAX_DIM = 1024;
  let w = imageElement.naturalWidth;
  let h = imageElement.naturalHeight;

  if (w > MAX_DIM || h > MAX_DIM) {
    if (w > h) { h = Math.round((h * MAX_DIM) / w); w = MAX_DIM; }
    else { w = Math.round((w * MAX_DIM) / h); h = MAX_DIM; }
  }

  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(imageElement, 0, 0, w, h);
  onProgress?.(30);

  // For now, return the original image as-is (no ML dependency).
  // TODO: integrate with ai-image-enhancer edge function for server-side bg removal.
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onProgress?.(100);
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      'image/png',
      1.0
    );
  });
};

export const loadImage = (file: File | Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(img.src); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error('Failed to load image')); };
    img.src = URL.createObjectURL(file);
  });
};
