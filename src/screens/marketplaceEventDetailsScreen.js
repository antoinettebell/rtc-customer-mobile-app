import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Modal,
  StyleSheet,
  ScrollView,
  Share,
  Text,
  TextInput,
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
  closeMarketplaceEvent_API,
  updateMarketplaceEvent_API,
  trackPublicMarketplaceTicketClick_API,
  createMarketplaceScannerSession_API,
  closeMarketplaceScanner_API,
  closeMarketplaceTicketSales_API,
  createMarketplaceTicketShareLink_API,
  getMarketplaceTicketSummary_API,
  cancelMarketplaceTicketedEvent_API,
  getMarketplaceTicketInvitation_API,
  createMarketplaceFinalPayment_API,
} from "../apiFolder/appAPI";
import AppImage from "../components/AppImage";
import ImageCarousel from "../components/ImageCarousel";
import { showGuestSignupRequired } from "../helpers/guestAction.helper";
import {
  formatDate,
  formatEventTime,
  formatMoney,
  formatPermitList,
  normalizeExternalUrl,
  styles,
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

const DetailRow = ({ label, value }) => (
  <View style={{ marginTop: 12 }}>
    <Text style={styles.label}>{label}</Text>
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

const getRecordDocuments = (record) => [
  ...(record?.menu_pdf_url ? [{ label: "Menu PDF", url: record.menu_pdf_url }] : []),
  ...(record?.agreement_document_url
    ? [{ label: "Agreement Document", url: record.agreement_document_url }]
    : []),
  ...(record?.signed_document_url
    ? [{ label: "Signed Document", url: record.signed_document_url }]
    : []),
  ...(record?.permit_license_urls || []).map((url, index) => ({
    label: `Business License/Permit ${index + 1}`,
    url,
  })),
  ...(record?.attachments || [])
    .filter((attachment) => attachment.file_url || attachment.url)
    .map((attachment, index) => ({
      label:
        attachment.original_name ||
        attachment.attachment_type ||
        `Document ${index + 1}`,
      url: attachment.file_url || attachment.url,
    })),
];

const isRecordPaymentFulfilled = (record) =>
  ["PAID", "NOT_REQUIRED"].includes(record?.payment_status || "NOT_REQUIRED");

const getAwardAmount = (record, event) =>
  Number(record?.full_bid_amount || record?.final_payment_base_amount || event?.budgeted_amount || 0);

const hasEventDatePassed = (eventDate) => {
  if (!eventDate) return false;
  const date = new Date(eventDate);
  if (Number.isNaN(date.getTime())) return false;
  date.setHours(23, 59, 59, 999);
  return date < new Date();
};

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
  dangerButton: {
    borderColor: AppColor.snackbarError,
  },
  dangerButtonText: {
    color: AppColor.snackbarError,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: AppColor.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 18,
  },
  closeCommentInput: {
    minHeight: 140,
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: AppColor.borderColor,
    borderRadius: 10,
    color: AppColor.text,
    textAlignVertical: "top",
  },
  characterCount: {
    marginTop: 6,
    textAlign: "right",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  modalActionButton: {
    flex: 1,
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
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [closeModalVisible, setCloseModalVisible] = useState(false);
  const [closeComment, setCloseComment] = useState("");
  const [closingEvent, setClosingEvent] = useState(false);
  const [finalPaymentLoadingId, setFinalPaymentLoadingId] = useState(null);
  const [ticketSummary, setTicketSummary] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    requirements: true,
    budget: true,
    visibility: true,
  });

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
  const locationText =
    event?.formatted_address ||
    event?.geocoded_address ||
    event?.event_address ||
    "Location not set";
  const cityStateText = [event?.event_city, event?.event_state]
    .filter(Boolean)
    .join(", ");
  const ticketSalesEnabled = !!event?.ticket_sales_enabled;
  const ticketUrl = normalizeExternalUrl(event?.ticket_url);
  const showEventVisibility =
    event?.event_visibility === "PUBLIC" && ticketSalesEnabled && !!ticketUrl;
  const eventStatus = event?.status || "DRAFT";
  const isDraft = eventStatus === "DRAFT";
  const isPublished = ["OPEN", "REOPENED"].includes(eventStatus);
  const isClosed = event?.status === "CLOSED";
  const isArchivedClosed = isClosed && !!event?.archived_at;
  const isAwarded = eventStatus === "AWARDED";
  const canEditEvent = isPublished;
  const submissionCount = Number(
    event?.submission_count ?? event?.final_submission_count ?? 0
  );
  const hasAwardedRecords =
    (event?.awarded_bids || []).length > 0 ||
    (event?.awarded_applications || []).length > 0 ||
    isAwarded;
  const hasSubmissionsWithoutAwards = submissionCount > 0 && !hasAwardedRecords;
  const canViewAwardedDocs =
    isAwarded && ["PAID", "NOT_REQUIRED"].includes(event?.award_payment_status);
  let ticketAvailabilityMessage =
    "Ticket availability details are not available in the app yet.";
  if (ticketSalesEnabled && !event?.ticket_sales_closed_at) {
    ticketAvailabilityMessage = imageUrls.length
      ? "Tap an event image to preview it, or select Buy Tickets below."
      : "Select Buy Tickets below to choose GA or VIP tickets.";
  } else if (ticketSalesEnabled) {
    ticketAvailabilityMessage = "Ticket sales are closed for this event.";
  }

  const handleCustomerEventImagePress = async () => {
    if (!ticketSalesEnabled) return;

    if (!isSignedIn) {
      showGuestSignupRequired(navigation);
      return;
    }

    try {
      await trackPublicMarketplaceTicketClick_API(eventId);
    } catch (error) {
      console.log("Marketplace ticket click tracking error", error);
    }

    navigation.navigate("marketplaceTicketCheckoutScreen", { event });
  };

  const handleBuyTickets = () => {
    if (!isSignedIn) {
      showGuestSignupRequired(navigation);
      return;
    }
    navigation.navigate("marketplaceTicketCheckoutScreen", { event });
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
      if (!url) throw new Error("Invitation link unavailable.");
      await Share.share({
        title: event.event_name,
        message: `You're invited to ${event.event_name}. Create or sign in to your Round Da' Corner customer profile, then purchase tickets: ${url}`,
        url,
      });
    } catch (error) {
      Alert.alert("Share Tickets", error?.message || "Unable to create the ticket invitation.");
    }
  };

  const handleCloseTicketSales = () => Alert.alert(
    "Close Ticket Sales",
    "Customers will no longer be able to purchase tickets. Ticket scanning will remain available until you close check-in.",
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

  const handleCancelTicketedEvent = () => Alert.alert(
    "Cancel Event",
    "Refunds are due immediately upon cancellation. All ticket buyers will be notified by text and email. Events must be cancelled at least 72 hours before they begin.",
    [
      { text: "Do Not Cancel", style: "cancel" },
      { text: "Cancel & Refund", style: "destructive", onPress: async () => {
        try {
          const response = await cancelMarketplaceTicketedEvent_API(event.event_id);
          setEvent(response?.data?.marketplaceEvent || event);
          Alert.alert("Event Cancelled", `${response?.data?.refunded_count || 0} refunds issued. ${response?.data?.failed_count || 0} require manual review.`);
        } catch (error) { Alert.alert("Cancel Event", error?.message || "Unable to cancel the event."); }
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

          {ticketSalesEnabled && !event?.ticket_sales_closed_at ? (
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

  const handleReopenEvent = () => {
    if (!event) return;
    const eventDatePassed = hasEventDatePassed(event.event_date);

    Alert.alert(
      "Reopen Bidding",
      eventDatePassed
        ? "Update the event dates before reopening bidding. Previous submissions will be archived and remain visible for comparison."
        : "This will move you to the event editor. When you submit, previous submissions will be archived and remain visible for comparison.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reopen & Edit",
          onPress: () => {
            navigation.navigate("marketplaceCreateEventScreen", {
              eventId,
              draftEvent: {
                ...event,
                status: "OPEN",
                event_date: eventDatePassed ? "" : event.event_date,
                event_close_date: eventDatePassed ? "" : event.event_close_date,
                event_close_time: eventDatePassed ? "" : event.event_close_time,
              },
              reopenMode: true,
            });
          },
        },
      ]
    );
  };

  const handleCloseEventContinue = () => {
    const trimmedComment = closeComment.trim();
    if (!trimmedComment) {
      Alert.alert("Close Event", "Please enter a comment before closing this event.");
      return;
    }

    Alert.alert(
      "Close Event",
      hasSubmissionsWithoutAwards
        ? "This event has vendor submissions, but no award has been made. Closing will archive the event and it cannot be reopened. Do you want to continue?"
        : "Are you sure you want to close and archive this event? This cannot be reopened.",
      [
        {
          text: "Yes",
          onPress: async () => {
            setClosingEvent(true);
            try {
              const response = await closeMarketplaceEvent_API({
                eventId,
                closeComment: trimmedComment,
              });
              if (response?.success) {
                setEvent(response.data?.marketplaceEvent);
                setCloseModalVisible(false);
                setCloseComment("");
              }
            } catch (error) {
              Alert.alert("Close Event", error?.message || "Failed to close event.");
            } finally {
              setClosingEvent(false);
            }
          },
        },
        {
          text: "No",
          style: "cancel",
          onPress: () => setCloseModalVisible(false),
        },
      ]
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
	          const documents = getRecordDocuments(record);
	          const key =
	            record.bid_id || record.application_id || `${record.event_id}-${index}`;
	          const finalPaymentStatus = record.final_payment_status || "NOT_STARTED";
	          const awardAmount = getAwardAmount(record, event);
	          const paymentActionId = record.bid_id || record.application_id;
	          const eventEndAt = event?.final_payment_timing?.event_end_at
	            ? new Date(event.final_payment_timing.event_end_at).getTime()
	            : null;
	          const eventHasEnded =
	            Number.isFinite(eventEndAt) && Date.now() >= eventEndAt;
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
	                Final Payment: {finalPaymentStatus}
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
	                  disabled={!!finalPaymentLoadingId || !eventHasEnded}
	                  style={[
	                    styles.button,
	                    { marginTop: 10, opacity: eventHasEnded ? 1 : 0.5 },
	                  ]}
	                >
	                  {finalPaymentLoadingId === paymentActionId ? (
	                    <ActivityIndicator color={AppColor.white} />
	                  ) : (
	                    <Text style={styles.buttonText}>
	                      {record.final_payment_id
	                        ? "Checkout Payment"
	                        : "Close Event for Payment"}
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
                    <Text style={styles.secondaryButtonText}>Share Ticket Invitation</Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.7} style={styles.secondaryButton} onPress={handleCloseTicketSales}>
                    <Text style={styles.secondaryButtonText}>Close Ticket Sales</Text>
                  </TouchableOpacity>
                </>
              ) : null}
              {eventStatus !== "CANCELLED" ? (
                <TouchableOpacity activeOpacity={0.7} style={[styles.secondaryButton, safeStyles.dangerButton]} onPress={handleCancelTicketedEvent}>
                  <Text style={[styles.secondaryButtonText, safeStyles.dangerButtonText]}>Cancel Event & Refund Tickets</Text>
                </TouchableOpacity>
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
          {isPublished ? (
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.secondaryButton, safeStyles.dangerButton]}
              onPress={() => setCloseModalVisible(true)}
            >
              <Text style={[styles.secondaryButtonText, safeStyles.dangerButtonText]}>
                Close Event
              </Text>
            </TouchableOpacity>
          ) : null}
          {isClosed && !isArchivedClosed ? (
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.secondaryButton, styles.mutedButton]}
              onPress={handleReopenEvent}
              disabled={(event?.reopen_count || 0) >= 2}
            >
              <Text style={[styles.secondaryButtonText, styles.mutedButtonText]}>
                {(event?.reopen_count || 0) >= 2
                  ? "Reopen Limit Reached"
                  : "Reopen Bidding"}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      );
    }

	    if (isAwarded && ticketSalesEnabled) {
      return (
        <View style={{ gap: 12 }}>
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
          {!event?.ticket_sales_closed_at ? (
            <>
              <TouchableOpacity activeOpacity={0.7} style={styles.secondaryButton} onPress={handleShareTickets}>
                <Text style={styles.secondaryButtonText}>Share Ticket Invitation</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} style={styles.secondaryButton} onPress={handleCloseTicketSales}>
                <Text style={styles.secondaryButtonText}>Close Ticket Sales</Text>
              </TouchableOpacity>
            </>
          ) : null}
          {eventStatus !== "CANCELLED" ? (
            <TouchableOpacity activeOpacity={0.7} style={[styles.secondaryButton, safeStyles.dangerButton]} onPress={handleCancelTicketedEvent}>
              <Text style={[styles.secondaryButtonText, safeStyles.dangerButtonText]}>Cancel Event & Refund Tickets</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      );
    }

	    if (isAwarded) return null;

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
              {ticketSalesEnabled && !event?.ticket_sales_closed_at ? (
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
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
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
            <DetailRow label="Guests" value={String(event?.number_of_guests || 0)} />
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
                <DetailRow label="RTC Ticket Fee (1.5% + $1/ticket)" value={formatMoney(ticketSummary.summary.rtc_processing_fee)} />
                <DetailRow label="Collected Sales Tax" value={formatMoney(ticketSummary.summary.collected_sales_tax)} />
                <DetailRow label="Estimated Net Payout" value={formatMoney(ticketSummary.summary.estimated_net_payout)} />
                <Text style={[styles.meta, { marginTop: 12 }]}>{ticketSummary.payout_notice}</Text>
              </>
            ) : null}
            <DetailRow
              label="Catered VIP Section"
              value={event?.catered_vip_section_enabled ? "Yes" : "No"}
            />
            {event?.catered_vip_section_enabled ? (
              <DetailRow
                label="# of VIP Guests"
                value={String(event?.vip_guest_count || 0)}
              />
            ) : null}
            <DetailRow label="Close Date" value={formatDate(event?.event_close_date)} />
            <DetailRow
              label="Close Time"
              value={formatEventTime(event?.event_close_time, {
                ...event,
                event_date: event?.event_close_date || event?.event_date,
              })}
            />
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
	              value={event?.final_payment_status || "NOT_REQUIRED"}
	            />
	            {event?.agreement_status && event.agreement_status !== "NOT_REQUIRED" ? (
	              <DetailRow
	                label="Agreement"
	                value={event.agreement_status}
	              />
	            ) : null}
            </>
          ))}

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
      <Modal
        transparent
        animationType="fade"
        visible={closeModalVisible}
        onRequestClose={() => setCloseModalVisible(false)}
      >
        <View style={safeStyles.modalOverlay}>
          <View style={[safeStyles.modalSheet, { paddingBottom: Math.max(insets.bottom, 18) }]}>
            <Text style={styles.title}>Close Event</Text>
            <Text style={styles.meta}>
              Add a closing comment before archiving this event.
            </Text>
            <TextInput
              value={closeComment}
              onChangeText={(value) => setCloseComment(value.slice(0, 1000))}
              placeholder="Enter closing comment"
              placeholderTextColor={AppColor.textPlaceholder}
              multiline
              maxLength={1000}
              editable={!closingEvent}
              style={safeStyles.closeCommentInput}
            />
            <Text style={[styles.meta, safeStyles.characterCount]}>
              {closeComment.length}/1000
            </Text>
            <View style={safeStyles.modalActions}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.secondaryButton,
                  safeStyles.modalActionButton,
                  { opacity: closingEvent ? 0.6 : 1 },
                ]}
                onPress={() => setCloseModalVisible(false)}
                disabled={closingEvent}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.button,
                  safeStyles.modalActionButton,
                  { opacity: closingEvent ? 0.6 : 1 },
                ]}
                onPress={handleCloseEventContinue}
                disabled={closingEvent}
              >
                {closingEvent ? (
                  <ActivityIndicator color={AppColor.white} />
                ) : (
                  <Text style={styles.buttonText}>Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {renderImagePreviewModal()}
    </View>
  );
};

export default MarketplaceEventDetailsScreen;
