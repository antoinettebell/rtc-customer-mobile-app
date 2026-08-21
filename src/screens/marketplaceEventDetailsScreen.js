import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import AppHeader from "../components/AppHeader";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor } from "../utils/theme";
import {
  getMarketplaceEventById_API,
  getMarketplaceEventQuestions_API,
  getPublicMarketplaceEventById_API,
  updateMarketplaceEvent_API,
  trackPublicMarketplaceTicketClick_API,
  createMarketplaceScannerSession_API,
  closeMarketplaceScanner_API,
  closeMarketplaceTicketSales_API,
  createMarketplaceTicketShareLink_API,
  getMarketplaceTicketSummary_API,
  getMarketplaceTicketInvitation_API,
  createMarketplaceFinalPayment_API,
} from "../apiFolder/appAPI";
import AppImage from "../components/AppImage";
import ImageCarousel from "../components/ImageCarousel";
import {
  isPdfAttachment,
  isTicketPurchaseAvailable,
} from "../helpers/customerPunchList.helper";
import {
  getTicketInventory,
  isTicketInventorySoldOut,
} from "../helpers/marketplaceParticipation.helper";
import { formatMarketplaceStatus } from "../helpers/marketplaceStatus.helper";
import { getMarketplaceAwardedDocuments } from "../helpers/marketplaceAwardedDocuments.helper";
import {
  formatDate,
  formatEventDeadlineDate,
  formatEventTime,
  formatMoney,
  formatPermitList,
  normalizeExternalUrl,
  styles,
  getEventVendorRequirementRows,
} from "./marketplaceShared";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const displayValue = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ") || "Not set";
  }
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }
  if (typeof value === "object") {
    return (
      value.label ||
      value.name ||
      value.title ||
      value.value ||
      JSON.stringify(value)
    );
  }
  return String(value);
};

const DetailRow = ({ label, value, infoMessage = "" }) => (
  <View style={{ marginTop: 12 }}>
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Text style={styles.label}>{label}</Text>
      {infoMessage ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`${label} information`}
          activeOpacity={0.7}
          hitSlop={8}
          style={{ marginLeft: 8 }}
          onPress={() => Alert.alert(label, infoMessage)}
        >
          <MaterialIcons
            name="info-outline"
            size={19}
            color={AppColor.primary}
          />
        </TouchableOpacity>
      ) : null}
    </View>
    <Text style={styles.meta}>{displayValue(value)}</Text>
  </View>
);

const listValue = (value) =>
  Array.isArray(value)
    ? displayValue(value)
    : value
      ? String(value)
      : "Not set";
const boolValue = (value) =>
  value === true ? "Yes" : value === false ? "No" : "Not answered";

const normalizeEventImageUrls = (images) => {
  const list = Array.isArray(images) ? images : images ? [images] : [];
  return list
    .map((image) => {
      if (typeof image === "string") return image;
      return image?.image_url || image?.file_url || image?.url || "";
    })
    .filter(Boolean);
};

const getEventImageUrls = (event) => {
  const candidates = [
    event?.images,
    event?.event_images,
    event?.image_urls,
    event?.attachments,
    event?.image_url,
  ];
  return [...new Set(candidates.flatMap(normalizeEventImageUrls))];
};

const getVendorName = (record) => {
  const foodTruck = record?.food_truck_id;
  const vendor = record?.vendor_user_id;
  if (foodTruck?.name) return foodTruck.name;
  return [vendor?.firstName, vendor?.lastName].filter(Boolean).join(" ") || "Vendor";
};

const isRecordPaymentFulfilled = (record) =>
  ["PAID", "NOT_REQUIRED"].includes(record?.payment_status || "NOT_REQUIRED");

const getAwardAmount = (record, event) =>
  Number(record?.full_bid_amount || record?.final_payment_base_amount || event?.budgeted_amount || 0);

const getEventDurationMinutes = (event) => {
  const safeEvent = event || {};
  const hours = Number(safeEvent.event_duration_hours || 0);
  const minutes = Number(safeEvent.event_duration_minutes || 0);
  if (minutes > 59) return minutes;
  return hours > 0 ? hours * 60 + minutes : minutes;
};

