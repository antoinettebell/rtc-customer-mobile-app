import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ImagePicker from "react-native-image-crop-picker";
import { RESULTS } from "react-native-permissions";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Snackbar } from "react-native-paper";
import AppHeader from "../components/AppHeader";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor } from "../utils/theme";
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
  event_type: "",
  event_style: "",
  service_type: "",
  primary_service_style: "",
  event_date: "",
  event_time: "",
  event_address: "",
  event_city: "",
  event_state: "",
  event_zip: "",
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

const requiredFields = [
  "event_name",
  "event_type",
  "event_date",
  "event_address",
  "event_city",
  "event_state",
  "number_of_guests",
  "number_of_vendors_needed",
  "event_close_date",
];

const MarketplaceCreateEventScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState(initialForm);
  const [eventImages, setEventImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: "" });
  const { checkAndRequestPermission: photosPermissionStatus } = usePermission(
    permission.photos
  );

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    const missing = requiredFields.find((field) => !String(form[field]).trim());
    if (missing) {
      setSnackbar({ visible: true, message: "Please complete required fields." });
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
        number_of_vendors_needed: Number(form.number_of_vendors_needed),
        vendor_fee: Number(form.vendor_fee || 0),
        budgeted_amount: Number(form.budgeted_amount || 0),
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
        style={[
          styles.input,
          props.multiline ? styles.textarea : null,
        ]}
      />
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />
      <AppHeader headerTitle="Create Event" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.card}>
            <Text style={styles.title}>Event Basics</Text>
            {renderInput("Event Name *", "event_name")}
            {renderInput("Description", "event_description", { multiline: true })}
            {renderChips("Event Type *", "event_type", EVENT_TYPES)}
            {renderChips("Event Style", "event_style", EVENT_STYLES)}
            {renderChips("Service Type", "service_type", SERVICE_TYPES)}
            {renderChips(
              "Primary Service Style",
              "primary_service_style",
              SERVICE_TYPES
            )}
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
            {renderInput("Address *", "event_address")}
            <View style={styles.row}>
              <View style={styles.flex}>{renderInput("City *", "event_city")}</View>
              <View style={styles.flex}>{renderInput("State *", "event_state")}</View>
            </View>
            {renderInput("Zip", "event_zip")}
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Vendor Needs</Text>
            <View style={styles.row}>
              <View style={styles.flex}>
                {renderInput("Guests *", "number_of_guests", {
                  keyboardType: "number-pad",
                })}
              </View>
              <View style={styles.flex}>
                {renderInput("Vendors *", "number_of_vendors_needed", {
                  keyboardType: "number-pad",
                })}
              </View>
            </View>
            {renderChips("Power Requirements", "power_required", POWER_OPTIONS)}
            {renderChips("Permits Required", "permits_required", PERMIT_OPTIONS)}
            {renderBoolean("Insurance Required", "insurance_required")}
            {renderBoolean("Alcohol Required", "alcohol_required")}
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
