import { createFileRoute } from "@tanstack/react-router";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host === "0.0.0.0" ||
    host === "::" ||
    host === "::1" ||
    host === "metadata.google.internal"
  ) {
    return true;
  }
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!ipv4) {
    return host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80");
  }
  const a = Number(ipv4[1]);
  const b = Number(ipv4[2]);
  if ([a, b, Number(ipv4[3]), Number(ipv4[4])].some((n) => n > 255)) return true;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function publicUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.username || url.password) return null;
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (isBlockedHost(url.hostname)) return null;
  return url;
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function looksLikeAudio(contentType: string | null): boolean {
  if (!contentType) return true;
  const value = contentType.toLowerCase();
  if (value.includes("text/html") || value.includes("application/json") || value.includes("text/plain")) {
    return false;
  }
  return true;
}

async function fetchUpstream(start: string): Promise<Response> {
  let current = start;
  for (let hop = 0; hop < 5; hop += 1) {
    const url = publicUrl(current);
    if (!url) throw new Error("That stream address is not allowed");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    let response: Response;
    try {
      response = await fetch(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": BROWSER_UA,
          "Icy-MetaData": "0",
          Accept: "audio/mpeg, audio/aac, audio/ogg, audio/*;q=0.9, */*;q=0.1",
        },
      });
    } finally {
      clearTimeout(timer);
    }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Stream redirected without a location");
      current = new URL(location, url).toString();
      continue;
    }
    return response;
  }
  throw new Error("Stream redirected too many times");
}

function stripIcy(metaint: number, source: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const reader = source.getReader();
  let pending = new Uint8Array(0);
  let audioLeft = metaint;
  let metaLeft = 0;
  let readingLength = false;

  return new ReadableStream({
    async pull(controller) {
      while (true) {
        if (pending.length === 0) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            return;
          }
          pending = new Uint8Array(value);
        }
        if (readingLength) {
          metaLeft = pending[0] * 16;
          pending = pending.subarray(1);
          readingLength = false;
          continue;
        }
        if (metaLeft > 0) {
          const skip = Math.min(metaLeft, pending.length);
          pending = pending.subarray(skip);
          metaLeft -= skip;
          continue;
        }
        if (audioLeft === 0) {
          readingLength = true;
          continue;
        }
        const take = Math.min(audioLeft, pending.length);
        controller.enqueue(pending.slice(0, take));
        pending = pending.subarray(take);
        audioLeft -= take;
        if (audioLeft === 0) readingLength = true;
        return;
      }
    },
    cancel() {
      void reader.cancel();
    },
  });
}

async function handleGet({ request }: { request: Request }): Promise<Response> {
  const src = new URL(request.url).searchParams.get("src") ?? "";
  if (!src || src.length > 2000 || !publicUrl(src)) {
    return jsonError("Missing stream", 400);
  }
  try {
    const upstream = await fetchUpstream(src);
    if (!upstream.ok || !upstream.body) {
      return jsonError("Station did not answer", 502);
    }
    const contentType = upstream.headers.get("content-type");
    if (!looksLikeAudio(contentType)) {
      return jsonError("That address is not an audio stream", 502);
    }
    const metaint = Number(upstream.headers.get("icy-metaint"));
    const body =
      Number.isFinite(metaint) && metaint > 0 && metaint < 1_000_000
        ? stripIcy(metaint, upstream.body)
        : upstream.body;
    return new Response(body, {
      headers: {
        "content-type": contentType || "audio/mpeg",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stream failed";
    return jsonError(message, 502);
  }
}

export const Route = createFileRoute("/api/stream")({
  server: { handlers: { GET: handleGet } },
});
