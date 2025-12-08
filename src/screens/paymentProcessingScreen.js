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

let PAYMENT_METHODS = [
  {
    type: "cashOnPickup",
    method: "Cash on Pickup",
    icon: require("../assets/images/cash-on-pickup.png"),
    style: { height: 32, width: 40 },
  },
  ...Platform.select({
    android: [
      {
        type: "googlePay",
        method: "Google Pay",
        icon: require("../assets/images/google-pay.png"),
        style: { height: 36, width: 40 },
      },
    ],
    ios: [
      {
        type: "applePay",
        method: "Apple Pay",
        icon: require("../assets/images/apple-pay.png"),
        style: { height: 36, width: 40 },
      },
    ],
  }),
];

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
    environment: EnvironmentEnum.TEST,
    countryCode: Config.PAYMENT_COUNTRY_CODE,
    currencyCode: Config.PAYMENT_CURRENCY_CODE,
    requestBillingAddress: false,
    requestPayerEmail: false,
    requestShipping: false,
    gatewayConfig: {
      gateway: "example",
      gatewayMerchantId: "exampleGatewayMerchantId",
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
  } = route.params || {};

  const [dataLoading, setDataLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cashOnPickup");
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

  const handlePayment = async () => {
    setPaymentLoading(true);
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
          total: {
            label: "Total",
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
            //     "MIAGCSqGSIb3DQEHAqCAMIACAQExDTALBglghkgBZQMEAgEwgAYJKoZIhvcNAQcBAACggDCCA+MwggOIoAMCAQICCBZjTIsOMFcXMAoGCCqGSM49BAMCMHoxLjAsBgNVBAMMJUFwcGxlIEFwcGxpY2F0aW9uIEludGVncmF0aW9uIENBIC0gRzMxJjAkBgNVBAsMHUFwcGxlIENlcnRpZmljYXRpb24gQXV0aG9yaXR5MRMwEQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUzAeFw0yNDA0MjkxNzQ3MjdaFw0yOTA0MjgxNzQ3MjZaMF8xJTAjBgNVBAMMHGVjYy1zbXAtYnJva2VyLXNpZ25fVUM0LVBST0QxFDASBgNVBAsMC2lPUyBTeXN0ZW1zMRMwEQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUzBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABMIVd+3r1seyIY9o3XCQoSGNx7C9bywoPYRgldlK9KVBG4NCDtgR80B+gzMfHFTD9+syINa61dTv9JKJiT58DxOjggIRMIICDTAMBgNVHRMBAf8EAjAAMB8GA1UdIwQYMBaAFCPyScRPk+TvJ+bE9ihsP6K7/S5LMEUGCCsGAQUFBwEBBDkwNzA1BggrBgEFBQcwAYYpaHR0cDovL29jc3AuYXBwbGUuY29tL29jc3AwNC1hcHBsZWFpY2EzMDIwggEdBgNVHSAEggEUMIIBEDCCAQwGCSqGSIb3Y2QFATCB/jCBwwYIKwYBBQUHAgIwgbYMgbNSZWxpYW5jZSBvbiB0aGlzIGNlcnRpZmljYXRlIGJ5IGFueSBwYXJ0eSBhc3N1bWVzIGFjY2VwdGFuY2Ugb2YgdGhlIHRoZW4gYXBwbGljYWJsZSBzdGFuZGFyZCB0ZXJtcyBhbmQgY29uZGl0aW9ucyBvZiB1c2UsIGNlcnRpZmljYXRlIHBvbGljeSBhbmQgY2VydGlmaWNhdGlvbiBwcmFjdGljZSBzdGF0ZW1lbnRzLjA2BggrBgEFBQcCARYqaHR0cDovL3d3dy5hcHBsZS5jb20vY2VydGlmaWNhdGVhdXRob3JpdHkvMDQGA1UdHwQtMCswKaAnoCWGI2h0dHA6Ly9jcmwuYXBwbGUuY29tL2FwcGxlYWljYTMuY3JsMB0GA1UdDgQWBBSUV9tv1XSBhomJdi9+V4UH55tYJDAOBgNVHQ8BAf8EBAMCB4AwDwYJKoZIhvdjZAYdBAIFADAKBggqhkjOPQQDAgNJADBGAiEAxvAjyyYUuzA4iKFimD4ak/EFb1D6eM25ukyiQcwU4l4CIQC+PNDf0WJH9klEdTgOnUTCKKEIkKOh3HJLi0y4iJgYvDCCAu4wggJ1oAMCAQICCEltL786mNqXMAoGCCqGSM49BAMCMGcxGzAZBgNVBAMMEkFwcGxlIFJvb3QgQ0EgLSBHMzEmMCQGA1UECwwdQXBwbGUgQ2VydGlmaWNhdGlvbiBBdXRob3JpdHkxEzARBgNVBAoMCkFwcGxlIEluYy4xCzAJBgNVBAYTAlVTMB4XDTE0MDUwNjIzNDYzMFoXDTI5MDUwNjIzNDYzMFowejEuMCwGA1UEAwwlQXBwbGUgQXBwbGljYXRpb24gSW50ZWdyYXRpb24gQ0EgLSBHMzEmMCQGA1UECwwdQXBwbGUgQ2VydGlmaWNhdGlvbiBBdXRob3JpdHkxEzARBgNVBAoMCkFwcGxlIEluYy4xCzAJBgNVBAYTAlVTMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE8BcRhBnXZIXVGl4lgQd26ICi7957rk3gjfxLk+EzVtVmWzWuItCXdg0iTnu6CP12F86Iy3a7ZnC+yOgphP9URaOB9zCB9DBGBggrBgEFBQcBAQQ6MDgwNgYIKwYBBQUHMAGGKmh0dHA6Ly9vY3NwLmFwcGxlLmNvbS9vY3NwMDQtYXBwbGVyb290Y2FnMzAdBgNVHQ4EFgQUI/JJxE+T5O8n5sT2KGw/orv9LkswDwYDVR0TAQH/BAUwAwEB/zAfBgNVHSMEGDAWgBS7sN6hWDOImqSKmd6+veuv2sskqzA3BgNVHR8EMDAuMCygKqAohiZodHRwOi8vY3JsLmFwcGxlLmNvbS9hcHBsZXJvb3RjYWczLmNybDAOBgNVHQ8BAf8EBAMCAQYwEAYKKoZIhvdjZAYCDgQCBQAwCgYIKoZIzj0EAwIDZwAwZAIwOs9yg1EWmbGG+zXDVspiv/QX7dkPdU2ijr7xnIFeQreJ+Jj3m1mfmNVBDY+d6cL+AjAyLdVEIbCjBXdsXfM4O5Bn/Rd8LCFtlk/GcmmCEm9U+Hp9G5nLmwmJIWEGmQ8Jkh0AADGCAYgwggGEAgEBMIGGMHoxLjAsBgNVBAMMJUFwcGxlIEFwcGxpY2F0aW9uIEludGVncmF0aW9uIENBIC0gRzMxJjAkBgNVBAsMHUFwcGxlIENlcnRpZmljYXRpb24gQXV0aG9yaXR5MRMwEQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUwIIFmNMiw4wVxcwCwYJYIZIAWUDBAIBoIGTMBgGCSqGSIb3DQEJAzELBgkqhkiG9w0BBwEwHAYJKoZIhvcNAQkFMQ8XDTI1MTEyNzA5NDgxOVowKAYJKoZIhvcNAQk0MRswGTALBglghkgBZQMEAgGhCgYIKoZIzj0EAwIwLwYJKoZIhvcNAQkEMSIEIMVEC7ejTBdJNVT6z/yHxipZlUGsqWIyHdTh1GDrhJuEMAoGCCqGSM49BAMCBEcwRQIgeb4mpaGr0gPLe7Fhr125gQC/Ms9CvawoVcXSM3vwbLACIQCZUHLbITZSMDgNOHzWW9vmMbeIIpY9EAv00gWWnQNB+wAAAAAAAA==",
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
      console.log("orderDetail", orderDetail);
      console.log("foodTruckDetail", foodTruckDetail);
      console.log("checkoutTime", checkoutTime);
      console.log("finalAmount", finalAmount);

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

      const isOnlinePaymentApplicable =
        onlinePyamentApplicablePlanList.includes(foodTruckDetail?.plan?.slug);
      if (!isOnlinePaymentApplicable) {
        PAYMENT_METHODS = PAYMENT_METHODS.filter(
          (item) => item.type !== "googlePay" && item.type !== "applePay"
        );
      }

      setTimeout(() => {
        setDataLoading(false);
      }, 1000);
    }, [])
  );

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
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={styles.paymentTitleTxt}>Final Amount: </Text>
              <Text
                style={styles.paymentTitleTxt}
              >{`$${finalAmount.toFixed(2)}`}</Text>
            </View>
            <Text style={styles.paymentTitleTxt}>Select Payment Method</Text>
            {PAYMENT_METHODS.map(({ type, method, icon, style }) => (
              <TouchableOpacity
                key={type}
                onPress={() => setPaymentMethod(type)}
                activeOpacity={0.7}
                style={[
                  styles.paymentOption,
                  paymentMethod === type && styles.paymentOptionActive,
                ]}
              >
                <View style={styles.paymentOptionContextContainer}>
                  <Image
                    source={icon}
                    style={[styles.paymentIcon, style]}
                    resizeMode="contain"
                  />
                  <Text style={styles.paymentText}>{method}</Text>
                </View>
                <View style={styles.radioContainer}>
                  <View
                    style={[
                      styles.radioOuter,
                      paymentMethod === type && styles.radioOuterActive,
                    ]}
                  >
                    {paymentMethod === type && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Order btn container */}
          <View
            style={[
              styles.bottomContainer,
              {
                paddingBottom: insets.bottom + 14,
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.nextBtn}
              onPress={() => handlePayment()}
              disabled={paymentLoading}
            >
              {paymentLoading ? (
                <ActivityIndicator size="small" color={AppColor.white} />
              ) : (
                <Text style={styles.nextBtnText}>Next</Text>
              )}
            </TouchableOpacity>
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
    marginHorizontal: 16,
    marginVertical: 10,
  },
  paymentTitleTxt: {
    fontFamily: Mulish700,
    fontSize: 18,
    marginVertical: 10,
  },
  paymentOption: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    // paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: AppColor.white,
    ...Platform.select({
      ios: {
        shadowColor: AppColor.black,
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  paymentOptionActive: {
    borderWidth: 1,
    borderColor: AppColor.primary,
    // backgroundColor: "#FFF6ED",
  },
  paymentOptionContextContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioContainer: {
    width: 24,
    alignItems: "center",
    marginRight: 8,
  },
  radioOuter: {
    height: 18,
    width: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: {
    borderColor: AppColor.primary,
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: AppColor.primary,
  },
  paymentIcon: {
    marginRight: 8,
  },
  paymentText: {
    fontFamily: Mulish600,
    fontSize: 15,
  },

  bottomContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: AppColor.borderColor,
  },
  nextBtn: {
    height: 56,
    borderRadius: 8,
    backgroundColor: AppColor.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtnText: {
    color: AppColor.white,
    fontFamily: Mulish700,
    fontSize: 16,
  },
});

// ==========================================================

// import React, { useMemo, useState } from "react";
// import {
//   Alert,
//   Platform,
//   SafeAreaView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import {
//   PaymentRequest,
//   PaymentMethodNameEnum,
//   SupportedNetworkEnum,
//   EnvironmentEnum,
// } from "@rnw-community/react-native-payments";

// const applePayMerchantIdentifier = "merchant.roundthecorner.vendor";

// function App() {
//   // Apple Pay
//   const iosPaymentMethod = {
//     supportedMethods: PaymentMethodNameEnum.ApplePay,
//     data: {
//       merchantIdentifier: applePayMerchantIdentifier,
//       supportedNetworks: [
//         SupportedNetworkEnum.Visa,
//         SupportedNetworkEnum.Mastercard,
//       ],
//       countryCode: "US",
//       currencyCode: "USD",
//       requestBillingAddress: false,
//       requestPayerEmail: false,
//       requestShipping: false,
//     },
//   };

//   // Android Pay
//   const androidPaymentMethod = {
//     supportedMethods: PaymentMethodNameEnum.AndroidPay,
//     data: {
//       supportedNetworks: [
//         SupportedNetworkEnum.Visa,
//         SupportedNetworkEnum.Mastercard,
//       ],
//       environment: EnvironmentEnum.TEST,
//       countryCode: "US",
//       currencyCode: "USD",
//       requestBillingAddress: false,
//       requestPayerEmail: false,
//       requestShipping: false,
//       gatewayConfig: {
//         gateway: "authorizenet",
//         gatewayMerchantId: "exampleGatewayMerchantId",
//       },
//     },
//   };

//   const [price, setPrice] = useState("0.10");
//   const [tax, setTax] = useState("0.00");

//   const toAmount = (val) => {
//     const n = parseFloat(val);
//     return Number.isFinite(n) ? n.toFixed(2) : "0.00";
//   };

//   const paymentDetails = useMemo(() => {
//     const priceValue = toAmount(price);
//     const taxValue = toAmount(tax);
//     const total = (parseFloat(priceValue) + parseFloat(taxValue)).toFixed(2);
//     return {
//       displayItems: [
//         { label: "Price", amount: { currency: "USD", value: priceValue } },
//         { label: "Taxes", amount: { currency: "USD", value: taxValue } },
//       ],
//       total: {
//         label: "Total",
//         amount: { currency: "USD", value: total },
//       },
//     };
//   }, [price, tax]);

//   // Update the handlers to use the payment request
//   const handleGooglePayPress = async () => {
//     try {
//       // Create a new payment request instance each time to handle cancellation properly
//       const paymentRequest = new PaymentRequest(
//         [androidPaymentMethod],
//         paymentDetails
//       );

//       const response = await paymentRequest.show();
//       console.log("Payment Response:", response);
//       Alert.alert("Payment Success", "Transaction completed successfully");
//       response.complete("success");
//     } catch (error) {
//       const errorMessage =
//         error instanceof Error ? error.message : "Unknown error occurred";
//       Alert.alert("Payment Error", errorMessage);
//     }
//   };

//   const handleApplePayPress = async () => {
//     try {
//       if (Platform.OS === "ios") {
//         const totalNumber = parseFloat(paymentDetails.total.amount.value);
//         if (totalNumber === 0) {
//           Alert.alert("Invalid Total", "Total must be greater than 0");
//           return;
//         }
//         // Create a new payment request instance each time to handle cancellation properly
//         const paymentRequest = new PaymentRequest(
//           [iosPaymentMethod],
//           paymentDetails
//         );

//         const response = await paymentRequest.show();
//         setTimeout(() => {
//           response.complete("success");
//           Alert.alert("Payment Success", "Transaction completed successfully");
//         }, 3000);
//       } else {
//         Alert.alert("Apple Pay", "Apple Pay is only available on iOS");
//       }
//     } catch (error) {
//       console.log("Payment Error => ", error);
//       const errorMessage =
//         error instanceof Error ? error.message : "Unknown error occurred";
//       Alert.alert("Payment Error", errorMessage);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <Text style={styles.title}>Payment - POC</Text>
//       <View style={styles.inputContainer}>
//         <Text style={styles.inputLabel}>Price</Text>
//         <TextInput
//           style={styles.input}
//           value={price}
//           onChangeText={setPrice}
//           keyboardType="decimal-pad"
//           placeholder="Enter price"
//         />
//         <Text style={[styles.inputLabel, { marginTop: 10 }]}>Taxes</Text>
//         <TextInput
//           style={styles.input}
//           value={tax}
//           onChangeText={setTax}
//           keyboardType="decimal-pad"
//           placeholder="Enter taxes"
//         />
//       </View>

//       {Platform.OS === "ios" ? (
//         <Text
//           style={[
//             styles.versionText,
//             { textTransform: "none", color: "#000000" },
//           ]}
//         >
//           {applePayMerchantIdentifier}
//         </Text>
//       ) : null}

//       {paymentDetails.displayItems?.map((item, index) => (
//         <View key={index} style={styles.detailRow}>
//           <Text style={styles.detailLabel}>{item.label}:</Text>
//           <Text style={styles.detailValue}>
//             {item.amount.currency} {item.amount.value}
//           </Text>
//         </View>
//       ))}
//       <View style={styles.totalRow}>
//         <Text style={styles.totalLabel}>{paymentDetails.total.label}:</Text>
//         <Text style={styles.totalValue}>
//           {paymentDetails.total.amount.currency}{" "}
//           {paymentDetails.total.amount.value}
//         </Text>
//       </View>

//       <View style={styles.buttonContainer}>
//         {Platform.OS === "android" && (
//           <TouchableOpacity
//             style={[styles.button, { backgroundColor: "#4285F4" }]}
//             onPress={handleGooglePayPress}
//           >
//             <Text style={styles.buttonText}>Google Pay</Text>
//           </TouchableOpacity>
//         )}

//         {Platform.OS === "ios" && (
//           <TouchableOpacity
//             style={[styles.button, { backgroundColor: "#000000" }]}
//             onPress={handleApplePayPress}
//           >
//             <Text style={styles.buttonText}>Apple Pay</Text>
//           </TouchableOpacity>
//         )}
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: "center",
//     padding: 20,
//     backgroundColor: "#FFF",
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: "bold",
//     marginBottom: 10,
//   },
//   buttonContainer: {
//     width: "80%",
//     gap: 20,
//     marginTop: 20,
//   },
//   button: {
//     padding: 15,
//     borderRadius: 5,
//     alignItems: "center",
//   },
//   buttonText: {
//     color: "white",
//     fontSize: 18,
//     fontWeight: "bold",
//   },
//   inputContainer: {
//     width: "80%",
//     marginVertical: 10,
//   },
//   inputLabel: {
//     fontSize: 16,
//   },
//   input: {
//     width: "100%",
//     borderWidth: 1,
//     borderColor: "#cccccc",
//     borderRadius: 5,
//     padding: 10,
//   },
//   detailRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     width: "80%",
//     marginBottom: 5,
//   },
//   detailLabel: {
//     fontSize: 16,
//   },
//   detailValue: {
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   totalRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     width: "80%",
//     marginTop: 10,
//     paddingTop: 10,
//     borderTopWidth: 1,
//     borderTopColor: "#cccccc",
//   },
//   totalLabel: {
//     fontSize: 18,
//     fontWeight: "bold",
//   },
//   totalValue: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "green",
//   },
//   versionText: {
//     marginBottom: 10,
//     fontSize: 12,
//     fontWeight: "bold",
//     color: "#4f4141ff",
//     textTransform: "capitalize",
//   },
// });

// export default App;
