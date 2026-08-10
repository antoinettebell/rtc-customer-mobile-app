import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { isBannerActiveAt, normalizePublicBanners } from "./customerBanner.helper.js";

const now = new Date("2026-08-09T12:00:00Z");
const active = { _id: "active", imageUrl: "https://cdn/ad.jpg", isActive: true, fromDate: "2026-08-01", toDate: "2026-08-10" };
assert.equal(isBannerActiveAt(active, now), true);
assert.equal(normalizePublicBanners({ data: { bannerList: [active] } }, now).length, 1);
assert.equal(normalizePublicBanners({ bannerList: [{ ...active, isActive: false }] }, now).length, 0);
assert.equal(normalizePublicBanners({ bannerList: [{ ...active, toDate: "2026-08-08" }] }, now).length, 0);
assert.equal(normalizePublicBanners({ bannerList: [{ ...active, imageUrl: "" }] }, now).length, 0);
assert.equal(normalizePublicBanners({ bannerList: [{ ...active, imageUrl: undefined, image_url: "https://cdn/legacy.jpg" }] }, now)[0].imageUrl, "https://cdn/legacy.jpg");
const explore = await readFile(new URL("../screens/exploreScreen.js", import.meta.url), "utf8");
assert.match(explore, /trackBannerEvent_API\(\{[\s\S]*event_type: "impression"/);
assert.match(explore, /event_type: "click"/);
assert.match(explore, /Linking\.openURL\(destinationUrl\)/);
assert.match(explore, /width=\{Math\.max\(1, width - 32\)\}/);
console.log("customer banner helper tests passed");
