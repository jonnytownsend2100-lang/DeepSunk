/** Streaming protections for provider-hosted generated MP4 files. */
export const MAX_VIDEO_BYTES = 300 * 1024 * 1024;

/** Accept one byte range only; multipart ranges are deliberately unsupported. */
export const SINGLE_BYTE_RANGE = /^bytes=(?:\d+-\d*|-\d+)$/;

/** RFC 9110 Content-Range value returned with a valid 206 response. */
export const CONTENT_RANGE = /^bytes \d+-\d+\/(?:\d+|\*)$/;

/** Enforce a hard streaming cap even when the provider omits Content-Length. */
export function limitStream(
  body: ReadableStream<Uint8Array>,
  maxBytes = MAX_VIDEO_BYTES,
  idleTimeoutMs = 30_000,
): ReadableStream<Uint8Array> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new Error("Invalid stream byte limit.");
  }
  if (!Number.isSafeInteger(idleTimeoutMs) || idleTimeoutMs <= 0) {
    throw new Error("Invalid stream idle timeout.");
  }
  const reader = body.getReader();
  let total = 0;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const nextChunk = reader.read();
        const { done, value } = await Promise.race([
          nextChunk,
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error("Video provider stream became idle.")), idleTimeoutMs);
          }),
        ]);
        if (done) {
          controller.close();
          return;
        }
        total += value.byteLength;
        if (total > maxBytes) {
          await reader.cancel("Video exceeded the download limit.").catch(() => undefined);
          controller.error(new Error("Video exceeded the download limit."));
          return;
        }
        controller.enqueue(value);
      } catch (error) {
        await reader.cancel(error).catch(() => undefined);
        controller.error(error);
      } finally {
        if (timer) clearTimeout(timer);
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
}
