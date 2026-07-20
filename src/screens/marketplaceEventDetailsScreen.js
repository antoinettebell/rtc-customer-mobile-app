import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  StyleSheet,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import AppHeader from "../components/AppHeader";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor } from "../utils/theme";
import {
  getMarketplaceEventById_API,
  getMarketplaceEventQuestions_API,
  getPublicMarketplaceEventById_API,
  closeMarketplaceEvent_API,
  createMarketplaceFinalPayment_API,
  reopenMarketplaceEvent_API,
  updateMarketplaceEvent_API,
  trackPublicMarketplaceTicketClick_API,
} from "../apiFolder/appAPI";
import ImageCarousel from "../components/ImageCarousel";
import {
  formatDate,
  formatEventTime,
  formatMoney,
  formatPermitList,
  normalizeExternalUrl,
  styles,
} from "./marketplaceShared";

const DetailRow = ({ label, value }) => (
  <View style={{ marginTop: 12 }}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.meta}>{value || "Not set"}</Text>
  </View>
);

const listValue = (value) =>
  Array.isArray(value) && value.length ? value.join(", ") : "Not set";
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
    label: `Permit / License ${index + 1}`,
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

const canCreateRecordFinalPayment = (record, event) =>
  !!record &&
  ["PAID", "NOT_REQUIRED"].includes(record?.payment_status || "NOT_REQUIRED") &&
  !record?.final_payment_id &&
  record?.final_payment_status !== "PAID" &&
  getAwardAmount(record, event) > 0;

const canContinueRecordFinalPayment = (record) =>
  !!record?.final_payment_id &&
  record?.final_payment_status &&
  record.final_payment_status !== "PAID";

const hasEventDatePassed = (eventDate) => {
  if (!eventDate) return false;
  const date = new Date(eventDate);
  if (Number.isNaN(date.getTime())) return false;
  date.setHours(23, 59, 59, 999);
  return date < new Date();
};

const formatPayloadDate = (date) => date.toISOString().slice(0, 10);

const getEventDurationMinutes = (event = {}) => {
  const hours = Number(event.event_duration_hours || 0);
  const minutes = Number(event.event_duration_minutes || 0);
  if (minutes > 59) return minutes;
  return hours > 0 ? hours * 60 + minutes : minutes;
};

