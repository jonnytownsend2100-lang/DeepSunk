import assert from "node:assert/strict";
import test from "node:test";
import { inspectImageDataUrl, validImageDataUrl } from "./image-validation.server.ts";

const dataUrl = (mime: string, bytes: Buffer) => `data:image/${mime};base64,${bytes.toString("base64")}`;

function png(width: number, height: number): Buffer {
  const bytes = Buffer.alloc(33);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(bytes, 0);
  bytes.writeUInt32BE(13, 8);
  bytes.write("IHDR", 12, "ascii");
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}

function jpeg(width: number, height: number): Buffer {
  const bytes = Buffer.from([
    0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08,
    (height >> 8) & 0xff, height & 0xff,
    (width >> 8) & 0xff, width & 0xff,
    0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x00, 0x03, 0x11, 0x00,
    0xff, 0xd9,
  ]);
  return bytes;
}

test("accepts image headers with supported dimensions", () => {
  const source = dataUrl("png", png(1440, 900));
  assert.equal(validImageDataUrl(source, 1_400_000), true);
  assert.deepEqual(inspectImageDataUrl(source, 1_400_000), {
    mime: "png", width: 1440, height: 900, bytes: 33,
  });
  assert.equal(validImageDataUrl(dataUrl("jpeg", jpeg(960, 540)), 1_400_000), true);
});

test("rejects MIME spoofing, missing dimensions, and oversized image bombs", () => {
  assert.equal(validImageDataUrl(dataUrl("png", jpeg(960, 540)), 1_400_000), false);
  assert.equal(validImageDataUrl(dataUrl("png", Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 1_400_000), false);
  assert.equal(validImageDataUrl(dataUrl("png", png(100_000, 100_000)), 1_400_000), false);
  assert.equal(validImageDataUrl(dataUrl("png", png(1, 1)), 1_400_000), false);
});

test("rejects oversized, non-canonical, and unsupported data URLs", () => {
  const source = dataUrl("png", png(4, 4));
  assert.equal(validImageDataUrl(source, source.length - 1), false);
  assert.equal(validImageDataUrl("data:image/gif;base64,R0lGODlh", 1_400_000), false);
  assert.equal(validImageDataUrl("data:image/png;base64,ab==", 1_400_000), false);
});
