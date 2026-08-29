import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator as NativeIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ScrollView,
  Pressable,
} from "react-native";
import {
  ActivityIndicator,
  Divider,
  IconButton,
  Snackbar,
} from "react-native-paper";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useDispatch } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  EnvironmentEnum,
  PaymentMethodNameEnum,
  PaymentRequest,
  SupportedNetworkEnum,
} from "@rnw-community/react-native-payments";
import Config from "../config/env";
import StatusBarManager from "../components/StatusBarManager";
import TipSelector from "../components/TipSelector";
import { AppColor, Mulish400, Mulish600, Mulish700 } from "../utils/theme";
import { onlinePyamentApplicablePlanList } from "../utils/constants";
import { paymentCheckout_API, placeFoodOrder_API } from "../apiFolder/appAPI";
import { assertGooglePayConfiguration, normalizeWalletBillingAddress } from "../helpers/walletBillingAddress.helper";
import { applyTipAmount, calculateFinalTotal } from "../helpers/tip.helper";
import { completeWalletResponseSafely, logWalletCheckoutDiagnostic } from "../helpers/walletCheckoutDiagnostics.helper";
import { clearCurrentOrder } from "../redux/slices/orderSlice";
import moment from "moment";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

import Apple_Pay_Mark from "../assets/images/Apple_Pay_Mark.svg";
import Tooltip from "react-native-walkthrough-tooltip";

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
    // The installed payments library maps this flag to Apple's
    // requiredBillingContactFields postal-address request.
    requestBillingAddress: true,
    requestPayerEmail: false,
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

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error?.message ||
  error?.message ||
  fallback;

const normalizeApplePayBillingAddress = (billingAddress) => {
  if (!billingAddress || typeof billingAddress !== "object") return undefined;

  const normalizeText = (value) =>
    typeof value === "string" ? value.trim() : undefined;

  const normalized = {
    address1: normalizeText(billingAddress.address1),
    locality: normalizeText(billingAddress.locality),
    administrativeArea: normalizeText(billingAddress.administrativeArea),
    postalCode: normalizeText(billingAddress.postalCode),
    country: normalizeText(billingAddress.countryCode || billingAddress.country)?.toUpperCase(),
  };

  return Object.values(normalized).some(Boolean) ? normalized : undefined;
};

const PaymentProcessingScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const {
    orderDetail = null,
    foodTruckDetail = null,
    checkoutTime = null,
    finalAmount = null,
    validatedDetail = null,
  } = route.params || {};

  const [dataLoading, setDataLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(null);
  const [tipAmount, setTipAmount] = useState(0);
  const tipAmountRef = useRef(0);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "success",
  });
  const [toolTipVisible, setToolTipVisible] = useState(false);

  const showSnackbar = ({ message, type = "success" }) => {
    setSnackbar({ visible: true, message, type });
  };

  const toAmount = (val) => {
    const n = parseFloat(val);
    return Number.isFinite(n) ? n.toFixed(2) : "0.00";
  };

  const isDelivery =
    validatedDetail?.fulfillmentType === "DELIVERY" ||
    Number(validatedDetail?.deliveryFee || 0) > 0;

  const handleTipChange = (nextTipAmount) => {
    applyTipAmount(nextTipAmount, tipAmountRef, setTipAmount);
  };

  const handlePayment = async ({ paymentMethod = "cashOnPickup" }) => {
    const paymentTipAmount = tipAmountRef.current;
    setPaymentLoading(paymentMethod);
    try {
      if (!paymentMethod || paymentMethod === "cashOnPickup") {
        try {
          const response = await placeFoodOrder_API({
            ...orderDetail,
            tipsAmount: paymentTipAmount,
          });
          console.log("Order placed response:", response);
          if (response?.success && response?.data) {
            dispatch(clearCurrentOrder());
            navigation.navigate("orderPlacedScreen", {
              orderNumber: response?.data?.order?.orderNumber,
            });
          }
        } catch (error) {
          console.error("Order failed:", error);
          showSnackbar({
            message:
              "Payment failed. Please try with different payment method.",
            type: "error",
          });
        }
      } else {
        const payableAmount = toAmount(calculateFinalTotal(finalAmount, paymentTipAmount));
        const DISPLAY_DATA = {
          displayItems: [
            {
              label: "Item Total",
              amount: {
                currency: "USD",
                value: toAmount(validatedDetail?.subTotal),
              },
            },
            {
              label: "Discount",
              amount: {
                currency: "USD",
                value: `-${toAmount(validatedDetail?.discount)}`,
              },
            },
            {
              label: "Sales Tax",
              amount: {
                currency: "USD",
                value: toAmount(validatedDetail?.taxAmount),
              },
            },
            ...(isDelivery
              ? [
                  {
                    label: "Delivery Fee",
                    amount: {
                      currency: "USD",
                      value: toAmount(validatedDetail?.deliveryFee),
                    },
                  },
                  {
                    label: "Driver Tip",
                    amount: {
                      currency: "USD",
                      value: toAmount(validatedDetail?.tip),
                    },
                  },
                ]
              : []),
            {
              label: "Payment Processing Fee",
              amount: {
                currency: "USD",
                value: toAmount(validatedDetail?.paymentProcessingFee),
              },
            },
            {
              label: "Food Truck Tip",
              amount: {
                currency: "USD",
                value: toAmount(paymentTipAmount),
              },
            },
          ],
          total: {
            label: `${foodTruckDetail?.name || "Food Truck"} (via ROUND THE CORNER LLC)`,
            amount: { currency: "USD", value: payableAmount },
          },
        };

        const paymentRequest = new PaymentRequest(
          [
            Platform.OS === "ios"
              ? APPLE_PAY_METHOD_DATA
              : ANDROID_PAY_METHOD_DATA,
          ],
          DISPLAY_DATA,
        );

        let walletStage = "canMakePayment";
        let paymentResponse;
        let paymentResponseSettled = false;
        let isPaymentPossible;
        try {
          isPaymentPossible = await paymentRequest.canMakePayment();
        } catch (error) {
          logWalletCheckoutDiagnostic(walletStage, error);
          throw error;
        }
        if (!isPaymentPossible) {
          logWalletCheckoutDiagnostic(walletStage, new Error("Wallet unavailable"));
          showSnackbar({
            message: "Please try with different payment method.",
            type: "error",
          });
          return;
        }

        try {
          if (Platform.OS === "android") assertGooglePayConfiguration(Config);
          walletStage = "show";
          paymentResponse = await paymentRequest.show();
          walletStage = "token extraction";
          const paymentRawToken =
            Platform.OS === "ios"
              ? paymentResponse.details.applePayToken.paymentData
              : paymentResponse.details.androidPayToken.rawToken;

          const reqPayload = {
            paymentData: paymentRawToken,
            paymentMethod:
              paymentMethod === "googlePay"
                ? "GOOGLE_PAY"
                : paymentMethod === "applePay"
                  ? "APPLE_PAY"
                  : "CASH_ON_PICKUP",
            amount: String(payableAmount),
            billingAddress: Platform.OS === "ios"
              ? normalizeApplePayBillingAddress(paymentResponse.details.billingAddress)
              : normalizeWalletBillingAddress(paymentResponse.details.billingAddress, {
                  email: paymentResponse.details.payerEmail,
                  phone: paymentResponse.details.payerPhone,
                  firstName: paymentResponse.details.payerName?.givenName,
                  lastName: paymentResponse.details.payerName?.familyName,
                }),
          };

          // const respose_1 = {
          //   code: 200,
          //   success: true,
          //   data: {
          //     paymentsData: {
          //       userId: "691487f6ab521ebc73863e06",
          //       transactionId: "0",
          //       authCode: "000000",
          //       amount: "1.13",
          //       taxAmount: 0,
          //       subTotal: 0,
          //       paymentMethod: "APPLE_PAY",
          //       mode: "production",
          //       invoiceNumber: "INV-1765115052542",
          //       accountNumber: "XXXX8090",
          //       accountType: "Visa",
          //       date: "2025-12-07T13:44:13.060Z",
          //     },
          //   },
          //   error: null,
          //   message: "Payment checkout was successful",
          // };

          walletStage = "backend checkout";
          const respose_1 = await paymentCheckout_API(reqPayload);
          if (respose_1.success && respose_1.data) {
            showSnackbar({
              message: "Payment successful. Thank you!",
              type: "success",
            });
            const respose_2 = await placeFoodOrder_API({
              ...orderDetail,
              paymentMethod:
                paymentMethod === "googlePay"
                  ? "GOOGLE_PAY"
                  : paymentMethod === "applePay"
                    ? "APPLE_PAY"
                    : "COD", //'COD', 'APPLE_PAY', 'GOOGLE_PAY', 'CARD'
              paymentStatus: "PAID", //'PENDING', 'PAID'
              transactionId: respose_1.data.paymentsData.transactionId,
              authCode: respose_1.data.paymentsData.authCode,
              invoiceNumber: respose_1.data.paymentsData.invoiceNumber,
              accountNumber: respose_1.data.paymentsData.accountNumber,
              accountType: respose_1.data.paymentsData.accountType,
              tipsAmount: paymentTipAmount,
            });
            if (respose_2.success && respose_2.data) {
              dispatch(clearCurrentOrder());
              navigation.navigate("orderPlacedScreen", {
                orderNumber: respose_2?.data?.order?.orderNumber,
              });
            }
          }

          completeWalletResponseSafely(paymentResponse, "success");
          paymentResponseSettled = true;
        } catch (error) {
          logWalletCheckoutDiagnostic(walletStage, error);
          if (paymentResponse && !paymentResponseSettled) {
            completeWalletResponseSafely(paymentResponse, "fail");
            paymentResponseSettled = true;
          }
          showSnackbar({
            message: getErrorMessage(
              error,
              "Payment failed. Please try with different payment method.",
            ),
            type: "error",
          });
        }
      }
    } catch (error) {
      showSnackbar({
        message: "Payment failed. Please try with different payment method.",
        type: "error",
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const currentTime = moment();
      const checkoutMoment = moment(checkoutTime);
      if (!checkoutMoment.isValid()) {
        navigation.goBack();
        return;
      }
      const differenceInMinutes = currentTime.diff(checkoutMoment, "minutes");
      if (differenceInMinutes > 10) {
        navigation.goBack();
        return;
      }

      setTimeout(() => {
        setDataLoading(false);
      }, 1000);
    }, []),
  );

  const summaryData = [
    {
      label: "Item Total",
      value: `$${toAmount(validatedDetail?.subTotal)}`,
    },
    {
      label: "Discount",
      value: `- $${toAmount(validatedDetail?.discount)}`,
    },
    {
      label: "Sales Tax",
      value: `$${toAmount(validatedDetail?.taxAmount)}`,
    },
    ...(isDelivery
      ? [
          {
            label: "Delivery Fee",
            value: `$${toAmount(validatedDetail?.deliveryFee)}`,
          },
          {
            label: "Driver Tip",
            value: `$${toAmount(validatedDetail?.tip)}`,
          },
        ]
      : []),
    {
      label: "Payment Processing Fee",
      value: `$${toAmount(validatedDetail?.paymentProcessingFee)}`,
    },
  ];

  const ItemContainer = ({ title, value }) => {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginVertical: 2,
        }}
      >
        <Text style={{ fontFamily: Mulish600, fontSize: 14 }}>{title}:</Text>
        <Text style={{ fontFamily: Mulish600, fontSize: 14 }}>{value}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={{ width: "20%" }}>
            <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
          </View>
          <Text style={styles.headerTitle}>{"Payment"}</Text>
          <View style={{ width: "20%" }} />
        </View>
      </View>

      {dataLoading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <NativeIndicator size="large" color={AppColor.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.subContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.paymentBox}>
            {/* Payment Summary */}
            <>
              <Text style={styles.paymentTitleTxt}>Payment summary</Text>
              {summaryData.map(({ label, value }) => (
                <ItemContainer key={label} title={label} value={value} />
              ))}
              <Divider style={{ marginVertical: 10 }} />
              <ItemContainer
                key={"Pre-Tip Total"}
                title={"Pre-Tip Total"}
                value={`$${toAmount(finalAmount)}`}
              />
              <ItemContainer
                key={"Food Truck Tip"}
                title={"Food Truck Tip"}
                value={`$${toAmount(tipAmount)}`}
              />
              <Divider style={{ marginVertical: 10 }} />
              <ItemContainer
                key={"Final Total"}
                title={"Final Total"}
                value={`$${toAmount(calculateFinalTotal(finalAmount, tipAmount))}`}
              />
            </>

            {/* Tip */}
            <>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 20,
                }}
              >
                <Text style={styles.paymentTitleTxt}>
                  {"Add a food truck tip "}
                  <Text style={{ fontFamily: Mulish400, fontSize: 14 }}>
                    (optional)
                  </Text>
                </Text>
                <Tooltip
                  animated={true}
                  disableShadow={true}
                  placement="bottom"
                  isVisible={toolTipVisible}
                  backgroundColor="rgba(0,0,0,0)"
                  arrowSize={{
                    width: 16,
                    height: 8,
                    color: AppColor.text,
                  }}
                  contentStyle={{
                    padding: 18,
                    borderRadius: 8,
                    backgroundColor: AppColor.text,
                  }}
                  content={
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: Mulish400,
                        color: AppColor.white,
                      }}
                    >
                      {
                        "Food truck tips are clearly shown and passed 100% to the food truck owner, with no deductions."
                      }
                    </Text>
                  }
                  onClose={() => setToolTipVisible(false)}
                >
                  <IconButton
                    icon="information"
                    size={18}
                    style={{
                      height: 18,
                      width: 18,
                      marginTop: 10,
                    }}
                    onPress={() => setToolTipVisible(true)}
                  />
                </Tooltip>
              </View>
              <TipSelector
                preTipTotal={parseFloat(finalAmount) || 0}
                onTipChange={handleTipChange}
              />
            </>

            {/* Payment Method */}
            <>
              <Text style={[styles.paymentTitleTxt, { marginTop: 20 }]}>
                Payment method
              </Text>

              {/* Cash On Pickup  */}
              {/* <TouchableOpacity
                onPress={() => handlePayment({ paymentMethod: "cashOnPickup" })}
                activeOpacity={0.7}
                style={styles.paymentOption}
              >
                <View style={styles.paymentOptionContextContainer}>
                  {paymentLoading === "cashOnPickup" ? (
                    <ActivityIndicator color={AppColor.primary} />
                  ) : (
                    <Text style={styles.paymentText}>{"Cash on Pickup"}</Text>
                  )}
                </View>
              </TouchableOpacity> */}

              {Platform.OS === "android" &&
                onlinePyamentApplicablePlanList.includes(
                  foodTruckDetail?.plan?.slug,
                ) && (
                  <TouchableOpacity
                    onPress={() =>
                      handlePayment({ paymentMethod: "googlePay" })
                    }
                    activeOpacity={0.7}
                    style={styles.paymentOption}
                  >
                    <View style={styles.paymentOptionContextContainer}>
                      {paymentLoading === "googlePay" ? (
                        <ActivityIndicator color={AppColor.primary} />
                      ) : (
                        <Image
                          source={require("../assets/images/GPay.png")}
                          style={{ height: 36 }}
                          resizeMode="contain"
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                )}

              {Platform.OS === "ios" &&
                onlinePyamentApplicablePlanList.includes(
                  foodTruckDetail?.plan?.slug,
                ) && (
                  <TouchableOpacity
                    onPress={() => handlePayment({ paymentMethod: "applePay" })}
                    activeOpacity={0.7}
                    style={styles.paymentOption}
                  >
                    <View style={styles.paymentOptionContextContainer}>
                      {paymentLoading === "applePay" ? (
                        <ActivityIndicator color={AppColor.primary} />
                      ) : (
                        <Apple_Pay_Mark height={46} />
                      )}
                    </View>
                  </TouchableOpacity>
                )}
            </>
          </View>
        </ScrollView>
      )}

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={3000}
        style={[
          styles.snackbar,
          {
            backgroundColor:
              snackbar.type === "success" ? AppColor.primary : "#FF5252",
          },
        ]}
        action={{
          label: "Dismiss",
          onPress: () => setSnackbar({ ...snackbar, visible: false }),
          textColor: AppColor.white,
        }}
      >
        {snackbar.message}
      </Snackbar>
    </View>
  );
};

export default PaymentProcessingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColor.white,
  },
  header: {
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: AppColor.border,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: Mulish700,
    textAlign: "center",
    color: AppColor.text,
  },

  subContainer: {
    flexGrow: 1,
  },

  paymentBox: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  paymentTitleTxt: {
    fontFamily: Mulish700,
    fontSize: 18,
    marginVertical: 10,
  },
  paymentOption: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: AppColor.black,
    backgroundColor: AppColor.white,
    ...Platform.select({
      ios: {
        shadowColor: AppColor.black,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  paymentOptionActive: {
    borderWidth: 1,
    borderColor: AppColor.primary,
  },
  paymentOptionContextContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentText: {
    fontFamily: Mulish600,
    fontSize: 18,
  },
});
