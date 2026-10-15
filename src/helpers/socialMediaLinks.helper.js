const CANONICAL_PLATFORMS = {
  instagram: { mediaType: "INSTAGRAM", url: (handle) => `https://www.instagram.com/${handle}` },
  facebook: { mediaType: "FACEBOOK", url: (handle) => `https://www.facebook.com/${handle}` },
  x: { mediaType: "TWITTER", url: (handle) => `https://x.com/${handle}` },
  threads: { mediaType: "THREADS", url: (handle) => `https://www.threads.net/@${handle}` },
  tiktok: { mediaType: "TIKTOK", url: (handle) => `https://www.tiktok.com/@${handle}` },
};

const legacySocialMediaLinks = (socialMedia) =>
  socialMedia
    .filter((entry) => entry?.mediaType && entry?.mediaUrl)
    .map((entry) => ({
      mediaType: String(entry.mediaType).toUpperCase(),
      mediaUrl: String(entry.mediaUrl),
    }));

// Food trucks created before handle migration use [{ mediaType, mediaUrl }],
// while current records use { instagram, facebook, x, threads, tiktok }.
export const getSocialMediaLinks = (socialMedia) => {
  if (Array.isArray(socialMedia)) return legacySocialMediaLinks(socialMedia);
  if (!socialMedia || typeof socialMedia !== "object") return [];

  return Object.entries(CANONICAL_PLATFORMS).flatMap(([key, platform]) => {
    const handle = String(socialMedia[key] || "").trim().replace(/^@+/, "");
    if (!handle) return [];
    return [{ mediaType: platform.mediaType, mediaUrl: platform.url(encodeURIComponent(handle)) }];
  });
};
