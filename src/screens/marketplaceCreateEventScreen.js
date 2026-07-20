import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import ImagePicker from "react-native-image-crop-picker";
import { RESULTS } from "react-native-permissions";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Snackbar } from "react-native-paper";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import { promptForEnableLocationIfNeeded } from "react-native-android-location-enabler";
import Geolocation from "@react-native-community/geolocation";
import AppHeader from "../components/AppHeader";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor } from "../utils/theme";
import Config from "../config/env";
import StatePickerModal from "../components/StatePickerModal";
import {
  createMarketplaceEvent_API,
  deleteMarketplaceEvent_API,
  getLocationName,
	  updateMarketplaceEvent_API,
	  uploadMarketplaceCoordinatorPaymentQr_API,
	  uploadMarketplaceEventImage_API,
	} from "../apiFolder/appAPI";
import usePermission from "../hooks/usePermission";
import { permission } from "../helpers/permission.helper";
import { parseUsAddressFromGooglePlace } from "../helpers/address.helper";
import {
  CUISINE_OPTIONS,
  DIETARY_OPTIONS,
  EQUIPMENT_OPTIONS,
  EVENT_STYLES,
  EVENT_TYPES,
  PERMIT_OPTIONS,
  POWER_OPTIONS,
  SERVICE_TYPES,
  isValidExternalUrl,
  normalizeExternalUrl,
  styles,
  toggleListValue,
} from "./marketplaceShared";

const initialForm = {
  event_name: "",
  event_description: "",
  ticket_sales_enabled: false,
  ticket_url: "",
  event_type: "",
  event_visibility: "PRIVATE",
  event_style: "",
  event_type_other: "",
  service_type: "",
  service_types: [],
  service_styles: [],
  primary_service_style: "",
  plated_number_of_courses: "",
  plated_options: [],
  plated_entree_selection: "",
  plated_included_items: [],
  buffet_setup: "",
  buffet_included_items: [],
  food_truck_options: "",
  station_setup_type: "",
  station_included_items: [],
  service_notes: "",
  event_date: "",
  event_time: "",
  event_duration_total_minutes: "",
  event_address: "",
  event_city: "",
  event_state: "",
  event_zip: "",
  latitude: "",
  longitude: "",
  formatted_address: "",
  place_id: "",
  geocoding_provider: "",
  geocoded_at: "",
  number_of_guests: "",
  number_of_vendors_needed: "1",
  power_required: [],
  permits_required: [],
  insurance_required: false,
  alcohol_required: false,
  free_food_offered: null,
  free_food_provider: "",
  vendors_required_to_giveaway_food: null,
  catered_vip_section_enabled: false,
  vip_guest_count: "",
  cuisine_preferences: [],
  dietary_restrictions: [],
  equipment_needed: [],
  vendor_fee: "",
  budgeted_amount: "",
	  payment_responsibility: "COORDINATOR",
	  coordinator_tax_identifier_type: "",
	  coordinator_tax_identifier: "",
	  coordinator_payment_preference: "",
	  coordinator_payment_handle: "",
	  coordinator_payment_qr_code_url: "",
	  coordinator_payment_qr_code_key: "",
	  coordinator_direct_deposit_routing_number: "",
	  coordinator_direct_deposit_account_number: "",
	  event_close_date: "",
	  event_close_time: "",
	};

const GOOGLE_MAP_API_KEY = Config.GOOGLE_MAP_API_KEY;
const initialEventAddressRegion = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.015,
  longitudeDelta: 0.0121,
};

const PRIMARY_SERVICE_STYLES = [
  {
    label: "Plated",
    icon: "restaurant",
    description:
      "Formal seated service with pre-selected courses. Guests may choose entrees in advance.",
  },
  {
    label: "Buffet",
    icon: "room-service",
    description:
      "Guests serve themselves or are served from stations with flexible portions.",
  },
  {
    label: "Food Truck",
    icon: "local-shipping",
    description:
      "Casual mobile service. Vendors needed are automatically calculated at one truck per 100 guests.",
  },
  {
    label: "Family Style / Stations",
    icon: "groups",
    description:
      "Shared platters, interactive stations, or family-style table service.",
  },
  {
    label: "Other",
    icon: "more-horiz",
    description: "Custom service setup that does not match the standard styles.",
  },
];

const COORDINATOR_PAYMENT_OPTIONS = [
  { label: "Cash App", value: "CASHAPP" },
  { label: "Zelle", value: "ZELLE" },
  { label: "PayPal", value: "PAYPAL" },
  { label: "Venmo", value: "VENMO" },
  { label: "Direct Deposit", value: "DIRECT_DEPOSIT" },
];
const PLATED_OPTIONS = [
  "Individual Plated Meals",
  "Buffet Style",
  "Boxed Meals",
  "Family Style / Shared Platters",
  "Passed Appetizers",
  "Food Truck Window Service",
  "Drop-Off Catering Only",
  "Full-Service Catering",
  "Dessert / Snack Service",
  "Custom Menu / Chef's Choice",
];
const COURSE_OPTIONS = [
  "1 Course",
  "2 Courses",
  "3 Courses",
  "4 Courses",
  "5 Courses",
  "Vendor Recommended",
];
const ENTREE_SELECTION_OPTIONS = [
  "Single entree for all guests",
  "Guest choice of 2-3 entrees",
  "Table-side choice",
  "Vendor recommended",
];
const PLATED_INCLUDED_ITEMS = ["Bread", "Salad", "Dessert", "None", "Vendor recommended"];
const BUFFET_SETUP_OPTIONS = [
  "Full menu buffet",
  "Self-service buffet",
  "Staff-served buffet",
  "Buffet stations",
];
const CATERING_INCLUDED_ITEMS = [
  "Bread",
  "Salad",
  "Dessert",
  "Drinks",
  "Plates/utensils/napkins",
  "Vendor recommended",
];
const FOOD_TRUCK_OPTIONS = [
  "Full Menu",
  "Limited event menu",
  "Vendor recommended",
];
const STATION_SETUP_OPTIONS = [
  "Served stations",
  "Self-service stations",
  "Family-style table service",
  "Vendor recommended",
];
const PAYMENT_RESPONSIBILITY_OPTIONS = [
  ["Event Coordinator pays vendor", "COORDINATOR"],
  ["Vendor pays to attend", "VENDOR"],
  ["Both", "BOTH"],
];
const CALENDAR_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIME_HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);
const TIME_MINUTE_OPTIONS = Array.from({ length: 12 }, (_, index) => index * 5);
const DURATION_HOUR_OPTIONS = Array.from({ length: 13 }, (_, index) => index);
const DURATION_MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) => index);

const EVENT_TYPE_ICONS = {
  Festival: "festival",
  Wedding: "diamond",
  Corporate: "business-center",
  "Private Party": "celebration",
  Fundraiser: "redeem",
  Conference: "groups",
  Market: "storefront",
  Concert: "music-note",
  Other: "more-horiz",
};

const parseLocationDetails = ({ data, details, fallbackAddress = "" }) => {
  const address = parseUsAddressFromGooglePlace({ data, details, fallbackAddress });

  return {
    event_address: address.line1,
    event_city: address.city,
    event_state: address.state,
    event_zip: address.zip,
    latitude: address.latitude,
    longitude: address.longitude,
    formatted_address: address.formattedAddress,
    place_id: address.placeId,
    geocoding_provider: address.latitude && address.longitude ? "GOOGLE_PLACES" : "",
    geocoded_at:
      address.latitude && address.longitude ? new Date().toISOString() : "",
  };
};

const requiredFields = [
  "event_name",
  "event_type",
  "primary_service_style",
  "event_date",
  "event_time",
  "event_address",
  "event_city",
  "event_state",
  "number_of_guests",
  "event_close_date",
  "event_close_time",
];

const getAutoFoodTruckVendorCount = (guestCount) =>
  Math.max(1, Math.ceil(Number(guestCount || 0) / 100));
const getDefaultVendorCount = (value) => String(Math.max(1, Number(value || 1)));

const isFoodTruckService = (form) => form.service_types?.includes("Food Truck");
const hasServiceStyle = (form, style) =>
  normalizeOptionList(form.service_styles).includes(style) ||
  form.primary_service_style === style;
const isCoordinatorBudgetRequired = (form) =>
  ["COORDINATOR", "BOTH"].includes(form.payment_responsibility);
const getBudgetGuestCount = (form) =>
  form.payment_responsibility === "BOTH" && form.catered_vip_section_enabled
    ? Number(form.vip_guest_count || 0)
    : Number(form.number_of_guests || 0);
const getMinimumBudget = (form) => getBudgetGuestCount(form) * 25;
const normalizeOptionList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
};
const maskAccountNumber = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  return `${"*".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
};
const isMaskedAccountValue = (value) => /^\*+\d{4}$/.test(String(value || ""));

const formatDateForPayload = (date) => {
  if (!date) return "";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "";
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateForDisplay = (value) => {
  if (!value) return "";
  const date = parseDateFieldValue(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}/${day}/${date.getFullYear()}`;
};

const hideEncryptedFormValue = (value) =>
  typeof value === "string" && value.includes(":") ? "" : value || "";

const normalizeEventForForm = (event = {}) => ({
  ...initialForm,
  ...event,
  service_types: normalizeOptionList(event.service_types || event.service_type),
  service_styles: normalizeOptionList(event.service_styles || event.event_style),
  power_required: normalizeOptionList(event.power_required),
  permits_required: normalizeOptionList(event.permits_required),
  catered_vip_section_enabled: !!event.catered_vip_section_enabled,
  vip_guest_count: event.vip_guest_count ? String(event.vip_guest_count) : "",
  cuisine_preferences: normalizeOptionList(event.cuisine_preferences),
  dietary_restrictions: normalizeOptionList(event.dietary_restrictions),
  equipment_needed: normalizeOptionList(event.equipment_needed),
  free_food_offered:
    event.free_food_offered === true || event.free_food_offered === false
      ? event.free_food_offered
      : null,
  free_food_provider: event.free_food_provider || "",
  vendors_required_to_giveaway_food:
    event.vendors_required_to_giveaway_food === true ||
    event.vendors_required_to_giveaway_food === false
      ? event.vendors_required_to_giveaway_food
      : null,
  plated_options: normalizeOptionList(event.plated_options),
  plated_included_items: normalizeOptionList(event.plated_included_items),
  buffet_included_items: normalizeOptionList(event.buffet_included_items),
  station_included_items: normalizeOptionList(event.station_included_items),
  food_truck_options: normalizeOptionList(event.food_truck_options)[0] || "",
  event_date: event.event_date ? formatDateForPayload(event.event_date) : "",
  event_duration_hours: "",
  event_duration_minutes: "",
  event_duration_total_minutes:
    event.event_duration_minutes != null || event.event_duration_hours != null
      ? String(getDurationTotalMinutes(event))
      : "",
  event_close_date: event.event_close_date
    ? formatDateForPayload(event.event_close_date)
    : "",
  number_of_guests: event.number_of_guests
    ? String(event.number_of_guests)
    : "",
  number_of_vendors_needed: event.number_of_vendors_needed
    ? String(event.number_of_vendors_needed)
    : "",
	  vendor_fee: event.vendor_fee ? String(event.vendor_fee) : "",
	  budgeted_amount: event.budgeted_amount ? String(event.budgeted_amount) : "",
	  coordinator_tax_identifier_type: event.coordinator_tax_identifier_type || "",
	  coordinator_tax_identifier: hideEncryptedFormValue(event.coordinator_tax_identifier),
	  coordinator_payment_preference: event.coordinator_payment_preference || "",
	  coordinator_payment_handle: event.coordinator_payment_handle || "",
	  coordinator_payment_qr_code_url: event.coordinator_payment_qr_code_url || "",
	  coordinator_payment_qr_code_key: event.coordinator_payment_qr_code_key || "",
	  coordinator_direct_deposit_routing_number:
	    hideEncryptedFormValue(event.coordinator_direct_deposit_routing_number),
  coordinator_direct_deposit_account_number:
    maskAccountNumber(
      hideEncryptedFormValue(event.coordinator_direct_deposit_account_number)
    ),
	});

