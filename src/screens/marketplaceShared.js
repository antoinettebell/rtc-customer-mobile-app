import { StyleSheet } from "react-native";
import { AppColor, Mulish400, Mulish600, Mulish700 } from "../utils/theme";

export const EVENT_TYPES = [
  "Festival",
  "Wedding",
  "Corporate",
  "Private Party",
  "Fundraiser",
  "Conference",
  "Market",
  "Concert",
  "Other",
];

export const EVENT_STYLES = ["Casual", "Formal", "Themed"];
export const SERVICE_TYPES = [
  "Food Truck",
  "Full Service Catering",
  "Buffet",
  "Drop-off Catering",
  "Served Stations",
  "Beverage and Alcohol",
];
export const POWER_OPTIONS = ["110v/15A", "110V/30A", "220V", "Generator OK"];
export const PERMIT_OPTIONS = [
  "None",
  "City Permit",
  "Food Vendor",
  "Sanitation Grade",
  "Alcohol",
];

export const formatPermitLabel = (value) =>
  value === "Health Department" ? "Sanitation Grade" : value;

export const formatPermitList = (value) =>
  Array.isArray(value) && value.length
    ? value.map(formatPermitLabel).join(", ")
    : "Not set";

export const normalizeExternalUrl = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
};

export const isValidExternalUrl = (value) => {
  const normalized = normalizeExternalUrl(value);
  if (!normalized) return true;
  return /^https?:\/\/[^\s]+\.[^\s]+$/i.test(normalized);
};
export const CUISINE_OPTIONS = [
  "BBQ",
  "Latin",
  "Vegan",
  "Soul/Caribbean",
  "Asian",
  "Kosher",
  "Halal",
];
export const DIETARY_OPTIONS = [
  "No Pork",
  "Child-Friendly",
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Nut Allergy",
];
export const EQUIPMENT_OPTIONS = [
  "None",
  "Tents",
  "Tables",
  "Table Clothes",
  "Additional Staffing",
  "Chair Covers",
];

export const formatDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const DEFAULT_EVENT_TIME_ZONE = "America/New_York";

const stateTimeZones = {
  AL: "America/Chicago",
  AK: "America/Anchorage",
  AZ: "America/Phoenix",
  AR: "America/Chicago",
  CA: "America/Los_Angeles",
  CO: "America/Denver",
  CT: "America/New_York",
  DC: "America/New_York",
  DE: "America/New_York",
  FL: "America/New_York",
  GA: "America/New_York",
  HI: "Pacific/Honolulu",
  IA: "America/Chicago",
  ID: "America/Denver",
  IL: "America/Chicago",
  IN: "America/Indiana/Indianapolis",
  KS: "America/Chicago",
  KY: "America/New_York",
  LA: "America/Chicago",
  MA: "America/New_York",
  MD: "America/New_York",
  ME: "America/New_York",
  MI: "America/Detroit",
  MN: "America/Chicago",
  MO: "America/Chicago",
  MS: "America/Chicago",
  MT: "America/Denver",
  NC: "America/New_York",
  ND: "America/Chicago",
  NE: "America/Chicago",
  NH: "America/New_York",
  NJ: "America/New_York",
  NM: "America/Denver",
  NV: "America/Los_Angeles",
  NY: "America/New_York",
  OH: "America/New_York",
  OK: "America/Chicago",
  OR: "America/Los_Angeles",
  PA: "America/New_York",
  RI: "America/New_York",
  SC: "America/New_York",
  SD: "America/Chicago",
  TN: "America/Chicago",
  TX: "America/Chicago",
  UT: "America/Denver",
  VA: "America/New_York",
  VT: "America/New_York",
  WA: "America/Los_Angeles",
  WI: "America/Chicago",
  WV: "America/New_York",
  WY: "America/Denver",
};

