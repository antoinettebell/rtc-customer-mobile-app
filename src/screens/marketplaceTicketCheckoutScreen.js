import React, { useEffect, useRef, useState } from "react";
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
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import AppHeader from "../components/AppHeader";
import StatePickerModal from "../components/StatePickerModal";
import StatusBarManager from "../components/StatusBarManager";
import Config from "../config/env";
import { AppColor } from "../utils/theme";
import {
  checkoutMarketplaceTickets_API,
  checkoutGuestMarketplaceTickets_API,
  checkoutPublicGuestMarketplaceTickets_API,
  getMarketplaceTicketInvitation_API,
  quoteMarketplaceTickets_API,
  quoteGuestMarketplaceTickets_API,
  quotePublicGuestMarketplaceTickets_API,
} from "../apiFolder/appAPI";
import { formatMoney, styles } from "./marketplaceShared";
import { getMarketplaceTicketExitRoute } from "../helpers/marketplaceTicketNavigation.helper";
import {
  getGooglePlaceAddressSelection,
  splitUsFormattedAddress,
} from "../helpers/address.helper";

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

const GOOGLE_PLACES_QUERY = Object.freeze({
  key: Config.GOOGLE_MAP_API_KEY,
  language: "en",
  types: "geocode|establishment",
  components: "country:us",
});
const NO_PREDEFINED_PLACES = Object.freeze([]);

const MarketplaceTicketCheckoutScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useSelector((state) => state.authReducer);
  const { user } = useSelector((state) => state.userReducer);
  const { event: initialEvent, shareToken } = route.params || {};
  const [event, setEvent] = useState(initialEvent || null);
  const [eventLoading, setEventLoading] = useState(!initialEvent && !!shareToken);
  const guestCheckout = !isSignedIn;
  const [ga, setGa] = useState(0);
  const [vip, setVip] = useState(0);
  const [purchaser, setPurchaser] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });
  const [address, setAddress] = useState({ line1: "", city: "", region: "", postalCode: "" });
  const addressSearchRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const accountEmail = String(user?.email || "").trim();
  const accountPhone = `${user?.countryCode || ""}${user?.mobileNumber || ""}`.trim();

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
  const updateStreetAddress = (value) => {
    const parsed = splitUsFormattedAddress(value);
    const hasCompleteFormattedAddress =
      parsed.line1 && parsed.city && parsed.state && parsed.zip;
    setAddress((old) => hasCompleteFormattedAddress
      ? {
          ...old,
          line1: parsed.line1,
          city: parsed.city,
          region: parsed.state,
          postalCode: parsed.zip,
        }
      : { ...old, line1: value });
  };
  const selectGoogleAddress = (data, details) => {
    const selection = getGooglePlaceAddressSelection({ data, details });
    if (!selection.shouldCloseSelection) {
      Alert.alert("Billing Address", selection.error);
      return;
    }
    setAddress({
      line1: selection.address.line1,
      city: selection.address.city,
      region: selection.address.state,
      postalCode: selection.address.zip,
    });
    addressSearchRef.current?.setAddressText(selection.address.line1);
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
    const destination = getMarketplaceTicketExitRoute(isSignedIn);
    navigation.reset({ index: 0, routes: [destination] });
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
        ? shareToken
          ? await quoteGuestMarketplaceTickets_API({ shareToken, payload })
          : await quotePublicGuestMarketplaceTickets_API({ eventId: event.event_id, payload })
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
        ? shareToken
          ? await checkoutGuestMarketplaceTickets_API({ shareToken, payload: checkoutPayload })
          : await checkoutPublicGuestMarketplaceTickets_API({ eventId: event.event_id, payload: checkoutPayload })
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
      <View style={styles.card}>
        <Text style={styles.title}>Contact & Billing Information</Text>
        <Text style={styles.meta}>Tickets and QR codes are texted to the phone number and emailed to the email address below. We also use this information if a refund is required.</Text>
        {guestCheckout ? (
          <>
          {[
            ["first_name", "First name", "default"],
            ["last_name", "Last name", "default"],
            ["email", "Email address (required)", "email-address"],
            ["phone", "Phone number (required)", "phone-pad"],
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
          </>
        ) : (
          <Text style={styles.meta}>
            Email: {accountEmail || "Not available"}{"\n"}
            Phone: {accountPhone || "Not available"}
          </Text>
        )}
        <Text style={[styles.title, local.billingTitle]}>Billing Address</Text>
        <View style={local.placesWrapper}>
          <GooglePlacesAutocomplete
            ref={addressSearchRef}
            placeholder="Street address"
            fetchDetails
            debounce={250}
            enablePoweredByContainer={false}
            predefinedPlaces={NO_PREDEFINED_PLACES}
            keyboardShouldPersistTaps="always"
            minLength={2}
            timeout={20000}
            onPress={selectGoogleAddress}
            onFail={() => {
              Alert.alert("Billing Address", "Address search failed. Please try again.");
            }}
            query={GOOGLE_PLACES_QUERY}
            textInputProps={{
              onChangeText: updateStreetAddress,
              placeholderTextColor: AppColor.textPlaceholder,
              returnKeyType: "search",
              autoCapitalize: "words",
              autoCorrect: false,
            }}
            styles={{
              container: local.placesContainer,
              textInputContainer: local.placesInputContainer,
              textInput: local.placesInput,
              listView: local.placesList,
              row: local.placesRow,
              description: local.placesDescription,
              separator: local.placesSeparator,
            }}
          />
        </View>
        <TextInput
          value={address.city}
          onChangeText={(value) => setAddress((old) => ({ ...old, city: value }))}
          placeholder="City"
          placeholderTextColor={AppColor.textPlaceholder}
          autoCapitalize="words"
          autoComplete="off"
          textContentType="addressCity"
          style={local.input}
        />
        <View style={local.statePicker}>
          <StatePickerModal
            label="State"
            value={address.region}
            onChangeText={(value) => setAddress((old) => ({ ...old, region: value }))}
          />
        </View>
        <TextInput
          value={address.postalCode}
          onChangeText={(value) => setAddress((old) => ({ ...old, postalCode: value }))}
          placeholder="ZIP code"
          placeholderTextColor={AppColor.textPlaceholder}
          keyboardType="number-pad"
          autoComplete="postal-code"
          textContentType="postalCode"
          style={local.input}
        />
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
  billingTitle: { marginTop: 20 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#ddd" },
  step: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: AppColor.primary },
  stepText: { color: AppColor.white, fontSize: 24, fontWeight: "700" },
  quantity: { width: 40, textAlign: "center", fontSize: 18, fontWeight: "700" },
  input: { minHeight: 48, borderWidth: 1, borderColor: "#d8dee8", borderRadius: 10, paddingHorizontal: 12, marginTop: 12, color: AppColor.text },
  placesWrapper: { marginTop: 12, zIndex: 20 },
  placesContainer: { flex: 0 },
  placesInputContainer: { borderWidth: 1, borderColor: "#d8dee8", borderRadius: 10, backgroundColor: AppColor.white },
  placesInput: { minHeight: 48, height: 48, margin: 0, paddingHorizontal: 12, color: AppColor.text, backgroundColor: AppColor.white, borderRadius: 10 },
  placesList: { borderWidth: 1, borderColor: "#d8dee8", borderRadius: 10, marginTop: 4, backgroundColor: AppColor.white, zIndex: 30, elevation: 4 },
  placesRow: { paddingVertical: 12, paddingHorizontal: 12 },
  placesDescription: { color: AppColor.text },
  placesSeparator: { height: StyleSheet.hairlineWidth, backgroundColor: "#d8dee8" },
  statePicker: { marginTop: 12 },
});

export default MarketplaceTicketCheckoutScreen;
