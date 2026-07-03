/**
 * Client-side image preparation before upload.
 *
 * Phone/camera photos are routinely 4–15MB; the API caps uploads at 10MB and
 * nobody needs an 8000px feed image. Downscale to a sane max edge and re-encode
 * so uploads are fast and never bounce off the size limit.
 */

const MAX_EDGE = 2048;
const QUALITY = 0.85;
/** Files already smaller than this are sent untouched. */
const SKIP_BELOW_BYTES = 512 * 1024;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

/**
 * Downscale + re-encode an image file for upload.
 * GIFs (animation) and small files pass through unchanged. Falls back to the
 * original file on any decode/encode failure — the server still validates.
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/gif") return file; // keep animation
  if (file.size < SKIP_BELOW_BYTES) return file;

  try {
    const img = await loadImage(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);

    // PNGs with transparency stay PNG; everything else becomes JPEG.
    const targetType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, targetType, QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;

    const ext = targetType === "image/png" ? "png" : "jpg";
    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${base}.${ext}`, { type: targetType });
  } catch {
    return file;
  }
}
