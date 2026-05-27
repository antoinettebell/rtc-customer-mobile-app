import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  serviceGrid: {
    gap: 10,
  },
  serviceCard: {
    borderWidth: 1,
    borderColor: AppColor.border,
    borderRadius: 10,
    padding: 12,
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
  serviceTitle: {
    flex: 1,
    color: AppColor.text,
  },
  serviceDescription: {
    color: AppColor.textHighlighter,
    marginTop: 8,
    lineHeight: 18,
  },
  readOnlyInput: {
    backgroundColor: AppColor.inputBackground || "#F5F5F5",
    color: AppColor.textHighlighter,
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

  const renderInput = (label, key, props = {}) => (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={form[key]}
        onChangeText={(value) => updateField(key, value)}
        placeholder={props.placeholder}
        keyboardType={props.keyboardType}
        multiline={props.multiline}
        editable={props.editable}
        style={[
          styles.input,
          props.multiline ? styles.textarea : null,
          props.editable === false ? localStyles.readOnlyInput : null,
        ]}
      />
    </View>
  );

  const renderAddressInput = () => (
    <View style={styles.placesWrapper}>
      <Text style={styles.label}>Address *</Text>
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
        <Text style={styles.meta}>Location verified with Google Places.</Text>
      ) : (
        <Text style={styles.meta}>
          Select a suggestion to place this event on the map. Manual entries can be saved without a marker.
        </Text>
      )}
    </View>
  );

  const renderChips = (label, key, options) => (
    <View>
      <Text style={styles.label}>{label}</Text>
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

  const renderBoolean = (label, key) => (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {[
          ["Yes", true],
          ["No", false],
        ].map(([labelText, value]) => {
          const active = form[key] === value;
          return (
            <TouchableOpacity
              key={labelText}
              activeOpacity={0.7}
              onPress={() => updateField(key, value)}
              style={[styles.chip, active && styles.chipActive]}
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

  const renderTicketSalesFields = () => (
    <View>
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
    <View>
      <Text style={styles.label}>Primary Service Style *</Text>
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
                <MaterialIcons
                  name={option.icon}
                  size={24}
                  color={active ? AppColor.primary : AppColor.text}
                />
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
        <View>
          <Text style={styles.label}>Plated Options</Text>
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
    <View style={styles.row}>
      <View style={styles.flex}>
        {renderInput("Guests *", "number_of_guests", {
          keyboardType: "number-pad",
        })}
      </View>
      <View style={styles.flex}>
        {renderInput("Vendors Needed *", "number_of_vendors_needed", {
          keyboardType: "number-pad",
          editable: !foodTruckSelected,
        })}
        {foodTruckSelected ? (
          <Text style={styles.meta}>
            Auto-calculated at one food truck per 75 guests.
          </Text>
        ) : (
          <Text style={styles.meta}>Minimum 1 vendor.</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />
      <AppHeader headerTitle="Create Event" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.title}>Event Basics</Text>
            {renderInput("Event Name *", "event_name")}
            {renderInput("Description", "event_description", { multiline: true })}
            {renderTicketSalesFields()}
            {renderChips("Event Type *", "event_type", EVENT_TYPES)}
            {renderChips("Event Style", "event_style", EVENT_STYLES)}
            {renderChips("Service Type", "service_type", SERVICE_TYPES)}
            {renderPrimaryServiceStyle()}
            {renderServiceSpecificDetails()}
            <View style={styles.row}>
              <View style={styles.flex}>
                {renderInput("Event Date *", "event_date", {
                  placeholder: "YYYY-MM-DD",
                })}
              </View>
              <View style={styles.flex}>
                {renderInput("Time", "event_time", {
                  placeholder: "HH:mm",
                })}
              </View>
            </View>
            {renderInput("Close Date *", "event_close_date", {
              placeholder: "YYYY-MM-DD",
            })}
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Location</Text>
            {renderAddressInput()}
            <View style={styles.row}>
              <View style={styles.flex}>{renderInput("City *", "event_city")}</View>
              <View style={styles.flex}>{renderInput("State *", "event_state")}</View>
            </View>
            {renderInput("Zip", "event_zip")}
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Vendor Needs</Text>
            {renderVendorCountFields()}
            {renderChips("Power Requirements", "power_required", POWER_OPTIONS)}
            {renderChips("Permits Required", "permits_required", PERMIT_OPTIONS)}
            {renderBoolean("Insurance Required", "insurance_required")}
            {renderBoolean("Alcohol Service", "alcohol_required")}
            {renderChips("Cuisine Preferences", "cuisine_preferences", CUISINE_OPTIONS)}
            {renderChips("Dietary Restrictions", "dietary_restrictions", DIETARY_OPTIONS)}
            {renderChips("Equipment Needs", "equipment_needed", EQUIPMENT_OPTIONS)}
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Budget</Text>
            <View style={styles.row}>
              <View style={styles.flex}>
                {renderInput("Vendor Fee", "vendor_fee", {
                  keyboardType: "decimal-pad",
                })}
              </View>
              <View style={styles.flex}>
                {renderInput("Budgeted Amount", "budgeted_amount", {
                  keyboardType: "decimal-pad",
                })}
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Event Images</Text>
            <Text style={styles.meta}>
              Upload JPG, PNG, or HEIC images. Maximum file size is 10 MB.
            </Text>
            {eventImages.map((image, index) => (
              <View
                key={`${image.uri}-${index}`}
                style={[styles.row, { alignItems: "center", marginTop: 10 }]}
              >
                <Text style={[styles.meta, styles.flex]} numberOfLines={1}>
                  {image.name}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() =>
                    setEventImages((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  <Text style={styles.secondaryButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.secondaryButton, { marginTop: 14 }]}
              onPress={handlePickEventImages}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Add Event Images</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.button, { opacity: loading ? 0.6 : 1 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={AppColor.white} />
            ) : (
              <Text style={styles.buttonText}>Submit Event</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
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
