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
import { AppColor, Mulish700, Mulish400 } from "../utils/theme";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FastImage from "@d11/react-native-fast-image";
import AppHeader from "../components/AppHeader";
import { cancelFoodOrder_API } from "../apiFolder/appAPI";

const CANCEL_REASONS = [
  { id: 1, label: "Order by mistake", value: "order_mistake" },
  { id: 2, label: "No response from food truck", value: "no_response" },
  { id: 3, label: "Takes too much time", value: "too_much_time" },
  { id: 4, label: "Other", value: "other" },
];

const CancelOrderScreen = ({ route }) => {
  const [selectedReason, setSelectedReason] = useState(null);
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customReasonError, setCustomReasonError] = useState("");

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const orderDetails = route?.params?.order || null;

  const handleReasonToggle = useCallback((reasonValue) => {
    setSelectedReason((prev) => {
      const newValue = prev === reasonValue ? null : reasonValue;

      if (newValue !== "other") {
        setCustomReason("");
        setCustomReasonError("");
      }

      return newValue;
    });
  }, []);

  const validateForm = useCallback(() => {
    if (!selectedReason) {
      Alert.alert(
        "Validation Error",
        "Please select a reason for cancellation."
      );
      return false;
    }

    if (selectedReason === "other") {
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
  }, [selectedReason, customReason]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const payload = {
        orderStatus: "CANCEL",
        cancelReason:
          selectedReason === "other" ? customReason.trim() : selectedReason,
      };

      const response = await cancelFoodOrder_API(orderDetails?._id, payload);

      if (response?.success) {
        Alert.alert(
          "Order Cancelled",
          "Your order has been cancelled successfully. Refund will be processed within 3-5 business days.",
          [
            {
              text: "OK",
              onPress: () => {
                navigation.goBack();
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        throw new Error(response?.message || "Failed to cancel order");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      Alert.alert(
        "Error",
        error.message ||
          "Failed to cancel order. Please try again or contact support.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, selectedReason, customReason, orderDetails, navigation]);

  const isOtherSelected = selectedReason === "other";
  const canSubmit = !!selectedReason && !isSubmitting;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />
      <AppHeader headerTitle="Cancel Order" />

      <KeyboardAvoidingView
        style={styles.innerContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
                Order #{orderDetails.orderNumber || orderDetails._id} •{" "}
                {orderDetails.foodTruck?.name}
              </Text>
            </View>
          )}

          <View style={styles.card}>
            {CANCEL_REASONS.map((reason) => (
              <Checkbox.Item
                key={reason.id}
                label={reason.label}
                status={
                  selectedReason === reason.value ? "checked" : "unchecked"
                }
                onPress={() => handleReasonToggle(reason.value)}
                color={AppColor.primary}
                uncheckedColor={AppColor.primary}
                labelStyle={styles.reasonText}
                mode="android"
                rippleColor={AppColor.primary + "10"}
                style={styles.checkboxItem}
              />
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
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.buttonContainer, { marginBottom: insets.bottom }]}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            !canSubmit && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.7}
        >
          {isSubmitting ? (
            <ActivityIndicator color={AppColor.white} />
          ) : (
            <Text style={styles.submitButtonText}>Cancel Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
    flexGrow: 1,
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
    fontFamily: Mulish700,
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
    fontFamily: Mulish400,
    fontSize: 14,
    color: AppColor.textSecondary,
    textAlign: "center",
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
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  checkboxItem: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  reasonText: {
    fontFamily: Mulish400,
    fontSize: 16,
    color: AppColor.text,
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
    fontFamily: Mulish400,
    fontSize: 16,
    color: AppColor.text,
    minHeight: 80,
  },
  inputError: {
    borderColor: AppColor.error,
  },
  errorText: {
    fontFamily: Mulish400,
    fontSize: 12,
    color: AppColor.error,
    marginTop: 4,
    marginLeft: 4,
  },
  characterCount: {
    fontFamily: Mulish400,
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
    fontFamily: Mulish400,
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
    fontFamily: Mulish700,
    fontSize: 18,
  },
});

export default CancelOrderScreen;
