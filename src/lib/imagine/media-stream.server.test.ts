import test from "node:test";
import assert from "node:assert/strict";
import {
  CONTENT_RANGE,
  limitStream,
  MAX_VIDEO_BYTES,
  SINGLE_BYTE_RANGE,
} from "./media-stream.server.ts";

function streamOf(...chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
}

test("bounded media stream passes complete streams without buffering", async () => {
  const reader = limitStream(streamOf(new Uint8Array([1, 2]), new Uint8Array([3])), 3).getReader();
  const first = await reader.read();
  const second = await reader.read();
  const last = await reader.read();
  assert.deepEqual([...first.value!], [1, 2]);
  assert.deepEqual([...second.value!], [3]);
  assert.equal(last.done, true);
});

test("bounded media stream errors when the hard cap is exceeded", async () => {
  const reader = limitStream(streamOf(new Uint8Array([1, 2]), new Uint8Array([3, 4])), 3).getReader();
  assert.deepEqual([...(await reader.read()).value!], [1, 2]);
  await assert.rejects(() => reader.read(), /exceeded the download limit/);
});

test("video byte limit is finite and deliberately bounded", () => {
  assert.equal(MAX_VIDEO_BYTES, 300 * 1024 * 1024);
});

test("single byte-range validation rejects multipart and malformed ranges", () => {
  assert.equal(SINGLE_BYTE_RANGE.test("bytes=0-1023"), true);
  assert.equal(SINGLE_BYTE_RANGE.test("bytes=-1024"), true);
  assert.equal(SINGLE_BYTE_RANGE.test("bytes=1024-"), true);
  assert.equal(SINGLE_BYTE_RANGE.test("bytes=0-1,4-5"), false);
  assert.equal(SINGLE_BYTE_RANGE.test("bytes=abc-def"), false);
});

test("partial content requires a syntactically valid content-range", () => {
  assert.equal(CONTENT_RANGE.test("bytes 0-99/1000"), true);
  assert.equal(CONTENT_RANGE.test("bytes 0-99/*"), true);
  assert.equal(CONTENT_RANGE.test("bytes */1000"), false);
  assert.equal(CONTENT_RANGE.test("0-99/1000"), false);
});

test("bounded stream aborts a stalled upstream after the idle timeout", async () => {
  let cancelled = false;
  const stalled = new ReadableStream<Uint8Array>({
    cancel() { cancelled = true; },
  });
  const reader = limitStream(stalled, 100, 5).getReader();
  await assert.rejects(() => reader.read(), /stream became idle/);
  assert.equal(cancelled, true);
});

test("bounded stream rejects invalid limits and idle timeouts", () => {
  assert.throws(() => limitStream(streamOf(), 0), /Invalid stream byte limit/);
  assert.throws(() => limitStream(streamOf(), Number.POSITIVE_INFINITY), /Invalid stream byte limit/);
  assert.throws(() => limitStream(streamOf(), 100, 0), /Invalid stream idle timeout/);
});
