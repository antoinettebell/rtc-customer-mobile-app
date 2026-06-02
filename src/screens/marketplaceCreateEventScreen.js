import React, { useEffect, useState } from "react";
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
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import AppHeader from "../components/AppHeader";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor } from "../utils/theme";
import Config from "../config/env";
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
  service_type: "",
  primary_service_style: "",
  plated_number_of_courses: "",
  plated_single_entree: false,
  plated_choice_entrees: false,
  plated_tableside_choice: false,
  plated_bread_salad_dessert: false,
  buffet_options: [],
  food_truck_options: [],
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
  event_close_date: "",
};

const GOOGLE_MAP_API_KEY = Config.GOOGLE_MAP_API_KEY;
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
      "Casual mobile service. Vendors needed are automatically calculated at one truck per 75 guests.",
  },
  {
    label: "Other / Family Style / Stations",
    icon: "groups",
    description:
      "Shared platters, interactive stations, family-style, or custom service setup.",
  },
];
const PLATED_OPTIONS = [
  ["Single Entree", "plated_single_entree"],
  ["Choice of 2-3 Entrees", "plated_choice_entrees"],
  ["Tableside Choice", "plated_tableside_choice"],
  ["Bread/Salad/Dessert Included", "plated_bread_salad_dessert"],
];
const BUFFET_OPTIONS = ["Full Menu", "Self-Service", "Staff-Service", "Stations"];
const FOOD_TRUCK_OPTIONS = [
  "Full Menu",
  "Full Menu Order Anything",
  "Desserts Only",
  "Desserts Only - Event Pays",
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

const getAddressPart = (components = [], type, field = "long_name") =>
  components.find((component) => component.types?.includes(type))?.[field] || "";

const parseGooglePlaceDetails = (data, details) => {
  const components = details?.address_components || [];
  const city =
    getAddressPart(components, "locality") ||
    getAddressPart(components, "postal_town") ||
    getAddressPart(components, "administrative_area_level_2");
  const state = getAddressPart(components, "administrative_area_level_1", "short_name");
  const zip = getAddressPart(components, "postal_code", "short_name");
  const formattedAddress = details?.formatted_address || data?.description || "";
  const latitude = details?.geometry?.location?.lat;
  const longitude = details?.geometry?.location?.lng;

  return {
    event_address: formattedAddress,
    event_city: city,
    event_state: state,
    event_zip: zip,
    latitude: latitude != null ? String(latitude) : "",
    longitude: longitude != null ? String(longitude) : "",
    formatted_address: formattedAddress,
    place_id: data?.place_id || details?.place_id || "",
    geocoding_provider: latitude != null && longitude != null ? "GOOGLE_PLACES" : "",
    geocoded_at:
      latitude != null && longitude != null ? new Date().toISOString() : "",
  };
};

const requiredFields = [
  "event_name",
  "event_type",
  "primary_service_style",
  "event_date",
  "event_address",
  "event_city",
  "event_state",
  "number_of_guests",
  "number_of_vendors_needed",
  "event_close_date",
];

const isValidUrl = (value) => {
  if (!value?.trim()) return true;
  return /^https?:\/\/[^\s]+\.[^\s]+$/i.test(value.trim());
};

const getAutoFoodTruckVendorCount = (guestCount) =>
  Math.max(1, Math.ceil(Number(guestCount || 0) / 75));

const isFoodTruckStyle = (style) => style === "Food Truck";

const resetServiceSpecificFields = () => ({
  plated_number_of_courses: "",
  plated_single_entree: false,
  plated_choice_entrees: false,
  plated_tableside_choice: false,
  plated_bread_salad_dessert: false,
  buffet_options: [],
  food_truck_options: [],
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
  mapPreview: {
    height: 118,
    borderRadius: 12,
    marginTop: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E0E4EB",
    backgroundColor: "#E9EEF5",
    alignItems: "center",
    justifyContent: "center",
  },
  mapGridLine: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  mapGridHorizontal: {
    left: 0,
    right: 0,
    height: 1,
  },
  mapGridVertical: {
    top: 0,
    bottom: 0,
    width: 1,
  },
  mapPin: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColor.white,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 3,
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
});

const MarketplaceCreateEventScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState(initialForm);
  const [eventImages, setEventImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: "" });
  const { checkAndRequestPermission: photosPermissionStatus } = usePermission(
    permission.photos
  );
  const foodTruckVendorCount = getAutoFoodTruckVendorCount(
    form.number_of_guests
  );
  const foodTruckSelected = isFoodTruckStyle(form.primary_service_style);

  useEffect(() => {
    if (!foodTruckSelected) return;
    setForm((prev) => ({
      ...prev,
      number_of_vendors_needed: String(
        getAutoFoodTruckVendorCount(prev.number_of_guests)
      ),
    }));
  }, [foodTruckSelected, form.number_of_guests]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleManualAddressChange = (value) => {
    // TODO: Add a backend/manual geocoding fallback so typed addresses can get markers later.
    setForm((prev) => ({
      ...prev,
      event_address: value,
      latitude: "",
      longitude: "",
      formatted_address: "",
      place_id: "",
      geocoding_provider: "",
      geocoded_at: "",
    }));
  };

  const handleGoogleAddressSelect = (data, details) => {
    if (!details) return;
    setForm((prev) => ({
      ...prev,
      ...parseGooglePlaceDetails(data, details),
    }));
  };

  const validate = () => {
    const missing = requiredFields.find((field) => !String(form[field]).trim());
    if (missing) {
      setSnackbar({ visible: true, message: "Please complete required fields." });
      return false;
    }
    if (!isValidUrl(form.ticket_url)) {
      setSnackbar({
        visible: true,
        message: "Please enter a valid ticket sales link.",
      });
      return false;
    }
    if (
      !foodTruckSelected &&
      Number(form.number_of_vendors_needed || 0) < 1
    ) {
      setSnackbar({
        visible: true,
        message: "Vendors Needed must be at least 1.",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        number_of_guests: Number(form.number_of_guests),
        number_of_vendors_needed: foodTruckSelected
          ? foodTruckVendorCount
          : Math.max(1, Number(form.number_of_vendors_needed || 1)),
        plated_number_of_courses: form.plated_number_of_courses
          ? Number(form.plated_number_of_courses)
          : null,
        vendor_fee: Number(form.vendor_fee || 0),
        budgeted_amount: Number(form.budgeted_amount || 0),
        ticket_sales_enabled: !!form.ticket_sales_enabled,
        ticket_url: form.ticket_url?.trim() || "",
        status: "OPEN",
      };
      const response = await createMarketplaceEvent_API(payload);
      if (response?.success) {
        const eventId = response.data?.marketplaceEvent?.event_id;
        let uploadWarning = false;
        if (eventId && eventImages.length) {
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
          "Event Created",
          uploadWarning
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
        message: error?.message || "Failed to create event.",
      });
    } finally {
      setLoading(false);
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

  const renderMoneyInput = (label, key, helper) => (
    <View style={[localStyles.fieldGroup, localStyles.sideField]}>
      {renderLabel(label)}
      <View style={localStyles.moneyBox}>
        <Text style={localStyles.moneyPrefix}>$</Text>
        <TextInput
          value={form[key]}
          onChangeText={(value) => updateField(key, value)}
          placeholder="0.00"
          placeholderTextColor={AppColor.textPlaceholder}
          keyboardType="decimal-pad"
          style={localStyles.moneyInput}
        />
      </View>
      {helper ? <Text style={styles.meta}>{helper}</Text> : null}
    </View>
  );

  const renderAddressInput = () => (
    <View style={styles.placesWrapper}>
      {renderLabel("Address *")}
      <GooglePlacesAutocomplete
        placeholder="Search address"
        query={{
          key: GOOGLE_MAP_API_KEY,
          language: "en",
          types: "geocode|establishment",
        }}
        fetchDetails={true}
        enablePoweredByContainer={false}
        predefinedPlaces={[]}
        keyboardShouldPersistTaps="always"
        minLength={2}
        timeout={20000}
        onPress={handleGoogleAddressSelect}
        onFail={(error) => {
          console.log("Google Places event address error", error);
          setSnackbar({
            visible: true,
            message: "Address search failed. You can enter the address manually.",
          });
        }}
        textInputProps={{
          placeholderTextColor: AppColor.textPlaceholder,
          defaultValue: form.event_address,
          onChangeText: handleManualAddressChange,
          returnKeyType: "search",
        }}
        styles={{
          container: styles.placesContainer,
          textInputContainer: styles.placesTextInputContainer,
          textInput: styles.placesTextInput,
          listView: styles.placesListView,
          row: styles.placesRow,
          description: styles.placesDescription,
          separator: styles.placesSeparator,
        }}
      />
      {form.latitude && form.longitude ? (
        <View style={localStyles.mapPreview}>
          <View style={[localStyles.mapGridLine, localStyles.mapGridHorizontal, { top: 30 }]} />
          <View style={[localStyles.mapGridLine, localStyles.mapGridHorizontal, { top: 76 }]} />
          <View style={[localStyles.mapGridLine, localStyles.mapGridVertical, { left: 72 }]} />
          <View style={[localStyles.mapGridLine, localStyles.mapGridVertical, { right: 88 }]} />
          <View style={localStyles.mapPin}>
            <MaterialIcons name="place" size={28} color={AppColor.primary} />
          </View>
        </View>
      ) : null}
      {form.latitude && form.longitude ? (
        <Text style={styles.meta}>Location verified with Google Places.</Text>
      ) : (
        <Text style={styles.meta}>
          Select a suggestion to place this event on the map. Manual entries can be saved without a marker.
        </Text>
      )}
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
                  updateField(key, toggleListValue(form[key], option));
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
              onPress={() => updateField("event_type", option)}
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
              onPress={() => updateField(key, value)}
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
                setForm((prev) => ({
                  ...prev,
                  ...resetServiceSpecificFields(),
                  primary_service_style: option.label,
                  number_of_vendors_needed:
                    option.label === "Food Truck"
                      ? String(getAutoFoodTruckVendorCount(prev.number_of_guests))
                      : prev.number_of_vendors_needed,
                }))
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

  const renderBooleanOption = (label, key) => (
    <TouchableOpacity
      key={key}
      activeOpacity={0.7}
      style={localStyles.checkboxRow}
      onPress={() => updateField(key, !form[key])}
    >
      <View
        style={[
          localStyles.checkbox,
          form[key] && localStyles.checkboxActive,
        ]}
      >
        {form[key] && (
          <MaterialIcons name="check" size={16} color={AppColor.white} />
        )}
      </View>
      <Text style={localStyles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const renderServiceSpecificDetails = () => {
    if (form.primary_service_style === "Plated") {
      return (
        <View style={localStyles.fieldGroup}>
          {renderLabel("Plated Options")}
          {renderInput("Number of Courses", "plated_number_of_courses", {
            keyboardType: "number-pad",
          })}
          {PLATED_OPTIONS.map(([label, key]) => renderBooleanOption(label, key))}
        </View>
      );
    }

    if (form.primary_service_style === "Buffet") {
      return renderChips("Buffet Options", "buffet_options", BUFFET_OPTIONS);
    }

    if (form.primary_service_style === "Food Truck") {
      return renderChips(
        "Food Truck Options",
        "food_truck_options",
        FOOD_TRUCK_OPTIONS
      );
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
        {renderInput("Vendors Needed *", "number_of_vendors_needed", {
          keyboardType: "number-pad",
          editable: !foodTruckSelected,
        })}
        {foodTruckSelected ? (
          <Text style={styles.meta}>
            One food truck is recommended for every 75 guests.
          </Text>
        ) : (
          <Text style={styles.meta}>
            This controls the maximum number of vendors you can award.
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
            {renderInput("Event Name *", "event_name")}
            {renderInput("Description", "event_description", { multiline: true })}
            {renderTicketSalesFields()}
            {renderEventTypeCards()}
            {renderVisibilityToggle()}
            {renderChips("Event Style", "event_style", EVENT_STYLES)}
            {renderChips("Service Type", "service_type", SERVICE_TYPES)}
            {renderPrimaryServiceStyle()}
            {renderServiceSpecificDetails()}
            <View style={localStyles.sideBySide}>
              <View style={localStyles.sideField}>
                {renderInput("Event Date *", "event_date", {
                  placeholder: "YYYY-MM-DD",
                })}
              </View>
              <View style={localStyles.sideField}>
                {renderInput("Time", "event_time", {
                  placeholder: "HH:mm",
                })}
              </View>
            </View>
            {renderInput("Close Date *", "event_close_date", {
              placeholder: "YYYY-MM-DD",
            })}
          </View>

          <View style={localStyles.card}>
            {renderSectionHeader("Location", "place")}
            {renderAddressInput()}
            <View style={localStyles.sideBySide}>
              <View style={localStyles.sideField}>
                {renderInput("City *", "event_city")}
              </View>
              <View style={localStyles.sideField}>
                {renderInput("State *", "event_state")}
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
            <View style={localStyles.sideBySide}>
              {renderMoneyInput(
                "Vendor Fee",
                "vendor_fee",
                "Fee vendors pay if this event requires attendance payment.",
              )}
              {renderMoneyInput(
                "Budgeted Amount",
                "budgeted_amount",
                "Amount available when coordinator pays vendors.",
              )}
            </View>
          </View>

          <View style={localStyles.card}>
            {renderSectionHeader("Event Images", "image")}
            <View style={localStyles.uploadCard}>
              <Text style={styles.meta}>
                Upload JPG, PNG, or HEIC images. Maximum file size is 10 MB.
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
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.button,
              localStyles.submitButton,
              { opacity: loading ? 0.6 : 1 },
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={AppColor.white} />
            ) : (
              <Text style={styles.buttonText}>Submit Event</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
