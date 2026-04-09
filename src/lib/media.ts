import type { MediaItem } from "@/lib/types";

const GOOGLE_DRIVE_HOSTS = new Set(["drive.google.com", "www.drive.google.com", "docs.google.com"]);

function extractGoogleDriveFileId(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl.trim());
    if (!GOOGLE_DRIVE_HOSTS.has(url.hostname)) return null;

    const paramId = url.searchParams.get("id");
    if (paramId) return paramId;

    const pathMatch = url.pathname.match(/\/file\/d\/([^/]+)/) || url.pathname.match(/\/d\/([^/]+)/);
    return pathMatch?.[1] ?? null;
  } catch {
    return null;
  }
}

function uniqueUrls(urls: string[]) {
  return [...new Set(urls.map((url) => url.trim()).filter(Boolean))];
}

export function resolveMediaSource(rawUrl: string): MediaItem["source"] {
  return extractGoogleDriveFileId(rawUrl) ? "drive" : "url";
}

export function getMediaPlaybackUrls(rawUrl: string, type: MediaItem["type"]): string[] {
  const trimmedUrl = rawUrl.trim();
  const driveFileId = extractGoogleDriveFileId(trimmedUrl);

  if (!driveFileId) {
    return uniqueUrls([trimmedUrl]);
  }

  if (type === "video") {
    return uniqueUrls([
      `https://drive.google.com/uc?export=download&id=${driveFileId}`,
      `https://drive.google.com/uc?export=view&id=${driveFileId}`,
      trimmedUrl,
    ]);
  }

  return uniqueUrls([
    `https://drive.google.com/uc?export=view&id=${driveFileId}`,
    `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w1600`,
    trimmedUrl,
  ]);
}

export function normalizeMediaUrl(rawUrl: string, type: MediaItem["type"]): string {
  return getMediaPlaybackUrls(rawUrl, type)[0] || rawUrl.trim();
}