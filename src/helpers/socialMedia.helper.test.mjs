import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const helperSource = await readFile(new URL("./socialMedia.helper.js", import.meta.url), "utf8");
const helperModuleUrl = `data:text/javascript;base64,${Buffer.from(helperSource).toString("base64")}`;
const {
  displaySocialMediaHandle,
  normalizeSocialMediaHandle,
  normalizeSocialMediaObject,
  socialMediaProfileUrl,
} = await import(helperModuleUrl);

assert.equal(normalizeSocialMediaHandle("  @rtc.eats  ", "instagram"), "rtc.eats");
assert.equal(displaySocialMediaHandle("rtc_eats", "x"), "@rtc_eats");
assert.equal(displaySocialMediaHandle("RTC.Eats", "facebook"), "RTC.Eats");
assert.throws(
  () => normalizeSocialMediaHandle("https://instagram.com/rtc.eats", "instagram"),
  /without a link/,
);
assert.deepEqual(
  normalizeSocialMediaObject([
    { mediaType: "INSTAGRAM", mediaUrl: "https://instagram.com/rtc.eats" },
    { mediaType: "TWITTER", mediaUrl: "https://x.com/rtc_eats" },
  ]),
  { instagram: "rtc.eats", facebook: "", x: "rtc_eats", threads: "", tiktok: "" },
);
assert.equal(socialMediaProfileUrl("tiktok", "@rtc.eats"), "https://www.tiktok.com/@rtc.eats");

console.log("social media helper tests passed");
