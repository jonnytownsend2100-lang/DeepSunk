import { MAX_IMAGE_CHARS, MAX_UPLOAD_BYTES } from "@/lib/imagine/limits";

export type StillAsset = {
  dataUrl: string;
  name: string;
  width: number;
  height: number;
  sourceBytes: number;
};

function canvas(width: number, height: number): CanvasRenderingContext2D {
  const element = document.createElement("canvas");
  element.width = width;
  element.height = height;
  const context = element.getContext("2d", { alpha: false });
  if (!context) throw new Error("Your browser could not prepare this image.");
  return context;
}

export function paintWindowStill(): string {
  const g = canvas(960, 540);
  const sky = g.createLinearGradient(0, 0, 0, 320);
  sky.addColorStop(0, "#f2c27a");
  sky.addColorStop(1, "#7ea8c4");
  g.fillStyle = "#c9b394";
  g.fillRect(0, 0, 960, 540);
  g.save();
  g.beginPath();
  g.rect(250, 64, 460, 286);
  g.clip();
  g.fillStyle = sky;
  g.fillRect(0, 0, 960, 540);
  g.fillStyle = "#6d8b5e";
  g.beginPath();
  g.moveTo(0, 250);
  g.quadraticCurveTo(220, 190, 460, 240);
  g.quadraticCurveTo(700, 290, 960, 200);
  g.lineTo(960, 360);
  g.lineTo(0, 360);
  g.fill();
  g.fillStyle = "#fff1d2";
  g.beginPath();
  g.arc(630, 130, 34, 0, Math.PI * 2);
  g.fill();
  g.restore();
  g.strokeStyle = "#3c2a1e";
  g.lineWidth = 16;
  g.strokeRect(250, 64, 460, 286);
  g.beginPath();
  g.moveTo(480, 64);
  g.lineTo(480, 350);
  g.moveTo(250, 207);
  g.lineTo(710, 207);
  g.stroke();
  g.fillStyle = "#6b4a32";
  g.fillRect(214, 346, 532, 20);
  g.fillStyle = "#4d3424";
  g.fillRect(292, 300, 64, 46);
  g.fillStyle = "#2f6b45";
  g.beginPath();
  g.ellipse(324, 268, 48, 26, -0.5, 0, Math.PI * 2);
  g.ellipse(356, 250, 28, 16, 0.6, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#8a6b4e";
  g.fillRect(0, 430, 960, 110);
  g.fillStyle = "rgba(255, 214, 150, 0.2)";
  g.beginPath();
  g.moveTo(540, 78);
  g.lineTo(780, 430);
  g.lineTo(500, 430);
  g.closePath();
  g.fill();
  return g.canvas.toDataURL("image/jpeg", 0.86);
}

export function paintPierStill(): string {
  const g = canvas(960, 540);
  const sky = g.createLinearGradient(0, 0, 0, 320);
  sky.addColorStop(0, "#1c2433");
  sky.addColorStop(0.62, "#c56b45");
  sky.addColorStop(1, "#e7b07a");
  g.fillStyle = sky;
  g.fillRect(0, 0, 960, 540);
  g.fillStyle = "#f4efe4";
  g.beginPath();
  g.arc(760, 92, 22, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#16343f";
  g.fillRect(0, 300, 960, 240);
  g.strokeStyle = "rgba(232, 196, 150, 0.35)";
  g.lineWidth = 2;
  for (let y = 330; y < 520; y += 18) {
    g.beginPath();
    g.moveTo(0, y);
    g.quadraticCurveTo(240, y - 6, 480, y + 2);
    g.quadraticCurveTo(720, y + 8, 960, y - 2);
    g.stroke();
  }
  g.fillStyle = "#2a211c";
  g.beginPath();
  g.moveTo(80, 540);
  g.lineTo(250, 310);
  g.lineTo(700, 310);
  g.lineTo(860, 540);
  g.fill();
  g.fillStyle = "#e08a3c";
  g.beginPath();
  g.arc(470, 286, 8, 0, Math.PI * 2);
  g.fill();
  return g.canvas.toDataURL("image/jpeg", 0.86);
}

export async function fileToStill(file: File): Promise<StillAsset> {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    throw new Error("Choose a JPEG, PNG, or WebP image.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("That image is over 20 MB. Choose a smaller original.");
  }
  if (!file.size) throw new Error("That image file is empty.");

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = objectUrl;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight) throw new Error("That image has no readable dimensions.");
    if (image.naturalWidth * image.naturalHeight > 40_000_000) {
      throw new Error("That image exceeds 40 megapixels. Export a smaller still and try again.");
    }

    const originalWidth = image.naturalWidth;
    const originalHeight = image.naturalHeight;
    let maxDimension = 1440;
    let dataUrl = "";

    for (let pass = 0; pass < 4; pass += 1) {
      const scale = Math.min(1, maxDimension / Math.max(originalWidth, originalHeight));
      const width = Math.max(2, Math.round(originalWidth * scale));
      const height = Math.max(2, Math.round(originalHeight * scale));
      const g = canvas(width, height);
      g.drawImage(image, 0, 0, width, height);
      const quality = [0.86, 0.78, 0.7, 0.62][pass];
      dataUrl = g.canvas.toDataURL("image/jpeg", quality);
      if (dataUrl.length <= MAX_IMAGE_CHARS) {
        return {
          dataUrl,
          name: file.name || "Uploaded image",
          width: originalWidth,
          height: originalHeight,
          sourceBytes: file.size,
        };
      }
      maxDimension = Math.round(maxDimension * 0.82);
    }
    throw new Error("This image could not be compressed enough. Try a smaller image.");
  } catch (error) {
    if (error instanceof Error && error.message) throw error;
    throw new Error("Could not decode this image. Try a JPEG, PNG, or WebP file.");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Center-crop the source to the chosen output frame before submitting it.
 * xAI image-to-video uses the input still's aspect ratio, so cropping the image
 * first is the reliable way to select landscape, portrait, or square framing.
 */
export async function cropStillToAspect(dataUrl: string, ratio: string): Promise<string> {
  const [ratioWidth, ratioHeight] = ratio.split(":").map(Number);
  if (!ratioWidth || !ratioHeight) throw new Error("Choose a valid output aspect ratio.");
  const targetRatio = ratioWidth / ratioHeight;
  const image = new Image();
  image.decoding = "async";
  image.src = dataUrl;
  await image.decode();

  let sx = 0;
  let sy = 0;
  let sw = image.naturalWidth;
  let sh = image.naturalHeight;
  const sourceRatio = sw / sh;
  if (sourceRatio > targetRatio) {
    sw = sh * targetRatio;
    sx = (image.naturalWidth - sw) / 2;
  } else if (sourceRatio < targetRatio) {
    sh = sw / targetRatio;
    sy = (image.naturalHeight - sh) / 2;
  }

  let maxDimension = 1440;
  for (let pass = 0; pass < 4; pass += 1) {
    const scale = Math.min(1, maxDimension / Math.max(sw, sh));
    const width = Math.max(2, Math.round(sw * scale));
    const height = Math.max(2, Math.round(sh * scale));
    const g = canvas(width, height);
    g.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
    const data = g.canvas.toDataURL("image/jpeg", [0.86, 0.78, 0.7, 0.62][pass]);
    if (data.length <= MAX_IMAGE_CHARS) return data;
    maxDimension = Math.round(maxDimension * 0.82);
  }
  throw new Error("The cropped image is too large to send. Choose a smaller source image.");
}
