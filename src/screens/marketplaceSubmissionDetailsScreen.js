import React, { useState } from "react";
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import AppHeader from "../components/AppHeader";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor } from "../utils/theme";
import { sendMarketplaceEventQuestion_API } from "../apiFolder/appAPI";
import {
  declineEventVendorApplication_API,
  declineMarketplaceApplication_API,
  declineMarketplaceBid_API,
  revokeEventVendorApplicationAward_API,
  revokeMarketplaceApplicationAward_API,
  revokeMarketplaceAward_API,
} from "../apiFolder/appAPI";
import { getCoordinatorSubmissionActions } from "../helpers/marketplaceCoordinatorSubmissionActions.helper";
import { formatMoney, getMarketplaceMessageError, styles } from "./marketplaceShared";
import ZoomableImageModal from "../components/ZoomableImageModal";

const DetailRow = ({ label, value }) => (
  <View style={{ marginTop: 12 }}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.meta}>{value || "Not provided"}</Text>
  </View>
);

const getAttachmentLabel = (attachment = {}) => {
  if (attachment.original_name) return attachment.original_name;
  if (attachment.attachment_type === "BID_MENU_PDF") return "Menu PDF";
  if (attachment.attachment_type === "APPLICATION_MENU_PDF") return "Menu PDF";
  if (attachment.attachment_type === "BID_IMAGE") return "Food/Menu Photo";
  if (attachment.attachment_type === "APPLICATION_IMAGE") return "Food/Menu Photo";
  return attachment.attachment_type || "Attachment";
};

const getImageUrls = (submission = {}) => {
  const imageUrls = [
    ...(Array.isArray(submission.image_urls) ? submission.image_urls : []),
    ...(Array.isArray(submission.imageUrls) ? submission.imageUrls : []),
    ...(Array.isArray(submission.images) ? submission.images : []),
    ...(Array.isArray(submission.photos) ? submission.photos : []),
  ]
    .map((image) => (typeof image === "string" ? image : image?.file_url || image?.url || image?.image_url))
    .filter(Boolean);
  const attachmentUrls = (submission.attachments || [])
    .filter((attachment) =>
      ["BID_IMAGE", "APPLICATION_IMAGE"].includes(attachment.attachment_type) ||
      String(attachment.mime_type || "").startsWith("image/")
    )
    .map((attachment) => attachment.file_url)
    .filter(Boolean);

  return [...new Set([...imageUrls, ...attachmentUrls])];
};

const getMenuAttachments = (submission = {}) => {
  const attachments = (submission.attachments || []).filter((attachment) =>
    ["BID_MENU_PDF", "APPLICATION_MENU_PDF"].includes(attachment.attachment_type) ||
    String(attachment.mime_type || "").includes("pdf")
  );
  const menuUrl = submission.menu_pdf_url || submission.menuPdfUrl || submission.menu_url;
  if (menuUrl) {
    return [
      { attachment_id: "menu_pdf_url", file_url: menuUrl, original_name: "Menu PDF" },
      ...attachments,
    ];
  }
  return attachments;
};

const getVendorDisplay = (submission = {}) => {
  if (submission.vendor_display_id) return submission.vendor_display_id;
  if (submission.food_truck_id?.display_id) return submission.food_truck_id.display_id;
  return "Vendor identity hidden";
};

const getVendorMessageId = (submission = {}) => {
  const vendorUser = submission.vendor_user_id;
  if (typeof vendorUser === "string") return vendorUser;
  if (vendorUser?._id) return String(vendorUser._id);
  if (vendorUser?.id) return String(vendorUser.id);
  return submission.vendor_display_id || submission.food_truck_id?.display_id || "";
};

const MarketplaceSubmissionDetailsScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const submission = route?.params?.submission || {};
  const submissionType = route?.params?.submissionType || "Bid";
  const imageUrls = getImageUrls(submission);
  const menuAttachments = getMenuAttachments(submission);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [declining, setDeclining] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const messageError = getMarketplaceMessageError(messageText);
  const eventId = submission.event_id || submission.marketplaceEvent?.event_id || submission.event?.event_id;
  const vendorMessageId = getVendorMessageId(submission);
  const canSendMessage =
    !!eventId &&
    (!!vendorMessageId || !!submission.bid_id || !!submission.application_id) &&
    !!messageText.trim() &&
    !messageError &&
    !sendingMessage;

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      Alert.alert("Messages", "Enter a message before sending.");
      return;
    }
    if (messageError) {
      Alert.alert("Messages", messageError);
      return;
    }
    setSendingMessage(true);
    try {
      const response = await sendMarketplaceEventQuestion_API({
        eventId,
        payload: {
          question_text: messageText.trim(),
          vendor_user_id: vendorMessageId,
          bid_id: submission.bid_id || null,
          application_id: submission.application_id || null,
        },
      });
      if (response?.success) {
        setMessageText("");
        Alert.alert("Messages", "Message sent to vendor.");
      } else {
        Alert.alert("Messages", response?.message || "Unable to send message.");
      }
    } catch (error) {
      Alert.alert("Messages", error?.message || "Unable to send message.");
    } finally {
      setSendingMessage(false);
    }
  };

  const submissionActions = getCoordinatorSubmissionActions(submission);
  const isEventVendorApplication = submissionActions.kind === "EVENT_VENDOR_APPLICATION";
  const canDecline = submissionActions.canReject;
  const rejectionLabel = submissionActions.rejectLabel;
  const handleDecline = () => Alert.alert(
    rejectionLabel,
    `Reject this ${submission.bid_id ? "bid" : "application"}? The vendor will be notified.`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: rejectionLabel,
        style: "destructive",
        onPress: async () => {
          setDeclining(true);
          try {
            if (submission.bid_id) await declineMarketplaceBid_API(submission.bid_id);
            else if (isEventVendorApplication) await declineEventVendorApplication_API(submission.application_id);
            else await declineMarketplaceApplication_API(submission.application_id);
            Alert.alert("Submission Updated", "The vendor was notified that this submission was not selected.", [
              { text: "OK", onPress: () => navigation.canGoBack() && navigation.goBack() },
            ]);
          } catch (error) {
            Alert.alert("Unable to Update", error?.message || "Please try again.");
          } finally {
            setDeclining(false);
          }
        },
      },
    ],
  );
  const handleRevoke = () => Alert.alert(
    "Revoke Award",
    "Revoke this award? The vendor will be notified and the capacity slot will be released. Awards cannot be revoked at or within 72 hours of the event.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Revoke Award",
        style: "destructive",
        onPress: async () => {
          setRevoking(true);
          try {
            if (submissionActions.kind === "FOOD_BID") {
              await revokeMarketplaceAward_API({ eventId, bidId: submission.bid_id });
            } else if (submissionActions.kind === "EVENT_VENDOR_APPLICATION") {
              await revokeEventVendorApplicationAward_API({
                applicationId: submission.application_id,
              });
            } else {
              await revokeMarketplaceApplicationAward_API({
                eventId,
                applicationId: submission.application_id,
              });
            }
            Alert.alert("Award Revoked", "The vendor was notified and the slot is available.", [
              { text: "OK", onPress: () => navigation.canGoBack() && navigation.goBack() },
            ]);
          } catch (error) {
            Alert.alert("Unable to Revoke Award", error?.message || "Please try again.");
          } finally {
            setRevoking(false);
          }
        },
      },
    ],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />
      <AppHeader headerTitle={`${submissionType} Details`} />
      <ScrollView contentContainerStyle={styles.body}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.secondaryButton}
          onPress={() => navigation.canGoBack() && navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={18} color={AppColor.primary} />
          <Text style={styles.secondaryButtonText}>Back to Bids</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.title}>{getVendorDisplay(submission)}</Text>
          <Text style={styles.meta}>
            Vendor identity remains hidden until marketplace unlock conditions are met.
          </Text>
          <DetailRow
            label="Submission Round"
            value={`Round ${submission.submission_round || 1}${
              submission.archived_at ? " • Previous submission" : ""
            }`}
          />
          <DetailRow
            label="Proposal Bid Amount"
            value={formatMoney(submission.full_bid_amount || submission.vendor_fee_amount)}
          />
          {submission.guest_coverage ? (
            <DetailRow
              label="Guest Coverage"
              value={submission.guest_coverage === "VIP" ? "VIP Guests" : submission.guest_coverage === "BOTH" ? "Regular & VIP Guests" : "Regular Guests"}
            />
          ) : null}
          {submission.guest_coverage === "BOTH" ? (
            <>
              <DetailRow label="Regular Guests Amount" value={formatMoney(submission.regular_guest_amount)} />
              <DetailRow label="VIP Catering Amount" value={formatMoney(submission.vip_catering_amount)} />
            </>
          ) : null}
          <DetailRow
            label="Price Per Guest"
            value={
              submission.price_per_guest == null
                ? "Not provided"
                : formatMoney(submission.price_per_guest)
            }
          />
          <DetailRow
            label="Average Price Per Meal"
            value={
              submission.average_price_per_meal == null
                ? "Not provided"
                : formatMoney(submission.average_price_per_meal)
            }
          />
          <DetailRow
            label="Menu / Proposal Notes"
            value={submission.menu_description || submission.message || submission.notes}
          />
          <DetailRow label="Submission Status" value={submissionActions.status} />
          {submission.vendor_types ? <DetailRow label="Vendor Types" value={submission.vendor_types.join(", ")} /> : null}
          {submission.offering_bullets ? <DetailRow label="Products / Services" value={submission.offering_bullets.map((item) => `• ${item}`).join("\n")} /> : null}
          {submission.average_price != null ? <DetailRow label="Average Price" value={formatMoney(submission.average_price)} /> : null}
          {submission.category_fee != null ? <DetailRow label="Category Fee" value={formatMoney(submission.category_fee)} /> : null}
          {submission.electricity_required !== undefined ? (
            <DetailRow label="Electricity" value={submission.electricity_required ? `Required · ${formatMoney(submission.electricity_fee)}` : "Not required"} />
          ) : null}
          <DetailRow label="Agreement" value={submission.agreement_status || (submission.nda_accepted_at && submission.governance_accepted_at ? "SIGNED" : "Not provided")} />
          <DetailRow
            label="Insurance"
            value={submission.insurance_confirmed ? "Confirmed" : "Not confirmed"}
          />
          <DetailRow
            label="Permits"
            value={submission.permits_confirmed ? "Confirmed" : "Not confirmed"}
          />
        </View>

        {canDecline ? (
          <TouchableOpacity
            style={[styles.secondaryButton, { marginBottom: 14, borderColor: "#B42318" }]}
            disabled={declining}
            onPress={handleDecline}
          >
            <Text style={[styles.secondaryButtonText, { color: "#B42318" }]}>
              {declining ? "Updating..." : rejectionLabel}
            </Text>
          </TouchableOpacity>
        ) : null}

        {submissionActions.canRevoke ? (
          <TouchableOpacity
            style={[styles.secondaryButton, { marginBottom: 14, borderColor: "#B42318" }]}
            disabled={revoking}
            onPress={handleRevoke}
          >
            <Text style={[styles.secondaryButtonText, { color: "#B42318" }]}>
              {revoking ? "Revoking..." : "Revoke Award"}
            </Text>
          </TouchableOpacity>
        ) : null}
        {submissionActions.paidRevocationBlocked ? (
          <Text style={[styles.meta, { marginBottom: 14 }]}>
            This paid award cannot be revoked until a verified processor refund is available.
          </Text>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.title}>Message Vendor</Text>
          <TouchableOpacity
            style={[styles.secondaryButton, { marginBottom: 12 }]}
            onPress={() => navigation.navigate("marketplaceEventMessagesScreen", {
              eventId,
              bidId: submission.bid_id || null,
              applicationId: submission.application_id || null,
            })}
          >
            <Text style={styles.secondaryButtonText}>Open Submission Conversation</Text>
          </TouchableOpacity>
          <TextInput
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Ask for clarification"
            placeholderTextColor={AppColor.textHighlighter}
            multiline
            style={[styles.input, styles.textarea, { marginTop: 12 }]}
          />
          {!!messageError && <Text style={styles.errorText}>{messageError}</Text>}
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.button,
              { marginTop: 12 },
              !canSendMessage && styles.buttonDisabled,
            ]}
            disabled={!canSendMessage}
            onPress={handleSendMessage}
          >
            <Text style={styles.buttonText}>
              {sendingMessage ? "Sending..." : "Send Message"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Food / Menu Photos</Text>
          {imageUrls.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
              {imageUrls.map((url) => (
                <TouchableOpacity key={url} onPress={() => setSelectedImage(url)}>
                <Image
                  source={{ uri: url }}
                  style={{
                    width: 220,
                    height: 150,
                    borderRadius: 8,
                    marginRight: 12,
                    backgroundColor: AppColor.borderColor,
                  }}
                  resizeMode="cover"
                />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.emptyText}>No photos uploaded.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Menu Files</Text>
          {menuAttachments.length ? (
            menuAttachments.map((attachment) => (
              <TouchableOpacity
                key={attachment.attachment_id || attachment.file_url}
                activeOpacity={0.7}
                style={[styles.secondaryButton, { marginTop: 10 }]}
                onPress={() => attachment.file_url && Linking.openURL(attachment.file_url)}
              >
                <Text style={styles.secondaryButtonText}>
                  {getAttachmentLabel(attachment)}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>No menu files uploaded.</Text>
          )}
        </View>
      </ScrollView>
      <ZoomableImageModal uri={selectedImage} title="Submission Photo" onClose={() => setSelectedImage(null)} />
    </View>
  );
};

export default MarketplaceSubmissionDetailsScreen;
