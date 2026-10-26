import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconButton } from "react-native-paper";
import ImagePicker from "react-native-image-crop-picker";
import StatusBarManager from "../components/StatusBarManager";
import StatePickerModal from "../components/StatePickerModal";
import { AppColor, Mulish400, Mulish700 } from "../utils/theme";
import {
  getCoordinatorBankDetail_API,
  saveCoordinatorBankDetail_API,
  uploadImage_API,
} from "../apiFolder/appAPI";

const ACCOUNT_TYPES = ["CHECKING", "SAVINGS"];
const PAYMENT_METHODS = [
  { label: "Cash App", value: "CASHAPP" },
  { label: "PayPal", value: "PAYPAL" },
  { label: "Venmo", value: "VENMO" },
  { label: "ACH", value: "ACH" },
  { label: "Check", value: "CHECK" },
];
const WALLET_METHODS = ["CASHAPP", "PAYPAL", "VENMO"];
const digits = (value) => String(value || "").replace(/\D/g, "");
const maskAccount = (value) => {
  const number = digits(value);
  return number ? `${"*".repeat(Math.max(0, number.length - 4))}${number.slice(-4)}` : "";
};
const isMaskedAccount = (value) => /^\*+\d{4}$/.test(String(value || ""));

const CoordinatorBankDetailsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAccountNumber, setSavedAccountNumber] = useState("");
  const [form, setForm] = useState({
    accountHolderName: "",
    phoneNumber: "",
    paymentMethod: "ACH",
    walletPaymentHandle: "",
    remittanceEmail: "",
    currency: "USD",
    paymentQrCodeUrl: "",
    bankName: "",
    accountNumber: "",
    routingNumber: "",
    accountType: "CHECKING",
    bankAddressLine1: "",
    bankAddressLine2: "",
    bankCity: "",
    bankState: "",
    bankPostal: "",
  });

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const load = useCallback(async () => {
    try {
      const response = await getCoordinatorBankDetail_API();
      const detail = response?.data?.bankDetail;
      if (!detail) return;
      setSavedAccountNumber(detail.accountNumber || "");
      setForm({
        accountHolderName: detail.accountHolderName || "",
        phoneNumber: detail.phoneNumber || "",
        paymentMethod: detail.paymentMethod || "ACH",
        walletPaymentHandle: detail.walletPaymentHandle || "",
        remittanceEmail: detail.remittanceEmail || "",
        currency: detail.currency || "USD",
        paymentQrCodeUrl: detail.paymentQrCodeUrl || "",
        bankName: detail.bankName || "",
        accountNumber: maskAccount(detail.accountNumber),
        routingNumber: detail.routingNumber || "",
        accountType: detail.accountType || "CHECKING",
        bankAddressLine1: detail.bankAddressLine1 || "",
        bankAddressLine2: detail.bankAddressLine2 || "",
        bankCity: detail.bankCity || "",
        bankState: detail.bankState || "",
        bankPostal: detail.bankPostal || "",
      });
    } catch (error) {
      Alert.alert("Bank Details", error?.message || "Could not load bank details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    const isWallet = WALLET_METHODS.includes(form.paymentMethod);
    const required = [
      ...(isWallet ? [
        ["Payment handle / account identifier", form.walletPaymentHandle],
        ["Payment email", form.remittanceEmail],
        ["Payment QR code", form.paymentQrCodeUrl],
      ] : [
        ["Account holder name", form.accountHolderName],
        ["Bank name", form.bankName],
        ["Account number", form.accountNumber],
        ["Routing number", form.routingNumber],
        ["Bank address", form.bankAddressLine1],
        ["Bank city", form.bankCity],
        ["Bank state", form.bankState],
        ["Bank postal code", form.bankPostal],
      ]),
    ];
    const missing = required.find(([, value]) => !String(value || "").trim());
    if (missing) return Alert.alert("Bank Details", `${missing[0]} is required.`);
    const routingNumber = digits(form.routingNumber);
    if (!isWallet && routingNumber.length !== 9) return Alert.alert("Bank Details", "Routing number must be 9 digits.");
    if (!/^\+?[0-9() .-]{7,25}$/.test(form.phoneNumber.trim())) {
      return Alert.alert("Bank Details", "Enter a valid phone number.");
    }
    const accountNumber = isMaskedAccount(form.accountNumber)
      ? savedAccountNumber
      : digits(form.accountNumber);
    if (!isWallet && accountNumber.length < 8) return Alert.alert("Bank Details", "Enter a valid account number.");

    setSaving(true);
    try {
      const response = await saveCoordinatorBankDetail_API({
        ...form,
        ...(isWallet ? {
          accountHolderName: "",
          bankName: "",
          accountNumber: "",
          routingNumber: "",
          accountType: "",
          bankAddressLine1: "",
          bankAddressLine2: "",
          bankCity: "",
          bankState: "",
          bankPostal: "",
        } : {
          accountNumber,
          routingNumber,
          walletPaymentHandle: "",
          remittanceEmail: "",
          paymentQrCodeUrl: "",
          currency: "",
        }),
      });
      if (!response?.success) throw new Error(response?.message || "Could not save bank details.");
      Alert.alert("Bank Details", "Bank details saved.", [{ text: "OK", onPress: () => navigation.goBack() }]);
    } catch (error) {
      Alert.alert("Bank Details", error?.message || "Could not save bank details.");
    } finally {
      setSaving(false);
    }
  };

  const uploadQr = async () => {
    try {
      const image = await ImagePicker.openPicker({ mediaType: "photo", cropping: false });
      const data = new FormData();
      data.append("file", { uri: image.path, name: image.path.split("/").pop() || `coordinator-payment-qr-${Date.now()}.jpg`, type: image.mime || "image/jpeg" });
      const response = await uploadImage_API(data);
      const url = response?.data?.file;
      if (!response?.success || !url) throw new Error("QR upload failed");
      set("paymentQrCodeUrl", url);
    } catch (error) {
      if (!String(error?.message || error).toLowerCase().includes("cancel")) Alert.alert("Upload failed", "Could not upload the payment QR code.");
    }
  };

  const input = (label, key, options = {}) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={form[key]}
        onChangeText={(value) => set(key, options.digits ? digits(value).slice(0, options.maxLength) : value)}
        style={styles.input}
        placeholder={options.placeholder}
        placeholderTextColor="#8A96A3"
        keyboardType={options.keyboardType}
        secureTextEntry={options.secureTextEntry}
        maxLength={options.maxLength}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBarManager />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
        <Text style={styles.title}>Bank Details</Text>
        <View style={{ width: 48 }} />
      </View>
      {loading ? <View style={styles.loading}><ActivityIndicator size="large" color={AppColor.primary} /></View> : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]} keyboardShouldPersistTaps="handled">
          <Text style={styles.copy}>These details are used only for approved Event Coordinator payouts.</Text>
          {input("Phone Number *", "phoneNumber", { placeholder: "Phone number for payment questions", keyboardType: "phone-pad" })}
          <Text style={styles.label}>Payment Method *</Text>
          <View style={styles.choiceRow}>{PAYMENT_METHODS.map((method) => <TouchableOpacity key={method.value} style={[styles.choice, form.paymentMethod === method.value && styles.choiceActive]} onPress={() => set("paymentMethod", method.value)}><Text style={form.paymentMethod === method.value ? styles.choiceTextActive : styles.choiceText}>{method.label}</Text></TouchableOpacity>)}</View>
          {WALLET_METHODS.includes(form.paymentMethod) ? <>
            {input("Payment Handle / Account Identifier *", "walletPaymentHandle", { placeholder: "Payment handle or account identifier" })}
            {input("Payment Email *", "remittanceEmail", { placeholder: "Email for payment", keyboardType: "email-address" })}
            <Text style={styles.label}>Payment QR Code *</Text>
            <TouchableOpacity style={styles.qrButton} onPress={uploadQr}><Text style={styles.qrButtonText}>{form.paymentQrCodeUrl ? "Replace QR Code" : "Upload QR Code"}</Text></TouchableOpacity>
          </> : <>
            {input("Account Holder Name *", "accountHolderName", { placeholder: "Name on the bank account" })}
            {input("Bank Name *", "bankName", { placeholder: "Bank name" })}
            {input("Account Number *", "accountNumber", { placeholder: "Account number", keyboardType: "number-pad", digits: true, maxLength: 17, secureTextEntry: !isMaskedAccount(form.accountNumber) })}
            {input("Routing Number (ABA) *", "routingNumber", { placeholder: "9-digit routing number", keyboardType: "number-pad", digits: true, maxLength: 9 })}
            <Text style={styles.label}>Account Type *</Text>
            <View style={styles.choiceRow}>{ACCOUNT_TYPES.map((type) => <TouchableOpacity key={type} style={[styles.choice, form.accountType === type && styles.choiceActive]} onPress={() => set("accountType", type)}><Text style={form.accountType === type ? styles.choiceTextActive : styles.choiceText}>{type[0] + type.slice(1).toLowerCase()}</Text></TouchableOpacity>)}</View>
            <Text style={styles.sectionTitle}>Bank Address</Text>
            {input("Address Line 1 *", "bankAddressLine1", { placeholder: "Street address" })}{input("Address Line 2", "bankAddressLine2", { placeholder: "Apartment, suite, or unit" })}{input("City *", "bankCity", { placeholder: "City" })}<View style={styles.field}><StatePickerModal label="State *" value={form.bankState} onChange={(value) => set("bankState", value)} /></View>{input("Postal Code *", "bankPostal", { placeholder: "ZIP code", keyboardType: "number-pad" })}
          </>}
          <TouchableOpacity style={[styles.save, saving && styles.disabled]} disabled={saving} onPress={save}>{saving ? <ActivityIndicator color={AppColor.white} /> : <Text style={styles.saveText}>Save Bank Details</Text>}</TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColor.white },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderColor: "#E5E7EB" },
  title: { fontFamily: Mulish700, fontSize: 20, color: AppColor.black },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 20 },
  copy: { fontFamily: Mulish400, color: "#5F6D7E", lineHeight: 21, marginBottom: 18 },
  field: { marginBottom: 14 },
  label: { fontFamily: Mulish700, color: AppColor.black, marginBottom: 7, fontSize: 15 },
  input: { borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 9, paddingHorizontal: 14, height: 52, fontFamily: Mulish400, color: AppColor.black, fontSize: 16 },
  sectionTitle: { fontFamily: Mulish700, color: AppColor.black, fontSize: 18, marginTop: 8, marginBottom: 14 },
  choiceRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  choice: { borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 20, paddingHorizontal: 18, paddingVertical: 10 },
  choiceActive: { backgroundColor: AppColor.primary, borderColor: AppColor.primary },
  choiceText: { fontFamily: Mulish400, color: AppColor.black },
  choiceTextActive: { fontFamily: Mulish700, color: AppColor.white },
  save: { marginTop: 12, backgroundColor: AppColor.primary, borderRadius: 10, minHeight: 54, alignItems: "center", justifyContent: "center" },
  saveText: { fontFamily: Mulish700, color: AppColor.white, fontSize: 16 },
  disabled: { opacity: 0.6 },
  qrButton: { borderWidth: 1, borderColor: AppColor.primary, borderRadius: 10, minHeight: 50, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  qrButtonText: { fontFamily: Mulish700, color: AppColor.primary, fontSize: 16 },
});

export default CoordinatorBankDetailsScreen;