const cityStateTimeZones = {
  "FL:PENSACOLA": "America/Chicago",
  "FL:PANAMA CITY": "America/Chicago",
  "FL:TALLAHASSEE": "America/New_York",
  "IN:EVANSVILLE": "America/Chicago",
  "IN:GARY": "America/Chicago",
  "IN:SOUTH BEND": "America/Indiana/Indianapolis",
  "KY:BOWLING GREEN": "America/Chicago",
  "KY:LOUISVILLE": "America/New_York",
  "KY:LEXINGTON": "America/New_York",
  "MI:IRONWOOD": "America/Menominee",
  "MI:DETROIT": "America/Detroit",
  "TN:MEMPHIS": "America/Chicago",
  "TN:NASHVILLE": "America/Chicago",
  "TN:CHATTANOOGA": "America/New_York",
  "TN:KNOXVILLE": "America/New_York",
  "TX:EL PASO": "America/Denver",
};

const normalizeAddressPart = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

export const resolveEventTimeZone = (event = {}) => {
  const explicitTimeZone =
    event.event_time_zone ||
    event.event_timezone ||
    event.time_zone ||
    event.timezone ||
    event.location_time_zone;
  if (explicitTimeZone) return explicitTimeZone;

  const state = normalizeAddressPart(event.event_state || event.state);
  const city = normalizeAddressPart(event.event_city || event.city);
  return (
    cityStateTimeZones[`${state}:${city}`] ||
    stateTimeZones[state] ||
    DEFAULT_EVENT_TIME_ZONE
  );
};

const parseEventTimeParts = (value) => {
  const text = String(value || "").trim();
  const match = text.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const meridiem = match[3]?.toUpperCase();
  if (hours > 24 || minutes > 59) return null;
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  if (!meridiem && hours === 24) hours = 0;

  return { hours, minutes };
};

export const formatEventTime = (timeValue, event = {}) => {
  if (!timeValue) return "Not set";
  const parts = parseEventTimeParts(timeValue);
  if (!parts) return timeValue;

  const dateValue = event.event_date ? new Date(event.event_date) : new Date();
  const zoneProbeDate = Number.isNaN(dateValue.getTime())
    ? new Date()
    : new Date(
        Date.UTC(
          dateValue.getFullYear(),
          dateValue.getMonth(),
          dateValue.getDate(),
          12,
          0,
        ),
      );
  const normalizedHours = parts.hours % 24;
  const displayHours = normalizedHours % 12 || 12;
  const displayMinutes = String(parts.minutes).padStart(2, "0");
  const meridiem = normalizedHours >= 12 ? "PM" : "AM";

  try {
    const zoneNameParts = new Intl.DateTimeFormat("en-US", {
      timeZone: resolveEventTimeZone(event),
      timeZoneName: "short",
    }).formatToParts(zoneProbeDate);
    const zoneName = zoneNameParts.find((part) => part.type === "timeZoneName")?.value;
    return `${displayHours}:${displayMinutes} ${meridiem}${zoneName ? ` ${zoneName}` : ""}`;
  } catch (error) {
    return `${displayHours}:${displayMinutes} ${meridiem}`;
  }
};

export const formatMoney = (value) => {
  const amount = Number(value || 0);
  return `$${amount.toFixed(2)}`;
};

export const toggleListValue = (list, value) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

