import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppHeader from "../components/AppHeader";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor } from "../utils/theme";
import { getMarketplaceEventById_API } from "../apiFolder/appAPI";
import { formatDate, formatMoney, styles } from "./marketplaceShared";

const DetailRow = ({ label, value }) => (
  <View style={{ marginTop: 12 }}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.meta}>{value || "Not set"}</Text>
  </View>
);

const listValue = (value) =>
  Array.isArray(value) && value.length ? value.join(", ") : "Not set";

const MarketplaceEventDetailsScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { eventId } = route.params || {};
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadEvent = async () => {
    setLoading(true);
    try {
      const response = await getMarketplaceEventById_API(eventId);
      if (response?.success) {
        setEvent(response.data?.marketplaceEvent);
      }
    } catch (error) {
      Alert.alert("Event", error?.message || "Failed to load event.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEvent();
    }, [eventId])
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />
      <AppHeader headerTitle="Event Details" />
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={AppColor.primary} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.card}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={[styles.title, { flex: 1, paddingRight: 8 }]}>
                {event?.event_name || "Event"}
              </Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{event?.status || "DRAFT"}</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>{event?.event_description}</Text>
            <DetailRow label="Date" value={formatDate(event?.event_date)} />
            <DetailRow label="Time" value={event?.event_time} />
            <DetailRow
              label="Location"
              value={`${event?.event_address || ""}, ${event?.event_city || ""}, ${event?.event_state || ""} ${event?.event_zip || ""}`}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Event Requirements</Text>
            <DetailRow label="Event Type" value={event?.event_type} />
            <DetailRow label="Event Style" value={event?.event_style} />
            <DetailRow label="Service Type" value={event?.service_type} />
            <DetailRow label="Primary Service Style" value={event?.primary_service_style} />
            <DetailRow label="Guests" value={String(event?.number_of_guests || 0)} />
            <DetailRow
              label="Vendors Needed"
              value={String(event?.number_of_vendors_needed || 0)}
            />
            <DetailRow label="Power" value={listValue(event?.power_required)} />
            <DetailRow label="Permits" value={listValue(event?.permits_required)} />
            <DetailRow
              label="Insurance Required"
              value={event?.insurance_required ? "Yes" : "No"}
            />
            <DetailRow
              label="Alcohol Required"
              value={event?.alcohol_required ? "Yes" : "No"}
            />
            <DetailRow
              label="Cuisine Preferences"
              value={listValue(event?.cuisine_preferences)}
            />
            <DetailRow
              label="Dietary Restrictions"
              value={listValue(event?.dietary_restrictions)}
            />
            <DetailRow
              label="Equipment"
              value={listValue(event?.equipment_needed)}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Budget</Text>
            <DetailRow label="Vendor Fee" value={formatMoney(event?.vendor_fee)} />
            <DetailRow
              label="Budgeted Amount"
              value={formatMoney(event?.budgeted_amount)}
            />
            <DetailRow label="Close Date" value={formatDate(event?.event_close_date)} />
            <DetailRow
              label="Booking Payment"
              value={event?.award_payment_status || "NOT_REQUIRED"}
            />
            <DetailRow
              label="Agreement"
              value={event?.agreement_status || "NOT_REQUIRED"}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.button}
            onPress={() =>
              navigation.navigate("marketplaceAwardBidsScreen", { eventId })
            }
          >
            <Text style={styles.buttonText}>View Bids / Award Vendors</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.secondaryButton, styles.mutedButton, { marginTop: 12 }]}
            onPress={() =>
              Alert.alert("Reopen Bidding", "Reopen bidding payment will be added in a later phase.")
            }
          >
            <Text style={[styles.secondaryButtonText, styles.mutedButtonText]}>
              Reopen Bidding
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

export default MarketplaceEventDetailsScreen;
