import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
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
import { Snackbar } from "react-native-paper";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import AppHeader from "../components/AppHeader";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor } from "../utils/theme";
import StatePickerModal from "../components/StatePickerModal";
import {
  createMarketplaceEvent_API,
  uploadMarketplaceEventImage_API,
} from "../apiFolder/appAPI";
import usePermission from "../hooks/usePermission";
import { permission } from "../helpers/permission.helper";
import {
  CUISINE_OPTIONS,
  DIETARY_OPTIONS,
  EQUIPMENT_OPTIONS,
  EVENT_STYLES,
  EVENT_TYPES,
  PERMIT_OPTIONS,
  POWER_OPTIONS,
  SERVICE_TYPES,
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
  number_of_vendors_needed: "",
  power_required: [],
  permits_required: [],
  insurance_required: false,
  alcohol_required: false,
  cuisine_preferences: [],
  dietary_restrictions: [],
  equipment_needed: [],
  vendor_fee: "",
  budgeted_amount: "",
  payment_responsibility: "COORDINATOR",
  event_close_date: "",
  event_close_time: "",
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

const isValidUrl = (value) => {
  if (!value?.trim()) return true;
  return /^https?:\/\/[^\s]+\.[^\s]+$/i.test(value.trim());
};

const getAutoFoodTruckVendorCount = (guestCount) =>
  Math.max(1, Math.ceil(Number(guestCount || 0) / 100));

const isFoodTruckService = (form) => form.service_types?.includes("Food Truck");
const isCoordinatorBudgetRequired = (form) =>
  ["COORDINATOR", "BOTH"].includes(form.payment_responsibility);

const formatDateForPayload = (date) => {
  if (!date) return "";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "";
  return value.toISOString().slice(0, 10);
};

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
  input: {
    minHeight: 48,
    borderRadius: 10,
    borderColor: "#D8DDE6",
    backgroundColor: AppColor.white,
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
  eventLocationButton: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: "#D8DDE6",
    borderRadius: 10,
    backgroundColor: AppColor.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  eventLocationIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1E6",
  },
  eventLocationButtonTextWrap: {
    flex: 1,
  },
  eventLocationButtonText: {
    color: AppColor.text,
    fontSize: 14,
  },
  eventLocationButtonPlaceholder: {
    color: AppColor.textPlaceholder,
  },
  clearLocationButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  clearLocationText: {
    color: AppColor.textHighlighter,
    fontSize: 13,
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
});

const MarketplaceCreateEventScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState(initialForm);
  const [eventImages, setEventImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitMode, setSubmitMode] = useState(null);
  const [pickerState, setPickerState] = useState(null);
  const [snackbar, setSnackbar] = useState({ visible: false, message: "" });
  const autoFoodTruckStyleRef = useRef(false);
  const { checkAndRequestPermission: photosPermissionStatus } = usePermission(
    permission.photos
  );
  const foodTruckSelected = isFoodTruckService(form);

  useEffect(() => {
    setForm((prev) => {
      if (!isFoodTruckService(prev)) {
        return prev.number_of_vendors_needed === ""
          ? prev
          : { ...prev, number_of_vendors_needed: "" };
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
    const selectedLocation = route?.params?.selectedEventLocation;
    if (!selectedLocation) return;

    setForm((prev) => ({
      ...prev,
      event_address: selectedLocation.address || "",
      event_city: selectedLocation.city || prev.event_city,
      event_state: selectedLocation.state || prev.event_state,
      event_zip: selectedLocation.zip || prev.event_zip,
      latitude:
        selectedLocation.lat != null ? String(selectedLocation.lat) : prev.latitude,
      longitude:
        selectedLocation.long != null ? String(selectedLocation.long) : prev.longitude,
      formatted_address:
        selectedLocation.formattedAddress ||
        selectedLocation.address ||
        prev.formatted_address,
      place_id: selectedLocation.placeId || prev.place_id,
      geocoding_provider:
        selectedLocation.geocodingProvider || prev.geocoding_provider,
      geocoded_at: selectedLocation.geocodedAt || prev.geocoded_at,
    }));
    navigation.setParams({ selectedEventLocation: undefined });
  }, [navigation, route?.params?.selectedEventLocation]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateListField = (key, option) => {
    setForm((prev) => {
      let nextList = toggleListValue(prev[key] || [], option);
      const next = { ...prev, [key]: nextList };

      if (key === "service_types" && option === "Food Truck") {
        if (nextList.includes("Food Truck")) {
          if (!prev.primary_service_style || autoFoodTruckStyleRef.current) {
            next.primary_service_style = "Food Truck";
            next.service_styles = [
              ...new Set([...(prev.service_styles || []), "Food Truck"]),
            ];
            autoFoodTruckStyleRef.current = true;
          }
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
          next.number_of_vendors_needed = "";
        }
      }

      if (key === "service_styles" && option === "Food Truck") {
        if (nextList.includes("Food Truck")) {
          next.service_types = [
            ...new Set([...(prev.service_types || []), "Food Truck"]),
          ];
          next.primary_service_style = "Food Truck";
        }
      }

      if (key === "permits_required" && option === "Alcohol") {
        next.alcohol_required = nextList.includes("Alcohol");
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
      }

      if (key === "equipment_needed") {
        if (option === "None" && nextList.includes("None")) {
          nextList = ["None"];
        } else if (option !== "None") {
          nextList = nextList.filter((item) => item !== "None");
        }
        next.equipment_needed = nextList;
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
    }));
  };

  const handleClearAddress = () => {
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

  const handleSelectEventLocation = () => {
    navigation.navigate("authMapScreen", {
      mode: "select",
      returnTo: "marketplaceCreateEventScreen",
      returnParamKey: "selectedEventLocation",
      initialLocation: form.event_address
        ? {
            title: form.event_address,
            address: form.formatted_address || form.event_address,
            lat: form.latitude,
            long: form.longitude,
            city: form.event_city,
            state: form.event_state,
            zip: form.event_zip,
            formattedAddress: form.formatted_address,
            placeId: form.place_id,
          }
        : undefined,
    });
  };

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
    if (!form.service_types.length) {
      setSnackbar({ visible: true, message: "Please select at least one service type." });
      return false;
    }
    if (!isValidUrl(form.ticket_url)) {
      setSnackbar({
        visible: true,
        message: "Please enter a valid ticket sales link.",
      });
      return false;
    }
    if (isFoodTruckService(form) && Number(form.number_of_vendors_needed || 0) < 1) {
      setSnackbar({
        visible: true,
        message: "Vendors Needed must be at least 1.",
      });
      return false;
    }
    if (form.alcohol_required && !form.permits_required.includes("Alcohol")) {
      setSnackbar({
        visible: true,
        message: "Alcohol Permit is required when Alcohol Service is selected.",
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
    if (isCoordinatorBudgetRequired(form)) {
      const minimumBudget = Number(form.number_of_guests || 0) * 25;
      if (Number(form.budgeted_amount || 0) < minimumBudget) {
        setSnackbar({
          visible: true,
          message: `Budget must be at least $${minimumBudget.toFixed(2)} for this guest count.`,
        });
        return false;
      }
    }
    return true;
  };

  const buildPayload = (status) => ({
    ...form,
    event_style: form.service_styles[0] || form.event_style || "",
    service_type: form.service_types[0] || "",
    number_of_guests: form.number_of_guests ? Number(form.number_of_guests) : null,
    number_of_vendors_needed: isFoodTruckService(form) && form.number_of_guests
      ? getAutoFoodTruckVendorCount(form.number_of_guests)
      : null,
    plated_number_of_courses: form.plated_number_of_courses
      ? form.plated_number_of_courses
      : null,
    food_truck_options: form.food_truck_options ? [form.food_truck_options] : [],
    vendor_fee:
      form.payment_responsibility === "COORDINATOR"
        ? 0
        : Number(form.vendor_fee || 0),
    budgeted_amount:
      form.payment_responsibility === "VENDOR"
        ? 0
        : Number(form.budgeted_amount || 0),
    ticket_sales_enabled: !!form.ticket_sales_enabled,
    ticket_url: form.ticket_url?.trim() || "",
    status,
  });

  const handleSubmit = async (status = "OPEN") => {
    if (!validate(status)) return;
    setLoading(true);
    setSubmitMode(status);
    try {
      const payload = buildPayload(status);
      const response = await createMarketplaceEvent_API(payload);
      if (response?.success) {
        const eventId = response.data?.marketplaceEvent?.event_id;
        let uploadWarning = false;
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
            console.log("Marketplace event image upload error", error);
          }
        }
        Alert.alert(
          status === "DRAFT" ? "Draft Saved" : "Event Created",
          status === "DRAFT"
            ? "Your draft has been saved."
            : uploadWarning
              ? "Your event is open for vendor bids, but one or more images did not upload."
              : "Your event is open for vendor bids.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("marketplaceMyEventsScreen"),
            },
          ]
        );
      }
    } catch (error) {
      setSnackbar({
        visible: true,
        message:
          error?.message ||
          (status === "DRAFT" ? "Failed to save draft." : "Failed to create event."),
      });
    } finally {
      setLoading(false);
      setSubmitMode(null);
    }
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
        value={form[key]}
        onChangeText={(value) => updateField(key, value)}
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

  const renderDateTimePicker = (label, key, mode) => (
    <View style={localStyles.fieldGroup}>
      {renderLabel(label)}
      <TouchableOpacity
        activeOpacity={0.7}
        style={localStyles.pickerButton}
        onPress={() => setPickerState({ key, mode })}
      >
        <Text
          style={[
            styles.chipText,
            localStyles.pickerButtonText,
            !form[key] && localStyles.pickerPlaceholder,
          ]}
        >
          {form[key] || (mode === "date" ? "Select date" : "Select time")}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderMoneyInput = (label, key, helper, disabled = false) => (
    <View style={[localStyles.fieldGroup, localStyles.sideField]}>
      {renderLabel(label)}
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
    </View>
  );

  const renderAddressInput = () => (
    <View style={localStyles.fieldGroup}>
      {renderLabel("Address *")}
      <TouchableOpacity
        activeOpacity={0.75}
        style={localStyles.eventLocationButton}
        onPress={handleSelectEventLocation}
      >
        <View style={localStyles.eventLocationIcon}>
          <MaterialIcons name="place" size={22} color={AppColor.primary} />
        </View>
        <View style={localStyles.eventLocationButtonTextWrap}>
          <Text
            style={[
              localStyles.eventLocationButtonText,
              !form.event_address && localStyles.eventLocationButtonPlaceholder,
            ]}
          >
            {form.event_address || "Select Location"}
          </Text>
          {form.formatted_address && form.formatted_address !== form.event_address ? (
            <Text style={styles.meta}>{form.formatted_address}</Text>
          ) : null}
        </View>
        <MaterialIcons name="chevron-right" size={24} color={AppColor.textHighlighter} />
      </TouchableOpacity>
      {form.event_address ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleClearAddress}
          style={localStyles.clearLocationButton}
        >
          <MaterialIcons name="close" size={18} color={AppColor.textHighlighter} />
          <Text style={localStyles.clearLocationText}>Clear location</Text>
        </TouchableOpacity>
      ) : null}
      <Text style={styles.meta}>
        Uses the same Select Location map and address search as the customer app.
        Exact event address remains protected by marketplace visibility and unlock rules.
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
          placeholder: "https://example.com/tickets",
          keyboardType: "url",
        })}
    </View>
  );

  const renderPrimaryServiceStyle = () => (
    <View style={localStyles.fieldGroup}>
      {renderLabel("Primary Service Style *")}
      <View style={localStyles.serviceGrid}>
        {PRIMARY_SERVICE_STYLES.map((option) => {
          const active = form.primary_service_style === option.label;
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
                  autoFoodTruckStyleRef.current = false;
                  return {
                    ...prev,
                    ...resetServiceSpecificFields(),
                    primary_service_style: option.label,
                    service_styles: [
                      ...new Set([...(prev.service_styles || []), option.label]),
                    ],
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
    if (form.primary_service_style === "Plated") {
      return (
        <View style={localStyles.fieldGroup}>
          {renderChips("Plated Options", "plated_options", PLATED_OPTIONS)}
          {renderSingleSelect("Number of Courses", "plated_number_of_courses", COURSE_OPTIONS)}
          {renderSingleSelect("Entree Selection", "plated_entree_selection", ENTREE_SELECTION_OPTIONS)}
          {renderChips("Included Items", "plated_included_items", PLATED_INCLUDED_ITEMS)}
        </View>
      );
    }

    if (form.primary_service_style === "Buffet") {
      return (
        <View style={localStyles.fieldGroup}>
          {renderSingleSelect("Buffet Setup", "buffet_setup", BUFFET_SETUP_OPTIONS)}
          {renderChips("Included Items", "buffet_included_items", CATERING_INCLUDED_ITEMS)}
        </View>
      );
    }

    if (form.primary_service_style === "Food Truck") {
      return renderSingleSelect(
        "Menu Availability",
        "food_truck_options",
        FOOD_TRUCK_OPTIONS
      );
    }

    if (form.primary_service_style === "Family Style / Stations") {
      return (
        <View style={localStyles.fieldGroup}>
          {renderSingleSelect("Setup Type", "station_setup_type", STATION_SETUP_OPTIONS)}
          {renderChips("Included Items", "station_included_items", CATERING_INCLUDED_ITEMS)}
        </View>
      );
    }

    if (form.primary_service_style === "Other") {
      return renderInput("Service Notes", "service_notes", { multiline: true });
    }

    return null;
  };

  const renderVendorCountFields = () => (
    <View style={localStyles.sideBySide}>
      <View style={localStyles.sideField}>
        {renderInput("Guests *", "number_of_guests", {
          keyboardType: "number-pad",
        })}
      </View>
      <View style={localStyles.sideField}>
        {foodTruckSelected ? renderInput("Vendors Needed *", "number_of_vendors_needed", {
          keyboardType: "number-pad",
          editable: false,
        }) : null}
        {foodTruckSelected ? (
          <Text style={styles.meta}>
            Vendors needed is calculated automatically at one vendor per 100 guests.
          </Text>
        ) : (
          <Text style={styles.meta}>
            Vendors needed only applies when Food Truck is selected.
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, localStyles.screen, { paddingTop: insets.top }]}>
      <StatusBarManager />
      <AppHeader headerTitle="Create Event" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
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
            {renderChips("Event Tone", "service_styles", EVENT_STYLES)}
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
            <View style={localStyles.sideBySide}>
              <View style={localStyles.sideField}>
                {renderDateTimePicker("Close Date *", "event_close_date", "date")}
              </View>
              <View style={localStyles.sideField}>
                {renderDateTimePicker("Close Time *", "event_close_time", "time")}
              </View>
            </View>
          </View>

          <View style={localStyles.card}>
            {renderSectionHeader("Location", "place")}
            {renderAddressInput()}
            <View style={localStyles.sideBySide}>
              <View style={localStyles.sideField}>
                {renderInput("City *", "event_city")}
              </View>
              <View style={localStyles.sideField}>
                <View style={localStyles.fieldGroup}>
                  <StatePickerModal
                    value={form.event_state}
                    onChange={(value) => updateField("event_state", value)}
                  />
                </View>
              </View>
            </View>
            {renderInput("Zip", "event_zip")}
          </View>

          <View style={localStyles.card}>
            {renderSectionHeader("Vendor Needs", "groups")}
            {renderVendorCountFields()}
            {renderChips("Power Requirements", "power_required", POWER_OPTIONS)}
            {renderChips("Permits Required", "permits_required", PERMIT_OPTIONS)}
            {renderBoolean("Insurance Required", "insurance_required")}
            {renderBoolean("Alcohol Service", "alcohol_required")}
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
                form.payment_responsibility === "VENDOR",
              )}
            </View>
            {isCoordinatorBudgetRequired(form) ? (
              <Text style={styles.meta}>
                Minimum budget for this guest count is $
                {(Number(form.number_of_guests || 0) * 25).toFixed(2)}.
              </Text>
            ) : null}
          </View>

          <View style={localStyles.card}>
            {renderSectionHeader("Event Images", "image")}
            <View style={localStyles.uploadCard}>
              <Text style={styles.meta}>
                Upload JPG, PNG, or HEIC images. Maximum file size is 10 MB.
              </Text>
              <Text style={styles.meta}>
                No words are allowed on event images. Images must appear anonymous. Violators may be removed from the app.
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
                styles.secondaryButton,
                localStyles.submitButton,
                localStyles.footerButton,
                { opacity: loading ? 0.6 : 1 },
              ]}
              onPress={() => handleSubmit("DRAFT")}
              disabled={loading}
            >
              {loading && submitMode === "DRAFT" ? (
                <ActivityIndicator color={AppColor.primary} />
              ) : (
                <Text style={styles.secondaryButtonText}>Save Draft</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.button,
                localStyles.submitButton,
                localStyles.footerButton,
                { opacity: loading ? 0.6 : 1 },
              ]}
              onPress={() => handleSubmit("OPEN")}
              disabled={loading}
            >
              {loading && submitMode === "OPEN" ? (
                <ActivityIndicator color={AppColor.white} />
              ) : (
                <Text style={styles.buttonText}>Submit Event</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      <DateTimePickerModal
        isVisible={!!pickerState}
        mode={pickerState?.mode || "date"}
        is24Hour={false}
        onCancel={() => setPickerState(null)}
        onConfirm={(date) => {
          const activePicker = pickerState;
          setPickerState(null);
          if (activePicker?.key) {
            updateField(
              activePicker.key,
              activePicker.mode === "date"
                ? formatDateForPayload(date)
                : formatTimeForPayload(date)
            );
          }
        }}
      />
      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: "" })}
        duration={3000}
        style={{ backgroundColor: AppColor.snackbarError }}
      >
        {snackbar.message}
      </Snackbar>
    </View>
  );
};

export default MarketplaceCreateEventScreen;
