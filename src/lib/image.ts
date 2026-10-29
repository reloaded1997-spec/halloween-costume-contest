export interface CompressedImage {
  blob: Blob;
  /** ~960×540 copy for the TV's lite mode and thumbnails. */
  small: Blob;
  width: number;
  height: number;
}

const FULL = { longEdge: 1920, shortEdge: 1080, quality: 0.8 };
const SMALL = { longEdge: 960, shortEdge: 540, quality: 0.72 };

/**
 * Downscale to fit 1920×1080 (or 1080×1920 for portrait shots, so tall costume photos keep their detail)
 * and re-encode as JPEG at 0.8. A 12 MP phone photo typically drops from ~4 MB to ~300–600 KB.
 * Also makes a 960×540 copy (~60–120 KB) for the TV's lite mode and small thumbnails.
 */
export async function compressImage(file: File): Promise<CompressedImage> {
  const source = await decode(file);
  try {
    const full = await encode(source, FULL);
    const small = await encode(source, SMALL);
    return { blob: full.blob, small: small.blob, width: full.width, height: full.height };
  } finally {
    source.dispose();
  }
}

async function encode(source: Decoded, size: typeof FULL) {
  const { width: srcW, height: srcH } = source;
  const landscape = srcW >= srcH;
  const maxW = landscape ? size.longEdge : size.shortEdge;
  const maxH = landscape ? size.shortEdge : size.longEdge;
  const scale = Math.min(1, maxW / srcW, maxH / srcH);
  const width = Math.round(srcW * scale);
  const height = Math.round(srcH * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported on this device.');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height); // JPEG has no alpha; give transparent PNGs a defined background
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source.image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', size.quality));
  if (!blob) throw new Error('Could not process that photo.');
  return { blob, width, height };
}

interface Decoded {
  image: CanvasImageSource;
  width: number;
  height: number;
  dispose: () => void;
}

async function decode(file: File): Promise<Decoded> {
  // createImageBitmap honours EXIF orientation, so phone photos don't come out sideways.
  if ('createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { image: bitmap, width: bitmap.width, height: bitmap.height, dispose: () => bitmap.close() };
    } catch {
      // Fall through to <img> decoding (older Safari).
    }
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  try {
    await img.decode();
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("That file couldn't be read as a photo. Try a JPEG or PNG.");
  }
  return { image: img, width: img.naturalWidth, height: img.naturalHeight, dispose: () => URL.revokeObjectURL(url) };
}
