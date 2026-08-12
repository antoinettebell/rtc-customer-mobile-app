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
  acceptMarketplaceApplication_API,
  getMarketplaceEventBids_API,
  getMarketplaceEventById_API,
  getEventVendorEventApplications_API,
  awardEventVendorApplication_API,
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
  const [eventVendorApplications, setEventVendorApplications] = useState([]);
  const [selectedBidIds, setSelectedBidIds] = useState([]);
  const [awardCoverageByBidId, setAwardCoverageByBidId] = useState({});
  const [loading, setLoading] = useState(false);
  const [awarding, setAwarding] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: "" });

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventRes, bidsRes, eventVendorRes] = await Promise.all([
        getMarketplaceEventById_API(eventId),
        getMarketplaceEventBids_API(eventId),
        getEventVendorEventApplications_API(eventId),
      ]);
      if (eventRes?.success) {
        setEvent(eventRes.data?.marketplaceEvent);
      }
      if (eventVendorRes?.success) {
        setEventVendorApplications(eventVendorRes.data?.applicationList || []);
      }
      if (bidsRes?.success) {
        const nextBids = bidsRes.data?.marketplaceBidList || [];
        setApplications(bidsRes.data?.marketplaceApplicationList || []);
        setBids(nextBids);
        setAwardCoverageByBidId(
          nextBids.reduce((result, bid) => ({
            ...result,
            [bid.bid_id]: bid.awarded_coverage || bid.guest_coverage || "REGULAR",
          }), {})
        );
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
    if (["AWARDED", "NOT_AWARDED", "DECLINED", "WITHDRAWN"].includes(bid.bid_status)) {
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
    const selectedBids = bids.filter((bid) => selectedBidIds.includes(bid.bid_id));
    const awardSelections = selectedBids.map((bid) => ({
      bid_id: bid.bid_id,
      award_coverage: awardCoverageByBidId[bid.bid_id] || bid.guest_coverage,
    }));
    const requiredCount = Math.max(1, Number(event?.number_of_vendors_needed || 1));
    const minimumCount = Math.max(
      1,
      requiredCount - (awardSelections.some((item) => item.award_coverage === "BOTH") ? 1 : 0),
    );
    if (selectedBidIds.length < minimumCount) {
      setSnackbar({
        visible: true,
        message: `Select at least ${minimumCount} vendor(s). One fewer is allowed only when a selected bid covers Both Regular and VIP Guests.`,
      });
      return;
    }

    Alert.alert(
      "Award Bid",
      "Are you sure you want to award the selected bid(s) to the selected vendor(s)?",
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
                awardSelections,
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
    const locked = ["AWARDED", "NOT_AWARDED", "DECLINED", "WITHDRAWN"].includes(
      item.bid_status
    ) || !!item.archived_at;
    const offeredCoverage = item.guest_coverage || "REGULAR";
    const awardCoverageOptions = offeredCoverage === "BOTH"
      ? event?.fully_catered_event
        ? [["REGULAR", "GA Catering"], ["VIP", "VIP Catering"], ["BOTH", "Both"]]
        : [["VIP", "VIP Catering"], ["BOTH", "VIP Catering + GA Sales"]]
      : [[offeredCoverage, offeredCoverage === "VIP" ? "VIP Catering" : "GA / Event Catering"]];

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.card,
          selected ? { borderColor: AppColor.primary, backgroundColor: "#FFF8F1" } : null,
        ]}
        onPress={() =>
          navigation.navigate("marketplaceSubmissionDetailsScreen", {
            submission: item,
            submissionType: "Bid",
          })
        }
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={locked}
            onPress={() => toggleBid(item)}
          >
            <MaterialIcons
              name={selected ? "check-circle" : "radio-button-unchecked"}
              size={24}
              color={selected ? AppColor.primary : AppColor.gray}
            />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.title}>{getVendorName(item)}</Text>
            <Text style={styles.meta}>Bid {formatMoney(item.full_bid_amount)}</Text>
            {event?.catered_vip_section_enabled ? (
              <Text style={styles.meta}>
                Coverage: {item.guest_coverage === "VIP" ? "VIP Guests" : item.guest_coverage === "BOTH" ? "Regular & VIP Guests" : "Regular Guests"}
              </Text>
            ) : null}
            {item.guest_coverage === "BOTH" ? (
              <Text style={styles.meta}>
                Regular: {formatMoney(item.regular_guest_amount)} · VIP Catering: {formatMoney(item.vip_catering_amount)}
              </Text>
            ) : null}
            <Text style={styles.meta}>
              Round {item.submission_round || 1}
              {item.archived_at ? " • Previous submission" : ""}
            </Text>
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
        {!locked ? (
          <>
          {selected && awardCoverageOptions.length > 1 ? (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.label}>Award Type</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {awardCoverageOptions.map(([value, label]) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.chip,
                      awardCoverageByBidId[item.bid_id] === value && styles.chipActive,
                    ]}
                    onPress={() => setAwardCoverageByBidId((current) => ({
                      ...current,
                      [item.bid_id]: value,
                    }))}
                  >
                    <Text style={[
                      styles.chipText,
                      awardCoverageByBidId[item.bid_id] === value && styles.chipTextActive,
                    ]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.secondaryButton,
              {
                marginTop: 10,
                borderColor: selected ? AppColor.primary : "#DDE2EA",
                backgroundColor: selected ? "#FFF1E6" : AppColor.white,
                flexDirection: "row",
              },
            ]}
            onPress={() => toggleBid(item)}
          >
            <MaterialIcons
              name={selected ? "check-circle" : "add-circle-outline"}
              size={18}
              color={selected ? AppColor.primary : AppColor.textHighlighter}
            />
            <Text
              style={[
                styles.secondaryButtonText,
                {
                  marginLeft: 8,
                  color: selected ? AppColor.primary : AppColor.textHighlighter,
                },
              ]}
            >
              {selected ? "Selected to Award" : "Select to Award"}
            </Text>
          </TouchableOpacity>
          </>
        ) : (
          <>
          <Text style={[styles.meta, { marginTop: 10 }]}>
            {item.bid_status === "AWARDED"
              ? "Awarded"
              : item.bid_status === "WITHDRAWN"
                ? "Withdrawn by vendor"
                : "Not selected"}
          </Text>
          </>
        )}
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
            Business License/Permit Files: {item.permit_license_urls.length} uploaded
          </Text>
        ) : null}
        <Text style={styles.meta}>
          NDA: {item.nda_required ? (item.nda_acknowledged ? "Acknowledged" : "Required") : "Not required"}
        </Text>
        <Text style={styles.meta}>
          Insurance: {item.insurance_confirmed ? "Confirmed" : "Not confirmed"} •
          Permits: {item.permits_confirmed ? " Confirmed" : " Not confirmed"}
        </Text>
        <Text style={[styles.secondaryButtonText, { marginTop: 10 }]}>
          Review full proposal
        </Text>
      </TouchableOpacity>
    );
  };

  const renderApplication = (item) => {
    const withdrawn = item.application_status === "WITHDRAWN";

    return (
      <TouchableOpacity
        key={item.application_id}
        activeOpacity={0.8}
        style={[
          styles.card,
          withdrawn ? { opacity: 0.75, borderColor: "#D93025" } : null,
        ]}
        onPress={() =>
          navigation.navigate("marketplaceSubmissionDetailsScreen", {
            submission: item,
            submissionType: "Application",
          })
        }
      >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{getVendorName(item)}</Text>
          <Text style={styles.meta}>
            Application round {item.submission_round || 1}
            {item.archived_at ? " • Previous submission" : ""}
          </Text>
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
      {withdrawn ? (
        <Text style={[styles.meta, { color: "#D93025", marginTop: 8 }]}>
          This application was withdrawn by the vendor and cannot be selected.
        </Text>
      ) : (
        <>
          <Text style={[styles.meta, { marginTop: 8 }]}>
            Review this application before accepting it.
          </Text>
          {["SUBMITTED", "UNDER_REVIEW"].includes(item.application_status) ? (
            <TouchableOpacity
              style={[styles.secondaryButton, { marginTop: 10 }]}
              onPress={() => Alert.alert(
                "Award Application",
                "Are you sure you want to award this application to this vendor?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Award",
                    onPress: async () => {
                      try {
                        await acceptMarketplaceApplication_API({
                          eventId,
                          applicationId: item.application_id,
                        });
                        await loadData();
                      } catch (error) {
                        setSnackbar({ visible: true, message: error?.message || "Unable to accept vendor application." });
                      }
                    },
                  },
                ]
              )}
            >
              <Text style={styles.secondaryButtonText}>Accept Vendor Application</Text>
            </TouchableOpacity>
          ) : null}
        </>
      )}
      <Text style={[styles.secondaryButtonText, { marginTop: 10 }]}>
        Review full application
      </Text>
      </TouchableOpacity>
    );
  };

  const awardLocked = ["AWARDED", "CLOSED", "CANCELLED"].includes(
    event?.status
  );

  const awardEventVendor = (application) => Alert.alert(
    "Award Marketplace Vendor",
    "Are you sure you want to award this application to this vendor?",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Award", onPress: async () => {
        try { await awardEventVendorApplication_API(application.application_id); await loadData(); }
        catch (error) { setSnackbar({ visible: true, message: error?.message || "Unable to award Marketplace Vendor." }); }
      } },
    ]
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
                {eventVendorApplications.length ? (
                  <View>
                    <Text style={[styles.title, { marginBottom: 10 }]}>Merchandise / Service / Other Applications</Text>
                    {eventVendorApplications.map((application) => (
                      <TouchableOpacity
                        key={application.application_id}
                        style={styles.card}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate("marketplaceSubmissionDetailsScreen", {
                          submission: application,
                          submissionType: "Marketplace Vendor Application",
                        })}
                      >
                        <Text style={styles.title}>{getVendorName(application)}</Text>
                        <Text style={styles.meta}>{application.vendor_types.join(", ")}</Text>
                        <Text style={styles.meta}>Offerings: {(application.offering_bullets || []).join(" • ")}</Text>
                        <Text style={styles.meta}>Category fee: {formatMoney(application.category_fee)} · Electricity: {formatMoney(application.electricity_fee)}</Text>
                        <Text style={styles.meta}>Photos: {(application.photos || []).length} · Status: {application.status}</Text>
                        {["SUBMITTED", "UNDER_REVIEW"].includes(application.status) ? (
                          <TouchableOpacity style={[styles.secondaryButton, { marginTop: 10 }]} onPress={() => awardEventVendor(application)}>
                            <Text style={styles.secondaryButtonText}>Award Marketplace Vendor</Text>
                          </TouchableOpacity>
                        ) : null}
                        <Text style={[styles.secondaryButtonText, { marginTop: 10 }]}>Review full application</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.button,
                    {
                      backgroundColor: AppColor.text,
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
