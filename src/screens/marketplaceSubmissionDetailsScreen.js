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
import { formatMoney, getMarketplaceMessageError, styles } from "./marketplaceShared";

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
  const imageUrls = Array.isArray(submission.image_urls)
    ? submission.image_urls
    : [];
  const attachmentUrls = (submission.attachments || [])
    .filter((attachment) =>
      ["BID_IMAGE", "APPLICATION_IMAGE"].includes(attachment.attachment_type)
    )
    .map((attachment) => attachment.file_url)
    .filter(Boolean);

  return [...new Set([...imageUrls, ...attachmentUrls])];
};

const getMenuAttachments = (submission = {}) => {
  const attachments = (submission.attachments || []).filter((attachment) =>
    ["BID_MENU_PDF", "APPLICATION_MENU_PDF"].includes(attachment.attachment_type)
  );
  if (submission.menu_pdf_url) {
    return [
      { attachment_id: "menu_pdf_url", file_url: submission.menu_pdf_url, original_name: "Menu PDF" },
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

const MarketplaceSubmissionDetailsScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const submission = route?.params?.submission || {};
  const submissionType = route?.params?.submissionType || "Bid";
  const imageUrls = getImageUrls(submission);
  const menuAttachments = getMenuAttachments(submission);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const messageError = getMarketplaceMessageError(messageText);
  const eventId = submission.event_id || submission.marketplaceEvent?.event_id || submission.event?.event_id;
  const canSendMessage =
    !!eventId &&
    !!submission.vendor_user_id &&
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
          vendor_user_id: submission.vendor_user_id,
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />
      <AppHeader headerTitle={`${submissionType} Details`} />
      <ScrollView contentContainerStyle={styles.body}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
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
          <DetailRow
            label="Insurance"
            value={submission.insurance_confirmed ? "Confirmed" : "Not confirmed"}
          />
          <DetailRow
            label="Permits"
            value={submission.permits_confirmed ? "Confirmed" : "Not confirmed"}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Message Vendor</Text>
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
                <Image
                  key={url}
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
    </View>
  );
};

export default MarketplaceSubmissionDetailsScreen;
