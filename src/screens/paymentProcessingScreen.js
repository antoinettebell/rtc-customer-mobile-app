import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator as NativeIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { ActivityIndicator, IconButton, Snackbar } from "react-native-paper";
import { useDispatch } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  EnvironmentEnum,
  PaymentMethodNameEnum,
  PaymentRequest,
  SupportedNetworkEnum,
} from "@rnw-community/react-native-payments";
import Config from "react-native-config";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor, Mulish400, Mulish600, Mulish700 } from "../utils/theme";
import { onlinePyamentApplicablePlanList } from "../utils/constants";
import { paymentCheckout_API, placeFoodOrder_API } from "../apiFolder/appAPI";
import { clearCurrentOrder } from "../redux/slices/orderSlice";
import moment from "moment";

import Apple_Pay_Mark from "../assets/images/Apple_Pay_Mark.svg";

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
    requestBillingAddress: false,
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
    environment: EnvironmentEnum.PRODUCTION,
    countryCode: Config.PAYMENT_COUNTRY_CODE,
    currencyCode: Config.PAYMENT_CURRENCY_CODE,
    requestBillingAddress: false,
    requestPayerEmail: false,
    requestShipping: false,
    gatewayConfig: {
      gateway: Config.ANDROID_PAYMENT_GATEWAY,
      gatewayMerchantId: Config.ANDROID_PAYMENT_GATEWAY_MERCHANT_ID,
    },
  },
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
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  const showSnackbar = ({ message, type = "success" }) => {
    setSnackbar({ visible: true, message, type });
  };

  const toAmount = (val) => {
    const n = parseFloat(val);
    return Number.isFinite(n) ? n.toFixed(2) : "0.00";
  };

  const handlePayment = async ({ paymentMethod = "cashOnPickup" }) => {
    setPaymentLoading(paymentMethod);
    try {
      if (!paymentMethod || paymentMethod === "cashOnPickup") {
        try {
          const response = await placeFoodOrder_API(orderDetail);
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
        const payableAmount = toAmount(finalAmount);
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
            {
              label: "Processing Fee",
              amount: {
                currency: "USD",
                value: toAmount(validatedDetail?.paymentProcessingFee),
              },
            },
          ],
          total: {
            label: foodTruckDetail?.name || "Food Truck",
            amount: { currency: "USD", value: payableAmount },
          },
        };

        const paymentRequest = new PaymentRequest(
          [
            Platform.OS === "ios"
              ? APPLE_PAY_METHOD_DATA
              : ANDROID_PAY_METHOD_DATA,
          ],
          DISPLAY_DATA
        );

        const isPaymentPossible = await paymentRequest.canMakePayment();
        if (!isPaymentPossible) {
          showSnackbar({
            message: "Please try with different payment method.",
            type: "error",
          });
          return;
        }

        try {
          const response = await paymentRequest.show();
          console.log("Payment UI Response:", response);

          const paymentRawToken =
            Platform.OS === "ios"
              ? response.details.applePayToken.paymentData
              : response.details.androidPayToken.rawToken;

          const reqPayload = {
            // paymentData: {
            //   data: "9/CYTcB0rjjCJsFnb6GxIeV7jc+MejfIY5o7uM39YIIFBXkW5NOSCqnMYCxyCHtuI6gMmfW1DB43D/CcP+SV11x33b4Go8HiGljGftFFs7X4GHtwRG1D1nMUc9vK7GCf17DWw8ZT1XvFpB7C1SehEEN1L/S3KOK7luJLFLgfiLtbGYa0ZAciUWOCYJBsOlHTU3gUB7eNllRbynQEzdJLP5oELiEB/d44iYDjlxX93CEpLZUY4qs5mpskloKSBADgKTCoDEeVtsmLAVL+iYs72Pfj+gt/3TxIpSOepq6uVld4Utx7VzFUOuGYaCkrFiQSGyiMRZzH0lTiEFqPGfi78pIkAt+bdywDx3MabPhVFt01bJB8+rZjhNx6HvaNaHxAJkeroTmC3GU01rn2m6XUGzCC4zYneqffqsFaWIQ=",
            //   signature:
            //     "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",
            //   header: {
            //     publicKeyHash: "RIPLjq/q7UqfvKVrv4elvNbnSzmcOs+e1x0AREFntKw=",
            //     ephemeralPublicKey:
            //       "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAERP17WG+VIJaPEQrI6ld7adkXe4sRlgE82VR7Ni4kDm/MPhcb1yZfLNUD1oZzfFoCAK0DRSDjVjvWaw2KJePVyA==",
            //     transactionId:
            //       "f321506b31e9cf4ec86db9ed32af4a4be4b2f92fa0bad98b157b7c91ad39c699",
            //   },
            //   version: "EC_v1",
            // },
            paymentData: paymentRawToken,
            paymentMethod:
              paymentMethod === "googlePay"
                ? "GOOGLE_PAY"
                : paymentMethod === "applePay"
                  ? "APPLE_PAY"
                  : "CASH_ON_PICKUP",
            amount: String(payableAmount),
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

          const respose_1 = await paymentCheckout_API(reqPayload);
          console.log("Payment Checkout Response => ", respose_1);
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
            });
            if (respose_2.success && respose_2.data) {
              dispatch(clearCurrentOrder());
              navigation.navigate("orderPlacedScreen", {
                orderNumber: respose_2?.data?.order?.orderNumber,
              });
            }
          }

          response.complete("success");
        } catch (error) {
          showSnackbar({
            message:
              "Payment failed. Please try with different payment method.",
            type: "error",
          });
          paymentRequest.abort();
          console.log("Payment Request Aborted:", error);
        }
      }
    } catch (error) {
      showSnackbar({
        message: "Payment failed. Please try with different payment method.",
        type: "error",
      });
      console.log("handlePayment error", error);
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
    }, [])
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
    {
      label: "Processing Fee",
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
        <View style={styles.subContainer}>
          <View style={styles.paymentBox}>
            <Text style={styles.paymentTitleTxt}>Payment Summary:</Text>
            {summaryData.map(({ label, value }) => (
              <ItemContainer key={label} title={label} value={value} />
            ))}
            <ItemContainer
              key={"Total"}
              title={"Total"}
              value={`$${toAmount(finalAmount)}`}
            />

            <Text style={[styles.paymentTitleTxt, { marginTop: 20 }]}>
              Payment Method:
            </Text>

            <TouchableOpacity
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
            </TouchableOpacity>

            {Platform.OS === "android" &&
              onlinePyamentApplicablePlanList.includes(
                foodTruckDetail?.plan?.slug
              ) && (
                <TouchableOpacity
                  onPress={() => handlePayment({ paymentMethod: "googlePay" })}
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
                foodTruckDetail?.plan?.slug
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
          </View>
        </View>
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
    flex: 1,
    justifyContent: "space-between",
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
