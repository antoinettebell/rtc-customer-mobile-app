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
  getEventVendorEventApplications_API,
  declineMarketplaceBid_API,
  declineMarketplaceApplication_API,
  declineEventVendorApplication_API,
} from "../apiFolder/appAPI";
import { formatMoney, styles } from "./marketplaceShared";
import {
  getEstimatedAwardVendorCounts,
  getRemainingFoodVendorAwards,
} from "../helpers/marketplaceAwardSelection.helper";
import { getCoordinatorSubmissionActions } from "../helpers/marketplaceCoordinatorSubmissionActions.helper";
import { getLockedFoodVendorDisplayName } from "../helpers/marketplaceFoodVendorDisplay.helper";
import { getCategoryAwardSummary } from "../helpers/marketplaceCategoryAwardSummary.helper";

const getVendorName = (bid) => {
  const detailsUnlocked = bid?.marketplace_unlock?.details_unlocked === true;
  if (!detailsUnlocked) {
    return getLockedFoodVendorDisplayName(bid?.vendor_display_id);
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
  const [selectedFoodApplicationIds, setSelectedFoodApplicationIds] = useState([]);
  const [selectedEventVendorApplicationIds, setSelectedEventVendorApplicationIds] = useState([]);
  const [awardCoverageByBidId, setAwardCoverageByBidId] = useState({});
  const [awardSpecialtiesByBidId, setAwardSpecialtiesByBidId] = useState({});
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
        setAwardSpecialtiesByBidId(
          nextBids.reduce((result, bid) => ({
            ...result,
            [bid.bid_id]: bid.awarded_specialty_services || [],
          }), {})
        );
        setSelectedBidIds([]);
        setSelectedFoodApplicationIds([]);
        setSelectedEventVendorApplicationIds([]);
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

      const remainingAwards = getRemainingFoodVendorAwards({ event, bids, applications });
      if (prev.length + selectedFoodApplicationIds.length >= remainingAwards) {
        setSnackbar({
          visible: true,
          message: remainingAwards > 0
            ? `You can only award ${remainingAwards} more Food Vendor(s) for this event.`
            : "All available Food Vendor award slots have already been filled.",
        });
        return prev;
      }

      return [...prev, bid.bid_id];
    });
  };

  const handleAward = () => {
    const totalSelections = selectedBidIds.length +
      selectedFoodApplicationIds.length +
      selectedEventVendorApplicationIds.length;
    if (!totalSelections) {
      setSnackbar({ visible: true, message: "Select at least one vendor submission." });
      return;
    }
    const remainingAwards = getRemainingFoodVendorAwards({ event, bids, applications });
    if (selectedBidIds.length + selectedFoodApplicationIds.length > remainingAwards) {
      setSnackbar({
        visible: true,
        message: `You can only award ${remainingAwards} more Food Vendor(s) for this event.`,
      });
      return;
    }
    const selectedBids = bids.filter((bid) => selectedBidIds.includes(bid.bid_id));
    const awardSelections = selectedBids.map((bid) => ({
      bid_id: bid.bid_id,
      award_coverage: awardCoverageByBidId[bid.bid_id] || bid.guest_coverage,
      award_specialty_services: awardSpecialtiesByBidId[bid.bid_id] || [],
    }));
    Alert.alert(
      "Complete Booking",
      "Complete this booking with the selected vendor bid(s) and application(s)?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete Booking",
          onPress: async () => {
            setAwarding(true);
            try {
              const response = await awardMarketplaceBids_API({
                eventId,
                bidIds: selectedBidIds,
                foodApplicationIds: selectedFoodApplicationIds,
                eventVendorApplicationIds: selectedEventVendorApplicationIds,
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
                setSnackbar({ visible: true, message: "Booking completed successfully." });
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
      : [[offeredCoverage, offeredCoverage === "VIP" ? "VIP Catering" : offeredCoverage === "SPECIALTY" ? "Desserts / Drinks Specialty" : "GA / Event Catering"]];

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
            {(item.specialty_services || []).length ? (
              <Text style={styles.meta}>Specialty services: {(item.specialty_services || []).map((value) => value === "DESSERTS" ? "Desserts" : "Drinks").join(" · ")}</Text>
            ) : null}
            {item.dessert_bid_amount != null ? <Text style={styles.meta}>Desserts: {formatMoney(item.dessert_bid_amount)} · {formatMoney(item.dessert_price_per_guest)} per guest</Text> : null}
            {item.drinks_bid_amount != null ? <Text style={styles.meta}>Drinks: {formatMoney(item.drinks_bid_amount)} · {formatMoney(item.drinks_price_per_guest)} per guest</Text> : null}
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
          {selected && (item.specialty_services || []).length ? (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.label}>Award Specialty Services</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {(item.specialty_services || []).map((value) => {
                  const active = (awardSpecialtiesByBidId[item.bid_id] || []).includes(value);
                  const label = value === "DESSERTS" ? "Desserts" : "Drinks";
                  return <TouchableOpacity key={value} style={[styles.chip, active && styles.chipActive]} onPress={() => setAwardSpecialtiesByBidId((current) => {
                    const currentValues = current[item.bid_id] || [];
                    return { ...current, [item.bid_id]: active ? currentValues.filter((itemValue) => itemValue !== value) : [...currentValues, value] };
                  })}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
                  </TouchableOpacity>;
                })}
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
          {["SUBMITTED", "UNDER_REVIEW"].includes(item.bid_status) ? (
            <TouchableOpacity
              style={[styles.secondaryButton, { marginTop: 10, borderColor: "#D93025" }]}
              onPress={() => Alert.alert(
                "Reject Bid",
                "Are you sure you want to reject this bid?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Reject",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await declineMarketplaceBid_API(item.bid_id);
                        await loadData();
                      } catch (error) {
                        setSnackbar({ visible: true, message: error?.message || "Unable to reject vendor bid." });
                      }
                    },
                  },
                ]
              )}
            >
              <Text style={[styles.secondaryButtonText, { color: "#D93025" }]}>Reject Bid</Text>
            </TouchableOpacity>
          ) : null}
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
    const selected = selectedFoodApplicationIds.includes(item.application_id);

    return (
      <TouchableOpacity
        key={item.application_id}
        activeOpacity={0.8}
        style={[
          styles.card,
          withdrawn ? { opacity: 0.75, borderColor: "#D93025" } : null,
          selected ? { borderColor: AppColor.primary, backgroundColor: "#FFF8F1" } : null,
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
            <>
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                {
                  marginTop: 10,
                  borderColor: selected ? AppColor.primary : "#DDE2EA",
                  backgroundColor: selected ? "#FFF1E6" : AppColor.white,
                },
              ]}
              onPress={() => setSelectedFoodApplicationIds((current) => {
                if (current.includes(item.application_id)) {
                  return current.filter((id) => id !== item.application_id);
                }
                const remainingAwards = getRemainingFoodVendorAwards({ event, bids, applications });
                if (selectedBidIds.length + current.length >= remainingAwards) {
                  setSnackbar({
                    visible: true,
                    message: remainingAwards > 0
                      ? `You can only award ${remainingAwards} more Food Vendor(s) for this event.`
                      : "All available Food Vendor award slots have already been filled.",
                  });
                  return current;
                }
                return [...current, item.application_id];
              })}
            >
              <Text style={styles.secondaryButtonText}>
                {selected ? "Selected to Award" : "Award Application"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, { marginTop: 10, borderColor: "#D93025" }]}
              onPress={() => Alert.alert(
                "Reject Application",
                "Are you sure you want to reject this application?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Reject",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await declineMarketplaceApplication_API(item.application_id);
                        await loadData();
                      } catch (error) {
                        setSnackbar({ visible: true, message: error?.message || "Unable to reject vendor application." });
                      }
                    },
                  },
                ]
              )}
            >
              <Text style={[styles.secondaryButtonText, { color: "#D93025" }]}>Reject Application</Text>
            </TouchableOpacity>
            </>
          ) : item.application_status === "PAYMENT_DUE" ? (
            <View style={[styles.secondaryButton, { marginTop: 10, opacity: 0.7 }]}>
              <Text style={styles.secondaryButtonText}>
                Selected to Award · Vendor Payment Pending
              </Text>
            </View>
          ) : null}
        </>
      )}
      <Text style={[styles.secondaryButtonText, { marginTop: 10 }]}>
        Review full application
      </Text>
      </TouchableOpacity>
    );
  };

  const remainingFoodAwards = getRemainingFoodVendorAwards({ event, bids, applications });
  const estimatedAwardCounts = getEstimatedAwardVendorCounts(event);
  const categoryAwards = getCategoryAwardSummary(event, bids, applications);
  const awardLocked = ["CLOSED", "CANCELLED"].includes(event?.status) ||
    (event?.status === "AWARDED" && remainingFoodAwards === 0);

  const toggleEventVendorAward = (application) => {
    setSelectedEventVendorApplicationIds((current) =>
      current.includes(application.application_id)
        ? current.filter((id) => id !== application.application_id)
        : [...current, application.application_id]
    );
  };

  const rejectEventVendor = (application) => Alert.alert(
    "Reject Application",
    "Are you sure you want to reject this application?",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Reject", style: "destructive", onPress: async () => {
        try { await declineEventVendorApplication_API(application.application_id); await loadData(); }
        catch (error) { setSnackbar({ visible: true, message: error?.message || "Unable to reject Marketplace Vendor application." }); }
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
                  Select up to {estimatedAwardCounts.foodVendorCount} Food Vendors and{" "}
                  {estimatedAwardCounts.applicationVendorCount} Application Vendors in this award batch.
                </Text>
                <Text style={styles.meta}>
                  Awards finalize after the marketplace booking payment is confirmed.
                </Text>
                <Text style={styles.meta}>
                  Final submissions: {bids.length + applications.length} total, {applications.length} application(s).
                </Text>
                <Text style={styles.meta}>GA Food Services: {categoryAwards.ga}</Text>
                {categoryAwards.vip ? <Text style={styles.meta}>VIP Catering: {categoryAwards.vip}</Text> : null}
                {categoryAwards.desserts ? <Text style={styles.meta}>Desserts: {categoryAwards.desserts}</Text> : null}
                {categoryAwards.drinks ? <Text style={styles.meta}>Drinks: {categoryAwards.drinks}</Text> : null}
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
                    {eventVendorApplications.map((application) => {
                      const applicationActions = getCoordinatorSubmissionActions(application);
                      const selected = selectedEventVendorApplicationIds.includes(
                        application.application_id
                      );
                      return (
                      <TouchableOpacity
                        key={application.application_id}
                        style={[
                          styles.card,
                          selected ? { borderColor: AppColor.primary, backgroundColor: "#FFF8F1" } : null,
                        ]}
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
                        <Text style={styles.meta}>Photos: {(application.photos || []).length} · Status: {applicationActions.status}</Text>
                        {applicationActions.canAward ? (
                          <>
                          <TouchableOpacity
                            style={[
                              styles.secondaryButton,
                              {
                                marginTop: 10,
                                borderColor: selected ? AppColor.primary : "#DDE2EA",
                                backgroundColor: selected ? "#FFF1E6" : AppColor.white,
                              },
                            ]}
                            onPress={() => toggleEventVendorAward(application)}
                          >
                            <Text style={styles.secondaryButtonText}>
                              {selected ? "Selected to Award" : "Award Application"}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.secondaryButton, { marginTop: 10, borderColor: "#D93025" }]} onPress={() => rejectEventVendor(application)}>
                            <Text style={[styles.secondaryButtonText, { color: "#D93025" }]}>Reject Application</Text>
                          </TouchableOpacity>
                          </>
                        ) : applicationActions.paymentPending ? (
                          <View style={[styles.secondaryButton, { marginTop: 10, opacity: 0.7 }]}>
                            <Text style={styles.secondaryButtonText}>
                              Selected to Award · Vendor Payment Pending
                            </Text>
                          </View>
                        ) : null}
                        <Text style={[styles.secondaryButtonText, { marginTop: 10 }]}>Review full application</Text>
                      </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.button,
                    {
                      backgroundColor: AppColor.text,
                      marginTop: 4,
                      opacity: awarding || !(
                        selectedBidIds.length +
                        selectedFoodApplicationIds.length +
                        selectedEventVendorApplicationIds.length
                      ) || awardLocked ? 0.6 : 1,
                    },
                  ]}
                  disabled={awarding || !(
                    selectedBidIds.length +
                    selectedFoodApplicationIds.length +
                    selectedEventVendorApplicationIds.length
                  ) || awardLocked}
                  onPress={handleAward}
                >
                  {awarding ? (
                    <ActivityIndicator color={AppColor.white} />
                  ) : (
                    <Text style={styles.buttonText}>Complete Booking</Text>
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
