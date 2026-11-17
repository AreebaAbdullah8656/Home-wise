/**
 * Client-side image compression before bill upload.
 * Max edge 1600px, JPEG quality 0.8. PDFs / HEIC left unchanged.
 */
export async function compressImageForUpload(
  file: File,
  options?: { maxEdge?: number; quality?: number }
): Promise<File> {
  const maxEdge = options?.maxEdge ?? 1600;
  const quality = options?.quality ?? 0.8;

  if (!file.type.startsWith("image/")) return file;
  // HEIC/HEIF often unsupported by canvas in browsers
  if (/heic|heif/i.test(file.type) || /\.heic$/i.test(file.name)) {
    return file;
  }

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
    );
    if (!blob) return file;

    // Keep compressed file only when meaningfully smaller (or always when resized)
    if (blob.size >= file.size && scale === 1) return file;

    const base = file.name.replace(/\.[^.]+$/, "") || "bill";
    return new File([blob], `${base}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}
