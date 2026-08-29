import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  EnvironmentEnum,
  PaymentMethodNameEnum,
  PaymentRequest,
  SupportedNetworkEnum,
} from "@rnw-community/react-native-payments";
import AppHeader from "../components/AppHeader";
import StatusBarManager from "../components/StatusBarManager";
import Config from "../config/env";
import { AppColor } from "../utils/theme";
import {
  callMarketplacePayment_API,
  checkoutMarketplacePayment_API,
  getMarketplacePaymentById_API,
  updateMarketplaceFinalPaymentTip_API,
} from "../apiFolder/appAPI";
import { formatMoney, styles } from "./marketplaceShared";
import { formatMarketplaceStatus } from "../helpers/marketplaceStatus.helper";
import { assertGooglePayConfiguration, normalizeWalletBillingAddress } from "../helpers/walletBillingAddress.helper";
import { completeWalletResponseSafely, logWalletCheckoutDiagnostic } from "../helpers/walletCheckoutDiagnostics.helper";

const RTC_PHONE = "800-410-7053";

const APPLE_PAY_METHOD_DATA = {
  supportedMethods: PaymentMethodNameEnum.ApplePay,
  data: {
    merchantIdentifier: Config.APPLE_PAY_MERCHANT_ID,
    supportedNetworks: [
      SupportedNetworkEnum.Visa,
      SupportedNetworkEnum.Mastercard,
    ],
    countryCode: Config.PAYMENT_COUNTRY_CODE,
    currencyCode: Config.PAYMENT_CURRENCY_CODE,
    requestBillingAddress: true,
    requestPayerEmail: true,
    requestPayerName: true,
    requestPayerPhone: true,
    requestShipping: false,
  },
};

const ANDROID_PAY_METHOD_DATA = {
  supportedMethods: PaymentMethodNameEnum.AndroidPay,
  data: {
    supportedNetworks: [
      SupportedNetworkEnum.Visa,
      SupportedNetworkEnum.Mastercard,
    ],
    environment: String(Config.GOOGLE_PAY_ENVIRONMENT).toUpperCase() === "TEST"
      ? EnvironmentEnum.TEST
      : EnvironmentEnum.PRODUCTION,
    countryCode: Config.PAYMENT_COUNTRY_CODE,
    currencyCode: Config.PAYMENT_CURRENCY_CODE,
    requestBillingAddress: true,
    requestPayerEmail: true,
    requestPayerName: true,
    requestPayerPhone: true,
    requestShipping: false,
    gatewayConfig: {
      gateway: Config.GOOGLE_PAY_GATEWAY,
      gatewayMerchantId: Config.CYBERSOURCE_MERCHANT_ID,
    },
  },
};

const toAmount = (value) => Number(value || 0).toFixed(2);

const getPaymentHelpText = (payment) => {
  if (payment?.payment_type === "COORDINATOR_AWARD_FEE") {
    return "This is the RTC processing fee for the awarded event amount. The vendor award payment is handled separately after the successful event.";
  }
  if (payment?.payment_type === "FINAL_EVENT_PAYMENT") {
    return "This payment closes out the event and pays the awarded vendor amount plus any tip.";
  }

  return "Complete this marketplace payment to continue.";
};

const MarketplacePaymentScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [payment, setPayment] = useState(route?.params?.payment || null);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(null);
  const [tipAmount, setTipAmount] = useState(
    String(route?.params?.payment?.tip_amount || "")
  );
  const paymentId = route?.params?.paymentId || payment?.payment_id;
  const returnScreen = route?.params?.returnScreen;
  const returnParams = route?.params?.returnParams || {};

  const loadPayment = async () => {
    if (!paymentId) return;
    setLoading(true);
    try {
      const response = await getMarketplacePaymentById_API(paymentId);
      if (response?.success) {
        const nextPayment = response.data?.marketplacePayment;
        setPayment(nextPayment);
        setTipAmount(nextPayment?.tip_amount ? String(nextPayment.tip_amount) : "");
        if (nextPayment?.payment_status === "PAID" && returnScreen) {
          navigation.replace(returnScreen, returnParams);
        }
      }
    } catch (error) {
      Alert.alert("Payment Status", error?.message || "Unable to refresh payment.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPayment();
    }, [paymentId])
  );

  const payWithWallet = async (method) => {
    if (!payment) return;
    setPaymentLoading(method);
    let paymentRequest;
    let paymentResponse;
    let paymentResponseSettled = false;
    let walletStage = "canMakePayment";
    try {
      let checkoutPayment = payment;
      if (payment.payment_type === "FINAL_EVENT_PAYMENT") {
        const normalizedTip = Number(tipAmount || 0);
        if (!Number.isFinite(normalizedTip) || normalizedTip < 0) {
          Alert.alert("Tip", "Enter a valid tip amount.");
          return;
        }
        const tipResponse = await updateMarketplaceFinalPaymentTip_API({
          paymentId: payment.payment_id,
          tipAmount: normalizedTip,
        });
        checkoutPayment = tipResponse?.data?.marketplacePayment || payment;
        setPayment(checkoutPayment);
      }
      const amount = toAmount(checkoutPayment.total_amount);
      paymentRequest = new PaymentRequest(
        [Platform.OS === "ios" ? APPLE_PAY_METHOD_DATA : ANDROID_PAY_METHOD_DATA],
        {
          displayItems: [
            {
              label: payment.payment_type?.replaceAll("_", " ") || "Marketplace Payment",
              amount: { currency: "USD", value: amount },
            },
          ],
          total: {
            label: "ROUND THE CORNER LLC",
            amount: { currency: "USD", value: amount },
          },
        }
      );

      const isPaymentPossible = await paymentRequest.canMakePayment();
      if (!isPaymentPossible) {
        logWalletCheckoutDiagnostic(walletStage, new Error("Wallet unavailable"));
        Alert.alert("Wallet Unavailable", "Please use another payment option.");
        return;
      }

      if (Platform.OS === "android") assertGooglePayConfiguration(Config);
      walletStage = "show";
      paymentResponse = await paymentRequest.show();
      walletStage = "token extraction";
      const paymentRawToken =
        Platform.OS === "ios"
          ? paymentResponse.details.applePayToken.paymentData
          : paymentResponse.details.androidPayToken.rawToken;

      walletStage = "backend checkout";
      const response = await checkoutMarketplacePayment_API({
        paymentId: payment.payment_id,
        payload: {
          payment_method: method === "googlePay" ? "GOOGLE_PAY" : "APPLE_PAY",
          payment_data: paymentRawToken,
          expected_total: Number(checkoutPayment.total_amount || 0),
          billing_address: normalizeWalletBillingAddress(paymentResponse.details.billingAddress, {
            email: paymentResponse.details.payerEmail,
            phone: paymentResponse.details.payerPhone,
            firstName: paymentResponse.details.payerName?.givenName,
            lastName: paymentResponse.details.payerName?.familyName,
          }),
        },
      });

      if (response?.success) {
        completeWalletResponseSafely(paymentResponse, "success");
        paymentResponseSettled = true;
        setPayment(response.data?.marketplacePayment);
        const agreementRequired = response.data?.routingResult?.agreement_required;
        Alert.alert(
          "Payment Confirmed",
          agreementRequired
            ? "DocuSign agreement has been sent. The award will finalize after signature."
            : "Marketplace payment is confirmed.",
          [
          {
            text: "OK",
            onPress: () =>
              returnScreen
                ? navigation.replace(returnScreen, returnParams)
                : navigation.goBack(),
          },
          ],
        );
      }
    } catch (error) {
      logWalletCheckoutDiagnostic(walletStage, error);
      if (paymentResponse && !paymentResponseSettled) {
        completeWalletResponseSafely(paymentResponse, "fail");
        paymentResponseSettled = true;
      }
      Alert.alert("Payment Failed", error?.message || "Please try again.");
    } finally {
      setPaymentLoading(null);
    }
  };

  const callRtc = async () => {
    try {
      if (paymentId) {
        const response = await callMarketplacePayment_API(paymentId);
        if (response?.data?.marketplacePayment) {
          setPayment(response.data.marketplacePayment);
        }
      }
    } catch (error) {
      Alert.alert("Call Payment", error?.message || "Unable to update payment status.");
    }
    Linking.openURL("tel:8004107053");
  };

  const paid = payment?.payment_status === "PAID";
  const processing = payment?.payment_status === "PROCESSING";
  const isFinalEventPayment = payment?.payment_type === "FINAL_EVENT_PAYMENT";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />
      <AppHeader headerTitle="Marketplace Payment" />
      <View style={styles.body}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {paid ? "Payment Confirmed" : "Awaiting Payment Confirmation"}
          </Text>
          <Text style={styles.meta}>
            Amount due: {formatMoney(payment?.total_amount || 0)}
          </Text>
          <Text style={styles.meta}>
            Type: {payment?.payment_type?.replaceAll("_", " ") || "Marketplace Payment"}
          </Text>
          <Text style={styles.meta}>Status: {formatMarketplaceStatus(payment?.payment_status)}</Text>
          <Text style={styles.meta}>{getPaymentHelpText(payment)}</Text>
        </View>

        {loading ? <ActivityIndicator color={AppColor.primary} /> : null}

        {processing ? (
          <Text style={[styles.meta, { marginTop: 12 }]}>
            Payment is processing. Refresh to see the completed status.
          </Text>
        ) : null}

        {!paid && !processing ? (
          <>
            {isFinalEventPayment ? (
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.label}>Optional tip</Text>
                <TextInput
                  value={tipAmount}
                  onChangeText={setTipAmount}
                  editable={!paymentLoading}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  style={styles.input}
                />
              </View>
            ) : null}
            {Platform.OS === "ios" ? (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.button}
                disabled={!!paymentLoading}
                onPress={() => payWithWallet("applePay")}
              >
                <Text style={styles.buttonText}>
                  {paymentLoading === "applePay" ? "Processing..." : "Apple Pay"}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.button}
                disabled={!!paymentLoading}
                onPress={() => payWithWallet("googlePay")}
              >
                <Text style={styles.buttonText}>
                  {paymentLoading === "googlePay" ? "Processing..." : "Google Pay"}
                </Text>
              </TouchableOpacity>
            )}

            {!isFinalEventPayment ? (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.secondaryButton}
                onPress={callRtc}
              >
                <Text style={styles.secondaryButtonText}>
                  Call RTC to Complete Payment
                </Text>
              </TouchableOpacity>
            ) : null}
          </>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.secondaryButton, { marginTop: 12 }]}
          onPress={loadPayment}
          disabled={loading}
        >
          <Text style={styles.secondaryButtonText}>
            {loading ? "Refreshing..." : "Refresh Payment Status"}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.meta, { marginTop: 12 }]}>
          RTC phone: {RTC_PHONE}
        </Text>
      </View>
    </View>
  );
};

export default MarketplacePaymentScreen;
