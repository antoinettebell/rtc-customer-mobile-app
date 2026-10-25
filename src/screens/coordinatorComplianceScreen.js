import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, AppState, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TextInput } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ImagePicker from "react-native-image-crop-picker";
import { pick, types } from "@react-native-documents/picker";
import { RESULTS } from "react-native-permissions";
import { useSelector } from "react-redux";
import Ionicons from "react-native-vector-icons/Ionicons";
import { AppColor, Mulish400, Mulish700 } from "../utils/theme";
import StatusBarManager from "../components/StatusBarManager";
import StatePickerModal from "../components/StatePickerModal";
import usePermission from "../hooks/usePermission";
import { permission } from "../helpers/permission.helper";
import {
  getCoordinatorCompliance_API,
  startCoordinatorW9Signing_API,
  completeCoordinatorW9Signing_API,
  saveCoordinatorComplianceProfile_API,
  submitCoordinatorComplianceOcr_API,
  startCoordinatorComplianceVerification_API,
  uploadCoordinatorComplianceDocument_API,
} from "../apiFolder/appAPI";

const entityTypes = ["SOLE_PROPRIETOR", "LLC", "CORPORATION", "PARTNERSHIP", "S_CORPORATION"];
const W9_SIGNING_STORAGE_KEY = "coordinator-compliance-w9-envelope";
const normalizeStateAbbreviation = (value = "") => String(value)
  .replace(/[^a-z]/gi, "")
  .slice(0, 2)
  .toUpperCase();

const parsePendingW9Signing = (value) => {
  try {
    return JSON.parse(value || "{}").envelope_id || null;
  } catch (_error) {
    return null;
  }
};

const formatOcrStatus = (status) => String(status || "Pending")
  .replace(/_/g, " ")
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getOcrStatusText = (document = {}) => {
  if (!document?.ocr_status) return "OCR: Pending";
  const status = formatOcrStatus(document.ocr_status);
  return document.ocr_error_message ? `OCR: ${status} - ${document.ocr_error_message}` : `OCR: ${status}`;
};

const getDocumentLifecycleText = (document = {}) => {
  if (document?.review_status) return formatOcrStatus(document.review_status);
  if (["queued", "processing"].includes(document?.ocr_status)) return "Pending Review";
  if (document?.ocr_status === "completed") return "Verified";
  return "Uploaded";
};

const getW9LifecycleText = (session = {}) => {
  if (session?.verification_status === "PENDING" || ["queued", "processing"].includes(session?.ocr_status)) {
    return "Pending Review";
  }
  if (session?.verification_status === "PASSED") return "Verified";
  if (session?.verification_status) return formatOcrStatus(session.verification_status);
  return "Not signed";
};

const CoordinatorComplianceScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useSelector((state) => state.userReducer);
  const [profile, setProfile] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [partyType, setPartyType] = useState("INDIVIDUAL");
  const [legalName, setLegalName] = useState("");
  const [dbaName, setDbaName] = useState("");
  const [entityType, setEntityType] = useState("LLC");
  const [registrationState, setRegistrationState] = useState("");
  const [mailingAddressLine1, setMailingAddressLine1] = useState("");
  const [mailingAddressLine2, setMailingAddressLine2] = useState("");
  const [mailingCity, setMailingCity] = useState("");
  const [mailingState, setMailingState] = useState("");
  const [mailingPostal, setMailingPostal] = useState("");
  const [taxIdType, setTaxIdType] = useState("SSN");
  const [taxId, setTaxId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requestingVerification, setRequestingVerification] = useState(false);
  const { checkAndRequestPermission: photosPermissionStatus } = usePermission(permission.photos);
  const { checkAndRequestPermission: cameraPermissionStatus } = usePermission(permission.camera);
  const [w9Session, setW9Session] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const formDirtyRef = useRef(false);
  const pendingW9EnvelopeRef = useRef(null);
  const completingW9Ref = useRef(false);
  const w9RecoveryRetryRef = useRef(null);
  const w9RecoveryAttemptRef = useRef(0);
  const [requiresPaidCompliance, setRequiresPaidCompliance] = useState(Boolean(
    user?.eventCoordinatorExpectsTicketSales || user?.eventCoordinatorExpectsVendorFees,
  ));

  const load = useCallback(async () => {
    try {
      const response = await getCoordinatorCompliance_API();
      const next = response?.data?.profile || null;
      setProfile(next);
      setCompliance(response?.data?.compliance || null);
      setW9Session(response?.data?.w9_session || null);
      if (typeof response?.data?.requires_payout_compliance === "boolean") {
        setRequiresPaidCompliance(response.data.requires_payout_compliance);
      }
      // Refresh status while verification is pending, but never overwrite an
      // in-progress compliance edit with the previously saved profile.
      if (!formDirtyRef.current) {
        setPartyType(next?.party_type || "INDIVIDUAL");
        setLegalName(next?.legal_name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim());
        setDbaName(next?.dba_name || "");
        setEntityType(next?.entity_type || "LLC");
        setRegistrationState(normalizeStateAbbreviation(next?.registration_state));
        const mailingAddress = next?.mailing_address || {};
        setMailingAddressLine1(mailingAddress.address_line1 || "");
        setMailingAddressLine2(mailingAddress.address_line2 || "");
        setMailingCity(mailingAddress.city || "");
        setMailingState(normalizeStateAbbreviation(mailingAddress.state));
        setMailingPostal(mailingAddress.postal || "");
        setTaxIdType(next?.tax_id_type || (next?.party_type === "BUSINESS" ? "EIN" : "SSN"));
      }
    } catch (_error) {
      // The screen remains usable if a delayed deployment or retry briefly
      // prevents the optional summary from loading.
    } finally {
      setLoading(false);
    }
  }, [user?.firstName, user?.lastName]);

  useEffect(() => { load(); }, [load]);

  const clearW9RecoveryRetry = useCallback(() => {
    if (w9RecoveryRetryRef.current) {
      clearTimeout(w9RecoveryRetryRef.current);
      w9RecoveryRetryRef.current = null;
    }
  }, []);

  const getPendingW9EnvelopeId = useCallback(async () => {
    if (pendingW9EnvelopeRef.current) return pendingW9EnvelopeRef.current;
    const storedValue = await AsyncStorage.getItem(W9_SIGNING_STORAGE_KEY);
    const envelopeId = parsePendingW9Signing(storedValue) || (
      w9Session?.status === "SENT" ? w9Session.envelope_id : null
    );
    if (envelopeId) pendingW9EnvelopeRef.current = envelopeId;
    return envelopeId;
  }, [w9Session?.envelope_id, w9Session?.status]);

  const completeW9Signing = useCallback(async (envelopeId, { quiet = false } = {}) => {
    if (!envelopeId || completingW9Ref.current) return false;
    completingW9Ref.current = true;
    setSaving(true);
    let completed = false;
    try {
      const response = await completeCoordinatorW9Signing_API(envelopeId);
      if (!response?.success) throw new Error(response?.message || "Could not receive the signed W-9.");
      setW9Session(response?.data?.w9_session || null);
      await load();
      if (!quiet) Alert.alert("W-9 Submitted", "Your signed W-9 was received and submitted for verification.");
      completed = true;
      return true;
    } catch (error) {
      if (!quiet) Alert.alert("W-9 Verification", error?.message || "We could not confirm the signed W-9 yet.");
      return false;
    } finally {
      if (completed) {
        clearW9RecoveryRetry();
        w9RecoveryAttemptRef.current = 0;
        pendingW9EnvelopeRef.current = null;
        await AsyncStorage.removeItem(W9_SIGNING_STORAGE_KEY);
      }
      completingW9Ref.current = false;
      setSaving(false);
    }
  }, [clearW9RecoveryRetry, load]);

  const reconcilePendingW9 = useCallback(async ({ quiet = true } = {}) => {
    const envelopeId = await getPendingW9EnvelopeId();
    if (!envelopeId || completingW9Ref.current) return false;
    const completed = await completeW9Signing(envelopeId, { quiet });
    if (completed) return true;
    const retryDelays = [1500, 4000, 8000];
    const delay = retryDelays[w9RecoveryAttemptRef.current];
    if (delay !== undefined) {
      w9RecoveryAttemptRef.current += 1;
      clearW9RecoveryRetry();
      w9RecoveryRetryRef.current = setTimeout(() => {
        reconcilePendingW9({ quiet: true }).catch(() => {});
      }, delay);
    }
    return false;
  }, [clearW9RecoveryRetry, completeW9Signing, getPendingW9EnvelopeId]);

  useEffect(() => {
    const handleUrl = async ({ url }) => {
      if (!String(url || "").includes("docusign/return")) return;
      reconcilePendingW9({ quiet: false }).catch(() => {});
    };
    const subscription = Linking.addEventListener("url", handleUrl);
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") reconcilePendingW9({ quiet: true }).catch(() => {});
    });
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
      else reconcilePendingW9({ quiet: true }).catch(() => {});
    });
    return () => {
      clearW9RecoveryRetry();
      subscription.remove();
      appStateSubscription.remove();
    };
  }, [clearW9RecoveryRetry, reconcilePendingW9]);

  // Mirror vendor compliance: a queued OCR request refreshes until the
  // Function callback replaces it with Completed, Revalidation Needed, or
  // Manual Review. The coordinator screen must not require navigation away
  // and back to reveal that result.
  useEffect(() => {
    const requiredDocumentType = partyType === "BUSINESS"
      ? "BUSINESS_LICENSE"
      : "DRIVER_LICENSE_FRONT";
    const document = profile?.documents?.find(
      (item) => item.document_type === requiredDocumentType,
    );
    const hasActiveOcr = [document?.ocr_status, w9Session?.ocr_status]
      .some((status) => ["queued", "processing"].includes(status));
    const hasPendingProviderVerification = compliance?.external_verification?.status === "PENDING";
    if (!hasActiveOcr && !hasPendingProviderVerification) return undefined;
    const timer = setTimeout(() => load(), 5000);
    return () => clearTimeout(timer);
  }, [compliance?.external_verification?.status, load, partyType, profile?.documents, w9Session?.ocr_status]);

  const save = async () => {
    if (!legalName.trim()) return Alert.alert("Compliance", "Legal name is required.");
    if (requiresPaidCompliance && (!mailingAddressLine1.trim() || !mailingCity.trim() || !mailingState || !mailingPostal.trim())) {
      return Alert.alert("Compliance", "Mailing address, city, state, and ZIP code are required for payout compliance.");
    }
    if (partyType === "BUSINESS" && !registrationState.trim()) {
      return Alert.alert("Compliance", "Registration state is required for a business coordinator.");
    }
    if (taxId && taxId.replace(/\D/g, "").length !== 9) return Alert.alert("Compliance", "Enter a nine-digit EIN or SSN.");
    if (requiresPaidCompliance && !taxId && !profile?.tax_id_masked) {
      return Alert.alert("Compliance", `Your ${taxIdType} is required after selecting paid event eligibility.`);
    }
    setSaving(true);
    try {
      const response = await saveCoordinatorComplianceProfile_API({
        party_type: partyType,
        legal_name: legalName.trim(),
        dba_name: dbaName.trim(),
        entity_type: partyType === "BUSINESS" ? entityType : null,
        registration_state: partyType === "BUSINESS" ? registrationState.trim().toUpperCase() : null,
        // Kept on the isolated coordinator-compliance profile, not on the
        // customer's delivery/discovery address.
        ...([mailingAddressLine1, mailingAddressLine2, mailingCity, mailingState, mailingPostal]
          .some((value) => String(value || "").trim()) ? {
            mailing_address: {
              address_line1: mailingAddressLine1.trim() || null,
              address_line2: mailingAddressLine2.trim() || null,
              city: mailingCity.trim() || null,
              state: mailingState || null,
              postal: mailingPostal.trim() || null,
              country: "US",
            },
          } : {}),
        ...(taxId ? { tax_id_type: taxIdType, tax_id: taxId.replace(/\D/g, "") } : {}),
      });
      if (!response?.success) throw new Error(response?.message || "Could not save compliance.");
      const savedProfile = response?.data?.profile || null;
      setProfile(savedProfile);
      formDirtyRef.current = false;
      setTaxId("");
      if (selectedDocument) {
        const payload = new FormData();
        payload.append("document_type", partyType === "BUSINESS" ? "BUSINESS_LICENSE" : "DRIVER_LICENSE_FRONT");
        payload.append("file", selectedDocument);
        const uploadResponse = await uploadCoordinatorComplianceDocument_API(payload);
        if (!uploadResponse?.success) throw new Error(uploadResponse?.message || "Could not upload document.");
        setProfile(uploadResponse?.data?.profile || savedProfile);
        setSelectedDocument(null);
      }
      const ocrResponse = await submitCoordinatorComplianceOcr_API();
      if (!ocrResponse?.success) throw new Error(ocrResponse?.message || "Could not submit documents for OCR.");
      if (ocrResponse?.data?.profile) setProfile(ocrResponse.data.profile);
      if (ocrResponse?.data?.w9_session) setW9Session(ocrResponse.data.w9_session);
      if (ocrResponse?.data?.compliance) setCompliance(ocrResponse.data.compliance);
      await load();
      Alert.alert("Compliance", "Compliance information saved. Changed documents were submitted for OCR.");
    } catch (error) {
      Alert.alert("Compliance", error?.message || "Could not save compliance.");
    } finally { setSaving(false); }
  };

  const selectPartyType = (nextType) => {
    if (nextType === partyType) return;
    const nextLabel = nextType === "BUSINESS" ? "Business" : "Individual";
    Alert.alert(
      "Switch account type?",
      `Switching to ${nextLabel} clears incompatible unsaved tax-ID details. When you tap Save & Run OCR, a prior 100% compliant legal payee is archived; incomplete legal-payee information is permanently deleted.`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Switch",
          style: "destructive",
          onPress: () => {
            formDirtyRef.current = true;
            setPartyType(nextType);
            setTaxIdType(nextType === "BUSINESS" ? "EIN" : "SSN");
            setTaxId("");
            setSelectedDocument(null);
            if (nextType === "INDIVIDUAL") {
              setDbaName("");
              setEntityType("LLC");
              setRegistrationState("");
            }
          },
        },
      ],
    );
  };

  const requestVerification = async () => {
    setRequestingVerification(true);
    try {
      const response = await startCoordinatorComplianceVerification_API(
        cobaltTinCanRetry ? "TIN" : (cobaltStateCanRetry || cobaltStateCanRefresh ? "SOS" : null),
      );
      if (!response?.success) throw new Error(response?.message || "Could not request verification.");
      setCompliance(response?.data?.compliance || compliance);
      await load();
      Alert.alert("Verification Requested", "Your identity verification request was submitted. The compliance status will update when the provider responds.");
    } catch (error) {
      Alert.alert("Verification", error?.message || "Unable to request identity verification.");
    } finally {
      setRequestingVerification(false);
    }
  };

  const setBusinessLicenseImage = (image) => {
    setSelectedDocument({
      uri: image.path,
      name: image.filename || "BUSINESS_LICENSE.jpg",
      type: image.mime || "image/jpeg",
    });
  };

  const chooseBusinessLicense = () => {
    Alert.alert("Upload Business License", "Choose how to add the document.", [
      {
        text: "Files",
        onPress: async () => {
          try {
            const [file] = await pick({ type: [types.pdf, types.images], allowMultiSelection: false });
            setSelectedDocument({
              uri: file.uri,
              name: file.name || "BUSINESS_LICENSE.pdf",
              type: file.type || "application/octet-stream",
            });
          } catch (error) {
            if (!String(error?.message || "").toLowerCase().includes("cancel")) {
              Alert.alert("Compliance", error?.message || "Could not select document.");
            }
          }
        },
      },
      {
        text: "Photo Library",
        onPress: async () => {
          try {
            if ((await photosPermissionStatus()) !== RESULTS.GRANTED) return;
            setBusinessLicenseImage(await ImagePicker.openPicker({ mediaType: "photo", compressImageQuality: 0.9 }));
          } catch (error) {
            if (error?.code !== "E_PICKER_CANCELLED") Alert.alert("Compliance", error?.message || "Could not select photo.");
          }
        },
      },
      {
        text: "Camera",
        onPress: async () => {
          try {
            if ((await cameraPermissionStatus()) !== RESULTS.GRANTED) return;
            setBusinessLicenseImage(await ImagePicker.openCamera({ mediaType: "photo", compressImageQuality: 0.9 }));
          } catch (error) {
            if (error?.code !== "E_PICKER_CANCELLED") Alert.alert("Compliance", error?.message || "Could not take photo.");
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const selectDocument = async () => {
    try {
      const documentType = partyType === "BUSINESS" ? "BUSINESS_LICENSE" : "DRIVER_LICENSE_FRONT";
      if (partyType === "BUSINESS") {
        chooseBusinessLicense();
        return;
      }
      const image = await ImagePicker.openPicker({ mediaType: "photo", compressImageQuality: 0.9 });
      setSelectedDocument({
        uri: image.path,
        name: image.filename || `${documentType}.${String(image.mime || "").includes("heic") ? "heic" : "jpg"}`,
        type: image.mime || "image/jpeg",
      });
    } catch (error) {
      if (error?.code !== "E_PICKER_CANCELLED") Alert.alert("Compliance", error?.message || "Could not select document.");
    }
  };

  const startW9 = async () => {
    try {
      setSaving(true);
      const response = await startCoordinatorW9Signing_API();
      const envelopeId = response?.data?.envelope_id;
      const signingUrl = response?.data?.signing_url;
      if (!response?.success || !envelopeId || !signingUrl) throw new Error("Could not start W-9 signing.");
      pendingW9EnvelopeRef.current = envelopeId;
      w9RecoveryAttemptRef.current = 0;
      setW9Session(response?.data?.w9_session || null);
      await AsyncStorage.setItem(
        W9_SIGNING_STORAGE_KEY,
        JSON.stringify({ envelope_id: envelopeId, started_at: new Date().toISOString() }),
      );
      await Linking.openURL(signingUrl);
    } catch (error) {
      pendingW9EnvelopeRef.current = null;
      Alert.alert("Compliance", error?.message || "Could not open DocuSign.");
    } finally { setSaving(false); }
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator color={AppColor.primary} /></View>;
  const requiredDocument = partyType === "BUSINESS" ? "BUSINESS_LICENSE" : "DRIVER_LICENSE_FRONT";
  const uploadedDocument = profile?.documents?.find((item) => item.document_type === requiredDocument);
  const uploaded = Boolean(uploadedDocument);
  const openDocument = async (url) => {
    try {
      if (!url || !(await Linking.canOpenURL(url))) throw new Error("Document is unavailable.");
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Compliance", error?.message || "Could not open the document.");
    }
  };

  const verificationStatus = compliance?.external_verification?.status || "NOT_STARTED";
  const verificationProvider = compliance?.external_verification?.provider || null;
  const verificationDisplay = {
    PASSED: { label: "Passed", tone: "passed" },
    PENDING: { label: "Pending", tone: "pending" },
    MANUAL_REVIEW: { label: "Manual Review", tone: "review" },
    FAILED: { label: "Not Verified", tone: "failed" },
    NOT_STARTED: { label: "Not Started", tone: "notStarted" },
  }[verificationStatus] || { label: "Not Started", tone: "notStarted" };
  const cobaltChecksByType = Object.fromEntries(
    (compliance?.external_verification?.checks || []).map((check) => [check.check_type, check]),
  );
  const cobaltVerificationChecks = [
    { type: "TIN", label: "EIN Verification" },
    { type: "SOS", label: "State Verification" },
  ].map((item) => ({ ...item, status: cobaltChecksByType[item.type]?.status || "NOT_STARTED" }));
  const internalVerificationReady = Boolean(requiresPaidCompliance) && (
    compliance?.requirements || []
  ).filter((requirement) => !["EXTERNAL_IDENTITY_VERIFICATION", "COBALT_TIN", "COBALT_SOS"].includes(requirement.key))
    .every((requirement) => requirement.complete);
  const cobaltStateCanRetry = verificationProvider === "COBALT" && ["FAILED", "RETRYABLE_ERROR"].includes(cobaltChecksByType.SOS?.status);
  const cobaltStateCanRefresh = verificationProvider === "COBALT" && cobaltChecksByType.SOS?.status === "PENDING" && Boolean(cobaltChecksByType.SOS?.provider_reference);
  const cobaltTinCanRetry = verificationProvider === "COBALT"
    && cobaltChecksByType.TIN?.status === "PENDING"
    && !cobaltChecksByType.TIN?.provider_reference
    && cobaltChecksByType.TIN?.submitted_at
    && Date.now() - new Date(cobaltChecksByType.TIN.submitted_at).getTime() >= 15 * 60 * 1000;
  const verificationCanRefresh = (verificationStatus === "PENDING" && verificationProvider === "COMPLYCUBE") || cobaltTinCanRetry || cobaltStateCanRetry || cobaltStateCanRefresh;
  const verificationDisabled = !internalVerificationReady || requestingVerification || (
    verificationStatus === "PENDING" && !verificationCanRefresh
  ) || verificationStatus === "PASSED";

  return <View style={styles.container}>
    <StatusBarManager backgroundColor={AppColor.white} barStyle="dark-content" />
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}><TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={28} color={AppColor.black} /></TouchableOpacity><Text style={styles.title}>Coordinator Compliance</Text><View style={{ width: 28 }} /></View>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={[styles.complianceCard, { borderColor: compliance?.score_color === "green" ? "#176B43" : compliance?.score_color === "yellow" ? "#B77900" : "#F97316" }]}>
        <View style={styles.complianceHeader}>
          <View style={styles.complianceCopy}>
            <Text style={styles.complianceTitle}>{compliance?.score_label || "Compliance"}</Text>
            <Text style={styles.copy}>{compliance?.remaining?.length ? `Remaining: ${compliance.remaining.join(" • ")}` : compliance ? "All currently applicable requirements are complete." : "Complete the required information below."}</Text>
          </View>
          <View style={[styles.scoreBadge, { backgroundColor: compliance?.score_color === "green" ? "#176B43" : compliance?.score_color === "yellow" ? "#B77900" : "#F97316" }]}><Text style={styles.scoreText}>{Number(compliance?.score || 0)}%</Text></View>
        </View>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, Number(compliance?.score || 0)))}%`, backgroundColor: compliance?.score_color === "green" ? "#176B43" : compliance?.score_color === "yellow" ? "#B77900" : "#F97316" }]} /></View>
        {compliance?.provider_verification_pending ? <Text style={styles.copy}>Documents are complete; identity verification is still pending.</Text> : null}
      </View>
      {verificationProvider === "COBALT" ? <View style={styles.externalVerificationRow}>
        <Text style={styles.externalVerificationLabel}>External Verification</Text>
        <View style={styles.verificationChecks}>
          {cobaltVerificationChecks.map((check) => <View key={check.type} style={styles.verificationCheck}>
            <Ionicons name={check.status === "PASSED" ? "checkbox" : "square-outline"} size={19} color={check.status === "PASSED" ? "#176B43" : "#64748B"} />
            <Text style={styles.verificationCheckText}>{check.label}</Text>
            <Text style={styles.verificationCheckStatus}>{formatOcrStatus(check.status)}</Text>
          </View>)}
        </View>
      </View> : <View style={styles.externalVerificationRow}>
        <Text style={styles.externalVerificationLabel}>External Verification</Text>
        <View style={[styles.externalVerificationPill, styles[`externalVerification${verificationDisplay.tone.charAt(0).toUpperCase()}${verificationDisplay.tone.slice(1)}`]]}>
          <Text style={styles.externalVerificationPillText}>{verificationDisplay.label}</Text>
        </View>
      </View>}
      <Text style={styles.label}>This is for</Text>
      <View style={styles.choiceRow}>{["INDIVIDUAL", "BUSINESS"].map((value) => <TouchableOpacity key={value} style={[styles.choice, partyType === value && styles.choiceActive]} onPress={() => selectPartyType(value)}><Text style={partyType === value ? styles.choiceTextActive : styles.choiceText}>{value === "INDIVIDUAL" ? "An Individual" : "A Business"}</Text></TouchableOpacity>)}</View>
      <TextInput label={partyType === "BUSINESS" ? "Legal business name *" : "Legal name *"} placeholder={`Legal Name must be exactly as printed on the ${partyType === "BUSINESS" ? "Business License" : "Driver License"}.`} value={legalName} onChangeText={(value) => { formDirtyRef.current = true; setLegalName(value); }} mode="outlined" style={styles.input} />
      {partyType === "BUSINESS" ? <><TextInput label="DBA (optional)" value={dbaName} onChangeText={setDbaName} mode="outlined" style={styles.input} /><Text style={styles.label}>Business type</Text><View style={styles.choiceRow}>{entityTypes.map((value) => <TouchableOpacity key={value} style={[styles.choice, entityType === value && styles.choiceActive]} onPress={() => setEntityType(value)}><Text style={entityType === value ? styles.choiceTextActive : styles.choiceText}>{value.replace(/_/g, " ")}</Text></TouchableOpacity>)}</View><View style={{ marginTop: 16 }}><StatePickerModal label="State of registration *" value={registrationState} onChange={(value) => { formDirtyRef.current = true; setRegistrationState(value); }} /></View></> : null}
      <Text style={styles.label}>Mailing Address</Text>
      <Text style={styles.copy}>This address is used only for coordinator compliance and payout records; it does not change customer delivery or discovery addresses.</Text>
      <TextInput label={requiresPaidCompliance ? "Address Line 1 *" : "Address Line 1"} value={mailingAddressLine1} onChangeText={(value) => { formDirtyRef.current = true; setMailingAddressLine1(value); }} mode="outlined" style={styles.input} />
      <TextInput label="Address Line 2" value={mailingAddressLine2} onChangeText={(value) => { formDirtyRef.current = true; setMailingAddressLine2(value); }} mode="outlined" style={styles.input} />
      <TextInput label={requiresPaidCompliance ? "City *" : "City"} value={mailingCity} onChangeText={(value) => { formDirtyRef.current = true; setMailingCity(value); }} mode="outlined" style={styles.input} />
      <View style={{ marginBottom: 12 }}><StatePickerModal label={requiresPaidCompliance ? "Mailing State *" : "Mailing State"} value={mailingState} onChange={(value) => { formDirtyRef.current = true; setMailingState(value); }} /></View>
      <TextInput label={requiresPaidCompliance ? "ZIP Code *" : "ZIP Code"} value={mailingPostal} onChangeText={(value) => { formDirtyRef.current = true; setMailingPostal(value); }} keyboardType="numbers-and-punctuation" mode="outlined" style={styles.input} />
      <TextInput label={requiresPaidCompliance ? `${taxIdType} *` : taxIdType} value={taxId} onChangeText={setTaxId} keyboardType="number-pad" secureTextEntry mode="outlined" style={styles.input} />
      {profile?.tax_id_masked ? <Text style={styles.copy}>Saved tax ID: {profile.tax_id_masked}</Text> : null}
      <View style={styles.documentCard}><Text style={styles.label}>{partyType === "BUSINESS" ? "Business License" : "Driver License — Front Only"}</Text><Text style={styles.copy}>Required before paid event capabilities can be verified.</Text><Text style={styles.status}>{selectedDocument ? `Ready to upload: ${selectedDocument.name}` : uploaded ? getDocumentLifecycleText(uploadedDocument) : "Not uploaded"}</Text>{uploaded ? <Text style={styles.copy}>{getOcrStatusText(uploadedDocument)}</Text> : null}{uploadedDocument?.original_name ? <Text style={styles.copy}>Uploaded: {uploadedDocument.original_name}</Text> : null}{uploadedDocument?.file_url ? <TouchableOpacity onPress={() => openDocument(uploadedDocument.file_url)} style={styles.secondary}><Text style={styles.secondaryText}>Open</Text></TouchableOpacity> : null}<TouchableOpacity disabled={saving} onPress={selectDocument} style={styles.secondary}><Text style={styles.secondaryText}>{uploaded || selectedDocument ? "Replace Document" : "Choose Document"}</Text></TouchableOpacity></View>
      <View style={styles.documentCard}><Text style={styles.label}>Signed W-9</Text><Text style={styles.copy}>{requiresPaidCompliance ? "Required before paid event capabilities can be verified." : "Optional while you only create free events. Select ticket sales or vendor fees in your profile to sign it."}</Text><View style={styles.infoRow}><Ionicons name="information-circle-outline" size={18} color={AppColor.primary} /><Text style={styles.infoText}>Individual Name and Business Name must be exactly as printed on the Business License or Driver License.</Text></View><Text style={styles.status}>{w9Session?.status === "SIGNED" ? getW9LifecycleText(w9Session) : w9Session?.status === "SENT" ? "Waiting for DocuSign signature confirmation" : "Not signed"}</Text>{w9Session?.status === "SIGNED" ? <Text style={styles.copy}>{getOcrStatusText(w9Session)}</Text> : null}{w9Session?.signed_document_url ? <TouchableOpacity onPress={() => openDocument(w9Session.signed_document_url)} style={styles.secondary}><Text style={styles.secondaryText}>Open</Text></TouchableOpacity> : null}{requiresPaidCompliance ? <TouchableOpacity disabled={saving} onPress={startW9} style={styles.secondary}><Text style={styles.secondaryText}>{w9Session ? "Replace W-9" : "Sign W-9"}</Text></TouchableOpacity> : null}</View>
      <TouchableOpacity disabled={saving} onPress={save} style={styles.primary}>{saving ? <ActivityIndicator color={AppColor.white} /> : <Text style={styles.primaryText}>Save & Run OCR</Text>}</TouchableOpacity>
      <TouchableOpacity disabled={verificationDisabled} onPress={requestVerification} style={[styles.primary, verificationDisabled && styles.disabled]}>{requestingVerification ? <ActivityIndicator color={AppColor.white} /> : <Text style={styles.primaryText}>{verificationStatus === "PENDING" ? cobaltTinCanRetry ? "Retry EIN Verification" : cobaltStateCanRetry ? "Retry State Verification" : cobaltStateCanRefresh ? "Check State Verification Status" : verificationCanRefresh ? "Check Verification Status" : "Verification Pending" : verificationStatus === "PASSED" ? "Verification Complete" : "Verification"}</Text>}</TouchableOpacity>
    </ScrollView>
  </View>;
};

const styles = StyleSheet.create({ container:{flex:1,backgroundColor:AppColor.white}, loading:{flex:1,alignItems:"center",justifyContent:"center"}, header:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",padding:20,borderBottomWidth:1,borderColor:"#eee"}, title:{fontFamily:Mulish700,fontSize:21,color:AppColor.black}, content:{padding:20,paddingBottom:40}, complianceCard:{borderWidth:2,borderRadius:14,padding:16,marginBottom:18}, complianceHeader:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:12}, complianceCopy:{flex:1}, complianceTitle:{fontFamily:Mulish700,fontSize:20,color:AppColor.black,marginBottom:4}, scoreBadge:{width:58,height:58,borderRadius:29,alignItems:"center",justifyContent:"center",paddingHorizontal:4}, scoreText:{fontFamily:Mulish700,fontSize:14,color:AppColor.white}, progressTrack:{height:8,borderRadius:4,backgroundColor:"#E5E7EB",overflow:"hidden",marginBottom:12}, progressFill:{height:"100%",borderRadius:4}, externalVerificationRow:{borderWidth:1,borderColor:"#e2e6ea",borderRadius:10,paddingHorizontal:14,paddingVertical:11,marginBottom:18,gap:10}, externalVerificationLabel:{fontFamily:Mulish700,fontSize:14,color:AppColor.black}, verificationChecks:{gap:8}, verificationCheck:{flexDirection:"row",alignItems:"center",gap:8}, verificationCheckText:{fontFamily:Mulish700,fontSize:13,color:AppColor.black,flex:1}, verificationCheckStatus:{fontFamily:Mulish400,fontSize:12,color:"#5f6d7e"}, externalVerificationPill:{alignSelf:"flex-end",borderRadius:14,paddingHorizontal:10,paddingVertical:5}, externalVerificationPillText:{fontFamily:Mulish700,fontSize:12,color:AppColor.white}, externalVerificationPassed:{backgroundColor:"#176B43"}, externalVerificationPending:{backgroundColor:"#B77900"}, externalVerificationReview:{backgroundColor:"#B77900"}, externalVerificationFailed:{backgroundColor:"#C53030"}, externalVerificationNotStarted:{backgroundColor:"#64748B"}, copy:{fontFamily:Mulish400,fontSize:14,lineHeight:21,color:"#5f6d7e",marginBottom:14}, infoRow:{flexDirection:"row",gap:6,alignItems:"flex-start",marginBottom:12}, infoText:{fontFamily:Mulish400,fontSize:13,lineHeight:19,color:"#5f6d7e",flex:1}, label:{fontFamily:Mulish700,fontSize:15,color:AppColor.black,marginTop:8,marginBottom:8}, choiceRow:{flexDirection:"row",flexWrap:"wrap",gap:8,marginBottom:10}, choice:{borderWidth:1,borderColor:"#cbd2da",borderRadius:18,paddingHorizontal:12,paddingVertical:8}, choiceActive:{backgroundColor:AppColor.primary,borderColor:AppColor.primary}, choiceText:{fontFamily:Mulish400,fontSize:12,color:AppColor.black}, choiceTextActive:{fontFamily:Mulish700,fontSize:12,color:AppColor.white}, input:{backgroundColor:AppColor.white,marginBottom:12}, primary:{alignItems:"center",backgroundColor:AppColor.primary,borderRadius:10,padding:16,marginTop:8}, disabled:{opacity:0.5}, primaryText:{fontFamily:Mulish700,color:AppColor.white,fontSize:16}, documentCard:{borderWidth:1,borderColor:"#e2e6ea",borderRadius:12,padding:16,marginTop:20}, status:{fontFamily:Mulish700,color:AppColor.primary,marginBottom:12}, secondary:{alignItems:"center",borderWidth:1,borderColor:AppColor.primary,borderRadius:10,padding:14}, secondaryText:{fontFamily:Mulish700,color:AppColor.primary} });

export default CoordinatorComplianceScreen;
