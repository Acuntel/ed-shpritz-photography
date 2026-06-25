// Read an image file's real pixel size and make a tiny blur placeholder (LQIP),
// entirely in the browser. Stored on the photo so the public site lays it out
// at the right aspect ratio and blurs up while the optimized version loads —
// the same width/height/lqip the old optimize.mjs step used to produce.
export async function measureImage(
  file: File,
): Promise<{ width: number; height: number; lqip: string }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Could not read this image."));
      i.src = url;
    });
    const width = img.naturalWidth || 1;
    const height = img.naturalHeight || 1;

    let lqip = "";
    try {
      const longEdge = 20;
      const scale = longEdge / Math.max(width, height);
      const cw = Math.max(1, Math.round(width * scale));
      const ch = Math.max(1, Math.round(height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, cw, ch);
        lqip = canvas.toDataURL("image/jpeg", 0.4);
      }
    } catch {
      // A blur placeholder is a nicety — fine to skip if the canvas is blocked.
    }

    return { width, height, lqip };
  } finally {
    URL.revokeObjectURL(url);
  }
}
