/** Strict image data-URI validation for the public generation endpoint. */
import { Buffer } from "node:buffer";

const DATA_URL = /^data:image\/(jpeg|png|webp);base64,([a-z0-9+/]+={0,2})$/i;
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const MAX_PIXELS = 40_000_000;
const MAX_DIMENSION = 16_384;

export type ImageMetadata = {
  mime: "jpeg" | "png" | "webp";
  width: number;
  height: number;
  bytes: number;
};

function validDimensions(width: number, height: number): boolean {
  return Number.isSafeInteger(width) && Number.isSafeInteger(height)
    && width >= 2 && height >= 2
    && width <= MAX_DIMENSION && height <= MAX_DIMENSION
    && width * height <= MAX_PIXELS;
}

function jpegDimensions(bytes: Buffer): { width: number; height: number } | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  const sof = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) return null;
    const marker = bytes[offset++];
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) continue;
    if (offset + 2 > bytes.length) return null;
    const segmentLength = bytes.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > bytes.length) return null;
    if (sof.has(marker)) {
      if (segmentLength < 7) return null;
      const height = bytes.readUInt16BE(offset + 3);
      const width = bytes.readUInt16BE(offset + 5);
      return validDimensions(width, height) ? { width, height } : null;
    }
    offset += segmentLength;
  }
  return null;
}

function pngDimensions(bytes: Buffer): { width: number; height: number } | null {
  if (bytes.length < 33 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE) || bytes.toString("ascii", 12, 16) !== "IHDR") return null;
  if (bytes.readUInt32BE(8) !== 13) return null;
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  return validDimensions(width, height) ? { width, height } : null;
}

function webpDimensions(bytes: Buffer): { width: number; height: number } | null {
  if (bytes.length < 25 || bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP") return null;
  if (bytes.readUInt32LE(4) + 8 > bytes.length) return null;
  const kind = bytes.toString("ascii", 12, 16);
  let width = 0;
  let height = 0;
  if (kind === "VP8X" && bytes.length >= 30) {
    width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
    height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
  } else if (kind === "VP8 " && bytes.length >= 30 && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
    width = bytes.readUInt16LE(26) & 0x3fff;
    height = bytes.readUInt16LE(28) & 0x3fff;
  } else if (kind === "VP8L" && bytes.length >= 25 && bytes[20] === 0x2f) {
    const b1 = bytes[21], b2 = bytes[22], b3 = bytes[23], b4 = bytes[24];
    width = 1 + b1 + ((b2 & 0x3f) << 8);
    height = 1 + ((b2 & 0xc0) >> 6) + (b3 << 2) + ((b4 & 0x0f) << 10);
  } else {
    return null;
  }
  return validDimensions(width, height) ? { width, height } : null;
}

/** Returns decoded container dimensions, rejecting malformed or oversized headers. */
export function inspectImageDataUrl(value: string, maxCharacters: number): ImageMetadata | null {
  if (typeof value !== "string" || value.length > maxCharacters) return null;
  const match = DATA_URL.exec(value);
  if (!match || match[2].length % 4 !== 0) return null;
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.toString("base64") !== match[2]) return null;
  const mime = match[1].toLowerCase() as ImageMetadata["mime"];
  const dimensions = mime === "jpeg"
    ? jpegDimensions(bytes)
    : mime === "png"
      ? pngDimensions(bytes)
      : webpDimensions(bytes);
  if (!dimensions) return null;
  return { mime, ...dimensions, bytes: bytes.length };
}

export function validImageDataUrl(value: string, maxCharacters: number): boolean {
  return inspectImageDataUrl(value, maxCharacters) !== null;
}
