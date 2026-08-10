export const getBannerImageUrl = (banner) =>
  String(banner?.imageUrl || banner?.image_url || banner?.image || "").trim();

export const isBannerActiveAt = (banner, now = new Date()) => {
  if (!banner || banner.deletedAt || banner.isActive === false) return false;
  const current = now instanceof Date ? now.getTime() : new Date(now).getTime();
  const starts = banner.fromDate ? new Date(banner.fromDate).getTime() : null;
  const ends = banner.toDate ? new Date(banner.toDate).getTime() : null;
  return !!getBannerImageUrl(banner)
    && (!Number.isFinite(starts) || starts <= current)
    && (!Number.isFinite(ends) || ends >= current);
};

export const normalizePublicBanners = (response, now = new Date()) => {
  const payload = response?.data || response || {};
  const banners = payload.bannerList || payload.banners || [];
  return (Array.isArray(banners) ? banners : [])
    .filter((banner) => isBannerActiveAt(banner, now))
    .map((banner) => ({ ...banner, imageUrl: getBannerImageUrl(banner) }));
};
