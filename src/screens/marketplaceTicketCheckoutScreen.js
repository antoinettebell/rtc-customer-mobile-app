import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
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
  checkoutMarketplaceTickets_API,
  checkoutGuestMarketplaceTickets_API,
  getMarketplaceTicketInvitation_API,
  quoteMarketplaceTickets_API,
  quoteGuestMarketplaceTickets_API,
} from "../apiFolder/appAPI";
import { formatMoney, styles } from "./marketplaceShared";

const walletMethod = Platform.OS === "ios"
  ? {
      supportedMethods: PaymentMethodNameEnum.ApplePay,
      data: {
        merchantIdentifier: Config.APPLE_PAY_MERCHANT_ID,
        supportedNetworks: [SupportedNetworkEnum.Visa, SupportedNetworkEnum.Mastercard],
        countryCode: Config.PAYMENT_COUNTRY_CODE,
        currencyCode: Config.PAYMENT_CURRENCY_CODE,
        requestBillingAddress: false,
        requestPayerEmail: false,
        requestShipping: false,
      },
    }
  : {
      supportedMethods: PaymentMethodNameEnum.AndroidPay,
      data: {
        supportedNetworks: [SupportedNetworkEnum.Visa, SupportedNetworkEnum.Mastercard],
        environment: __DEV__ ? EnvironmentEnum.TEST : EnvironmentEnum.PRODUCTION,
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

const MarketplaceTicketCheckoutScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useSelector((state) => state.authReducer);
  const { event: initialEvent, shareToken } = route.params || {};
  const [event, setEvent] = useState(initialEvent || null);
  const [eventLoading, setEventLoading] = useState(!initialEvent && !!shareToken);
  const guestCheckout = !!shareToken && !isSignedIn;
  const [ga, setGa] = useState(0);
  const [vip, setVip] = useState(0);
  const [purchaser, setPurchaser] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });
  const [address, setAddress] = useState({ line1: "", city: "", region: "", postalCode: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event || !shareToken) return;
    let active = true;
    getMarketplaceTicketInvitation_API(shareToken)
      .then((response) => {
        if (active) setEvent(response?.data?.marketplaceEvent || null);
      })
      .catch((error) => {
        if (active) Alert.alert("Tickets", error?.message || "Unable to load this ticket invitation.");
      })
      .finally(() => {
        if (active) setEventLoading(false);
      });
    return () => { active = false; };
  }, [event, shareToken]);

  const remaining = (type) => Math.max(
    0,
    Number(event?.[`${type}_ticket_quantity`] || 0) -
      Number(event?.[`${type}_tickets_sold`] || 0) -
      Number(event?.[`${type}_tickets_reserved`] || 0),
  );
  const changeQuantity = (type, delta) => {
    const setter = type === "ga" ? setGa : setVip;
    const current = type === "ga" ? ga : vip;
    setter(Math.max(0, Math.min(remaining(type), current + delta)));
  };
  const billingAddress = { ...address, region: address.region.trim().toUpperCase(), country: "US" };
  const addressComplete = address.line1.trim() && address.city.trim() &&
    billingAddress.region.length === 2 && address.postalCode.trim();
  const purchaserComplete = !guestCheckout || (
    purchaser.first_name.trim() &&
    purchaser.last_name.trim() &&
    /^\S+@\S+\.\S+$/.test(purchaser.email.trim()) &&
    purchaser.phone.replace(/\D/g, "").length >= 7
  );

  const goBackWithoutSaving = () => {
    if (shareToken) {
      navigation.replace("marketplaceEventDetailsScreen", {
        shareToken,
        initialEvent: event,
      });
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.replace("bottomRoot");
  };

  const purchase = async () => {
    if (ga + vip < 1) return Alert.alert("Tickets", "Select at least one ticket.");
    if (!purchaserComplete) return Alert.alert("Contact Information", "Enter your name, email address, and phone number.");
    if (!addressComplete) return Alert.alert("Billing Address", "Complete the billing address for tax calculation.");
    setLoading(true);
    let request;
    let response;
    try {
      const idempotencyKey = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
        const random = Math.floor(Math.random() * 16);
        return (character === "x" ? random : (random & 0x3) | 0x8).toString(16);
      });
      const payload = {
        ga_quantity: ga,
        vip_quantity: vip,
        billing_address: billingAddress,
        ...(guestCheckout ? { purchaser } : {}),
      };
      const quoteResponse = guestCheckout
        ? await quoteGuestMarketplaceTickets_API({ shareToken, payload })
        : await quoteMarketplaceTickets_API({ eventId: event.event_id, payload });
      const quote = quoteResponse.data?.quote;
      const total = Number(quote?.totalAmount || 0).toFixed(2);
      request = new PaymentRequest([walletMethod], {
        displayItems: [
          { label: "Tickets", amount: { currency: "USD", value: Number(quote.ticketSubtotal).toFixed(2) } },
          { label: "Processing fee", amount: { currency: "USD", value: Number(quote.customerProcessingFee).toFixed(2) } },
          { label: "Sales tax", amount: { currency: "USD", value: Number(quote.salesTax).toFixed(2) } },
        ],
        total: { label: "ROUND THE CORNER LLC", amount: { currency: "USD", value: total } },
      });
      if (!(await request.canMakePayment())) throw new Error("Apple Pay or Google Pay is unavailable.");
      response = await request.show();
      const paymentData = Platform.OS === "ios"
        ? response.details.applePayToken.paymentData
        : response.details.androidPayToken.rawToken;
      const checkoutPayload = {
        ...payload,
        payment_method: Platform.OS === "ios" ? "APPLE_PAY" : "GOOGLE_PAY",
        payment_data: paymentData,
        idempotency_key: idempotencyKey,
      };
      const checkout = guestCheckout
        ? await checkoutGuestMarketplaceTickets_API({ shareToken, payload: checkoutPayload })
        : await checkoutMarketplaceTickets_API({ eventId: event.event_id, payload: checkoutPayload });
      response.complete("success");
      const tickets = checkout.data?.tickets || [];
      Alert.alert("Tickets Purchased", `${tickets.length} ticket${tickets.length === 1 ? "" : "s"} sent by text and email.`, [
        {
          text: "View First Ticket",
          onPress: () => tickets[0]?.ticket_url && navigation.replace("marketplaceTicketWebViewScreen", {
            url: tickets[0].ticket_url,
            title: event.event_name,
          }),
        },
      ]);
    } catch (error) {
      response?.complete?.("fail");
      request?.abort?.();
      Alert.alert("Ticket Purchase", error?.message || "Unable to complete ticket purchase.");
    } finally {
      setLoading(false);
    }
  };

  const TicketRow = ({ type, label, price, quantity }) => (
    <View style={local.row}>
      <View style={{ flex: 1 }}><Text style={styles.title}>{label}</Text><Text style={styles.meta}>{formatMoney(price)} · {remaining(type)} remaining</Text></View>
      <TouchableOpacity style={local.step} onPress={() => changeQuantity(type, -1)}><Text style={local.stepText}>−</Text></TouchableOpacity>
      <Text style={local.quantity}>{quantity}</Text>
      <TouchableOpacity style={local.step} onPress={() => changeQuantity(type, 1)}><Text style={local.stepText}>+</Text></TouchableOpacity>
    </View>
  );

  if (eventLoading || !event) {
    return <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />
      <AppHeader headerTitle="Get Tickets" onBackPress={goBackWithoutSaving} />
      <View style={local.loadingWrap}>
        {eventLoading ? <ActivityIndicator color={AppColor.primary} /> : <Text style={styles.meta}>Ticket invitation unavailable.</Text>}
      </View>
    </View>;
  }

  return <View style={[styles.container, { paddingTop: insets.top }]}>
    <StatusBarManager /><AppHeader headerTitle="Get Tickets" onBackPress={goBackWithoutSaving} />
    <ScrollView contentContainerStyle={styles.body}>
      <View style={styles.card}><Text style={styles.title}>{event?.event_name}</Text>
        <TicketRow type="ga" label="General Admission" price={event?.ga_ticket_price} quantity={ga} />
        <TicketRow type="vip" label="VIP" price={event?.vip_ticket_price} quantity={vip} />
      </View>
      {guestCheckout ? (
        <View style={styles.card}>
          <Text style={styles.title}>Contact Information</Text>
          <Text style={styles.meta}>Used to deliver tickets and contact you if a refund is required.</Text>
          {[
            ["first_name", "First name", "default"],
            ["last_name", "Last name", "default"],
            ["email", "Email address", "email-address"],
            ["phone", "Phone number", "phone-pad"],
          ].map(([key, placeholder, keyboardType]) => (
            <TextInput
              key={key}
              value={purchaser[key]}
              onChangeText={(value) => setPurchaser((old) => ({ ...old, [key]: value }))}
              placeholder={placeholder}
              placeholderTextColor={AppColor.textPlaceholder}
              autoCapitalize={key === "email" ? "none" : "words"}
              keyboardType={keyboardType}
              style={local.input}
            />
          ))}
        </View>
      ) : null}
      <View style={styles.card}><Text style={styles.title}>Billing Address</Text>
        {[["line1", "Street address"], ["city", "City"], ["region", "State (2 letters)"], ["postalCode", "ZIP code"]].map(([key, placeholder]) =>
          <TextInput key={key} value={address[key]} onChangeText={(value) => setAddress((old) => ({ ...old, [key]: value }))} placeholder={placeholder} placeholderTextColor={AppColor.textPlaceholder} autoCapitalize={key === "region" ? "characters" : "words"} style={local.input} />)}
      </View>
      <Text style={styles.meta}>A 3.5% processing fee and applicable sales tax are shown in the wallet before payment.</Text>
      <TouchableOpacity style={[styles.button, loading && { opacity: 0.6 }]} disabled={loading} onPress={purchase}>
        {loading ? <ActivityIndicator color={AppColor.white} /> : <Text style={styles.buttonText}>Continue to {Platform.OS === "ios" ? "Apple Pay" : "Google Pay"}</Text>}
      </TouchableOpacity>
    </ScrollView>
  </View>;
};

const local = StyleSheet.create({
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#ddd" },
  step: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: AppColor.primary },
  stepText: { color: AppColor.white, fontSize: 24, fontWeight: "700" },
  quantity: { width: 40, textAlign: "center", fontSize: 18, fontWeight: "700" },
  input: { minHeight: 48, borderWidth: 1, borderColor: "#d8dee8", borderRadius: 10, paddingHorizontal: 12, marginTop: 12, color: AppColor.text },
});

export default MarketplaceTicketCheckoutScreen;