export const getMarketplaceMessageError = (value) => {
  const text = String(value || "");
  if (!text.trim()) return "";

  const hasEmail = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text);
  const hasUrl =
    /\b(?:https?:\/\/|www\.)\S+/i.test(text) ||
    /\b[A-Z0-9-]+\.(?:com|net|org|io|co|us|biz|info|me|app|food|catering)\b/i.test(
      text,
    );
  const hasPhone = /(?:\+?1[\s-.]*)?(?:\(?\d{3}\)?[\s-.]*)\d{3}[\s-.]*\d{4}\b/.test(
    text,
  );
  const hasSocialOrPayment =
    /\b(?:insta|instagram|ig|fb|facebook|meta|twitter|x|whatsapp|whats\s*app|cash\s*app|cashapp|paypal|pay\s*pal|venmo|zelle)\b/i.test(
      text,
    );
  const hasContactRequest =
    /\b(?:call|text|dm|message|email|reach|contact)\s+(?:me|us|my|our)\b/i.test(
      text,
    ) ||
    /\b(?:find|follow|add|look\s+up)\s+(?:me|us)\s+on\b/i.test(text) ||
    /\b(?:my|our)\s+(?:number|phone|email|cell|mobile|handle|username|user\s*name|cash\s*app|paypal|zelle)\b/i.test(
      text,
    );
  const hasSocialHandle = /(^|\s)@[A-Z0-9_.-]{2,}/i.test(text);

  return hasEmail ||
    hasUrl ||
    hasPhone ||
    hasSocialOrPayment ||
    hasContactRequest ||
    hasSocialHandle
    ? "Messages cannot include contact info, social handles, payment handles, or requests to connect outside RTC."
    : "";
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColor.white,
  },
  body: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: AppColor.screenBg,
  },
  card: {
    backgroundColor: AppColor.white,
    borderWidth: 1,
    borderColor: AppColor.borderColor,
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
  },
  title: {
    fontFamily: Mulish700,
    fontSize: 18,
    color: AppColor.text,
  },
  subtitle: {
    fontFamily: Mulish400,
    fontSize: 13,
    color: AppColor.textHighlighter,
    marginTop: 4,
  },
  label: {
    fontFamily: Mulish600,
    fontSize: 14,
    color: AppColor.text,
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: AppColor.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: Mulish400,
    fontSize: 14,
    color: AppColor.text,
    backgroundColor: AppColor.white,
  },
  placesWrapper: {
    marginTop: 0,
    zIndex: 10,
  },
  placesContainer: {
    flex: 0,
  },
  placesTextInputContainer: {
    borderWidth: 1,
    borderColor: AppColor.border,
    borderRadius: 8,
    backgroundColor: AppColor.white,
  },
  placesTextInput: {
    minHeight: 48,
    height: 48,
    margin: 0,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: Mulish400,
    fontSize: 14,
    color: AppColor.text,
    backgroundColor: AppColor.white,
    borderRadius: 8,
  },
  placesListView: {
    borderWidth: 1,
    borderColor: AppColor.border,
    borderRadius: 8,
    marginTop: 4,
    backgroundColor: AppColor.white,
    zIndex: 20,
    elevation: 4,
  },
  placesRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  placesDescription: {
    fontFamily: Mulish400,
    fontSize: 13,
    color: AppColor.text,
  },
  placesSeparator: {
    height: 1,
    backgroundColor: AppColor.borderColor,
  },
  textarea: {
    minHeight: 92,
    textAlignVertical: "top",
  },
  errorText: {
    fontFamily: Mulish400,
    color: AppColor.red,
    fontSize: 12,
    marginTop: 6,
    lineHeight: 17,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  flex: {
    flex: 1,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: AppColor.border,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: AppColor.white,
  },
  chipActive: {
    borderColor: AppColor.primary,
    backgroundColor: "#FFF1E6",
  },
  chipText: {
    fontFamily: Mulish600,
    fontSize: 12,
    color: AppColor.textHighlighter,
  },
  chipTextActive: {
    color: AppColor.primary,
  },
  button: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColor.primary,
    paddingHorizontal: 16,
  },
  buttonDisabled: {
    backgroundColor: AppColor.likePlaceholder,
  },
  buttonText: {
    fontFamily: Mulish700,
    color: AppColor.white,
    fontSize: 15,
  },
  secondaryButton: {
    minHeight: 46,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: AppColor.primary,
    paddingHorizontal: 16,
    backgroundColor: AppColor.white,
  },
  secondaryButtonText: {
    fontFamily: Mulish700,
    color: AppColor.primary,
    fontSize: 14,
  },
  mutedButton: {
    borderColor: AppColor.border,
  },
  mutedButtonText: {
    color: AppColor.textHighlighter,
  },
  meta: {
    fontFamily: Mulish400,
    color: AppColor.textHighlighter,
    fontSize: 13,
    marginTop: 4,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#FFF1E6",
  },
  badgeText: {
    fontFamily: Mulish700,
    color: AppColor.primary,
    fontSize: 11,
  },
  emptyText: {
    fontFamily: Mulish400,
    color: AppColor.textHighlighter,
    textAlign: "center",
    marginTop: 24,
  },
});