const formatEventDuration = (event) => {
  const totalMinutes = Math.max(0, Number(getEventDurationMinutes(event) || 0));
  if (!totalMinutes) return "Not set";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours} hr${hours === 1 ? "" : "s"}`);
  if (minutes > 0) parts.push(`${minutes} min`);
  return parts.join(" ");
};

const getServiceSpecificRows = (event) => {
  if (!event) return [];
  const primaryStyles = Array.isArray(event.primary_service_style)
    ? event.primary_service_style
    : [event.primary_service_style].filter(Boolean);
  const hasPrimaryStyle = (style) => primaryStyles.includes(style);

  if (hasPrimaryStyle("Plated")) {
    return [
      ["Number of Courses", event.plated_number_of_courses],
      ["Single Entree", event.plated_single_entree ? "Yes" : "No"],
      ["Choice of 2-3 Entrees", event.plated_choice_entrees ? "Yes" : "No"],
      ["Tableside Choice", event.plated_tableside_choice ? "Yes" : "No"],
      [
        "Bread/Salad/Dessert Included",
        event.plated_bread_salad_dessert ? "Yes" : "No",
      ],
    ];
  }

  if (hasPrimaryStyle("Buffet")) {
    return [["Buffet Options", listValue(event.buffet_options)]];
  }

  if (hasPrimaryStyle("Food Truck")) {
    return [["Food Truck Options", listValue(event.food_truck_options)]];
  }

  return [];
};

const safeStyles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  carousel: {
    overflow: "hidden",
    borderRadius: 10,
    marginTop: 14,
    marginBottom: 14,
    backgroundColor: AppColor.white,
    borderWidth: 1,
    borderColor: AppColor.borderColor,
  },
  carouselImage: {
    borderRadius: 10,
    backgroundColor: AppColor.white,
  },
  ticketText: {
    marginTop: 10,
    color: AppColor.textHighlighter,
    lineHeight: 20,
  },
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1E6",
  },
  sectionControls: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  sectionControlButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: AppColor.borderColor,
    borderRadius: 8,
    backgroundColor: AppColor.white,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ticketButton: {
    marginTop: 12,
  },
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.94)",
  },
  imagePreviewHeader: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  imagePreviewActions: {
    flexDirection: "row",
    gap: 10,
  },
  imagePreviewIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  imagePreviewScroll: {
    flex: 1,
  },
  imagePreviewHorizontalContent: {
    flexGrow: 1,
    alignItems: "center",
  },
  imagePreviewScrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePreviewImageContainer: {
    backgroundColor: "transparent",
    borderRadius: 0,
  },
  imagePreviewImage: {
    width: "100%",
    height: "100%",
  },
  imagePreviewFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  imagePreviewTicketButton: {
    height: 54,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: AppColor.primary,
  },
  imagePreviewTicketText: {
    color: AppColor.white,
    fontSize: 16,
    fontWeight: "700",
  },
});

const MarketplaceEventDetailsScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useSelector((state) => state.authReducer);
  const { eventId, shareToken, customerSafe = false, initialEvent = null } = route.params || {};
  const customerView = customerSafe || !!shareToken;
  const [event, setEvent] = useState(initialEvent);
  const [loading, setLoading] = useState(!initialEvent);
  const [questions, setQuestions] = useState([]);
  const [finalPaymentLoadingId, setFinalPaymentLoadingId] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [ticketSummary, setTicketSummary] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    requirements: true,
    budget: true,
    visibility: true,
  });

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const loadQuestions = async () => {
    if (!eventId || customerView) return;
    try {
      const response = await getMarketplaceEventQuestions_API(eventId);
      if (response?.success) {
        setQuestions(response.data?.marketplaceQuestionList || []);
      }
    } catch (error) {
      console.log("Marketplace messages error", error);
    }
  };

  const loadEvent = async () => {
    setLoading(true);
    try {
      const response = shareToken
        ? await getMarketplaceTicketInvitation_API(shareToken)
        : customerSafe
          ? await getPublicMarketplaceEventById_API(eventId)
          : await getMarketplaceEventById_API(eventId);
      if (response?.success) {
        setEvent(response.data?.marketplaceEvent);
      }
      await loadQuestions();
      if (!customerView && eventId) {
        const summaryResponse = await getMarketplaceTicketSummary_API(eventId).catch(() => null);
        setTicketSummary(summaryResponse?.data || null);
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
    }, [eventId, customerSafe, shareToken])
  );

  const imageUrls = getEventImageUrls(event);
  const exemptionCertificateUrl =
    event?.tax_exemption_certificate_url ||
    event?.taxExemptionCertificateUrl ||
    event?.tax_exemption_certificate?.file_url;
  const exemptionCertificateIsPdf = isPdfAttachment({
    file_url: exemptionCertificateUrl,
    mime_type:
      event?.tax_exemption_certificate?.mime_type ||
      event?.tax_exemption_certificate_mime_type,
  });
  const locationText =
    event?.formatted_address ||
    event?.geocoded_address ||
    event?.event_address ||
    "Location not set";
  const cityStateText = [event?.event_city, event?.event_state]
    .filter(Boolean)
    .join(", ");
  const ticketSalesEnabled = !!event?.ticket_sales_enabled;
  const ticketPurchaseAvailable = isTicketPurchaseAvailable(event);
  const ticketInventorySoldOut = isTicketInventorySoldOut(event);
  const ticketUrl = normalizeExternalUrl(event?.ticket_url);
  const showEventVisibility =
    event?.event_visibility === "PUBLIC" && ticketSalesEnabled && !!ticketUrl;
  const eventStatus = event?.status || "DRAFT";
  const isDraft = eventStatus === "DRAFT";
  const isPublished = ["OPEN", "REOPENED"].includes(eventStatus);
  const isClosed = event?.status === "CLOSED";
  const isAwarded = eventStatus === "AWARDED";
  const canEditEvent = isPublished;
  const canViewAwardedDocs =
    isAwarded && ["PAID", "NOT_REQUIRED"].includes(event?.award_payment_status);
  let ticketAvailabilityMessage =
    "Ticket availability details are not available in the app yet.";
  if (ticketPurchaseAvailable) {
    ticketAvailabilityMessage = imageUrls.length
      ? "Tap an event image to preview it, or select Buy Tickets below."
      : "Select Buy Tickets below to choose GA or VIP tickets.";
  } else if (ticketSalesEnabled) {
    ticketAvailabilityMessage = event?.ticket_sales_closed_at
      ? "Ticket sales are closed for this event."
      : ticketInventorySoldOut
        ? "Sorry, this event is sold out."
        : "Tickets are no longer available to purchase.";
  }

  const handleCustomerEventImagePress = async () => {
    if (!ticketSalesEnabled) return;

    if (eventId) {
      try {
        await trackPublicMarketplaceTicketClick_API(eventId);
      } catch (error) {
        console.log("Marketplace ticket click tracking error", error);
      }
    }

    navigation.navigate("marketplaceTicketCheckoutScreen", { event, shareToken });
  };

  const handleBuyTickets = () => {
    navigation.navigate("marketplaceTicketCheckoutScreen", { event, shareToken });
  };

  const handleOpenScanner = async () => {
    try {
      const response = await createMarketplaceScannerSession_API(eventId);
      const scannerUrl = response?.data?.scanner_url;
      if (!scannerUrl) throw new Error("Scanner link unavailable.");
      navigation.navigate("marketplaceTicketWebViewScreen", {
        url: scannerUrl,
        title: `${event?.event_name || "Event"} Check-In`,
      });
    } catch (error) {
      Alert.alert("Ticket Scanner", error?.message || "Scanner opens at 6:00 a.m. on the event day.");
    }
  };

  const handleShareTickets = async () => {
    try {
      const response = await createMarketplaceTicketShareLink_API(event.event_id);
      const url = response?.data?.share_url;
      if (!url) throw new Error("Event link unavailable.");
      const shareSubject = `${event.event_name} - ${formatDate(event.event_date)} @ ${formatEventTime(event.event_time, event)}`;
      const message = `${shareSubject}\nGet Tickets: ${url}`;
      const smsSeparator = Platform.OS === "ios" ? "&" : "?";
      await Linking.openURL(`sms:${smsSeparator}body=${encodeURIComponent(message)}`);
    } catch (error) {
      Alert.alert("Share Event via Text", error?.message || "Unable to open text messages.");
    }
  };

  const handleCloseTicketSales = () => Alert.alert(
    "Close Ticket Sales",
    "Customers will no longer be able to purchase tickets. Ticket scanning remains available until check-in is closed or 24 hours after the event start.",
    [
      { text: "Keep Open", style: "cancel" },
      { text: "Close Sales", style: "destructive", onPress: async () => {
        try {
          const response = await closeMarketplaceTicketSales_API(event.event_id);
          setEvent(response?.data?.marketplaceEvent || event);
        } catch (error) { Alert.alert("Close Ticket Sales", error?.message || "Unable to close ticket sales."); }
      } },
    ]
  );

  const handleCloseCheckIn = () => Alert.alert(
    "Close Ticket Check-In",
    "This permanently stops ticket scanning for this event.",
    [
      { text: "Keep Open", style: "cancel" },
      { text: "Close Check-In", style: "destructive", onPress: async () => {
        try {
          const response = await closeMarketplaceScanner_API(event.event_id);
          setEvent(response?.data?.marketplaceEvent || event);
        } catch (error) { Alert.alert("Close Check-In", error?.message || "Unable to close ticket scanning."); }
      } },
    ]
  );

  const openImagePreview = (image) => {
    const url =
      typeof image === "string"
        ? image
        : image?.image_url || image?.file_url || image?.url || "";
    if (!url) return;
    setPreviewImageUrl(url);
    setPreviewZoom(1);
  };

  const closeImagePreview = () => {
    setPreviewImageUrl(null);
    setPreviewZoom(1);
  };

  const adjustPreviewZoom = (delta) => {
    setPreviewZoom((current) =>
      Math.min(3, Math.max(1, Number((current + delta).toFixed(2))))
    );
  };

  const renderImagePreviewModal = () => {
    const previewHeight = Math.max(
      360,
      screenHeight - Math.max(insets.top, 0) - Math.max(insets.bottom, 0) - 170
    );

    return (
      <Modal
        transparent
        animationType="fade"
        visible={!!previewImageUrl}
        onRequestClose={closeImagePreview}
      >
        <View style={safeStyles.imagePreviewOverlay}>
          <View
            style={[
              safeStyles.imagePreviewHeader,
              { paddingTop: Math.max(insets.top, 16) },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              style={safeStyles.imagePreviewIconButton}
              onPress={closeImagePreview}
            >
              <MaterialIcons name="close" size={24} color={AppColor.white} />
            </TouchableOpacity>
            <View style={safeStyles.imagePreviewActions}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={safeStyles.imagePreviewIconButton}
                onPress={() => adjustPreviewZoom(-0.25)}
                disabled={previewZoom <= 1}
              >
                <MaterialIcons
                  name="zoom-out"
                  size={24}
                  color={
                    previewZoom <= 1
                      ? "rgba(255,255,255,0.35)"
                      : AppColor.white
                  }
                />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                style={safeStyles.imagePreviewIconButton}
                onPress={() => adjustPreviewZoom(0.25)}
                disabled={previewZoom >= 3}
              >
                <MaterialIcons
                  name="zoom-in"
                  size={24}
                  color={
                    previewZoom >= 3
                      ? "rgba(255,255,255,0.35)"
                      : AppColor.white
                  }
                />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            horizontal
            style={safeStyles.imagePreviewScroll}
            contentContainerStyle={safeStyles.imagePreviewHorizontalContent}
          >
            <ScrollView contentContainerStyle={safeStyles.imagePreviewScrollContent}>
              <AppImage
                uri={previewImageUrl}
                resizeMode="contain"
                containerStyle={[
                  safeStyles.imagePreviewImageContainer,
                  {
                    width: screenWidth * previewZoom,
                    height: previewHeight * previewZoom,
                  },
                ]}
                imageStyle={safeStyles.imagePreviewImage}
              />
            </ScrollView>
          </ScrollView>

          {ticketPurchaseAvailable ? (
            <View
              style={[
                safeStyles.imagePreviewFooter,
                { paddingBottom: Math.max(insets.bottom, 18) },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                style={safeStyles.imagePreviewTicketButton}
                onPress={handleCustomerEventImagePress}
              >
                <MaterialIcons
                  name="confirmation-number"
                  size={20}
                  color={AppColor.white}
                />
                <Text style={safeStyles.imagePreviewTicketText}>
                  Buy Tickets
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </Modal>
    );
  };

  const handleSubmitDraft = async () => {
    if (!event) return;
    setLoading(true);
    try {
      const payload = {
        ...event,
        status: "OPEN",
        event_date: event.event_date
          ? new Date(event.event_date).toISOString().slice(0, 10)
          : "",
        service_types:
          event.service_types?.length
            ? event.service_types
            : event.service_type
              ? [event.service_type]
              : [],
        service_styles:
          event.service_styles?.length
            ? event.service_styles
            : event.event_style
              ? [event.event_style]
              : [],
        food_truck_options: Array.isArray(event.food_truck_options)
          ? event.food_truck_options
          : event.food_truck_options
            ? [event.food_truck_options]
            : [],
      };
      const response = await updateMarketplaceEvent_API({ eventId, payload });
      if (response?.success) {
        setEvent(response.data?.marketplaceEvent);
      }
    } catch (error) {
      Alert.alert("Submit Event", error?.message || "Failed to submit event.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditDraft = () => {
    if (!event) return;
    if (!isDraft && !isPublished) return;

    const navigateToEditor = () =>
      navigation.navigate("marketplaceCreateEventScreen", {
        eventId,
        draftEvent: event,
      });

    if (!isDraft) {
      Alert.alert("Edit Event", "Do you want to edit this event?", [
        { text: "No", style: "cancel" },
        { text: "Yes", onPress: navigateToEditor },
      ]);
      return;
    }

    navigateToEditor();
  };

  const openDocument = async (url) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Document", "Unable to open this document.");
    }
  };

  const sectionKeys = ["overview", "requirements", "budget", "visibility"];

  const toggleSection = (key) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setAllSectionsExpanded = (expanded) => {
    setExpandedSections(
      sectionKeys.reduce((next, key) => ({ ...next, [key]: expanded }), {})
    );
  };

  const renderSectionControls = () => (
    <View style={safeStyles.sectionControls}>
      <TouchableOpacity
        activeOpacity={0.7}
        style={safeStyles.sectionControlButton}
        onPress={() => setAllSectionsExpanded(true)}
      >
        <Text style={styles.secondaryButtonText}>Expand All</Text>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.7}
        style={safeStyles.sectionControlButton}
        onPress={() => setAllSectionsExpanded(false)}
      >
        <Text style={styles.secondaryButtonText}>Collapse All</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCollapsibleSection = (key, title, children) => (
    <View style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.7}
        style={safeStyles.sectionHeaderRow}
        onPress={() => toggleSection(key)}
      >
        <Text style={styles.title}>{title}</Text>
        <MaterialIcons
          name={expandedSections[key] ? "expand-less" : "expand-more"}
          size={24}
          color={AppColor.primary}
        />
      </TouchableOpacity>
      {expandedSections[key] ? children : null}
    </View>
  );

  const renderMessagesEntry = () => {
    const unreadCount = questions.filter((question) => question.unread).length;
    return (
      <TouchableOpacity
        activeOpacity={0.75}
        style={styles.card}
        onPress={() =>
          navigation.navigate("marketplaceEventMessagesScreen", { eventId })
        }
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={styles.title}>Messages</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount ? `${unreadCount} UNREAD` : "READ"}
            </Text>
          </View>
        </View>
        <Text style={styles.meta}>
          {questions.length
            ? "Open event messages and vendor questions."
            : "No messages yet."}
        </Text>
      </TouchableOpacity>
    );
  };

	  const renderAwardedDocuments = () => {
	    if (!canViewAwardedDocs) return null;

    const awardedRecords = [
      ...(event?.awarded_bids || []),
      ...(event?.awarded_applications || []),
    ].filter(isRecordPaymentFulfilled);

    if (!awardedRecords.length) {
      return (
        <View style={styles.card}>
          <Text style={styles.title}>Awarded Vendor Documents</Text>
          <Text style={styles.emptyText}>No vendor documents are available yet.</Text>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <Text style={styles.title}>Awarded Vendor Documents</Text>
        <Text style={styles.meta}>
          Download signed agreements, permits, licenses, menus, and vendor files.
        </Text>
	        {awardedRecords.map((record, index) => {
	          const documents = getMarketplaceAwardedDocuments(record);
	          const key =
	            record.bid_id || record.application_id || `${record.event_id}-${index}`;
	          const finalPaymentStatus = record.final_payment_status || "NOT_STARTED";
	          const awardAmount = getAwardAmount(record, event);
	          const paymentActionId = record.bid_id || record.application_id;
	          const paymentAvailableAt = event?.final_payment_timing?.available_at
	            ? new Date(event.final_payment_timing.available_at).getTime()
	            : null;
	          const eventHasStarted =
	            Number.isFinite(paymentAvailableAt) && currentTime >= paymentAvailableAt;
	          const openFinalPayment = async () => {
	            setFinalPaymentLoadingId(paymentActionId);
	            try {
	              let paymentId = record.final_payment_id;
	              let payment = null;
	              if (!paymentId) {
	                const response = await createMarketplaceFinalPayment_API({
	                  eventId,
	                  bidId: record.bid_id,
	                });
	                payment = response?.data?.marketplacePayment;
	                paymentId = payment?.payment_id;
	              }
	              if (!paymentId) throw new Error("Final payment was not created.");
	              navigation.navigate("marketplacePaymentScreen", {
	                payment,
	                paymentId,
	                returnScreen: "marketplaceEventDetailsScreen",
	                returnParams: { eventId },
	              });
	            } catch (error) {
	              Alert.alert(
	                "Event Payment",
	                error?.message || "Unable to open final event payment.",
	              );
	            } finally {
	              setFinalPaymentLoadingId(null);
	            }
	          };
	          return (
	            <View key={key} style={{ marginTop: 14 }}>
	              <Text style={styles.label}>{getVendorName(record)}</Text>
	              <Text style={styles.meta}>
	                Award Amount: {formatMoney(awardAmount)}
	              </Text>
	              <Text style={styles.meta}>
	                Final Payment: {formatMarketplaceStatus(finalPaymentStatus, { coordinatorPaid: true })}
	              </Text>
	              {documents.length ? (
	                documents.map((document) => (
	                  <TouchableOpacity
                    key={`${key}-${document.label}-${document.url}`}
                    activeOpacity={0.7}
                    onPress={() => openDocument(document.url)}
                    style={{ marginTop: 6 }}
                  >
                    <Text style={styles.secondaryButtonText}>{document.label}</Text>
                  </TouchableOpacity>
                ))
	              ) : (
	                <Text style={styles.meta}>Documents: Not available</Text>
	              )}
	              {finalPaymentStatus === "PAID" ? (
	                <Text style={[styles.meta, { marginTop: 8 }]}>
	                  Final payment has been completed for this award.
	                </Text>
	              ) : record.bid_id ? (
	                <TouchableOpacity
	                  activeOpacity={0.7}
	                  onPress={openFinalPayment}
	                  disabled={!!finalPaymentLoadingId || !eventHasStarted}
	                  style={[
	                    styles.button,
	                    { marginTop: 10, opacity: eventHasStarted ? 1 : 0.5 },
	                  ]}
	                >
	                  {finalPaymentLoadingId === paymentActionId ? (
	                    <ActivityIndicator color={AppColor.white} />
	                  ) : (
	                    <Text style={styles.buttonText}>
	                      {record.final_payment_id
	                        ? "Checkout Payment"
	                        : "Checkout Payment"}
	                    </Text>
	                  )}
	                </TouchableOpacity>
	              ) : null}
	            </View>
	          );
	        })}
      </View>
    );
  };

  const renderCoordinatorActions = () => {
    if (isDraft) {
      return (
        <View style={{ gap: 12 }}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.secondaryButton}
            onPress={handleEditDraft}
          >
            <Text style={styles.secondaryButtonText}>Edit Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.button}
            onPress={handleSubmitDraft}
          >
            <Text style={styles.buttonText}>Submit Event</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (isPublished || isClosed) {
      return (
        <View style={{ gap: 12 }}>
          {ticketSalesEnabled ? (
            <>
              {!event?.ticket_scanning_closed_at ? (
                <>
                  <TouchableOpacity activeOpacity={0.7} style={styles.button} onPress={handleOpenScanner}>
                    <Text style={styles.buttonText}>Scan Event Tickets</Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.7} style={styles.secondaryButton} onPress={handleCloseCheckIn}>
                    <Text style={styles.secondaryButtonText}>Close Ticket Check-In</Text>
                  </TouchableOpacity>
                </>
              ) : null}
              {!event?.ticket_sales_closed_at && eventStatus !== "CANCELLED" ? (
                <>
                  <TouchableOpacity activeOpacity={0.7} style={styles.secondaryButton} onPress={handleShareTickets}>
                    <Text style={styles.secondaryButtonText}>Share Event via Text</Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.7} style={styles.secondaryButton} onPress={handleCloseTicketSales}>
                    <Text style={styles.secondaryButtonText}>Close Ticket Sales</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </>
          ) : null}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.button}
            onPress={() =>
              navigation.navigate("marketplaceAwardBidsScreen", { eventId })
            }
          >
            <Text style={styles.buttonText}>View Bids / Award Vendors</Text>
          </TouchableOpacity>
        </View>
      );
    }

	    if (isAwarded) {
      return (
        <View style={{ gap: 12 }}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.button}
            onPress={() => navigation.navigate("marketplaceAwardBidsScreen", { eventId })}
          >
            <Text style={styles.buttonText}>Manage Awarded Vendors</Text>
          </TouchableOpacity>
          {ticketSalesEnabled && !event?.ticket_scanning_closed_at ? (
            <>
              <TouchableOpacity activeOpacity={0.7} style={styles.button} onPress={handleOpenScanner}>
                <Text style={styles.buttonText}>Scan Event Tickets</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} style={styles.secondaryButton} onPress={handleCloseCheckIn}>
                <Text style={styles.secondaryButtonText}>Close Ticket Check-In</Text>
              </TouchableOpacity>
            </>
          ) : null}
          {ticketPurchaseAvailable ? (
            <>
              <TouchableOpacity activeOpacity={0.7} style={styles.secondaryButton} onPress={handleShareTickets}>
                <Text style={styles.secondaryButtonText}>Share Event via Text</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} style={styles.secondaryButton} onPress={handleCloseTicketSales}>
                <Text style={styles.secondaryButtonText}>Close Ticket Sales</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      );
    }

    return null;
  };

  if (customerView) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBarManager />
        <AppHeader headerTitle="Event Details" />
        {loading ? (
          <View style={safeStyles.loadingWrap}>
            <ActivityIndicator color={AppColor.primary} size="large" />
          </View>
        ) : !event ? (
          <View style={safeStyles.loadingWrap}>
            <Text style={styles.subtitle}>Event details are unavailable.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.body}>
            <View style={styles.card}>
              {imageUrls.length > 0 && (
                <ImageCarousel
                  images={imageUrls}
                  containerHeight={320}
                  containerStyle={safeStyles.carousel}
                  imageContainer={safeStyles.carouselImage}
                  imageResizeMode="contain"
                  onImagePress={openImagePreview}
                />
              )}

              <Text style={styles.title}>Ticket Availability</Text>
              <Text style={safeStyles.ticketText}>
                {ticketAvailabilityMessage}
              </Text>
              {ticketPurchaseAvailable ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.button, safeStyles.ticketButton]}
                  onPress={handleBuyTickets}
                >
                  <Text style={styles.buttonText}>Buy Tickets</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.card}>
              <Text style={styles.title}>{event?.event_name || "Event"}</Text>
              {!!event?.event_description && (
                <Text style={styles.subtitle}>{event.event_description}</Text>
              )}

              <DetailRow label="Date" value={formatDate(event?.event_date)} />
              <DetailRow
                label="Time"
                value={formatEventTime(event?.event_time, event)}
              />
              <DetailRow
                label="Duration"
                value={formatEventDuration(event)}
              />
              <DetailRow label="Location" value={locationText} />
              <DetailRow label="City / State" value={cityStateText} />
              <DetailRow
                label="Primary Service Style"
                value={event?.primary_service_style || listValue(event?.service_styles)}
              />
              <DetailRow
                label="Alcohol Service"
                value={event?.alcohol_required ? "Yes" : "No"}
              />
            </View>
          </ScrollView>
        )}
        {renderImagePreviewModal()}
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />
      <AppHeader headerTitle="Event Details" rightSide={canEditEvent}>
        {canEditEvent ? (
          <TouchableOpacity
            activeOpacity={0.7}
            style={safeStyles.headerAction}
            onPress={handleEditDraft}
          >
            <MaterialIcons name="edit" size={20} color={AppColor.primary} />
          </TouchableOpacity>
        ) : null}
      </AppHeader>
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={AppColor.primary} size="large" />
        </View>
      ) : !event ? (
        <View style={safeStyles.loadingWrap}>
          <Text style={styles.subtitle}>Event details are unavailable.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.card}>
            <Text style={styles.title}>
              Event Activity · {String(event?.event_id || "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase()}
            </Text>
            <Text style={styles.label}>Views: {event?.marketplace_metrics?.views ?? event?.event_impression_count ?? 0}</Text>
            <Text style={styles.label}>Ticket Checkout Clicks: {event?.marketplace_metrics?.ticket_checkout_clicks ?? event?.ticket_click_count ?? 0}</Text>
            <Text style={styles.label}>Tickets Sold: {event?.marketplace_metrics?.tickets_sold ?? 0}</Text>
            <Text style={styles.label}>VIP Vendors Selected: {event?.marketplace_metrics?.vip_vendors_selected ?? 0}</Text>
            <Text style={styles.label}>Vendor GA Slots Filled: {event?.marketplace_metrics?.vendor_ga_slots_filled ?? 0}</Text>
            {getEventVendorRequirementRows(event).map((requirement) => (
              <Text key={requirement.vendorType} style={styles.label}>
                {requirement.vendorType}: {requirement.requested} requested · {requirement.filled} filled · {requirement.remaining} remaining
              </Text>
            ))}
          </View>
          {renderMessagesEntry()}
          {renderSectionControls()}
          {renderCollapsibleSection("overview", "Event Details", (
            <>
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
	            <DetailRow
	              label="Time"
	              value={formatEventTime(event?.event_time, event)}
	            />
	            <DetailRow
	              label="Duration"
	              value={formatEventDuration(event)}
	            />
            <DetailRow
              label="Close Date"
              value={formatEventDeadlineDate(event?.event_close_date, event)}
              infoMessage="All applications and awards must be accepted by this date."
            />
            <DetailRow
              label="Close Time"
              value={formatEventTime(event?.event_close_time, {
                ...event,
                event_date: event?.event_close_date || event?.event_date,
              })}
            />
            <DetailRow
              label="Location"
              value={`${event?.event_address || ""}, ${event?.event_city || ""}, ${event?.event_state || ""} ${event?.event_zip || ""}`}
            />
            </>
          ))}

          {renderCollapsibleSection("requirements", "Event Requirements", (
            <>
            <DetailRow label="Event Type" value={event?.event_type} />
            <DetailRow label="Event Style" value={event?.event_style} />
            <DetailRow label="Service Type" value={event?.service_type} />
            <DetailRow label="Service Types" value={listValue(event?.service_types)} />
            <DetailRow label="Service Styles" value={listValue(event?.service_styles)} />
            <DetailRow label="Primary Service Style" value={event?.primary_service_style} />
            {getServiceSpecificRows(event).map(([label, value]) => (
              <DetailRow key={label} label={label} value={String(value || "Not set")} />
            ))}
            <DetailRow label="Expected GA Guests" value={String(event?.number_of_guests || 0)} />
            <DetailRow label="Expected VIP Guests" value={String(event?.vip_section_enabled ? event?.vip_guest_count || 0 : 0)} />
            <DetailRow label="VIP Section Details" value={event?.vip_section_details || "Not set"} />
            {ticketSalesEnabled ? (
              <>
                <DetailRow label="GA Ticket Capacity" value={String(getTicketInventory(event, "ga").capacity)} />
                <DetailRow label="GA Tickets Sold" value={String(getTicketInventory(event, "ga").sold)} />
                <DetailRow label="GA Tickets Remaining" value={String(getTicketInventory(event, "ga").remaining)} />
                <DetailRow label="VIP Ticket Capacity" value={String(getTicketInventory(event, "vip").capacity)} />
                <DetailRow label="VIP Tickets Sold" value={String(getTicketInventory(event, "vip").sold)} />
                <DetailRow label="VIP Tickets Remaining" value={String(getTicketInventory(event, "vip").remaining)} />
              </>
            ) : null}
            <DetailRow
              label="Vendors Needed"
              value={String(event?.number_of_vendors_needed || 0)}
            />
            <DetailRow label="Power" value={listValue(event?.power_required)} />
            <DetailRow label="Permits" value={formatPermitList(event?.permits_required)} />
            <DetailRow
              label="Insurance Required"
              value={event?.insurance_required ? "Yes" : "No"}
            />
            <DetailRow
              label="Alcohol Required"
              value={event?.alcohol_required ? "Yes" : "No"}
            />
            <DetailRow
              label="Free Food Offered"
              value={boolValue(event?.free_food_offered)}
            />
            {event?.free_food_offered === true ? (
              <>
                <DetailRow
                  label="Free Food Provider"
                  value={event?.free_food_provider || "Not set"}
                />
                <DetailRow
                  label="Vendors Must Give Away Food"
                  value={boolValue(event?.vendors_required_to_giveaway_food)}
                />
              </>
            ) : null}
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
            </>
          ))}

          {renderCollapsibleSection("budget", "Budget", (
            <>
            <DetailRow label="Vendor Fee" value={formatMoney(event?.vendor_fee)} />
            <DetailRow label="Who Pays" value={event?.payment_responsibility || "Not set"} />
            <DetailRow
              label="Budgeted Amount"
              value={formatMoney(event?.budgeted_amount)}
            />
            {ticketSalesEnabled && ticketSummary?.summary ? (
              <>
                <DetailRow label="Tickets Sold" value={String(ticketSummary.summary.tickets || 0)} />
                <DetailRow label="Gross Ticket Sales" value={formatMoney(ticketSummary.summary.gross_ticket_sales)} />
                <DetailRow label="Collected Sales Tax" value={formatMoney(ticketSummary.summary.collected_sales_tax)} />
                <DetailRow label="Estimated Ticket Proceeds" value={formatMoney(ticketSummary.summary.estimated_net_payout)} />
                <Text style={[styles.meta, { marginTop: 12 }]}>{ticketSummary.payout_notice}</Text>
              </>
            ) : null}
            <DetailRow
              label="Catered VIP Section"
              value={event?.catered_vip_section_enabled ? "Yes" : "No"}
            />
            <DetailRow
              label="Fully Catered Event"
              value={event?.fully_catered_event ? "Yes" : "No"}
            />
            <DetailRow
              label="GA Food Sales Allowed"
              value={event?.ga_food_sales_allowed ? "Yes" : "No"}
            />
            {event?.ga_food_sales_allowed ? (
              <DetailRow
                label="Combined Award Vendor Fee"
                value={event?.waive_vendor_fee_for_combined_award ? "Waived" : "Required"}
              />
            ) : null}
            {event?.vendor_fee_payment_deadline ? (
              <DetailRow
                label="Last Date to Accept Payments"
                value={formatDate(event.vendor_fee_payment_deadline)}
              />
            ) : null}
            <DetailRow
              label="# of VIP Guests"
              value={String(event?.vip_guest_count || 0)}
            />
            {event?.catered_vip_section_enabled ? (
              <DetailRow
                label="Additional VIP Catering Service Slot"
                value={event?.separate_vip_vendor_required ? "Yes" : "No"}
              />
            ) : null}
            {event?.close_comment ? (
              <DetailRow label="Close Comment" value={event.close_comment} />
            ) : null}
            <DetailRow
              label="Final Submissions"
              value={String(event?.submission_count ?? event?.final_submission_count ?? 0)}
            />
            <DetailRow label="Applications" value={String(event?.application_count ?? 0)} />
            <DetailRow
              label="Reopen Round"
              value={String(event?.current_submission_round || 1)}
            />
	            <DetailRow
	              label="Awarded Vendor Payment"
	              value={formatMarketplaceStatus(event?.final_payment_status, {
                  coordinatorPaid: ["COORDINATOR", "BOTH"].includes(event?.payment_responsibility),
                })}
	            />
	            {event?.agreement_status && event.agreement_status !== "NOT_REQUIRED" ? (
	              <DetailRow
	                label="Agreement"
	                value={event.agreement_status}
	              />
	            ) : null}
            </>
          ))}

          {exemptionCertificateUrl ? (
            <View style={styles.card}>
              <Text style={styles.label}>Sales Tax Exemption Certificate</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.secondaryButton}
                onPress={() =>
                  exemptionCertificateIsPdf
                    ? navigation.navigate("marketplaceTicketWebViewScreen", {
                        url: exemptionCertificateUrl,
                        title: "Sales Tax Exemption Certificate",
                      })
                    : openImagePreview(exemptionCertificateUrl)
                }
              >
                <Text style={styles.secondaryButtonText}>Open Certificate</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {showEventVisibility
            ? renderCollapsibleSection("visibility", "Event Visibility", (
                <>
                  {imageUrls.length > 0 ? (
                    <ImageCarousel
                      images={imageUrls}
                      containerHeight={320}
                      containerStyle={safeStyles.carousel}
                      imageContainer={safeStyles.carouselImage}
                      imageResizeMode="contain"
                      onImagePress={openImagePreview}
                    />
                  ) : null}
                  <DetailRow
                    label="Event Views"
                    value={String(event?.event_impression_count || 0)}
                  />
                  <DetailRow
                    label="Ticket Clicks"
                    value={String(event?.ticket_click_count || 0)}
                  />
                </>
              ))
            : null}

          {renderAwardedDocuments()}
          {renderCoordinatorActions()}

        </ScrollView>
      )}
      {renderImagePreviewModal()}
    </View>
  );
};

export default MarketplaceEventDetailsScreen;
