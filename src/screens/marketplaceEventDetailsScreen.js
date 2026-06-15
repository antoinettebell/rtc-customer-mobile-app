import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
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
  answerMarketplaceEventQuestion_API,
  reopenMarketplaceEvent_API,
  updateMarketplaceEvent_API,
  trackPublicMarketplaceTicketClick_API,
} from "../apiFolder/appAPI";
import ImageCarousel from "../components/ImageCarousel";
import { formatDate, formatMoney, styles } from "./marketplaceShared";

const DetailRow = ({ label, value }) => (
  <View style={{ marginTop: 12 }}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.meta}>{value || "Not set"}</Text>
  </View>
);

const listValue = (value) =>
  Array.isArray(value) && value.length ? value.join(", ") : "Not set";

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
});

const MarketplaceEventDetailsScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { eventId, customerSafe = false } = route.params || {};
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [qaArchived, setQaArchived] = useState(false);
  const [qaLoading, setQaLoading] = useState(false);
  const [answerDrafts, setAnswerDrafts] = useState({});
  const [answeringId, setAnsweringId] = useState(null);

  const loadQuestions = async () => {
    if (!eventId || customerSafe) return;
    setQaLoading(true);
    try {
      const response = await getMarketplaceEventQuestions_API(eventId);
      if (response?.success) {
        setQuestions(response.data?.marketplaceQuestionList || []);
        setQaArchived(!!response.data?.qa_archived);
      }
    } catch (error) {
      console.log("Marketplace messages error", error);
    } finally {
      setQaLoading(false);
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

  const imageUrls =
    event?.images?.map((image) => image.image_url).filter(Boolean) || [];
  const locationText =
    event?.formatted_address ||
    event?.geocoded_address ||
    event?.event_address ||
    "Location not set";
  const cityStateText = [event?.event_city, event?.event_state]
    .filter(Boolean)
    .join(", ");
  const ticketSalesEnabled = !!event?.ticket_sales_enabled;
  const ticketUrl = event?.ticket_url?.trim();
  const eventStatus = event?.status || "DRAFT";
  const isDraft = eventStatus === "DRAFT";
  const isPublished = ["OPEN", "REOPENED"].includes(eventStatus);
  const isClosed = event?.status === "CLOSED";
  const isAwarded = eventStatus === "AWARDED";
  const canViewAwardedDocs =
    isAwarded && ["PAID", "NOT_REQUIRED"].includes(event?.award_payment_status);
  let ticketAvailabilityMessage =
    "Ticket availability details are not available in the app yet.";
  if (ticketSalesEnabled && ticketUrl) {
    ticketAvailabilityMessage = "Tap event image to view tickets.";
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

    try {
      await Linking.openURL(ticketUrl);
    } catch (error) {
      Alert.alert("Tickets", "Unable to open the ticket sales link.");
    }
  };

  const handleReopenEvent = () => {
    if (!event) return;
    Alert.alert(
      "Reopen Bidding",
      "This will reopen the event with a new 7-day submission window. Previous submitters remain visible but cannot submit again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reopen",
          onPress: async () => {
            setLoading(true);
            try {
              const closeDate = new Date();
              closeDate.setDate(closeDate.getDate() + 7);
              const payload = {
                ...event,
                event_date: event.event_date
                  ? new Date(event.event_date).toISOString().slice(0, 10)
                  : "",
                event_close_date: closeDate.toISOString().slice(0, 10),
                event_close_time: "11:59 PM",
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
                setEvent(response.data?.marketplaceEvent);
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
    navigation.navigate("marketplaceCreateEventScreen", {
      eventId,
      draftEvent: event,
    });
  };

  const openDocument = async (url) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Document", "Unable to open this document.");
    }
  };

  const handleAnswerQuestion = async (questionId) => {
    const answerText = String(answerDrafts[questionId] || "").trim();
    if (!answerText) {
      Alert.alert("Messages", "Enter a response before posting.");
      return;
    }

    setAnsweringId(questionId);
    try {
      const response = await answerMarketplaceEventQuestion_API({
        eventId,
        questionId,
        answerText,
      });
      if (response?.success) {
        setAnswerDrafts((prev) => ({ ...prev, [questionId]: "" }));
        await loadQuestions();
      } else if (response?.message) {
        Alert.alert("Messages", response.message);
      }
    } catch (error) {
      Alert.alert("Messages", error?.message || "Unable to post response.");
    } finally {
      setAnsweringId(null);
    }
  };

  const renderMessages = () => (
    <View style={styles.card}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={styles.title}>Messages</Text>
        {qaArchived ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ARCHIVED</Text>
          </View>
        ) : null}
      </View>
      {qaLoading ? (
        <ActivityIndicator
          color={AppColor.primary}
          size="small"
          style={{ marginTop: 16 }}
        />
      ) : questions.length ? (
        questions.map((question) => {
          const canAnswer = question.status === "PENDING" && !qaArchived;
          return (
            <View
              key={question.question_id}
              style={{
                borderTopWidth: 1,
                borderTopColor: AppColor.borderColor,
                marginTop: 14,
                paddingTop: 14,
              }}
            >
              <Text style={styles.label}>{question.vendor_display_id}</Text>
              <Text style={styles.meta}>
                {question.question_text || "Blocked by RTC moderation."}
              </Text>
              {question.answer_text ? (
                <>
                  <Text style={styles.label}>Coordinator Response</Text>
                  <Text style={styles.meta}>{question.answer_text}</Text>
                </>
              ) : canAnswer ? (
                <>
                  <TextInput
                    value={answerDrafts[question.question_id] || ""}
                    onChangeText={(text) =>
                      setAnswerDrafts((prev) => ({
                        ...prev,
                        [question.question_id]: text,
                      }))
                    }
                    placeholder="Response"
                    placeholderTextColor={AppColor.textHighlighter}
                    multiline
                    style={[styles.input, styles.textarea, { marginTop: 12 }]}
                  />
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.button, { marginTop: 10 }]}
                    disabled={answeringId === question.question_id}
                    onPress={() => handleAnswerQuestion(question.question_id)}
                  >
                    <Text style={styles.buttonText}>
                      {answeringId === question.question_id ? "Posting..." : "Post Answer"}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.meta}>Awaiting response.</Text>
              )}
            </View>
          );
        })
      ) : (
        <Text style={styles.emptyText}>No messages yet.</Text>
      )}
    </View>
  );

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
          return (
            <View key={key} style={{ marginTop: 14 }}>
              <Text style={styles.label}>{getVendorName(record)}</Text>
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
          {isClosed ? (
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

            <View style={styles.card}>
              <Text style={styles.title}>{event?.event_name || "Event"}</Text>
              {!!event?.event_description && (
                <Text style={styles.subtitle}>{event.event_description}</Text>
              )}

              <DetailRow label="Date" value={formatDate(event?.event_date)} />
              <DetailRow label="Time" value={event?.event_time} />
              <DetailRow label="Location" value={locationText} />
              <DetailRow label="City / State" value={cityStateText} />
              <DetailRow label="Event Type" value={event?.event_type} />
              <DetailRow
                label="Primary Service Style"
                value={event?.primary_service_style}
              />
              {getServiceSpecificRows(event).map(([label, value]) => (
                <DetailRow key={label} label={label} value={String(value || "Not set")} />
              ))}
              <DetailRow
                label="Alcohol Service"
                value={event?.alcohol_required ? "Yes" : "No"}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.title}>Ticket Availability</Text>
              <Text style={safeStyles.ticketText}>
                {ticketAvailabilityMessage}
              </Text>
            </View>
          </ScrollView>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />
      <AppHeader headerTitle="Event Details" rightSide={isDraft}>
        {isDraft ? (
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
            <DetailRow label="Who Pays" value={event?.payment_responsibility || "Not set"} />
            <DetailRow
              label="Budgeted Amount"
              value={formatMoney(event?.budgeted_amount)}
            />
            <DetailRow label="Close Date" value={formatDate(event?.event_close_date)} />
            <DetailRow label="Close Time" value={event?.event_close_time} />
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
              label="Booking Payment"
              value={event?.award_payment_status || "NOT_REQUIRED"}
            />
            <DetailRow
              label="Agreement"
              value={event?.agreement_status || "NOT_REQUIRED"}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Event Visibility</Text>
            <DetailRow
              label="Event Views"
              value={String(event?.event_impression_count || 0)}
            />
            <DetailRow
              label="Ticket Clicks"
              value={String(event?.ticket_click_count || 0)}
            />
          </View>

          {renderAwardedDocuments()}
          {renderCoordinatorActions()}

          {renderMessages()}
        </ScrollView>
      )}
    </View>
  );
};

export default MarketplaceEventDetailsScreen;
