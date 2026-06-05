import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Snackbar } from "react-native-paper";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import AppHeader from "../components/AppHeader";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor } from "../utils/theme";
import {
  awardMarketplaceBids_API,
  getMarketplaceEventBids_API,
  getMarketplaceEventById_API,
} from "../apiFolder/appAPI";
import { formatMoney, styles } from "./marketplaceShared";

const getVendorName = (bid) => {
  const detailsUnlocked = bid?.marketplace_unlock?.details_unlocked === true;
  if (!detailsUnlocked) {
    if (bid?.vendor_display_id) return bid.vendor_display_id;
    if (bid?.food_truck_id?.display_id) return bid.food_truck_id.display_id;
    const rawId =
      typeof bid?.food_truck_id === "object"
        ? bid?.food_truck_id?._id
        : bid?.food_truck_id;
    const suffix = String(rawId || "").replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
    return `Vendor RTC - ${suffix || "MASKED"}`;
  }

  const vendor = bid?.vendor_user_id;
  const foodTruck = bid?.food_truck_id;
  if (foodTruck?.name) return foodTruck.name;
  return [vendor?.firstName, vendor?.lastName].filter(Boolean).join(" ") || "Vendor";
};

const MarketplaceAwardBidsScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { eventId } = route.params || {};
  const [event, setEvent] = useState(null);
  const [bids, setBids] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedBidIds, setSelectedBidIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [awarding, setAwarding] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: "" });

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventRes, bidsRes] = await Promise.all([
        getMarketplaceEventById_API(eventId),
        getMarketplaceEventBids_API(eventId),
      ]);
      if (eventRes?.success) {
        setEvent(eventRes.data?.marketplaceEvent);
      }
      if (bidsRes?.success) {
        const nextBids = bidsRes.data?.marketplaceBidList || [];
        setApplications(bidsRes.data?.marketplaceApplicationList || []);
        setBids(nextBids);
        setSelectedBidIds(
          nextBids
            .filter((bid) => bid.bid_status === "AWARDED")
            .map((bid) => bid.bid_id)
        );
      }
    } catch (error) {
      setSnackbar({
        visible: true,
        message: error?.message || "Failed to load bids.",
      });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [eventId])
  );

  const toggleBid = (bid) => {
    if (["AWARDED", "NOT_AWARDED", "WITHDRAWN"].includes(bid.bid_status)) {
      return;
    }

    setSelectedBidIds((prev) => {
      if (prev.includes(bid.bid_id)) {
        return prev.filter((id) => id !== bid.bid_id);
      }

      if (prev.length >= Number(event?.number_of_vendors_needed || 0)) {
        setSnackbar({
          visible: true,
          message: `You can only award up to ${event?.number_of_vendors_needed || 0} vendor(s) for this event.`,
        });
        return prev;
      }

      return [...prev, bid.bid_id];
    });
  };

  const handleAward = () => {
    if (!selectedBidIds.length) {
      setSnackbar({ visible: true, message: "Select at least one bid." });
      return;
    }
    if (selectedBidIds.length > Number(event?.number_of_vendors_needed || 0)) {
      setSnackbar({
        visible: true,
        message: `You can only award up to ${event?.number_of_vendors_needed || 0} vendor(s) for this event.`,
      });
      return;
    }

    Alert.alert(
      "Award Vendors",
      "Awarded bids will be marked AWARDED and all other bids will be marked NOT_AWARDED.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Award",
          onPress: async () => {
            setAwarding(true);
            try {
              const response = await awardMarketplaceBids_API({
                eventId,
                bidIds: selectedBidIds,
              });
              if (response?.success) {
                const marketplacePayment = response.data?.marketplacePayment;
                if (response.data?.requires_payment && marketplacePayment) {
                  navigation.navigate("marketplacePaymentScreen", {
                    payment: marketplacePayment,
                    paymentId: marketplacePayment.payment_id,
                    returnScreen: "marketplaceEventDetailsScreen",
                    returnParams: { eventId },
                  });
                  return;
                }
                setSnackbar({ visible: true, message: "Vendors awarded successfully." });
                await loadData();
              }
            } catch (error) {
              setSnackbar({
                visible: true,
                message: error?.message || "Failed to award vendors.",
              });
            } finally {
              setAwarding(false);
            }
          },
        },
      ]
    );
  };

  const renderBid = ({ item }) => {
    const selected = selectedBidIds.includes(item.bid_id);
    const locked = ["AWARDED", "NOT_AWARDED", "WITHDRAWN"].includes(
      item.bid_status
    );

    return (
      <TouchableOpacity
        activeOpacity={locked ? 1 : 0.8}
        style={[
          styles.card,
          selected ? { borderColor: AppColor.primary, backgroundColor: "#FFF8F1" } : null,
        ]}
        onPress={() => toggleBid(item)}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <MaterialIcons
            name={selected ? "check-circle" : "radio-button-unchecked"}
            size={24}
            color={selected ? AppColor.primary : AppColor.gray}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.title}>{getVendorName(item)}</Text>
            <Text style={styles.meta}>Bid {formatMoney(item.full_bid_amount)}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.bid_status}</Text>
          </View>
        </View>
        <Text style={styles.meta}>
          Price per guest:{" "}
          {item.price_per_guest == null
            ? "Not provided"
            : formatMoney(item.price_per_guest)}
        </Text>
        <Text style={styles.meta}>Menu: {item.menu_description || "Not provided"}</Text>
        {item.menu_pdf_url ? (
          <Text style={styles.meta}>Menu PDF: Uploaded</Text>
        ) : null}
        {item.image_urls?.length ? (
          <Text style={styles.meta}>
            Food/Menu Images: {item.image_urls.length} uploaded
          </Text>
        ) : null}
        {item.permit_license_urls?.length ? (
          <Text style={styles.meta}>
            Permit/License Files: {item.permit_license_urls.length} uploaded
          </Text>
        ) : null}
        <Text style={styles.meta}>
          NDA: {item.nda_required ? (item.nda_acknowledged ? "Acknowledged" : "Required") : "Not required"}
        </Text>
        <Text style={styles.meta}>
          Insurance: {item.insurance_confirmed ? "Confirmed" : "Not confirmed"} •
          Permits: {item.permits_confirmed ? " Confirmed" : " Not confirmed"}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderApplication = (item) => (
    <View key={item.application_id} style={styles.card}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{getVendorName(item)}</Text>
          <Text style={styles.meta}>Application round {item.submission_round || 1}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.application_status}</Text>
        </View>
      </View>
      <Text style={styles.meta}>
        Vendor fee: {formatMoney(item.vendor_fee_amount || event?.vendor_fee || 0)}
      </Text>
      <Text style={styles.meta}>
        Message: {item.message || item.notes || "Not provided"}
      </Text>
      {item.menu_pdf_url ? <Text style={styles.meta}>Menu PDF: Uploaded</Text> : null}
      {item.image_urls?.length ? (
        <Text style={styles.meta}>Food/Menu Images: {item.image_urls.length} uploaded</Text>
      ) : null}
    </View>
  );

  const awardLocked = ["AWARDED", "CLOSED", "CANCELLED"].includes(
    event?.status
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />
      <AppHeader headerTitle="Award Bids" />
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={AppColor.primary} size="large" />
        </View>
      ) : (
        <>
          <FlatList
            data={bids}
            keyExtractor={(item) => item.bid_id}
            renderItem={renderBid}
            contentContainerStyle={styles.body}
            ListHeaderComponent={
              <View style={styles.card}>
                <Text style={styles.title}>{event?.event_name || "Event Bids"}</Text>
                <Text style={styles.meta}>
                  Select up to {event?.number_of_vendors_needed || 0} vendor(s).
                </Text>
                <Text style={styles.meta}>
                  Awards finalize after the marketplace booking payment is confirmed.
                </Text>
                <Text style={styles.meta}>
                  Final submissions: {bids.length + applications.length} total, {applications.length} application(s).
                </Text>
                {awardLocked ? (
                  <Text style={styles.meta}>
                    This event is {event?.status}; award selections are locked.
                  </Text>
                ) : null}
              </View>
            }
            ListEmptyComponent={
              <View style={styles.card}>
                <Text style={[styles.emptyText, { marginTop: 0 }]}>
                  No vendor bids have been submitted yet.
                </Text>
              </View>
            }
            ListFooterComponent={
              <View>
                {applications.length ? (
                  <View>
                    <Text style={[styles.title, { marginBottom: 10 }]}>
                      Vendor Applications
                    </Text>
                    {applications.map(renderApplication)}
                  </View>
                ) : null}
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.button,
                    {
                      marginTop: 4,
                      opacity: awarding || !bids.length || awardLocked ? 0.6 : 1,
                    },
                  ]}
                  disabled={awarding || !bids.length || awardLocked}
                  onPress={handleAward}
                >
                  {awarding ? (
                    <ActivityIndicator color={AppColor.white} />
                  ) : (
                    <Text style={styles.buttonText}>Complete Booking Payment</Text>
                  )}
                </TouchableOpacity>
              </View>
            }
          />
        </>
      )}
      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: "" })}
        duration={3500}
        style={{ backgroundColor: AppColor.snackbarDefault }}
      >
        {snackbar.message}
      </Snackbar>
    </View>
  );
};

export default MarketplaceAwardBidsScreen;
