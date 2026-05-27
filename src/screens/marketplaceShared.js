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
  "Full-Service Catering",
  "Buffet",
  "Drop-off Catering",
  "Served Stations",
  "Beverage/Alcohol Service",
];
export const POWER_OPTIONS = ["110v/15A", "110V/30A", "220V", "Generator OK"];
export const PERMIT_OPTIONS = [
  "None",
  "City Permit",
  "Food Vendor",
  "Health Department",
  "Alcohol",
];
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
    minHeight: 46,
    borderWidth: 1,
    borderColor: AppColor.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    minHeight: 46,
    height: 46,
    margin: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