const formatEventDuration = (event = {}) => {
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

  if (event.primary_service_style === "Plated") {
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

  if (event.primary_service_style === "Buffet") {
    return [["Buffet Options", listValue(event.buffet_options)]];
  }

  if (event.primary_service_style === "Food Truck") {
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
  },
  carouselImage: {
    borderRadius: 10,
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
});

const MarketplaceEventDetailsScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { eventId, customerSafe = false } = route.params || {};
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [closeModalVisible, setCloseModalVisible] = useState(false);
  const [closeComment, setCloseComment] = useState("");
  const [closingEvent, setClosingEvent] = useState(false);
  const [finalPaymentModalVisible, setFinalPaymentModalVisible] = useState(false);
  const [finalPaymentTip, setFinalPaymentTip] = useState("");
  const [selectedFinalPaymentRecord, setSelectedFinalPaymentRecord] = useState(null);
  const [creatingFinalPayment, setCreatingFinalPayment] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    requirements: true,
    budget: true,
    visibility: true,
  });

  const loadQuestions = async () => {
    if (!eventId || customerSafe) return;
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
      const response = customerSafe
        ? await getPublicMarketplaceEventById_API(eventId)
        : await getMarketplaceEventById_API(eventId);
      if (response?.success) {
        setEvent(response.data?.marketplaceEvent);
      }
      await loadQuestions();
    } catch (error) {
      Alert.alert("Event", error?.message || "Failed to load event.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEvent();
    }, [eventId, customerSafe])
  );

  const imageUrls = normalizeEventImageUrls(event?.images);
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
  const canEditEvent = !["AWARDED", "CANCELLED"].includes(eventStatus);
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
  if (ticketSalesEnabled && ticketUrl) {
    ticketAvailabilityMessage = imageUrls.length
      ? "Tap View Tickets or the event image to open tickets."
      : "Tap View Tickets to open tickets.";
  } else if (ticketSalesEnabled) {
    ticketAvailabilityMessage =
      "Tickets are not being sold through the app at this time.";
  }

  const handleCustomerEventImagePress = async () => {
    if (!ticketSalesEnabled) return;

    if (!ticketUrl) {
      Alert.alert(
        "Tickets",
        "Tickets are not being sold through the app at this time."
      );
      return;
    }

    try {
      await trackPublicMarketplaceTicketClick_API(eventId);
    } catch (error) {
      console.log("Marketplace ticket click tracking error", error);
    }

    navigation.navigate("marketplaceTicketWebViewScreen", {
      url: ticketUrl,
      title: event?.event_name || "Tickets",
    });
  };

  const handleReopenEvent = () => {
    if (!event) return;
    const eventDatePassed = hasEventDatePassed(event.event_date);
    if (eventDatePassed) {
      navigation.navigate("marketplaceCreateEventScreen", {
        eventId,
        draftEvent: {
          ...event,
          status: "OPEN",
          event_date: "",
          event_close_date: "",
          event_close_time: "",
        },
        reopenMode: true,
      });
      return;
    }

    Alert.alert(
      "Reopen Bidding",
      "This will reopen bidding and move you to the event editor. Previous submissions remain visible for comparison, but previous submitters cannot submit again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reopen & Edit",
          onPress: async () => {
            setLoading(true);
            try {
              const closeDate = new Date();
              closeDate.setDate(closeDate.getDate() + 7);
              const eventDate = event.event_date ? new Date(event.event_date) : null;
              if (eventDate && !Number.isNaN(eventDate.getTime()) && closeDate > eventDate) {
                closeDate.setTime(eventDate.getTime());
              }
              const payload = {
                ...event,
                event_date: event.event_date
                  ? formatPayloadDate(new Date(event.event_date))
                  : "",
                event_close_date: formatPayloadDate(closeDate),
                event_close_time: event.event_close_time || "11:59 PM",
                event_time: event.event_time || "12:00 PM",
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
                payment_responsibility:
                  event.payment_responsibility ||
                  (Number(event.vendor_fee || 0) > 0 &&
                  Number(event.budgeted_amount || 0) > 0
                    ? "BOTH"
                    : Number(event.vendor_fee || 0) > 0
                      ? "VENDOR"
                      : "COORDINATOR"),
              };
              const response = await reopenMarketplaceEvent_API({
                eventId,
                payload,
              });
              if (response?.success) {
                const reopenedEvent = response.data?.marketplaceEvent;
                setEvent(reopenedEvent);
                navigation.navigate("marketplaceCreateEventScreen", {
                  eventId,
                  draftEvent: reopenedEvent,
                  reopenMode: true,
                });
              }
            } catch (error) {
              Alert.alert(
                "Reopen Bidding",
                error?.message || "Failed to reopen event."
              );
            } finally {
              setLoading(false);
            }
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

  const handleCreateFinalPayment = async () => {
    if (!selectedFinalPaymentRecord) {
      Alert.alert("Close Event for Payment", "Select an awarded vendor first.");
      return;
    }
    const tipAmount = Number(finalPaymentTip || 0);
    if (Number.isNaN(tipAmount) || tipAmount < 0) {
      Alert.alert("Close Event for Payment", "Please enter a valid tip amount.");
      return;
    }

    setCreatingFinalPayment(true);
    try {
      const response = await createMarketplaceFinalPayment_API({
        eventId,
        bidId: selectedFinalPaymentRecord.bid_id,
        applicationId: selectedFinalPaymentRecord.application_id,
        tipAmount,
      });
      if (response?.success) {
        const marketplacePayment = response.data?.marketplacePayment;
        setEvent(response.data?.marketplaceEvent || event);
        setFinalPaymentModalVisible(false);
        setFinalPaymentTip("");
        setSelectedFinalPaymentRecord(null);

        if (response.data?.requires_payment && marketplacePayment) {
          navigation.navigate("marketplacePaymentScreen", {
            payment: marketplacePayment,
            paymentId: marketplacePayment.payment_id,
            returnScreen: "marketplaceEventDetailsScreen",
            returnParams: { eventId },
          });
        }
      }
    } catch (error) {
      Alert.alert(
        "Close Event for Payment",
        error?.message || "Unable to create final event payment.",
      );
    } finally {
      setCreatingFinalPayment(false);
    }
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
	              {canCreateRecordFinalPayment(record, event) ? (
	                <TouchableOpacity
	                  activeOpacity={0.7}
	                  style={[styles.button, { marginTop: 10 }]}
	                  onPress={() => {
	                    setSelectedFinalPaymentRecord(record);
	                    setFinalPaymentTip("");
	                    setFinalPaymentModalVisible(true);
	                  }}
	                >
	                  <Text style={styles.buttonText}>Close Event for Payment</Text>
	                </TouchableOpacity>
	              ) : canContinueRecordFinalPayment(record) ? (
	                <TouchableOpacity
	                  activeOpacity={0.7}
	                  style={[styles.button, { marginTop: 10 }]}
	                  onPress={() =>
	                    navigation.navigate("marketplacePaymentScreen", {
	                      paymentId: record.final_payment_id,
	                      returnScreen: "marketplaceEventDetailsScreen",
	                      returnParams: { eventId },
	                    })
	                  }
	                >
	                  <Text style={styles.buttonText}>Continue Final Payment</Text>
	                </TouchableOpacity>
	              ) : finalPaymentStatus === "PAID" ? (
	                <Text style={[styles.meta, { marginTop: 8 }]}>
	                  Final payment has been completed for this award.
	                </Text>
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

	    if (isAwarded) return null;

    return null;
  };

  if (customerSafe) {
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
              <Text style={styles.title}>Ticket Availability</Text>
              <Text style={safeStyles.ticketText}>
                {ticketAvailabilityMessage}
              </Text>
              {ticketSalesEnabled && ticketUrl ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.button, safeStyles.ticketButton]}
                  onPress={handleCustomerEventImagePress}
                >
                  <Text style={styles.buttonText}>View Tickets</Text>
                </TouchableOpacity>
              ) : null}

              {imageUrls.length > 0 && (
                <ImageCarousel
                  images={imageUrls}
                  containerHeight={220}
                  containerStyle={safeStyles.carousel}
                  imageContainer={safeStyles.carouselImage}
                  onImagePress={
                    ticketSalesEnabled ? handleCustomerEventImagePress : undefined
                  }
                />
              )}
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
	              label="RTC Processing Fee"
	              value={event?.award_payment_status || "NOT_REQUIRED"}
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
      <Modal
        transparent
        animationType="fade"
        visible={finalPaymentModalVisible}
        onRequestClose={() => setFinalPaymentModalVisible(false)}
      >
        <View style={safeStyles.modalOverlay}>
          <View style={[safeStyles.modalSheet, { paddingBottom: Math.max(insets.bottom, 18) }]}>
	            <Text style={styles.title}>Close Event for Payment</Text>
	            <Text style={styles.meta}>
	              Create checkout for {getVendorName(selectedFinalPaymentRecord)}. Tip is optional.
	            </Text>
	            <Text style={styles.meta}>
	              Award Amount: {formatMoney(getAwardAmount(selectedFinalPaymentRecord, event))}
	            </Text>
	            <TextInput
              value={finalPaymentTip}
              onChangeText={setFinalPaymentTip}
              placeholder="Tip amount, optional"
              placeholderTextColor={AppColor.textPlaceholder}
              keyboardType="decimal-pad"
              editable={!creatingFinalPayment}
              style={safeStyles.closeCommentInput}
            />
            <View style={safeStyles.modalActions}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.secondaryButton,
                  safeStyles.modalActionButton,
                  { opacity: creatingFinalPayment ? 0.6 : 1 },
                ]}
	                onPress={() => {
	                  setFinalPaymentModalVisible(false);
	                  setFinalPaymentTip("");
	                  setSelectedFinalPaymentRecord(null);
	                }}
                disabled={creatingFinalPayment}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.button,
                  safeStyles.modalActionButton,
                  { opacity: creatingFinalPayment ? 0.6 : 1 },
                ]}
                onPress={handleCreateFinalPayment}
                disabled={creatingFinalPayment}
              >
                {creatingFinalPayment ? (
                  <ActivityIndicator color={AppColor.white} />
                ) : (
                  <Text style={styles.buttonText}>Checkout</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default MarketplaceEventDetailsScreen;
