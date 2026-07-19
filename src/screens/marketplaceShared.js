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