const formatTimeForPayload = (date) => {
  if (!date) return "";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "";
  return value.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const parseDateFieldValue = (value) => {
  if (!value) return new Date();
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
};

const parseTimeFieldValue = (value) => {
  if (!value) return new Date();
  const match = String(value)
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return new Date();

  const date = new Date();
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();

  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  date.setHours(hours, minutes, 0, 0);
  return date;
};

const combineFormDateTime = (dateValue, timeValue, fallbackEndOfDay = false) => {
  if (!dateValue) return null;
  const date = parseDateFieldValue(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  const time = parseTimeFieldValue(timeValue);
  if (timeValue && !Number.isNaN(time.getTime())) {
    date.setHours(time.getHours(), time.getMinutes(), 0, 0);
  } else if (fallbackEndOfDay) {
    date.setHours(23, 59, 59, 999);
  }
  return date;
};

const formatDurationLabel = (minutesValue) => {
  const totalMinutes = Math.max(0, Number(minutesValue || 0));
  if (!totalMinutes) return "Select duration";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const parts = [];

  if (hours > 0) parts.push(`${hours} hr${hours === 1 ? "" : "s"}`);
  if (minutes > 0) parts.push(`${minutes} min`);

  return parts.join(" ");
};

const getDurationTotalMinutes = (event = {}) => {
  const hours = Number(event.event_duration_hours || 0);
  const minutes = Number(event.event_duration_minutes || 0);
  if (minutes > 59) return minutes;
  return hours > 0 ? hours * 60 + minutes : minutes;
};

const splitDurationForPayload = (totalMinutesValue) => {
  const totalMinutes = Math.max(0, Number(totalMinutesValue || 0));
  return {
    event_duration_hours: Math.floor(totalMinutes / 60),
    event_duration_minutes: totalMinutes % 60,
  };
};

const resetServiceSpecificFields = () => ({
  plated_number_of_courses: "",
  plated_options: [],
  plated_entree_selection: "",
  plated_included_items: [],
  buffet_setup: "",
  buffet_included_items: [],
  food_truck_options: [],
  station_setup_type: "",
  station_included_items: [],
  service_notes: "",
});

const MARKETPLACE_TERMS_URL =
  "https://img1.wsimg.com/blobby/go/76d338e8-ba24-489e-b6e5-cd418f2432d1/downloads/60e83491-cc62-426e-9745-52bde989f441/Round_the_Corner_Terms_and_Conditions_Website_.pdf?ver=1782883580972";

const localStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F6F7F9",
  },
  body: {
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 110,
    backgroundColor: "#F6F7F9",
  },
  card: {
    backgroundColor: AppColor.white,
    borderWidth: 1,
    borderColor: "#E7EAF0",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  termsOverlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  termsModal: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    backgroundColor: AppColor.white,
    padding: 18,
  },
  termsTitle: {
    color: AppColor.text,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },
  termsMessage: {
    color: AppColor.text,
    fontSize: 15,
    lineHeight: 22,
  },
  termsLink: {
    color: AppColor.primary,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  termsActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 20,
  },
  termsActionButton: {
    minHeight: 42,
    minWidth: 82,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  termsNoButton: {
    borderWidth: 1,
    borderColor: "#D8DDE6",
    backgroundColor: AppColor.white,
  },
  termsYesButton: {
    backgroundColor: AppColor.primary,
  },
  termsNoText: {
    color: AppColor.text,
    fontWeight: "700",
  },
  termsYesText: {
    color: AppColor.white,
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1E6",
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
  },
  fieldGroup: {
    marginTop: 12,
  },
  labelWithAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  infoIconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1E6",
  },
  input: {
    minHeight: 48,
    borderRadius: 10,
    borderColor: "#D8DDE6",
    backgroundColor: AppColor.white,
    paddingHorizontal: 12,
    paddingVertical: 11,
    textAlignVertical: "center",
  },
  textarea: {
    minHeight: 98,
  },
  requiredMark: {
    color: AppColor.primary,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: AppColor.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColor.white,
  },
  checkboxActive: {
    borderColor: AppColor.primary,
    backgroundColor: AppColor.primary,
  },
  checkboxLabel: {
    flex: 1,
    color: AppColor.text,
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  eventTypeCard: {
    width: "30.9%",
    minHeight: 82,
    borderWidth: 1,
    borderColor: "#DDE2EA",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: AppColor.white,
  },
  eventTypeCardActive: {
    borderColor: AppColor.primary,
    backgroundColor: "#FFF4EA",
  },
  eventTypeLabel: {
    marginTop: 7,
    textAlign: "center",
  },
  serviceGrid: {
    gap: 12,
  },
  serviceCard: {
    minHeight: 116,
    borderWidth: 1.5,
    borderColor: "#DDE2EA",
    borderRadius: 14,
    padding: 14,
    backgroundColor: AppColor.white,
  },
  serviceCardActive: {
    borderColor: AppColor.primary,
    backgroundColor: "#FFF4EA",
  },
  serviceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  serviceIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F4F7",
  },
  serviceIconActive: {
    backgroundColor: AppColor.primary,
  },
  serviceTitle: {
    flex: 1,
    color: AppColor.text,
    fontSize: 15,
  },
  serviceDescription: {
    color: AppColor.textHighlighter,
    marginTop: 8,
    lineHeight: 19,
  },
	  readOnlyInput: {
	    backgroundColor: "#F2F4F7",
	    color: AppColor.textHighlighter,
	  },
	  pickerShell: {
	    minHeight: 48,
	    borderWidth: 1,
	    borderColor: "#D8DDE6",
	    borderRadius: 10,
	    justifyContent: "center",
	    backgroundColor: AppColor.white,
	    overflow: "hidden",
	  },
	  payoutPanel: {
	    borderWidth: 1,
	    borderColor: "#E7EAF0",
	    borderRadius: 12,
	    padding: 12,
	    marginTop: 14,
	    backgroundColor: "#FAFBFC",
	  },
	  infoRow: {
	    flexDirection: "row",
	    alignItems: "center",
	    gap: 8,
	  },
  segmented: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#DDE2EA",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: AppColor.white,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentActive: {
    backgroundColor: "#FFF1E6",
  },
  segmentDivider: {
    borderLeftWidth: 1,
    borderLeftColor: "#DDE2EA",
  },
  sideBySide: {
    flexDirection: "row",
    gap: 10,
  },
  sideField: {
    flex: 1,
  },
  eventLocationPicker: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#D8DDE6",
    borderRadius: 10,
    overflow: "visible",
    backgroundColor: AppColor.white,
    zIndex: 30,
  },
  eventMapWrap: {
    height: 158,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    overflow: "hidden",
    backgroundColor: "#E9EEF5",
  },
  eventMapWrapSelected: {
    height: 112,
  },
  eventMap: {
    flex: 1,
  },
  eventMapPin: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 57,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  eventLocateButton: {
    position: "absolute",
    right: 10,
    bottom: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColor.white,
    elevation: 4,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
  },
  eventSearchWrap: {
    padding: 10,
    backgroundColor: AppColor.white,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    zIndex: 40,
    elevation: 5,
  },
  eventPlacesContainer: {
    flex: 0,
    zIndex: 50,
  },
  eventPlacesInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    borderWidth: 1,
    borderColor: AppColor.border,
    borderRadius: 8,
    backgroundColor: AppColor.white,
  },
  eventPlacesInput: {
    flex: 1,
    minHeight: 48,
    height: 48,
    margin: 0,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: AppColor.text,
    backgroundColor: AppColor.white,
    textAlignVertical: "center",
  },
  eventPlacesList: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderColor: AppColor.border,
    borderRadius: 8,
    backgroundColor: AppColor.white,
    zIndex: 80,
    elevation: 8,
  },
  eventPlacesRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  eventAddressSummary: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: "#D8DDE6",
    borderRadius: 8,
    backgroundColor: AppColor.white,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
  },
  eventAddressText: {
    flex: 1,
    color: AppColor.text,
    fontSize: 14,
    lineHeight: 18,
    paddingVertical: 9,
    paddingRight: 8,
  },
  eventAddressClear: {
    width: 42,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  moneyBox: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#D8DDE6",
    borderRadius: 10,
    backgroundColor: AppColor.white,
    paddingHorizontal: 12,
  },
  moneyPrefix: {
    color: AppColor.textHighlighter,
    marginRight: 6,
    fontSize: 16,
  },
  moneyInput: {
    flex: 1,
    minHeight: 46,
    paddingVertical: 10,
    color: AppColor.text,
  },
  disabledMoneyBox: {
    backgroundColor: "#F2F4F7",
  },
  budgetInfoBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#FFD7B8",
    borderRadius: 10,
    backgroundColor: "#FFF8F2",
    padding: 12,
  },
  budgetInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  budgetInfoTitle: {
    color: AppColor.text,
    fontWeight: "700",
  },
  budgetInfoClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerButton: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#D8DDE6",
    borderRadius: 10,
    backgroundColor: AppColor.white,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  pickerButtonText: {
    color: AppColor.text,
  },
  pickerPlaceholder: {
    color: AppColor.textPlaceholder,
  },
  datePickerOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(17, 24, 39, 0.35)",
  },
  datePickerSheet: {
    backgroundColor: AppColor.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  datePickerActions: {
    minHeight: 48,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  iosDatePicker: {
    alignSelf: "center",
  },
  androidPickerContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  calendarNavButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1E6",
  },
  calendarTitle: {
    color: AppColor.text,
    fontSize: 17,
    fontWeight: "700",
  },
  calendarWeekRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  calendarWeekday: {
    width: "14.2857%",
    textAlign: "center",
    color: AppColor.textHighlighter,
    fontSize: 12,
    fontWeight: "700",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDayCell: {
    width: "14.2857%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDaySelected: {
    backgroundColor: AppColor.primary,
  },
  calendarDayText: {
    color: AppColor.text,
    fontSize: 14,
    fontWeight: "600",
  },
  calendarDayTextSelected: {
    color: AppColor.white,
  },
  timeToggleRow: {
    flexDirection: "row",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: AppColor.borderColor,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 14,
  },
  timeToggleButton: {
    minWidth: 82,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColor.white,
  },
  timeToggleButtonActive: {
    backgroundColor: AppColor.primary,
  },
  timeToggleText: {
    color: AppColor.text,
    fontWeight: "700",
  },
  timeToggleTextActive: {
    color: AppColor.white,
  },
  timeStepperValue: {
    alignSelf: "center",
    color: AppColor.text,
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 18,
  },
  timeStepperRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  timeStepperColumn: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderColor: AppColor.borderColor,
    borderRadius: 10,
    paddingVertical: 10,
    backgroundColor: AppColor.white,
  },
  timeStepperLabel: {
    color: AppColor.textHighlighter,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },
  timeStepperNumber: {
    color: AppColor.text,
    fontSize: 24,
    fontWeight: "700",
    marginVertical: 8,
  },
  wheelPickerRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "stretch",
    justifyContent: "center",
    marginBottom: 12,
  },
  wheelColumn: {
    flex: 1,
    borderWidth: 1,
    borderColor: AppColor.borderColor,
    borderRadius: 10,
    backgroundColor: AppColor.white,
    overflow: "hidden",
  },
  wheelColumnShort: {
    flex: 0.85,
  },
  wheelLabel: {
    color: AppColor.textHighlighter,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    paddingTop: 8,
    paddingBottom: 4,
  },
  wheelScroll: {
    height: 150,
  },
  wheelScrollContent: {
    paddingVertical: 6,
  },
  wheelOption: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  wheelOptionActive: {
    backgroundColor: "#FFF1E6",
  },
  wheelOptionText: {
    color: AppColor.text,
    fontSize: 18,
    fontWeight: "600",
  },
  wheelOptionTextActive: {
    color: AppColor.primary,
    fontWeight: "800",
  },
  clockFace: {
    width: 260,
    height: 260,
    borderRadius: 130,
    alignSelf: "center",
    backgroundColor: "#F3F4F6",
    marginBottom: 12,
  },
  clockCenter: {
    position: "absolute",
    left: 92,
    top: 92,
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColor.white,
    borderWidth: 1,
    borderColor: AppColor.borderColor,
  },
  clockCenterText: {
    color: AppColor.text,
    fontSize: 16,
    fontWeight: "700",
  },
  clockOption: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  clockOptionActive: {
    backgroundColor: AppColor.primary,
  },
  clockOptionText: {
    color: AppColor.text,
    fontWeight: "700",
  },
  clockOptionTextActive: {
    color: AppColor.white,
  },
  periodRow: {
    flexDirection: "row",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: AppColor.borderColor,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 6,
  },
  nativePickerRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  nativePickerBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: AppColor.borderColor,
    borderRadius: 10,
    backgroundColor: AppColor.white,
    overflow: "hidden",
  },
  nativePicker: {
    height: 156,
    color: AppColor.text,
  },
  nativePickerItem: {
    color: AppColor.text,
    fontSize: 18,
  },
  durationBox: {
    marginTop: 12,
  },
  durationControl: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: "#D8DDE6",
    borderRadius: 10,
    backgroundColor: AppColor.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  durationAdjustButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1E6",
  },
  durationAdjustButtonDisabled: {
    opacity: 0.45,
  },
  durationValue: {
    color: AppColor.text,
    fontSize: 16,
    fontWeight: "700",
  },
  durationOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  uploadCard: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#F0B074",
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#FFF9F4",
    marginTop: 12,
  },
  uploadButton: {
    flexDirection: "row",
    gap: 8,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  imageTile: {
    width: "30.9%",
  },
  imagePreview: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: "#EEF1F5",
  },
  removeImageButton: {
    marginTop: 6,
    alignItems: "center",
  },
  submitFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: AppColor.white,
    borderTopWidth: 1,
    borderTopColor: "#E7EAF0",
  },
  submitButton: {
    borderRadius: 12,
  },
  footerRow: {
    flexDirection: "row",
    gap: 10,
  },
  footerButton: {
    flex: 1,
  },
  deleteFooterButton: {
    borderColor: AppColor.snackbarError,
  },
  deleteFooterText: {
    color: AppColor.snackbarError,
  },
});

const MarketplaceCreateEventScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const editingEventId = route?.params?.eventId || route?.params?.draftEvent?.event_id;
  const draftEvent = route?.params?.draftEvent;
  const isReopenMode = !!route?.params?.reopenMode;
  const eventAddressMapRef = useRef(null);
  const eventAddressSearchRef = useRef(null);
  const formScrollRef = useRef(null);
  const vendorNeedsYRef = useRef(0);
	  const [form, setForm] = useState(initialForm);
	  const [eventImages, setEventImages] = useState([]);
	  const [coordinatorPaymentQrImage, setCoordinatorPaymentQrImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitMode, setSubmitMode] = useState(null);
  const [pickerState, setPickerState] = useState(null);
  const [budgetInfoVisible, setBudgetInfoVisible] = useState(false);
  const [eventAddressRegion, setEventAddressRegion] = useState(
    initialEventAddressRegion
  );
  const [eventAddressLoading, setEventAddressLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "error",
  });
  const [showTermsConfirmation, setShowTermsConfirmation] = useState(false);
  const autoFoodTruckStyleRef = useRef(false);
  const allowBackNavigationRef = useRef(false);
  const { checkAndRequestPermission: photosPermissionStatus } = usePermission(
    permission.photos
  );
  const { checkAndRequestPermission: locationPermissionStatus } = usePermission(
    permission.location
  );
	  const foodTruckSelected = isFoodTruckService(form);
	  const savedEventLocationLocked = !!editingEventId && !isReopenMode;

  const hasDraftableEventChanges = useCallback(() => {
    return [
      "event_name",
      "event_description",
      "event_type",
      "event_address",
      "event_city",
      "event_state",
      "event_zip",
      "number_of_guests",
      "budgeted_amount",
      "vendor_fee",
    ].some((key) => String(form[key] || "").trim()) || form.service_types.length > 0;
  }, [form]);

  useEffect(() => {
    if (!draftEvent) return;
	    const nextForm = normalizeEventForForm(draftEvent);
	    setForm(nextForm);
	    setCoordinatorPaymentQrImage(null);
    if (nextForm.latitude && nextForm.longitude) {
      const region = {
        latitude: Number(nextForm.latitude),
        longitude: Number(nextForm.longitude),
        latitudeDelta: 0.015,
        longitudeDelta: 0.0121,
      };
      setEventAddressRegion(region);
      setTimeout(() => {
        eventAddressMapRef.current?.animateToRegion(region, 600);
      }, 300);
    }
  }, [draftEvent]);

  useEffect(() => {
    setForm((prev) => {
      if (!isFoodTruckService(prev)) {
        return Number(prev.number_of_vendors_needed || 0) >= 1
          ? prev
          : { ...prev, number_of_vendors_needed: "1" };
      }

      return {
        ...prev,
        number_of_vendors_needed: String(
          getAutoFoodTruckVendorCount(prev.number_of_guests)
        ),
      };
    });
  }, [form.number_of_guests, form.service_types]);

  useEffect(() => {
    setForm((prev) => {
      if (
        prev.payment_responsibility !== "BOTH" ||
        !prev.catered_vip_section_enabled
      ) {
        return prev;
      }

      const minimumBudget = getMinimumBudget(prev).toFixed(2);
      return prev.budgeted_amount === minimumBudget
        ? prev
        : { ...prev, budgeted_amount: minimumBudget };
    });
  }, [
    form.payment_responsibility,
    form.catered_vip_section_enabled,
    form.vip_guest_count,
  ]);

  useEffect(() => {
    const selectedLocation = route?.params?.selectedEventLocation;
    if (!selectedLocation) return;

    applySelectedAddress({
      event_address: selectedLocation.address || "",
      event_city: selectedLocation.city || "",
      event_state: selectedLocation.state || "",
      event_zip: selectedLocation.zip || "",
      latitude: selectedLocation.lat != null ? String(selectedLocation.lat) : "",
      longitude: selectedLocation.long != null ? String(selectedLocation.long) : "",
      formatted_address:
        selectedLocation.formattedAddress || selectedLocation.address || "",
      place_id: selectedLocation.placeId || "",
      geocoding_provider: selectedLocation.geocodingProvider || "",
      geocoded_at: selectedLocation.geocodedAt || "",
    });
    if (selectedLocation.lat != null && selectedLocation.long != null) {
      const region = {
        latitude: Number(selectedLocation.lat),
        longitude: Number(selectedLocation.long),
        latitudeDelta: 0.015,
        longitudeDelta: 0.0121,
      };
      setEventAddressRegion(region);
      eventAddressMapRef.current?.animateToRegion(region, 1000);
    }
    eventAddressSearchRef.current?.setAddressText(
      selectedLocation.formattedAddress || selectedLocation.address || ""
    );
    navigation.setParams({ selectedEventLocation: undefined });
  }, [navigation, route?.params?.selectedEventLocation]);

  const updateField = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "free_food_offered" && value === false) {
        next.free_food_provider = "";
        next.vendors_required_to_giveaway_food = null;
      }
      return next;
    });
  };

  const updateListField = (key, option) => {
    setForm((prev) => {
      let nextList = toggleListValue(prev[key] || [], option);
      const next = { ...prev, [key]: nextList };

      if (key === "service_types" && option === "Food Truck") {
        if (nextList.includes("Food Truck")) {
          next.primary_service_style = "Food Truck";
          next.service_styles = [
            ...new Set([...(prev.service_styles || []), "Food Truck"]),
          ];
          autoFoodTruckStyleRef.current = true;
          next.number_of_vendors_needed = String(
            getAutoFoodTruckVendorCount(prev.number_of_guests)
          );
        } else {
          if (
            autoFoodTruckStyleRef.current &&
            prev.primary_service_style === "Food Truck"
          ) {
            next.primary_service_style = "";
            next.service_styles = (prev.service_styles || []).filter(
              (item) => item !== "Food Truck"
            );
            autoFoodTruckStyleRef.current = false;
          }
          next.number_of_vendors_needed = getDefaultVendorCount(
            prev.number_of_vendors_needed
          );
        }
      }

      if (key === "service_styles" && option === "Food Truck") {
        if (nextList.includes("Food Truck")) {
          next.service_types = [
            ...new Set([...(prev.service_types || []), "Food Truck"]),
          ];
          next.primary_service_style = "Food Truck";
        } else if (prev.service_types?.includes("Food Truck")) {
          nextList = [...new Set([...nextList, "Food Truck"])];
          next.service_styles = nextList;
          next.primary_service_style = "Food Truck";
        }
      }

      if (key === "permits_required" && option === "Alcohol") {
        next.alcohol_required = nextList.includes("Alcohol");
        next.service_types = next.alcohol_required
          ? [...new Set([...(prev.service_types || []), "Beverage and Alcohol"])]
          : (prev.service_types || []).filter(
              (item) => item !== "Beverage and Alcohol"
            );
      }

      if (key === "service_types" && option === "Beverage and Alcohol") {
        if (nextList.includes("Beverage and Alcohol")) {
          next.alcohol_required = true;
          next.permits_required = [
            ...new Set([...(prev.permits_required || []), "Alcohol"]),
          ];
        } else {
          next.alcohol_required = false;
          next.permits_required = (prev.permits_required || []).filter(
            (item) => item !== "Alcohol"
          );
        }
        next.service_types = nextList;
      }

      if (key === "equipment_needed") {
        if (option === "None" && nextList.includes("None")) {
          nextList = ["None"];
        } else if (option !== "None") {
          nextList = nextList.filter((item) => item !== "None");
        }
        next.equipment_needed = nextList;
      }

      if (
        [
          "plated_included_items",
          "buffet_included_items",
          "station_included_items",
        ].includes(key)
      ) {
        if (option === "None" && nextList.includes("None")) {
          nextList = ["None"];
        } else if (option !== "None") {
          nextList = nextList.filter((item) => item !== "None");
        }
        next[key] = nextList;
      }

      return next;
    });
  };

  const updateAlcoholRequired = (value) => {
    setForm((prev) => ({
      ...prev,
      alcohol_required: value,
      permits_required: value
        ? [...new Set([...(prev.permits_required || []), "Alcohol"])]
        : (prev.permits_required || []).filter((item) => item !== "Alcohol"),
      service_types: value
        ? [...new Set([...(prev.service_types || []), "Beverage and Alcohol"])]
        : (prev.service_types || []).filter(
            (item) => item !== "Beverage and Alcohol"
          ),
    }));
  };

  const getCurrentPosition = () =>
    new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(error),
        {
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: 20000,
        }
      );
    });

  const applySelectedAddress = (address, options = {}) => {
    const { syncSearchText = true } = options;
    const nextAddressText =
      address.formatted_address || address.event_address || "";
    if (syncSearchText && nextAddressText) {
      eventAddressSearchRef.current?.setAddressText(nextAddressText);
    }
    setForm((prev) => ({
      ...prev,
      event_address:
        address.event_address !== undefined ? address.event_address : "",
      event_city:
        address.event_city !== undefined ? address.event_city : prev.event_city,
      event_state:
        address.event_state !== undefined ? address.event_state : prev.event_state,
      event_zip:
        address.event_zip !== undefined ? address.event_zip : prev.event_zip,
      latitude: address.latitude !== undefined ? address.latitude : prev.latitude,
      longitude: address.longitude !== undefined ? address.longitude : prev.longitude,
      formatted_address:
        address.formatted_address !== undefined
          ? address.formatted_address
          : address.event_address || prev.formatted_address,
      place_id: address.place_id !== undefined ? address.place_id : prev.place_id,
      geocoding_provider:
        address.geocoding_provider !== undefined
          ? address.geocoding_provider
          : prev.geocoding_provider,
      geocoded_at:
        address.geocoded_at !== undefined ? address.geocoded_at : prev.geocoded_at,
    }));
  };

  const reverseGeocodeEventRegion = async (region) => {
    const response = await getLocationName({
      lat: region.latitude,
      long: region.longitude,
    });
    if (response?.status !== "OK" || !response?.results?.[0]) {
      setForm((prev) => ({
        ...prev,
        latitude: String(region.latitude),
        longitude: String(region.longitude),
        geocoding_provider: prev.event_address ? prev.geocoding_provider : "",
        geocoded_at: prev.event_address ? new Date().toISOString() : "",
      }));
      return;
    }

    const result = response.results[0];
    const parsedPlace = parseLocationDetails({
      details: result,
      fallbackAddress: result.formatted_address,
    });
    applySelectedAddress(
      {
        ...parsedPlace,
        latitude: String(region.latitude),
        longitude: String(region.longitude),
        geocoding_provider: "GOOGLE_REVERSE_GEOCODE",
        geocoded_at: new Date().toISOString(),
      },
      { syncSearchText: false }
    );
  };

  const centerEventAddressOnCurrentLocation = async () => {
    setEventAddressLoading(true);
    try {
      const locationStatus = await locationPermissionStatus();
      if (locationStatus !== RESULTS.GRANTED) {
        setSnackbar({
          visible: true,
          message: "Allow permission to locate you.",
        });
        return;
      }

      const position = await getCurrentPosition();
      const region = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.0121,
      };
      setEventAddressRegion(region);
      eventAddressMapRef.current?.animateToRegion(region, 1000);
      await reverseGeocodeEventRegion(region);
    } catch (error) {
      if (error?.code === 2 && Platform.OS === "android") {
        try {
          const enableResult = await promptForEnableLocationIfNeeded();
          if (enableResult === "already-enabled" || enableResult === "enabled") {
            setTimeout(() => {
              centerEventAddressOnCurrentLocation();
            }, 1000);
          }
        } catch (enableError) {
          console.log("Event address location enable error", enableError);
          setSnackbar({
            visible: true,
            message: "Please turn on device location.",
          });
        }
      } else {
        console.log("Event address current location error", error);
        setSnackbar({
          visible: true,
          message:
            error?.code === 3
              ? "Please select location manually."
              : "Please turn on device location.",
        });
      }
    } finally {
      setEventAddressLoading(false);
    }
  };

  const handleGoogleAddressSelect = (data, details) => {
    if (!details) return;
    const parsedPlace = parseLocationDetails({ data, details });
    const nextRegion =
      parsedPlace.latitude && parsedPlace.longitude
        ? {
            latitude: Number(parsedPlace.latitude),
            longitude: Number(parsedPlace.longitude),
            latitudeDelta: 0.015,
            longitudeDelta: 0.0121,
          }
        : null;

    applySelectedAddress(parsedPlace);
    if (nextRegion) {
      setEventAddressRegion(nextRegion);
      eventAddressMapRef.current?.animateToRegion(nextRegion, 1000);
    }
    eventAddressSearchRef.current?.setAddressText(
      parsedPlace.formatted_address || parsedPlace.event_address
    );
  };

  const handleEventMapRegionChange = async (region, gesture) => {
    if (!gesture?.isGesture) return;
    setEventAddressRegion(region);
    try {
      await reverseGeocodeEventRegion(region);
    } catch (error) {
      console.log("Event address reverse geocode error", error);
      setForm((prev) => ({
        ...prev,
        latitude: String(region.latitude),
        longitude: String(region.longitude),
      }));
    }
  };

  const handleClearAddress = () => {
    eventAddressSearchRef.current?.clear();
    eventAddressSearchRef.current?.setAddressText("");
    setForm((prev) => ({
      ...prev,
      event_address: "",
      event_city: "",
      event_state: "",
      event_zip: "",
      latitude: "",
      longitude: "",
      formatted_address: "",
      place_id: "",
      geocoding_provider: "",
      geocoded_at: "",
    }));
  };

  useEffect(() => {
    if (draftEvent?.event_address || draftEvent?.formatted_address) return;
    centerEventAddressOnCurrentLocation();
  }, [draftEvent]);

  const validate = (status = "OPEN") => {
    if (status === "DRAFT") {
      if (!form.event_name.trim() || !form.event_type.trim() || !form.event_visibility) {
        setSnackbar({
          visible: true,
          message: "Event name, event type, and visibility are required to save a draft.",
        });
        return false;
      }
      return true;
    }
    const missing = requiredFields.find((field) => !String(form[field]).trim());
    if (missing) {
      setSnackbar({ visible: true, message: "Please complete required fields." });
      return false;
    }
    if (form.event_type === "Other" && !form.event_type_other.trim()) {
      setSnackbar({ visible: true, message: "Please describe the Other event type." });
      return false;
    }
    if (form.free_food_offered !== true && form.free_food_offered !== false) {
      setSnackbar({
        visible: true,
        message: "Please answer whether free food will be offered.",
      });
      return false;
    }
    if (form.free_food_offered === true) {
      if (!form.free_food_provider.trim()) {
        setSnackbar({
          visible: true,
          message: "Please enter which company/vendor will offer free food.",
        });
        return false;
      }
      if (
        form.vendors_required_to_giveaway_food !== true &&
        form.vendors_required_to_giveaway_food !== false
      ) {
        setSnackbar({
          visible: true,
          message: "Please answer whether vendors must also give away food.",
        });
        return false;
      }
    }
    if (!form.service_types.length) {
      setSnackbar({ visible: true, message: "Please select at least one service type." });
      return false;
    }
    if (isFoodTruckService(form) && !hasServiceStyle(form, "Food Truck")) {
      setSnackbar({
        visible: true,
        message: "Food Truck must be selected under Primary Service Style.",
      });
      return false;
    }
    if (!isValidExternalUrl(form.ticket_url)) {
      setSnackbar({
        visible: true,
        message: "Please enter a valid ticket sales link.",
      });
      return false;
    }
    if (Number(form.number_of_vendors_needed || 0) < 1) {
      setSnackbar({
        visible: true,
        message: "Vendors Needed must be at least 1.",
      });
      return false;
    }
    const eventDateTime = combineFormDateTime(form.event_date, form.event_time, true);
    const closeDateTime = combineFormDateTime(
      form.event_close_date,
      form.event_close_time,
      true
    );
    if (!eventDateTime || eventDateTime <= new Date()) {
      setSnackbar({
        visible: true,
        message: "Event date/time must be in the future.",
      });
      return false;
    }
    if (!closeDateTime || closeDateTime <= new Date()) {
      setSnackbar({
        visible: true,
        message: "Close date/time must be in the future.",
      });
      return false;
    }
    if (closeDateTime >= eventDateTime) {
      setSnackbar({
        visible: true,
        message: "Close date/time must be before the event date/time.",
      });
      return false;
    }
    const durationMinutes = Number(form.event_duration_total_minutes || 0);
    if (
      !Number.isFinite(durationMinutes) ||
      durationMinutes < 0
    ) {
      setSnackbar({
        visible: true,
        message: "Please choose a valid event duration.",
      });
      return false;
    }
    if (status !== "DRAFT" && durationMinutes <= 0) {
      setSnackbar({
        visible: true,
        message: "Event duration is required.",
      });
      return false;
    }
    if (form.alcohol_required && !form.permits_required.includes("Alcohol")) {
      setSnackbar({
        visible: true,
        message: "Alcohol Permit is required when Alcohol Required is selected.",
      });
      return false;
    }
    if (form.payment_responsibility === "COORDINATOR" && Number(form.budgeted_amount || 0) <= 0) {
      setSnackbar({ visible: true, message: "Budget amount is required." });
      return false;
    }
    if (form.payment_responsibility === "VENDOR" && Number(form.vendor_fee || 0) <= 0) {
      setSnackbar({ visible: true, message: "Vendor fee is required." });
      return false;
    }
    if (
      form.payment_responsibility === "BOTH" &&
      (Number(form.budgeted_amount || 0) <= 0 || Number(form.vendor_fee || 0) <= 0)
    ) {
      setSnackbar({
        visible: true,
        message: "Budget amount and vendor fee are required.",
      });
      return false;
    }
    if (
      form.payment_responsibility === "BOTH" &&
      form.catered_vip_section_enabled &&
      Number(form.vip_guest_count || 0) < 1
    ) {
      setSnackbar({
        visible: true,
        message: "Enter the number of VIP guests for the catered section.",
      });
      return false;
    }
	    if (isCoordinatorBudgetRequired(form)) {
	      const minimumBudget = getMinimumBudget(form);
	      if (Number(form.budgeted_amount || 0) < minimumBudget) {
        setSnackbar({
          visible: true,
          message: `Budget must be at least $${minimumBudget.toFixed(2)} for the paid guest count.`,
        });
	        return false;
	      }
	    }
	    if (status !== "DRAFT" && form.coordinator_tax_identifier_type && !form.coordinator_tax_identifier.trim()) {
	      setSnackbar({
	        visible: true,
	        message: "Enter the coordinator EIN or SSN for accounting and tax purposes.",
	      });
	      return false;
	    }
	    if (status !== "DRAFT" && form.coordinator_payment_preference) {
	      if (form.coordinator_payment_preference === "DIRECT_DEPOSIT") {
	        if (!form.coordinator_direct_deposit_routing_number.trim()) {
	          setSnackbar({ visible: true, message: "Routing number is required for direct deposit." });
	          return false;
	        }
	        if (!form.coordinator_direct_deposit_account_number.trim()) {
	          setSnackbar({ visible: true, message: "Account number is required for direct deposit." });
	          return false;
	        }
	      } else if (!coordinatorPaymentQrImage && !form.coordinator_payment_qr_code_url) {
	        setSnackbar({
	          visible: true,
	          message: "Upload the coordinator payment QR code for the selected payment preference.",
	        });
	        return false;
	      }
	    }
	    return true;
	  };

  const buildPayload = (status) => {
    const {
      event_duration_total_minutes: _eventDurationTotalMinutes,
      event_duration_hours: _eventDurationHours,
      event_duration_minutes: _eventDurationMinutes,
      ...formPayload
    } = form;
    const durationPayload = splitDurationForPayload(_eventDurationTotalMinutes);

    return {
      ...formPayload,
      ...durationPayload,
      event_style: form.event_style || "",
      service_type: form.service_types[0] || "",
      primary_service_style:
        form.primary_service_style || form.service_styles[0] || "",
      number_of_guests: form.number_of_guests ? Number(form.number_of_guests) : null,
      catered_vip_section_enabled: !!form.catered_vip_section_enabled,
      vip_guest_count: form.catered_vip_section_enabled
        ? Number(form.vip_guest_count || 0)
        : 0,
      number_of_vendors_needed:
        isFoodTruckService(form) && form.number_of_guests
          ? getAutoFoodTruckVendorCount(form.number_of_guests)
          : Number(form.number_of_vendors_needed || 1),
      plated_number_of_courses: form.plated_number_of_courses
        ? form.plated_number_of_courses
        : null,
      food_truck_options: isFoodTruckService(form)
        ? normalizeOptionList(form.food_truck_options)
        : [],
      vendor_fee:
        form.payment_responsibility === "COORDINATOR"
          ? 0
          : Number(form.vendor_fee || 0),
      budgeted_amount:
        form.payment_responsibility === "VENDOR"
          ? 0
          : Number(form.budgeted_amount || 0),
      ticket_sales_enabled: !!form.ticket_sales_enabled,
      ticket_url: normalizeExternalUrl(form.ticket_url),
	      free_food_provider:
	        form.free_food_offered === true ? form.free_food_provider.trim() : "",
      vendors_required_to_giveaway_food:
        form.free_food_offered === true
	          ? form.vendors_required_to_giveaway_food
	          : null,
	      coordinator_tax_identifier_type:
	        form.coordinator_tax_identifier_type || null,
	      coordinator_tax_identifier:
	        form.coordinator_tax_identifier?.trim() || null,
	      coordinator_payment_preference:
	        form.coordinator_payment_preference || null,
	      coordinator_payment_handle:
	        form.coordinator_payment_handle?.trim() || null,
	      coordinator_payment_qr_code_url:
	        form.coordinator_payment_qr_code_url || null,
	      coordinator_payment_qr_code_key:
	        form.coordinator_payment_qr_code_key || null,
	      coordinator_payment_qr_pending:
	        !!coordinatorPaymentQrImage &&
	        form.coordinator_payment_preference &&
	        form.coordinator_payment_preference !== "DIRECT_DEPOSIT" &&
	        !form.coordinator_payment_qr_code_url,
	      coordinator_direct_deposit_routing_number:
	        form.coordinator_payment_preference === "DIRECT_DEPOSIT"
	          ? form.coordinator_direct_deposit_routing_number?.trim() || null
	          : null,
	      coordinator_direct_deposit_account_number:
	        form.coordinator_payment_preference === "DIRECT_DEPOSIT" &&
	        !isMaskedAccountValue(form.coordinator_direct_deposit_account_number)
	          ? form.coordinator_direct_deposit_account_number?.trim() || null
	          : null,
	      status,
	    };
	  };

  const handleSubmit = async (status = "OPEN", options = {}) => {
    if (!validate(status)) return;
    setLoading(true);
    setSubmitMode(status);
    try {
      const payload = buildPayload(status);
      if (__DEV__) {
        console.log("Marketplace event submit payload", {
          requestedStatus: status,
          payloadStatus: payload.status,
          eventId: editingEventId || null,
        });
      }
      const response = editingEventId
        ? await updateMarketplaceEvent_API({ eventId: editingEventId, payload })
        : await createMarketplaceEvent_API(payload);
      if (!response?.success) {
        throw new Error(response?.message || "Event update failed.");
      }

      const eventId = response.data?.marketplaceEvent?.event_id;
      const returnedStatus = response.data?.marketplaceEvent?.status;
      if (
        status !== "DRAFT" &&
        !["OPEN", "REOPENED"].includes(returnedStatus)
      ) {
        setSnackbar({
          visible: true,
          message:
            "Event was not submitted. Please review required fields and try again.",
          type: "error",
        });
        return;
      }

	      let uploadWarning = false;
	      let uploadWarningMessage = "";
	      if (
	        status !== "DRAFT" &&
	        eventId &&
	        coordinatorPaymentQrImage &&
	        form.coordinator_payment_preference !== "DIRECT_DEPOSIT"
	      ) {
	        try {
	          const qrFormData = new FormData();
	          qrFormData.append("file", {
	            uri: coordinatorPaymentQrImage.uri,
	            name: coordinatorPaymentQrImage.name,
	            type: coordinatorPaymentQrImage.type,
	          });
	          const qrResponse = await uploadMarketplaceCoordinatorPaymentQr_API({
	            eventId,
	            payload: qrFormData,
	          });
	          const qrUrl = qrResponse?.data?.coordinator_payment_qr_code_url;
	          const qrKey = qrResponse?.data?.coordinator_payment_qr_code_key;
	          if (qrUrl) {
	            await updateMarketplaceEvent_API({
	              eventId,
	              payload: {
	                ...payload,
	                coordinator_payment_qr_pending: false,
	                coordinator_payment_qr_code_url: qrUrl,
	                coordinator_payment_qr_code_key: qrKey || null,
	              },
	            });
	            setCoordinatorPaymentQrImage(null);
	            setForm((prev) => ({
	              ...prev,
	              coordinator_payment_qr_code_url: qrUrl,
	              coordinator_payment_qr_code_key: qrKey || "",
	            }));
	          }
	        } catch (error) {
	          uploadWarning = true;
	          uploadWarningMessage =
	            error?.message ||
	            error?.error?.message ||
	            "Coordinator payment QR code did not upload.";
	          console.log("Coordinator payment QR upload error", error);
	        }
	      }
	      if (status !== "DRAFT" && eventId && eventImages.length) {
        try {
          for (const image of eventImages) {
            const formData = new FormData();
            formData.append("file", {
              uri: image.uri,
              name: image.name,
              type: image.type,
            });
            await uploadMarketplaceEventImage_API({
              eventId,
              payload: formData,
            });
          }
        } catch (error) {
          uploadWarning = true;
          uploadWarningMessage =
            error?.message ||
            error?.error?.message ||
            "One or more images did not upload.";
          console.log("Marketplace event image upload error", error);
        }
      }
      setSnackbar({
        visible: true,
        message:
          options.successMessage
            ? options.successMessage
            : status === "DRAFT"
            ? "Your draft has been saved."
            : uploadWarning
              ? `Event submitted, but image upload was blocked: ${uploadWarningMessage}`
              : "Your event is open for vendor bids.",
        type: "success",
      });
      setTimeout(() => {
        if (options.skipNavigation) {
          return;
        }
        if (options.navigateToDetails && eventId) {
          if (options.replaceDetails) {
            navigation.replace("marketplaceEventDetailsScreen", { eventId });
            return;
          }
          navigation.navigate("marketplaceEventDetailsScreen", { eventId });
          return;
        }
        navigation.navigate("marketplaceMyEventsScreen");
      }, 600);
      return true;
    } catch (error) {
      setSnackbar({
        visible: true,
        message:
          error?.message ||
          (status === "DRAFT" ? "Failed to save draft." : "Failed to create event."),
        type: "error",
      });
      return false;
    } finally {
      setLoading(false);
      setSubmitMode(null);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = navigation.addListener("beforeRemove", (event) => {
        if (allowBackNavigationRef.current || loading || !hasDraftableEventChanges()) {
          return;
        }

        event.preventDefault();
        Alert.alert(
          "Save your event?",
          "Do you want to save your event before leaving?",
          [
            {
              text: "No",
              style: "destructive",
              onPress: () => {
                allowBackNavigationRef.current = true;
                navigation.dispatch(event.data.action);
              },
            },
            { text: "Cancel", style: "cancel" },
            {
              text: "Yes",
              onPress: async () => {
                const saved = await handleSubmit("DRAFT", {
                  skipNavigation: true,
                  successMessage: "Your draft has been saved.",
                });
                if (saved) {
                  allowBackNavigationRef.current = true;
                  navigation.dispatch(event.data.action);
                }
              },
            },
          ]
        );
      });

      return unsubscribe;
    }, [hasDraftableEventChanges, loading, navigation])
  );

  const scrollToVendorNeeds = () => {
    formScrollRef.current?.scrollTo({
      y: Math.max(0, vendorNeedsYRef.current - 20),
      animated: true,
    });
  };

  const continueSubmitConfirmation = () => {
    setShowTermsConfirmation(true);
  };

  const handleViewTerms = () => {
    navigation.navigate("marketplaceTicketWebViewScreen", {
      url: MARKETPLACE_TERMS_URL,
      title: "Terms and Conditions",
    });
  };

  const handleTermsConfirm = () => {
    setShowTermsConfirmation(false);
    handleSubmit("OPEN", {
      navigateToDetails: isReopenMode,
      replaceDetails: isReopenMode,
      successMessage: isReopenMode
        ? "Event dates and details have been updated."
        : undefined,
    });
  };

  const handleTermsDecline = () => {
    setShowTermsConfirmation(false);
    handleSubmit("DRAFT", {
      navigateToDetails: true,
      replaceDetails: !!editingEventId,
      successMessage: "Your changes have been saved as a draft.",
    });
  };

  const handleSubmitConfirmation = () => {
    if (loading) return;

    if (
      form.event_visibility === "PRIVATE" &&
      Number(form.number_of_vendors_needed || 0) === 1
    ) {
      Alert.alert(
        "Confirm Vendor Count",
        "You have selected only one vendor for this private event. Are you sure you only need one vendor?",
        [
          {
            text: "Yes",
            onPress: continueSubmitConfirmation,
          },
          {
            text: "No",
            style: "cancel",
            onPress: scrollToVendorNeeds,
          },
        ]
      );
      return;
    }

    continueSubmitConfirmation();
  };

  const handleDeleteDraft = () => {
    if (!editingEventId || loading) return;

    Alert.alert(
      "Delete Draft",
      "This draft will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            setSubmitMode("DELETE");
            try {
              const response = await deleteMarketplaceEvent_API(editingEventId);
              if (response?.success) {
                setSnackbar({
                  visible: true,
                  message: "Draft deleted.",
                  type: "success",
                });
                setTimeout(() => {
                  navigation.navigate("marketplaceMyEventsScreen");
                }, 500);
              }
            } catch (error) {
              setSnackbar({
                visible: true,
                message: error?.message || "Failed to delete draft.",
                type: "error",
              });
            } finally {
              setLoading(false);
              setSubmitMode(null);
            }
          },
        },
      ]
    );
  };

	  const handlePickEventImages = async () => {
    try {
      if (Platform.OS === "ios") {
        const photosStatus = await photosPermissionStatus();
        if (
          photosStatus !== RESULTS.GRANTED &&
          photosStatus !== RESULTS.LIMITED
        ) {
          return;
        }
      }

      const images = await ImagePicker.openPicker({
        multiple: true,
        mediaType: "photo",
      });
      const selectedImages = images.map((image) =>
        Platform.OS === "ios"
          ? {
              uri: image?.sourceURL || image?.path,
              name: image?.filename || `${Date.now()}.jpg`,
              type: image.mime,
            }
          : {
              uri: image?.path,
              name: `${image?.path?.split("/").pop()}`,
              type: image.mime,
            }
      );
      setEventImages((prev) => [...prev, ...selectedImages]);
    } catch (error) {
      if (error?.code !== "E_PICKER_CANCELLED") {
        setSnackbar({
          visible: true,
          message: error?.message || "Failed to select event images.",
        });
      }
    }
	  };

	  const handlePickCoordinatorPaymentQr = async () => {
	    try {
	      if (Platform.OS === "ios") {
	        const photosStatus = await photosPermissionStatus();
	        if (
	          photosStatus !== RESULTS.GRANTED &&
	          photosStatus !== RESULTS.LIMITED
	        ) {
	          return;
	        }
	      }

	      const image = await ImagePicker.openPicker({
	        multiple: false,
	        mediaType: "photo",
	      });
	      setCoordinatorPaymentQrImage(
	        Platform.OS === "ios"
	          ? {
	              uri: image?.sourceURL || image?.path,
	              name: image?.filename || `coordinator-payment-${Date.now()}.jpg`,
	              type: image.mime,
	            }
	          : {
	              uri: image?.path,
	              name: `${image?.path?.split("/").pop()}`,
	              type: image.mime,
	            }
	      );
	      setForm((prev) => ({
	        ...prev,
	        coordinator_payment_qr_code_url: "",
	        coordinator_payment_qr_code_key: "",
	      }));
	    } catch (error) {
	      if (error?.code !== "E_PICKER_CANCELLED") {
	        setSnackbar({
	          visible: true,
	          message: error?.message || "Failed to select payment QR code.",
	        });
	      }
	    }
	  };

  const renderSectionHeader = (title, icon) => (
    <View style={localStyles.sectionHeader}>
      <View style={localStyles.sectionIcon}>
        <MaterialIcons name={icon} size={21} color={AppColor.primary} />
      </View>
      <Text style={[styles.title, localStyles.sectionTitle]}>{title}</Text>
    </View>
  );

  const renderLabel = (label) => {
    const required = label.includes("*");
    const cleanLabel = label.replace(" *", "");
    return (
      <Text style={styles.label}>
        {cleanLabel}
        {required ? <Text style={localStyles.requiredMark}> *</Text> : null}
      </Text>
    );
  };

	  const renderInput = (label, key, props = {}) => (
	    <View style={localStyles.fieldGroup}>
      {renderLabel(label)}
      <TextInput
        value={props.value !== undefined ? props.value : form[key]}
        onChangeText={(value) =>
          props.onChangeText ? props.onChangeText(value) : updateField(key, value)
        }
        placeholder={props.placeholder}
        keyboardType={props.keyboardType}
        multiline={props.multiline}
        editable={props.editable}
        style={[
          styles.input,
          localStyles.input,
          props.multiline ? styles.textarea : null,
          props.multiline ? localStyles.textarea : null,
          props.editable === false ? localStyles.readOnlyInput : null,
        ]}
      />
	    </View>
	  );

	  const renderCoordinatorPayoutFields = () => {
	    const usesDirectDeposit =
	      form.coordinator_payment_preference === "DIRECT_DEPOSIT";
	    const needsQr =
	      form.coordinator_payment_preference &&
	      form.coordinator_payment_preference !== "DIRECT_DEPOSIT";
	    const qrReady = !!coordinatorPaymentQrImage || !!form.coordinator_payment_qr_code_url;

	    return (
	      <View style={localStyles.payoutPanel}>
	        <View style={localStyles.infoRow}>
	          <MaterialIcons name="info-outline" size={18} color={AppColor.primary} />
	          <Text style={styles.meta}>
	            Information is needed for accounting and tax purposes.
	          </Text>
	        </View>
	        <View style={localStyles.sideBySide}>
	          <View style={localStyles.sideField}>
	            <View style={localStyles.fieldGroup}>
	              {renderLabel("Tax ID Type")}
	              <View style={localStyles.pickerShell}>
	                <Picker
	                  selectedValue={form.coordinator_tax_identifier_type}
	                  onValueChange={(value) =>
	                    updateField("coordinator_tax_identifier_type", value)
	                  }
	                >
	                  <Picker.Item label="Select" value="" />
	                  <Picker.Item label="EIN" value="EIN" />
	                  <Picker.Item label="SSN" value="SSN" />
	                </Picker>
	              </View>
	            </View>
	          </View>
	          <View style={localStyles.sideField}>
	            {renderInput("EIN / SSN", "coordinator_tax_identifier", {
	              keyboardType: "number-pad",
	              placeholder: "Required if type is selected",
	            })}
	          </View>
	        </View>

	        <Text style={[styles.label, { marginTop: 8 }]}>Coordinator Payment Preference</Text>
	        <View style={styles.chipWrap}>
	          {COORDINATOR_PAYMENT_OPTIONS.map((option) => {
	            const active = form.coordinator_payment_preference === option.value;
	            return (
	              <TouchableOpacity
	                key={option.value}
	                activeOpacity={0.75}
	                onPress={() =>
	                  setForm((prev) => ({
	                    ...prev,
	                    coordinator_payment_preference: option.value,
	                    coordinator_payment_qr_code_url:
	                      option.value === "DIRECT_DEPOSIT"
	                        ? ""
	                        : prev.coordinator_payment_qr_code_url,
	                    coordinator_payment_qr_code_key:
	                      option.value === "DIRECT_DEPOSIT"
	                        ? ""
	                        : prev.coordinator_payment_qr_code_key,
	                    coordinator_direct_deposit_routing_number:
	                      option.value === "DIRECT_DEPOSIT"
	                        ? prev.coordinator_direct_deposit_routing_number
	                        : "",
	                    coordinator_direct_deposit_account_number:
	                      option.value === "DIRECT_DEPOSIT"
	                        ? prev.coordinator_direct_deposit_account_number
	                        : "",
	                  }))
	                }
	                style={[styles.chip, active && styles.chipActive]}
	              >
	                <Text style={[styles.chipText, active && styles.chipTextActive]}>
	                  {option.label}
	                </Text>
	              </TouchableOpacity>
	            );
	          })}
	        </View>

	        {usesDirectDeposit ? (
	          <View style={localStyles.sideBySide}>
	            <View style={localStyles.sideField}>
	              {renderInput("Routing Number *", "coordinator_direct_deposit_routing_number", {
	                keyboardType: "number-pad",
	              })}
	            </View>
	            <View style={localStyles.sideField}>
	              {renderInput("Account Number *", "coordinator_direct_deposit_account_number", {
	                keyboardType: "number-pad",
                  placeholder: "Account number",
                  onChangeText: (value) =>
                    updateField(
                      "coordinator_direct_deposit_account_number",
                      value.replace(/\D/g, "").slice(0, 17)
                    ),
	              })}
	            </View>
	          </View>
	        ) : null}

	        {needsQr ? (
	          <>
	            {renderInput("Payment Handle", "coordinator_payment_handle", {
	              placeholder: "Optional username/email/phone",
	            })}
	            <TouchableOpacity
	              activeOpacity={0.75}
	              style={[styles.secondaryButton, localStyles.uploadButton, { marginTop: 10 }]}
	              onPress={handlePickCoordinatorPaymentQr}
	              disabled={loading}
	            >
	              <MaterialIcons
	                name={qrReady ? "check-circle" : "qr-code-scanner"}
	                size={20}
	                color={AppColor.primary}
	              />
	              <Text style={styles.secondaryButtonText}>
	                {qrReady ? "Payment QR Selected" : "Upload Payment QR Code *"}
	              </Text>
	            </TouchableOpacity>
	          </>
	        ) : null}
	      </View>
	    );
	  };

  const renderDateTimePicker = (label, key, mode) => (
    <View style={localStyles.fieldGroup}>
      {renderLabel(label)}
      <Pressable
        accessibilityRole="button"
        hitSlop={8}
        style={localStyles.pickerButton}
        onPress={() => openDateTimePicker(key, mode)}
      >
        <Text
          style={[
            styles.chipText,
            localStyles.pickerButtonText,
            !form[key] && localStyles.pickerPlaceholder,
          ]}
        >
          {form[key]
            ? mode === "date"
              ? formatDateForDisplay(form[key])
              : form[key]
            : mode === "date"
              ? "Select date"
              : "Select time"}
        </Text>
      </Pressable>
    </View>
  );

  const renderDurationPicker = () => {
    const durationMinutes = Math.max(0, Number(form.event_duration_total_minutes || 0));

    return (
      <View style={localStyles.fieldGroup}>
        {renderLabel("Event Duration *")}
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          style={localStyles.pickerButton}
          onPress={() =>
            setPickerState({
              key: "event_duration_total_minutes",
              mode: "duration",
              value: durationMinutes,
            })
          }
        >
          <Text
            style={[
              styles.chipText,
              localStyles.pickerButtonText,
              !durationMinutes && localStyles.pickerPlaceholder,
            ]}
          >
            {formatDurationLabel(durationMinutes)}
          </Text>
        </Pressable>
      </View>
    );
  };

  const renderMoneyInput = (label, key, helper, disabled = false) => {
    const isBudgetAmount = key === "budgeted_amount";

    return (
      <View style={[localStyles.fieldGroup, localStyles.sideField]}>
        {isBudgetAmount ? (
          <View style={localStyles.labelWithAction}>
            {renderLabel(label)}
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.7}
              style={localStyles.infoIconButton}
              onPress={() => setBudgetInfoVisible(true)}
            >
              <MaterialIcons
                name="info-outline"
                size={19}
                color={AppColor.primary}
              />
            </TouchableOpacity>
          </View>
        ) : (
          renderLabel(label)
        )}
        <View style={[localStyles.moneyBox, disabled && localStyles.disabledMoneyBox]}>
          <Text style={localStyles.moneyPrefix}>$</Text>
          <TextInput
            value={form[key]}
            onChangeText={(value) => updateField(key, value)}
            placeholder="0.00"
            placeholderTextColor={AppColor.textPlaceholder}
            keyboardType="decimal-pad"
            editable={!disabled}
            style={localStyles.moneyInput}
          />
        </View>
        {helper ? <Text style={styles.meta}>{helper}</Text> : null}
        {isBudgetAmount && budgetInfoVisible ? (
          <View style={localStyles.budgetInfoBox}>
            <View style={localStyles.budgetInfoHeader}>
              <Text style={localStyles.budgetInfoTitle}>Budgeted Amount</Text>
              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.7}
                style={localStyles.budgetInfoClose}
                onPress={() => setBudgetInfoVisible(false)}
              >
                <MaterialIcons name="close" size={20} color={AppColor.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.meta}>
              Budgeted amount is based on average price per plate per adult guest.
              The final negotiated amount is finalized upon final consult with
              vendor. Prices may be larger or smaller than the budgeted amount
              but that does not negate the fee.
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  const getFieldDateTimeValue = (key, mode) => {
    const value = form[key];
    return mode === "date" ? parseDateFieldValue(value) : parseTimeFieldValue(value);
  };

  const openDateTimePicker = (key, mode) => {
    const pickerValue = getFieldDateTimeValue(key, mode);
    setPickerState({
      key,
      mode,
      value: pickerValue,
      timeStep: "hour",
    });
  };

  const updatePickerDateValue = (updater) => {
    setPickerState((prev) => {
      if (!prev) return prev;
      const nextValue =
        typeof updater === "function" ? updater(prev.value) : updater;
      return { ...prev, value: nextValue };
    });
  };

  const updatePickerTimePart = (part, nextPartValue) => {
    setPickerState((prev) => {
      if (!prev) return prev;
      const nextDate = new Date(prev.value);
      const currentHours = nextDate.getHours();
      const currentPeriod = currentHours >= 12 ? "PM" : "AM";
      const currentHour12 = currentHours % 12 || 12;

      if (part === "hour") {
        let nextHours = Number(nextPartValue) % 12;
        if (currentPeriod === "PM") nextHours += 12;
        nextDate.setHours(nextHours, nextDate.getMinutes(), 0, 0);
        return { ...prev, value: nextDate, timeStep: "minute" };
      }

      if (part === "minute") {
        nextDate.setMinutes(Number(nextPartValue), 0, 0);
        return { ...prev, value: nextDate };
      }

      let nextHours = currentHour12 % 12;
      if (nextPartValue === "PM") nextHours += 12;
      nextDate.setHours(nextHours, nextDate.getMinutes(), 0, 0);
      return { ...prev, value: nextDate };
    });
  };

  const updatePickerDurationPart = (part, nextPartValue) => {
    setPickerState((prev) => {
      if (!prev) return prev;
      const currentTotalMinutes = Math.max(0, Number(prev.value || 0));
      const currentHours = Math.floor(currentTotalMinutes / 60);
      const currentMinutes = currentTotalMinutes % 60;
      const nextHours = part === "hour" ? Number(nextPartValue) : currentHours;
      const nextMinutes =
        part === "minute" ? Number(nextPartValue) : currentMinutes;

      return {
        ...prev,
        value: Math.max(0, nextHours * 60 + nextMinutes),
      };
    });
  };

  const renderWheelColumn = ({
    label,
    options,
    selectedValue,
    onSelect,
    formatOption = (value) => value,
    short = false,
  }) => {
    const selectedIndex = Math.max(
      0,
      options.findIndex((option) => option === selectedValue)
    );

    return (
      <View style={[localStyles.wheelColumn, short && localStyles.wheelColumnShort]}>
        <Text style={localStyles.wheelLabel}>{label}</Text>
        <ScrollView
          style={localStyles.wheelScroll}
          contentContainerStyle={localStyles.wheelScrollContent}
          showsVerticalScrollIndicator={false}
          snapToInterval={42}
          decelerationRate="fast"
          contentOffset={{ x: 0, y: selectedIndex * 42 }}
          onMomentumScrollEnd={(event) => {
            const index = Math.max(
              0,
              Math.min(
                options.length - 1,
                Math.round(event.nativeEvent.contentOffset.y / 42)
              )
            );
            onSelect(options[index]);
          }}
          onScrollEndDrag={(event) => {
            const index = Math.max(
              0,
              Math.min(
                options.length - 1,
                Math.round(event.nativeEvent.contentOffset.y / 42)
              )
            );
            onSelect(options[index]);
          }}
        >
          {options.map((option) => {
            const isActive = option === selectedValue;
            return (
              <View
                key={option}
                style={[
                  localStyles.wheelOption,
                  isActive && localStyles.wheelOptionActive,
                ]}
              >
                <Text
                  style={[
                    localStyles.wheelOptionText,
                    isActive && localStyles.wheelOptionTextActive,
                  ]}
                >
                  {formatOption(option)}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const commitPickerValue = (activePicker, date) => {
    if (!activePicker?.key || (activePicker.mode !== "duration" && !date)) {
      return;
    }
    const nextValue = activePicker.mode === "duration"
      ? String(Math.max(0, Number(activePicker.value || 0)))
      : activePicker.mode === "date"
        ? formatDateForPayload(date)
        : formatTimeForPayload(date);
    updateField(
      activePicker.key,
      nextValue
    );
  };

  const handleNativePickerChange = (event, selectedDate) => {
    if (!pickerState) return;
    if (event?.type === "dismissed") {
      setPickerState(null);
      return;
    }
    if (selectedDate) {
      if (Platform.OS === "android") {
        const activePicker = pickerState;
        setPickerState(null);
        commitPickerValue(activePicker, selectedDate);
        return;
      }
      setPickerState((prev) => (prev ? { ...prev, value: selectedDate } : prev));
    }
  };

  const renderAndroidCalendarPicker = () => {
    const selectedDate = pickerState?.value || new Date();
    const monthStart = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1
    );
    const daysInMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      0
    ).getDate();
    const leadingEmptyDays = monthStart.getDay();
    const cells = [
      ...Array.from({ length: leadingEmptyDays }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];

    return (
      <View style={localStyles.androidPickerContent}>
        <View style={localStyles.calendarHeader}>
          <Pressable
            style={localStyles.calendarNavButton}
            onPress={() =>
              updatePickerDateValue(
                (date) => new Date(date.getFullYear(), date.getMonth() - 1, 1)
              )
            }
          >
            <MaterialIcons name="chevron-left" size={24} color={AppColor.primary} />
          </Pressable>
          <Text style={localStyles.calendarTitle}>
            {selectedDate.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </Text>
          <Pressable
            style={localStyles.calendarNavButton}
            onPress={() =>
              updatePickerDateValue(
                (date) => new Date(date.getFullYear(), date.getMonth() + 1, 1)
              )
            }
          >
            <MaterialIcons name="chevron-right" size={24} color={AppColor.primary} />
          </Pressable>
        </View>
        <View style={localStyles.calendarWeekRow}>
          {CALENDAR_WEEKDAYS.map((day) => (
            <Text key={day} style={localStyles.calendarWeekday}>
              {day}
            </Text>
          ))}
        </View>
        <View style={localStyles.calendarGrid}>
          {cells.map((day, index) => {
            if (!day) {
              return <View key={`empty-${index}`} style={localStyles.calendarDayCell} />;
            }
            const isSelected =
              selectedDate.getFullYear() === monthStart.getFullYear() &&
              selectedDate.getMonth() === monthStart.getMonth() &&
              selectedDate.getDate() === day;
            return (
              <View key={day} style={localStyles.calendarDayCell}>
                <Pressable
                  style={[
                    localStyles.calendarDayButton,
                    isSelected && localStyles.calendarDaySelected,
                  ]}
                  onPress={() =>
                    updatePickerDateValue(
                      new Date(monthStart.getFullYear(), monthStart.getMonth(), day)
                    )
                  }
                >
                  <Text
                    style={[
                      localStyles.calendarDayText,
                      isSelected && localStyles.calendarDayTextSelected,
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderAndroidClockPicker = () => {
    const selectedDate = pickerState?.value || new Date();
    const selectedHour = selectedDate.getHours() % 12 || 12;
    const selectedMinute = (Math.round(selectedDate.getMinutes() / 5) * 5) % 60;
    const selectedPeriod = selectedDate.getHours() >= 12 ? "PM" : "AM";

    return (
      <View style={localStyles.androidPickerContent}>
        <Text style={localStyles.timeStepperValue}>
          {formatTimeForPayload(selectedDate)}
        </Text>
        <View style={localStyles.wheelPickerRow}>
          {renderWheelColumn({
            label: "Hour",
            options: TIME_HOUR_OPTIONS,
            selectedValue: selectedHour,
            onSelect: (value) => updatePickerTimePart("hour", value),
          })}
          {renderWheelColumn({
            label: "Minute",
            options: TIME_MINUTE_OPTIONS,
            selectedValue: selectedMinute,
            onSelect: (value) => updatePickerTimePart("minute", value),
            formatOption: (value) => String(value).padStart(2, "0"),
          })}
        </View>
        <View style={localStyles.periodRow}>
          {["AM", "PM"].map((period) => {
            const isActive = selectedPeriod === period;
            return (
              <Pressable
                key={period}
                style={[
                  localStyles.timeToggleButton,
                  isActive && localStyles.timeToggleButtonActive,
                ]}
                onPress={() => updatePickerTimePart("period", period)}
              >
                <Text
                  style={[
                    localStyles.timeToggleText,
                    isActive && localStyles.timeToggleTextActive,
                  ]}
                >
                  {period}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  const renderDurationWheelPicker = () => {
    const totalMinutes = Math.max(0, Number(pickerState?.value || 0));
    const selectedHours = Math.floor(totalMinutes / 60);
    const selectedMinutes = totalMinutes % 60;

    return (
      <View style={localStyles.androidPickerContent}>
        <Text style={localStyles.timeStepperValue}>
          {formatDurationLabel(totalMinutes)}
        </Text>
        <View style={localStyles.nativePickerRow}>
          <View style={localStyles.nativePickerBox}>
            <Text style={localStyles.wheelLabel}>Hours</Text>
            <Picker
              selectedValue={selectedHours}
              onValueChange={(value) => updatePickerDurationPart("hour", value)}
              style={localStyles.nativePicker}
              itemStyle={localStyles.nativePickerItem}
              dropdownIconColor={AppColor.primary}
              mode="dropdown"
            >
              {DURATION_HOUR_OPTIONS.map((hour) => (
                <Picker.Item
                  key={hour}
                  label={`${hour}`}
                  value={hour}
                />
              ))}
            </Picker>
          </View>
          <View style={localStyles.nativePickerBox}>
            <Text style={localStyles.wheelLabel}>Minutes</Text>
            <Picker
              selectedValue={selectedMinutes}
              onValueChange={(value) => updatePickerDurationPart("minute", value)}
              style={localStyles.nativePicker}
              itemStyle={localStyles.nativePickerItem}
              dropdownIconColor={AppColor.primary}
              mode="dropdown"
            >
              {DURATION_MINUTE_OPTIONS.map((minute) => (
                <Picker.Item
                  key={minute}
                  label={String(minute).padStart(2, "0")}
                  value={minute}
                />
              ))}
            </Picker>
          </View>
        </View>
      </View>
    );
  };

  const renderNativeDateTimePicker = () => {
    if (!pickerState) return null;

    const pickerDisplay =
      pickerState.mode === "date" ? "inline" : "spinner";
    const useAndroidCustomPicker = Platform.OS === "android";

    return (
      <Modal
        transparent
        animationType="fade"
        visible
        onRequestClose={() => setPickerState(null)}
      >
        <View style={localStyles.datePickerOverlay}>
          <View style={localStyles.datePickerSheet}>
            <View style={localStyles.datePickerActions}>
              <TouchableOpacity onPress={() => setPickerState(null)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const activePicker = pickerState;
                  setPickerState(null);
                  commitPickerValue(activePicker, activePicker.value);
                }}
              >
                <Text style={styles.secondaryButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
            {pickerState.mode === "duration" ? (
              renderDurationWheelPicker()
            ) : useAndroidCustomPicker ? (
              pickerState.mode === "date"
                ? renderAndroidCalendarPicker()
                : renderAndroidClockPicker()
            ) : (
              <DateTimePicker
                value={pickerState.value}
                mode={pickerState.mode}
                display={pickerDisplay}
                is24Hour={false}
                onChange={handleNativePickerChange}
                style={localStyles.iosDatePicker}
              />
            )}
          </View>
        </View>
      </Modal>
    );
  };

  const renderAddressInput = () => (
    <View style={localStyles.fieldGroup}>
      {renderLabel("Address *")}
      <View style={localStyles.eventLocationPicker}>
        <View
          style={[
            localStyles.eventMapWrap,
            form.event_address && localStyles.eventMapWrapSelected,
          ]}
        >
	          <MapView
	            ref={eventAddressMapRef}
	            provider={PROVIDER_GOOGLE}
	            style={localStyles.eventMap}
	            loadingEnabled={true}
	            loadingIndicatorColor={AppColor.primary}
	            initialRegion={initialEventAddressRegion}
	            region={eventAddressRegion}
	            scrollEnabled={!savedEventLocationLocked}
	            zoomEnabled={!savedEventLocationLocked}
	            pitchEnabled={!savedEventLocationLocked}
	            rotateEnabled={!savedEventLocationLocked}
	            onRegionChangeComplete={
	              savedEventLocationLocked ? undefined : handleEventMapRegionChange
	            }
	          />
          <View style={localStyles.eventMapPin}>
            {eventAddressLoading ? (
              <ActivityIndicator size="large" color={AppColor.primary} />
            ) : (
              <MaterialIcons name="location-on" size={44} color={AppColor.primary} />
            )}
          </View>
	          {savedEventLocationLocked ? null : (
	            <TouchableOpacity
	              activeOpacity={0.75}
	              onPress={centerEventAddressOnCurrentLocation}
	              style={localStyles.eventLocateButton}
	              disabled={eventAddressLoading}
	            >
	              <MaterialIcons name="gps-fixed" size={22} color={AppColor.black} />
	            </TouchableOpacity>
	          )}
        </View>

        <View style={localStyles.eventSearchWrap}>
          {form.event_address ? (
            <View style={localStyles.eventAddressSummary}>
              <Text style={localStyles.eventAddressText} numberOfLines={2}>
                {form.formatted_address || form.event_address}
              </Text>
	              {savedEventLocationLocked ? null : (
	                <Pressable onPress={handleClearAddress} style={localStyles.eventAddressClear}>
	                  <MaterialIcons name="close" size={22} color={AppColor.textHighlighter} />
	                </Pressable>
	              )}
            </View>
          ) : (
            <GooglePlacesAutocomplete
              ref={eventAddressSearchRef}
              placeholder="Search Location"
              query={{
                key: GOOGLE_MAP_API_KEY,
                language: "en",
                types: "geocode|establishment",
              }}
              fetchDetails={true}
              enablePoweredByContainer={false}
              numberOfLines={2}
              predefinedPlaces={[]}
              keyboardShouldPersistTaps="always"
              minLength={2}
              timeout={20000}
              suppressDefaultStyles={true}
              textInputProps={{
                placeholderTextColor: AppColor.textPlaceholder,
                multiline: false,
                numberOfLines: 1,
                returnKeyType: "search",
                keyboardType: "default",
                autoCorrect: false,
              }}
              onPress={handleGoogleAddressSelect}
              onFail={(error) => {
                console.log("Google Places event address error", error);
                setSnackbar({
                  visible: true,
                  message: "Address search failed. Please try again.",
                });
              }}
              renderRightButton={() => (
                <Pressable
                  onPress={() => eventAddressSearchRef.current?.focus()}
                  style={{ paddingHorizontal: 12 }}
                >
                  <MaterialIcons name="search" size={22} color={AppColor.textHighlighter} />
                </Pressable>
              )}
              styles={{
                container: localStyles.eventPlacesContainer,
                textInputContainer: localStyles.eventPlacesInputContainer,
                textInput: localStyles.eventPlacesInput,
                listView: localStyles.eventPlacesList,
                row: localStyles.eventPlacesRow,
                description: styles.placesDescription,
                separator: styles.placesSeparator,
              }}
            />
          )}
        </View>
      </View>
      <Text style={styles.meta}>
	        {savedEventLocationLocked
	          ? "Saved event address is read only."
	          : "Type an address, choose a result, or move the pin. Vendors see city/state until address unlock."}
	      </Text>
    </View>
  );

  const renderChips = (label, key, options) => (
    <View style={localStyles.fieldGroup}>
      {renderLabel(label)}
      <View style={styles.chipWrap}>
        {options.map((option) => {
          const active = Array.isArray(form[key])
            ? form[key].includes(option)
            : form[key] === option;
          return (
            <TouchableOpacity
              key={option}
              activeOpacity={0.7}
              onPress={() => {
                if (Array.isArray(form[key])) {
                  updateListField(key, option);
                } else {
                  updateField(key, option);
                }
              }}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderSingleSelect = (label, key, options) => (
    <View style={localStyles.fieldGroup}>
      {renderLabel(label)}
      <View style={styles.chipWrap}>
        {options.map((option) => {
          const active = form[key] === option;
          return (
            <TouchableOpacity
              key={option}
              activeOpacity={0.7}
              onPress={() => updateField(key, option)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderEventToneSelect = () => (
    <View style={localStyles.fieldGroup}>
      {renderLabel("Event Tone")}
      <View style={styles.chipWrap}>
        {EVENT_STYLES.map((option) => {
          const active = form.event_style === option;
          return (
            <TouchableOpacity
              key={option}
              activeOpacity={0.7}
              onPress={() =>
                setForm((prev) => ({
                  ...prev,
                  event_style: option,
                }))
              }
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderPaymentResponsibility = () => (
    <View style={localStyles.fieldGroup}>
      {renderLabel("Who is paying? *")}
      <View style={styles.chipWrap}>
        {PAYMENT_RESPONSIBILITY_OPTIONS.map(([label, value]) => {
          const active = form.payment_responsibility === value;
          return (
            <TouchableOpacity
              key={value}
              activeOpacity={0.7}
              onPress={() => updateField("payment_responsibility", value)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderEventTypeCards = () => (
    <View style={localStyles.fieldGroup}>
      {renderLabel("Event Type *")}
      <View style={localStyles.cardGrid}>
        {EVENT_TYPES.map((option) => {
          const active = form.event_type === option;
          return (
            <TouchableOpacity
              key={option}
              activeOpacity={0.78}
              onPress={() =>
                setForm((prev) => ({
                  ...prev,
                  event_type: option,
                  event_type_other: option === "Other" ? prev.event_type_other : "",
                }))
              }
              style={[
                localStyles.eventTypeCard,
                active && localStyles.eventTypeCardActive,
              ]}
            >
              <MaterialIcons
                name={EVENT_TYPE_ICONS[option] || "event"}
                size={25}
                color={active ? AppColor.primary : AppColor.textHighlighter}
              />
              <Text
                style={[
                  styles.chipText,
                  localStyles.eventTypeLabel,
                  active && styles.chipTextActive,
                ]}
                numberOfLines={2}
              >
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {form.event_type === "Other"
        ? renderInput("Other Event Type *", "event_type_other")
        : null}
    </View>
  );

  const renderBoolean = (label, key) => (
    <View style={localStyles.fieldGroup}>
      {renderLabel(label)}
      <View style={localStyles.segmented}>
        {[
          ["Yes", true],
          ["No", false],
        ].map(([labelText, value], index) => {
          const active = form[key] === value;
          return (
            <TouchableOpacity
              key={labelText}
              activeOpacity={0.7}
              onPress={() =>
                key === "alcohol_required"
                  ? updateAlcoholRequired(value)
                  : updateField(key, value)
              }
              style={[
                localStyles.segment,
                index > 0 && localStyles.segmentDivider,
                active && localStyles.segmentActive,
              ]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {labelText}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderRequiredYesNo = (label, key) => (
    <View style={localStyles.fieldGroup}>
      {renderLabel(`${label} *`)}
      {[
        ["Yes", true],
        ["No", false],
      ].map(([labelText, value]) => {
        const active = form[key] === value;
        return (
          <TouchableOpacity
            key={`${key}-${labelText}`}
            activeOpacity={0.7}
            style={localStyles.checkboxRow}
            onPress={() => updateField(key, value)}
          >
            <View
              style={[
                localStyles.checkbox,
                active && localStyles.checkboxActive,
              ]}
            >
              {active && (
                <MaterialIcons name="check" size={16} color={AppColor.white} />
              )}
            </View>
            <Text style={localStyles.checkboxLabel}>{labelText}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderFreeFoodQuestions = () => (
    <View style={localStyles.fieldGroup}>
      {renderRequiredYesNo("Will free food be offered?", "free_food_offered")}
      {form.free_food_offered === true ? (
        <>
          {renderInput("If Yes, by which company/vendor *", "free_food_provider")}
          {renderRequiredYesNo(
            "Are vendors required to give away food as well?",
            "vendors_required_to_giveaway_food"
          )}
        </>
      ) : null}
      <TouchableOpacity
        activeOpacity={0.7}
        style={localStyles.checkboxRow}
        onPress={() =>
          setForm((prev) => ({
            ...prev,
            catered_vip_section_enabled: !prev.catered_vip_section_enabled,
            vip_guest_count: !prev.catered_vip_section_enabled
              ? prev.vip_guest_count
              : "",
          }))
        }
      >
        <View
          style={[
            localStyles.checkbox,
            form.catered_vip_section_enabled && localStyles.checkboxActive,
          ]}
        >
          {form.catered_vip_section_enabled && (
            <MaterialIcons name="check" size={16} color={AppColor.white} />
          )}
        </View>
        <Text style={localStyles.checkboxLabel}>
          Is there a catered VIP Section paid for by Coordinator?
        </Text>
      </TouchableOpacity>
      {form.catered_vip_section_enabled
        ? renderInput("# of VIP Guests", "vip_guest_count", {
            keyboardType: "number-pad",
            onChangeText: (value) =>
              updateField("vip_guest_count", value.replace(/\D/g, "")),
          })
        : null}
    </View>
  );

  const renderVisibilityToggle = () => (
    <View style={localStyles.fieldGroup}>
      {renderLabel("Public / Private")}
      <View style={localStyles.segmented}>
        {[
          ["Public", "PUBLIC"],
          ["Private", "PRIVATE"],
        ].map(([labelText, value], index) => {
          const active = form.event_visibility === value;
          return (
            <TouchableOpacity
              key={value}
              activeOpacity={0.7}
              onPress={() => updateField("event_visibility", value)}
              style={[
                localStyles.segment,
                index === 0 && localStyles.segmentFirst,
                active && localStyles.segmentActive,
              ]}
            >
              <Text
                style={[
                  localStyles.segmentText,
                  active && localStyles.segmentTextActive,
                ]}
              >
                {labelText}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.meta}>
        Public events can appear in Near Me. Private events stay hidden from
        customer discovery.
      </Text>
    </View>
  );

  const renderTicketSalesFields = () => (
    <View style={localStyles.fieldGroup}>
      <TouchableOpacity
        activeOpacity={0.7}
        style={localStyles.checkboxRow}
        onPress={() =>
          setForm((prev) => ({
            ...prev,
            ticket_sales_enabled: !prev.ticket_sales_enabled,
            ticket_url: !prev.ticket_sales_enabled ? prev.ticket_url : "",
          }))
        }
      >
        <View
          style={[
            localStyles.checkbox,
            form.ticket_sales_enabled && localStyles.checkboxActive,
          ]}
        >
          {form.ticket_sales_enabled && (
            <MaterialIcons name="check" size={16} color={AppColor.white} />
          )}
        </View>
        <Text style={localStyles.checkboxLabel}>
          Will tickets be sold online for this event?
        </Text>
      </TouchableOpacity>

      {form.ticket_sales_enabled &&
        renderInput("Ticket Sales Link", "ticket_url", {
          placeholder: "example.com/tickets",
          keyboardType: "url",
        })}
    </View>
  );

  const renderPrimaryServiceStyle = () => (
    <View style={localStyles.fieldGroup}>
      {renderLabel("Primary Service Style *")}
      <View style={localStyles.serviceGrid}>
        {PRIMARY_SERVICE_STYLES.map((option) => {
          const active = hasServiceStyle(form, option.label);
          return (
            <TouchableOpacity
              key={option.label}
              activeOpacity={0.8}
              style={[
                localStyles.serviceCard,
                active && localStyles.serviceCardActive,
              ]}
              onPress={() =>
                setForm((prev) => {
                  const previousStyles = normalizeOptionList(prev.service_styles);
                  const mustKeepFoodTruck =
                    prev.service_types?.includes("Food Truck") &&
                    option.label === "Food Truck";
                  const nextStyles =
                    active && !mustKeepFoodTruck
                      ? previousStyles.filter((item) => item !== option.label)
                      : [...new Set([...previousStyles, option.label])];
                  const normalizedStyles =
                    prev.service_types?.includes("Food Truck") &&
                    !nextStyles.includes("Food Truck")
                      ? [...nextStyles, "Food Truck"]
                      : nextStyles;
                  autoFoodTruckStyleRef.current =
                    prev.service_types?.includes("Food Truck");
                  return {
                    ...prev,
                    primary_service_style: normalizedStyles[0] || "",
                    service_styles: normalizedStyles,
                    service_types:
                      option.label === "Food Truck"
                        ? [...new Set([...(prev.service_types || []), "Food Truck"])]
                        : prev.service_types,
                    number_of_vendors_needed:
                      option.label === "Food Truck"
                        ? String(getAutoFoodTruckVendorCount(prev.number_of_guests))
                        : prev.number_of_vendors_needed,
                  };
                })
              }
            >
              <View style={localStyles.serviceHeader}>
                <View
                  style={[
                    localStyles.serviceIcon,
                    active && localStyles.serviceIconActive,
                  ]}
                >
                  <MaterialIcons
                    name={option.icon}
                    size={23}
                    color={active ? AppColor.white : AppColor.primary}
                  />
                </View>
                <Text
                  style={[
                    styles.chipText,
                    localStyles.serviceTitle,
                    active && styles.chipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => Alert.alert(option.label, option.description)}
                >
                  <MaterialIcons
                    name="info-outline"
                    size={22}
                    color={AppColor.textHighlighter}
                  />
                </TouchableOpacity>
              </View>
              <Text style={localStyles.serviceDescription}>
                {option.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderServiceSpecificDetails = () => {
    const selectedStyles = normalizeOptionList(form.service_styles);
    if (!selectedStyles.length && !form.primary_service_style) return null;

    return (
      <View style={localStyles.fieldGroup}>
        {hasServiceStyle(form, "Plated") ? (
          <View style={localStyles.fieldGroup}>
            {renderChips("Plated Options", "plated_options", PLATED_OPTIONS)}
            {renderSingleSelect("Number of Courses", "plated_number_of_courses", COURSE_OPTIONS)}
            {renderSingleSelect("Entree Selection", "plated_entree_selection", ENTREE_SELECTION_OPTIONS)}
            {renderChips("Included Items", "plated_included_items", PLATED_INCLUDED_ITEMS)}
          </View>
        ) : null}

        {hasServiceStyle(form, "Buffet") ? (
          <View style={localStyles.fieldGroup}>
            {renderSingleSelect("Buffet Setup", "buffet_setup", BUFFET_SETUP_OPTIONS)}
            {renderChips("Included Items", "buffet_included_items", CATERING_INCLUDED_ITEMS)}
          </View>
        ) : null}

        {hasServiceStyle(form, "Food Truck")
          ? renderSingleSelect("Menu Availability", "food_truck_options", FOOD_TRUCK_OPTIONS)
          : null}

        {hasServiceStyle(form, "Family Style / Stations") ? (
          <View style={localStyles.fieldGroup}>
            {renderSingleSelect("Setup Type", "station_setup_type", STATION_SETUP_OPTIONS)}
            {renderChips("Included Items", "station_included_items", CATERING_INCLUDED_ITEMS)}
          </View>
        ) : null}

        {hasServiceStyle(form, "Other")
          ? renderInput("Service Notes", "service_notes", { multiline: true })
          : null}
      </View>
    );
  };

  const renderVendorCountFields = () => (
    <View style={localStyles.sideBySide}>
      <View style={localStyles.sideField}>
        {renderInput("Guests *", "number_of_guests", {
          keyboardType: "number-pad",
        })}
      </View>
      <View style={localStyles.sideField}>
        {renderInput("Vendors Needed *", "number_of_vendors_needed", {
          keyboardType: "number-pad",
          editable: !foodTruckSelected,
        })}
        {foodTruckSelected ? (
          <Text style={styles.meta}>
            Vendors needed is calculated automatically at one vendor per 100 guests.
          </Text>
        ) : (
          <Text style={styles.meta}>
            Vendors needed defaults to one and can be updated before submission.
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, localStyles.screen, { paddingTop: insets.top }]}>
      <StatusBarManager />
      <AppHeader headerTitle={editingEventId ? "Edit Draft" : "Create Event"} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={formScrollRef}
          contentContainerStyle={localStyles.body}
          keyboardShouldPersistTaps="handled"
        >
          <View style={localStyles.card}>
            {renderSectionHeader("Event Basics", "event")}
            <Text style={styles.meta}>
              Event Name and Description cannot contain names, locations, or proper nouns. Violators may be blocked.
            </Text>
            {renderInput("Event Name *", "event_name")}
            {renderInput("Description", "event_description", { multiline: true })}
            {renderTicketSalesFields()}
            {renderEventTypeCards()}
            {renderVisibilityToggle()}
            {renderEventToneSelect()}
            {renderChips("Service Type *", "service_types", SERVICE_TYPES)}
            {renderPrimaryServiceStyle()}
            {renderServiceSpecificDetails()}
            <View style={localStyles.sideBySide}>
              <View style={localStyles.sideField}>
                {renderDateTimePicker("Event Date *", "event_date", "date")}
              </View>
              <View style={localStyles.sideField}>
                {renderDateTimePicker("Event Time *", "event_time", "time")}
              </View>
            </View>
            {renderDurationPicker()}
            <View style={localStyles.sideBySide}>
              <View style={localStyles.sideField}>
                {renderDateTimePicker("Close Date *", "event_close_date", "date")}
              </View>
              <View style={localStyles.sideField}>
                {renderDateTimePicker("Close Time *", "event_close_time", "time")}
              </View>
            </View>
          </View>

          <View
            style={localStyles.card}
            onLayout={(event) => {
              vendorNeedsYRef.current = event.nativeEvent.layout.y;
            }}
          >
            {renderSectionHeader("Location", "place")}
            {renderAddressInput()}
	            <View style={localStyles.sideBySide}>
	              <View style={localStyles.sideField}>
	                {renderInput("City *", "event_city", {
	                  editable: !savedEventLocationLocked,
	                })}
	              </View>
	              <View style={localStyles.sideField}>
	                <View style={localStyles.fieldGroup}>
	                  {savedEventLocationLocked ? (
	                    renderInput("State *", "event_state", { editable: false })
	                  ) : (
	                    <StatePickerModal
	                      value={form.event_state}
	                      onChange={(value) => updateField("event_state", value)}
	                    />
	                  )}
	                </View>
	              </View>
	            </View>
	            {renderInput("Zip", "event_zip", {
	              editable: !savedEventLocationLocked,
	            })}
          </View>

          <View style={localStyles.card}>
            {renderSectionHeader("Vendor Needs", "groups")}
            {renderVendorCountFields()}
            {renderChips("Power Requirements", "power_required", POWER_OPTIONS)}
            {renderChips("Permits Required", "permits_required", PERMIT_OPTIONS)}
            {renderBoolean("Alcohol Required", "alcohol_required")}
            {renderBoolean("Insurance Required", "insurance_required")}
            {renderFreeFoodQuestions()}
            {renderChips("Cuisine Preferences", "cuisine_preferences", CUISINE_OPTIONS)}
            {renderChips("Dietary Restrictions", "dietary_restrictions", DIETARY_OPTIONS)}
            {renderChips("Equipment Needs", "equipment_needed", EQUIPMENT_OPTIONS)}
          </View>

          <View style={localStyles.card}>
            {renderSectionHeader("Budget", "payments")}
            {renderPaymentResponsibility()}
            <View style={localStyles.sideBySide}>
              {renderMoneyInput(
                "Vendor Fee",
                "vendor_fee",
                "Fee vendors pay if this event requires attendance payment.",
                form.payment_responsibility === "COORDINATOR",
              )}
              {renderMoneyInput(
                "Budget Amount",
                "budgeted_amount",
                "Amount available when coordinator pays vendors.",
                form.payment_responsibility === "VENDOR" ||
                  (form.payment_responsibility === "BOTH" &&
                    form.catered_vip_section_enabled),
              )}
            </View>
	            {isCoordinatorBudgetRequired(form) ? (
	              <Text style={styles.meta}>
	                Minimum budget for this guest count is $
	                {getMinimumBudget(form).toFixed(2)}
                  {form.payment_responsibility === "BOTH" &&
                  form.catered_vip_section_enabled
                    ? " based on VIP guests."
                    : "."}
	              </Text>
	            ) : null}
	            {renderCoordinatorPayoutFields()}
	          </View>

          <View style={localStyles.card}>
            {renderSectionHeader("Event Images", "image")}
            <View style={localStyles.uploadCard}>
              <Text style={styles.meta}>
                Upload JPG, PNG, or HEIC images. Maximum file size is 10 MB.
              </Text>
              <Text style={styles.meta}>
                No contact information is allowed on event images. Do not include phone numbers, emails, websites, or social handles.
              </Text>
              {eventImages.length ? (
                <View style={localStyles.imageGrid}>
                  {eventImages.map((image, index) => (
                    <View key={`${image.uri}-${index}`} style={localStyles.imageTile}>
                      <Image
                        source={{ uri: image.uri }}
                        style={localStyles.imagePreview}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={localStyles.removeImageButton}
                        onPress={() =>
                          setEventImages((prev) =>
                            prev.filter((_, i) => i !== index),
                          )
                        }
                      >
                        <Text style={styles.secondaryButtonText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : null}
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.secondaryButton,
                  localStyles.uploadButton,
                  { marginTop: 14 },
                ]}
                onPress={handlePickEventImages}
                disabled={loading}
              >
                <MaterialIcons name="cloud-upload" size={20} color={AppColor.primary} />
                <Text style={styles.secondaryButtonText}>Add Event Images</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        <View
          style={[
            localStyles.submitFooter,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <View style={localStyles.footerRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.button,
                localStyles.submitButton,
                localStyles.footerButton,
                { opacity: loading ? 0.6 : 1 },
              ]}
              onPress={handleSubmitConfirmation}
              disabled={loading}
            >
              {loading && submitMode === "OPEN" ? (
                <ActivityIndicator color={AppColor.white} />
              ) : (
                <Text style={styles.buttonText}>Submit</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.secondaryButton,
                localStyles.submitButton,
                localStyles.footerButton,
                { opacity: loading ? 0.6 : 1 },
              ]}
              onPress={() =>
                handleSubmit("DRAFT", {
                  navigateToDetails: !!editingEventId,
                  replaceDetails: !!editingEventId,
                  successMessage: editingEventId
                    ? "Your changes have been saved as a draft."
                    : undefined,
                })
              }
              disabled={loading}
            >
              {loading && submitMode === "DRAFT" ? (
                <ActivityIndicator color={AppColor.primary} />
              ) : (
                <Text style={styles.secondaryButtonText}>Save</Text>
              )}
            </TouchableOpacity>
            {editingEventId ? (
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.secondaryButton,
                  localStyles.submitButton,
                  localStyles.footerButton,
                  localStyles.deleteFooterButton,
                  { opacity: loading ? 0.6 : 1 },
                ]}
                onPress={handleDeleteDraft}
                disabled={loading}
              >
                {loading && submitMode === "DELETE" ? (
                  <ActivityIndicator color={AppColor.snackbarError} />
                ) : (
                  <Text
                    style={[
                      styles.secondaryButtonText,
                      localStyles.deleteFooterText,
                    ]}
                  >
                    Delete
                  </Text>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
      {renderNativeDateTimePicker()}
      <Snackbar
        visible={snackbar.visible}
        onDismiss={() =>
          setSnackbar({ visible: false, message: "", type: "error" })
        }
        duration={3000}
        style={{
          backgroundColor:
            snackbar.type === "success"
              ? AppColor.snackbarSuccess
              : AppColor.snackbarError,
        }}
      >
        {snackbar.message}
      </Snackbar>
      <Modal
        visible={showTermsConfirmation}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTermsConfirmation(false)}
      >
        <View style={localStyles.termsOverlay}>
          <View style={localStyles.termsModal}>
            <Text style={localStyles.termsTitle}>Submit Event</Text>
            <Text style={localStyles.termsMessage}>
              By submitting this event you agree to all{" "}
              <Text style={localStyles.termsLink} onPress={handleViewTerms}>
                terms and conditions
              </Text>
              . Do you wish to proceed?
            </Text>
            <View style={localStyles.termsActions}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[localStyles.termsActionButton, localStyles.termsNoButton]}
                onPress={handleTermsDecline}
              >
                <Text style={localStyles.termsNoText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[localStyles.termsActionButton, localStyles.termsYesButton]}
                onPress={handleTermsConfirm}
              >
                <Text style={localStyles.termsYesText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default MarketplaceCreateEventScreen;
