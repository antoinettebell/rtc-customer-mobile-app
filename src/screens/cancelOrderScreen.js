import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { Checkbox } from "react-native-paper";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FastImage from "@d11/react-native-fast-image";
import AppHeader from "../components/AppHeader";

const CANCEL_REASONS = [
  { id: 1, label: "Order by mistake", value: "order_mistake" },
  { id: 2, label: "No response from food truck", value: "no_response" },
  { id: 3, label: "Takes too much time", value: "too_much_time" },
  { id: 4, label: "Other", value: "other" },
];

const CancelOrderScreen = ({ route }) => {
  const [selectedReasons, setSelectedReasons] = useState(new Set());
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customReasonError, setCustomReasonError] = useState("");

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Get order details from route params if passed
  const orderDetails = route?.params?.orderDetails || null;

  const handleReasonToggle = useCallback((reasonValue) => {
    setSelectedReasons((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(reasonValue)) {
        newSet.delete(reasonValue);
        // Clear custom reason if "Other" is unchecked
        if (reasonValue === "other") {
          setCustomReason("");
          setCustomReasonError("");
        }
      } else {
        newSet.add(reasonValue);
      }
      return newSet;
    });
  }, []);

  const validateForm = useCallback(() => {
    // Check if at least one reason is selected
    if (selectedReasons.size === 0) {
      Alert.alert(
        "Validation Error",
        "Please select at least one reason for cancellation."
      );
      return false;
    }

    // If "Other" is selected, custom reason is required
    if (selectedReasons.has("other")) {
      if (!customReason.trim()) {
        setCustomReasonError("Please provide a reason");
        return false;
      }
      if (customReason.trim().length < 5) {
        setCustomReasonError("Reason must be at least 5 characters long");
        return false;
      }
      setCustomReasonError("");
    }

    return true;
  }, [selectedReasons, customReason]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      // Prepare cancellation data
      const cancellationData = {
        orderId: orderDetails?.id || null,
        reasons: Array.from(selectedReasons),
        customReason: selectedReasons.has("other") ? customReason.trim() : null,
        timestamp: new Date().toISOString(),
      };

      // TODO: Replace with actual API call
      await mockCancelOrder(cancellationData);

      // Show success message
      Alert.alert(
        "Order Cancelled",
        "Your order has been cancelled successfully. Refund will be processed within 3-5 business days.",
        [
          {
            text: "OK",
            onPress: () => {
              // Navigate back to orders screen or home
              navigation.navigate("Orders", { refresh: true });
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error cancelling order:", error);
      Alert.alert(
        "Error",
        "Failed to cancel order. Please try again or contact support.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, selectedReasons, customReason, orderDetails, navigation]);

  const mockCancelOrder = (data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log("Order cancellation data:", data);
        resolve();
      }, 2000);
    });
  };

  const isOtherSelected = selectedReasons.has("other");
  const canSubmit = selectedReasons.size > 0 && !isSubmitting;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.innerContainer, { paddingTop: insets.top }]}>
        <StatusBarManager />
        <AppHeader headerTitle="CANCEL ORDER" />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconContainer}>
            <FastImage
              source={require("../assets/images/orderCancel.png")}
              style={styles.icon}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Cancel Order</Text>

          {orderDetails && (
            <View style={styles.orderInfo}>
              <Text style={styles.orderInfoText}>
                Order #{orderDetails.id} • {orderDetails.restaurant}
              </Text>
            </View>
          )}

          <View style={styles.card}>
            {CANCEL_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                style={styles.reasonRow}
                onPress={() => handleReasonToggle(reason.value)}
                activeOpacity={0.7}
              >
                <Checkbox
                  status={
                    selectedReasons.has(reason.value) ? "checked" : "unchecked"
                  }
                  onPress={() => handleReasonToggle(reason.value)}
                  color={AppColor.primary}
                  uncheckedColor={AppColor.primary}
                />
                <Text style={styles.reasonText}>{reason.label}</Text>
              </TouchableOpacity>
            ))}

            {isOtherSelected && (
              <View style={styles.customReasonContainer}>
                <TextInput
                  style={[
                    styles.customReasonInput,
                    customReasonError ? styles.inputError : null,
                  ]}
                  placeholder="Please specify your reason..."
                  value={customReason}
                  onChangeText={(text) => {
                    setCustomReason(text);
                    if (customReasonError) setCustomReasonError("");
                  }}
                  placeholderTextColor={AppColor.textPlaceholder}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                  textAlignVertical="top"
                />
                {customReasonError ? (
                  <Text style={styles.errorText}>{customReasonError}</Text>
                ) : null}
                <Text style={styles.characterCount}>
                  {customReason.length}/200
                </Text>
              </View>
            )}
          </View>

          {/* <View style={styles.warningContainer}>
            <MaterialIcons
              name="info-outline"
              size={16}
              color={AppColor.warning}
            />
            <Text style={styles.warningText}>
              Cancellation may take 3-5 business days for refund processing.
            </Text>
          </View> */}
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              !canSubmit && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={1}
          >
            {isSubmitting ? (
              <ActivityIndicator color={AppColor.white} />
            ) : (
              <Text style={styles.submitButtonText}>{"Cancel Order"}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColor.white,
  },
  innerContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  iconContainer: {
    height: 100,
    width: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 40,
    backgroundColor: AppColor.primary + "15",
  },
  icon: {
    width: 60,
    height: 60,
    tintColor: AppColor.primary,
  },
  title: {
    fontFamily: Primary400,
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
    color: AppColor.text,
  },
  orderInfo: {
    backgroundColor: AppColor.lightGray,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  orderInfoText: {
    fontFamily: Secondary400,
    fontSize: 14,
    color: AppColor.textSecondary,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: Secondary400,
    fontSize: 16,
    color: AppColor.text,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    borderWidth: 1,
    borderColor: AppColor.borderColor,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: AppColor.white,
    marginHorizontal: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: AppColor.black,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  reasonText: {
    fontFamily: Secondary400,
    fontSize: 16,
    color: AppColor.text,
    marginLeft: 8,
    flex: 1,
  },
  customReasonContainer: {
    marginTop: 12,
    marginHorizontal: 8,
  },
  customReasonInput: {
    borderWidth: 1,
    borderColor: AppColor.border,
    borderRadius: 8,
    padding: 12,
    fontFamily: Secondary400,
    fontSize: 16,
    color: AppColor.text,
    minHeight: 80,
  },
  inputError: {
    borderColor: AppColor.error,
  },
  errorText: {
    fontFamily: Secondary400,
    fontSize: 12,
    color: AppColor.error,
    marginTop: 4,
    marginLeft: 4,
  },
  characterCount: {
    fontFamily: Secondary400,
    fontSize: 12,
    color: AppColor.textSecondary,
    textAlign: "right",
    marginTop: 4,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColor.warning + "10",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: AppColor.warning,
  },
  warningText: {
    fontFamily: Secondary400,
    fontSize: 14,
    color: AppColor.warning,
    marginLeft: 8,
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  submitButton: {
    height: 48,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColor.primary,
  },
  submitButtonDisabled: {
    backgroundColor: AppColor.primary + "aa",
  },
  submitButtonText: {
    color: AppColor.white,
    fontFamily: Primary400,
    fontSize: 18,
  },
});

export default CancelOrderScreen;
