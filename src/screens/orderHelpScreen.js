import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { IconButton } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { submitCustomerOrderSupportIssue_API } from "../apiFolder/appAPI";
import { AppColor, Mulish400, Mulish600, Mulish700 } from "../utils/theme";

const issues = [
  { type: "FOOD_NOT_DELIVERED", title: "Food did not arrive", detail: "We will check this order and issue the eligible refund." },
  { type: "FOOD_QUALITY", title: "Food was uncooked or stale", detail: "We will check this order and issue the eligible refund." },
  { type: "OTHER", title: "Other", detail: "Our Support team will review your concern and contact you." },
];

const OrderHelpScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const order = route?.params?.order;
  const [showIssues, setShowIssues] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submitIssue = async (issue) => {
    if (!order?._id || submitting) return;
    setSubmitting(true);
    try {
      const response = await submitCustomerOrderSupportIssue_API(order._id, issue.type);
      const result = response?.data || {};
      Alert.alert(
        result.outcome === "REFUND_ISSUED" ? "Refund issued" : "Support request sent",
        result.message || "Support will be in touch to help with this order.",
        [{ text: "Done", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert("We need to review this", error?.message || "Support will be in touch to help with this order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Help Desk</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>How can we help?</Text>
        {order?.orderNumber && <Text style={styles.order}>Order #{order.orderNumber}</Text>}
        {!showIssues ? (
          <TouchableOpacity style={styles.primaryButton} onPress={() => setShowIssues(true)}>
            <Text style={styles.primaryButtonText}>I have a problem with my order</Text>
          </TouchableOpacity>
        ) : (
          <>
            <Text style={styles.prompt}>Choose the option that best describes the problem.</Text>
            {issues.map((issue) => (
              <TouchableOpacity key={issue.type} style={styles.issueCard} disabled={submitting} onPress={() => submitIssue(issue)}>
                <Text style={styles.issueTitle}>{issue.title}</Text>
                <Text style={styles.issueDetail}>{issue.detail}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
        {submitting && <ActivityIndicator color={AppColor.primary} size="large" style={styles.loader} />}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColor.white },
  header: { height: 58, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: AppColor.border },
  headerTitle: { flex: 1, textAlign: "center", fontFamily: Mulish700, fontSize: 20, color: AppColor.text },
  headerSpacer: { width: 48 },
  content: { padding: 24 },
  title: { fontFamily: Mulish700, fontSize: 26, color: AppColor.text, marginBottom: 8 },
  order: { fontFamily: Mulish400, color: AppColor.text, marginBottom: 24 },
  prompt: { fontFamily: Mulish400, color: AppColor.text, marginBottom: 14 },
  primaryButton: { backgroundColor: AppColor.primary, padding: 18, borderRadius: 8 },
  primaryButtonText: { color: AppColor.white, textAlign: "center", fontFamily: Mulish700, fontSize: 16 },
  issueCard: { borderWidth: 1, borderColor: AppColor.border, borderRadius: 8, padding: 16, marginBottom: 12 },
  issueTitle: { color: AppColor.text, fontFamily: Mulish600, fontSize: 16, marginBottom: 5 },
  issueDetail: { color: AppColor.text, fontFamily: Mulish400, fontSize: 13, lineHeight: 19 },
  loader: { marginTop: 18 },
});

export default OrderHelpScreen;
