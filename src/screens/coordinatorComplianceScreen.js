import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { TextInput } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ImagePicker from "react-native-image-crop-picker";
import { useSelector } from "react-redux";
import Ionicons from "react-native-vector-icons/Ionicons";
import { AppColor, Mulish400, Mulish700 } from "../utils/theme";
import StatusBarManager from "../components/StatusBarManager";
import {
  getCoordinatorCompliance_API,
  startCoordinatorW9Signing_API,
  completeCoordinatorW9Signing_API,
  saveCoordinatorComplianceProfile_API,
  submitCoordinatorComplianceOcr_API,
  uploadCoordinatorComplianceDocument_API,
} from "../apiFolder/appAPI";

const entityTypes = ["SOLE_PROPRIETOR", "LLC", "CORPORATION", "PARTNERSHIP", "S_CORPORATION"];

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
  const [businessAddress, setBusinessAddress] = useState("");
  const [taxIdType, setTaxIdType] = useState("SSN");
  const [taxId, setTaxId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [w9Session, setW9Session] = useState(null);
  const [pendingEnvelopeId, setPendingEnvelopeId] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
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
      setPartyType(next?.party_type || "INDIVIDUAL");
      setLegalName(next?.legal_name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim());
      setDbaName(next?.dba_name || "");
      setEntityType(next?.entity_type || "LLC");
      setRegistrationState(next?.registration_state || "");
      setBusinessAddress(next?.business_address || "");
      setTaxIdType(next?.tax_id_type || (next?.party_type === "BUSINESS" ? "EIN" : "SSN"));
    } catch (_error) {
      // The screen remains usable if a delayed deployment or retry briefly
      // prevents the optional summary from loading.
    } finally {
      setLoading(false);
    }
  }, [user?.firstName, user?.lastName]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const complete = async ({ url }) => {
      if (!pendingEnvelopeId || !String(url || "").startsWith("rtc-customer://docusign/return")) return;
      try {
        const response = await completeCoordinatorW9Signing_API(pendingEnvelopeId);
        setW9Session(response?.data?.w9_session || null);
        setPendingEnvelopeId(null);
        Alert.alert("Compliance", "Your signed W-9 was received.");
      } catch (error) {
        Alert.alert("Compliance", error?.message || "DocuSign is still finalizing the W-9. Please reopen Compliance shortly.");
      }
    };
    const subscription = Linking.addEventListener("url", complete);
    return () => subscription.remove();
  }, [pendingEnvelopeId]);

  const save = async () => {
    if (!legalName.trim()) return Alert.alert("Compliance", "Legal name is required.");
    if (partyType === "BUSINESS" && (!businessAddress.trim() || !registrationState.trim())) {
      return Alert.alert("Compliance", "Business address and registration state are required.");
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
        business_address: partyType === "BUSINESS" ? businessAddress.trim() : null,
        ...(taxId ? { tax_id_type: taxIdType, tax_id: taxId.replace(/\D/g, "") } : {}),
      });
      if (!response?.success) throw new Error(response?.message || "Could not save compliance.");
      const savedProfile = response?.data?.profile || null;
      setProfile(savedProfile);
      setTaxId("");
      if (selectedDocument) {
        const payload = new FormData();
        payload.append("document_type", partyType === "BUSINESS" ? "BUSINESS_LICENSE" : "DRIVER_LICENSE_FRONT");
        payload.append("file", selectedDocument);
        const uploadResponse = await uploadCoordinatorComplianceDocument_API(payload);
        if (!uploadResponse?.success) throw new Error(uploadResponse?.message || "Could not upload document.");
        setSelectedDocument(null);
      }
      const ocrResponse = await submitCoordinatorComplianceOcr_API();
      if (!ocrResponse?.success) throw new Error(ocrResponse?.message || "Could not submit documents for OCR.");
      await load();
      Alert.alert("Compliance", "Compliance information saved. Changed documents were submitted for OCR.");
    } catch (error) {
      Alert.alert("Compliance", error?.message || "Could not save compliance.");
    } finally { setSaving(false); }
  };

  const selectDocument = async () => {
    try {
      const image = await ImagePicker.openPicker({ mediaType: "photo", compressImageQuality: 0.9 });
      const documentType = partyType === "BUSINESS" ? "BUSINESS_LICENSE" : "DRIVER_LICENSE_FRONT";
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
      setPendingEnvelopeId(envelopeId);
      setW9Session(response?.data?.w9_session || null);
      await Linking.openURL(signingUrl);
    } catch (error) {
      Alert.alert("Compliance", error?.message || "Could not open DocuSign.");
    } finally { setSaving(false); }
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator color={AppColor.primary} /></View>;
  const requiredDocument = partyType === "BUSINESS" ? "BUSINESS_LICENSE" : "DRIVER_LICENSE_FRONT";
  const uploaded = profile?.documents?.some((item) => item.document_type === requiredDocument);

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
      <Text style={styles.copy}>This information is kept separately from your customer profile. Your driver license stays in RTC records and is not sent to ComplyCube.</Text>
      <Text style={styles.label}>This is for</Text>
      <View style={styles.choiceRow}>{["INDIVIDUAL", "BUSINESS"].map((value) => <TouchableOpacity key={value} style={[styles.choice, partyType === value && styles.choiceActive]} onPress={() => { setPartyType(value); setTaxIdType(value === "BUSINESS" ? "EIN" : "SSN"); }}><Text style={partyType === value ? styles.choiceTextActive : styles.choiceText}>{value === "INDIVIDUAL" ? "An Individual" : "A Business"}</Text></TouchableOpacity>)}</View>
      <TextInput label={partyType === "BUSINESS" ? "Legal business name *" : "Legal name *"} value={legalName} onChangeText={setLegalName} mode="outlined" style={styles.input} />
      {partyType === "BUSINESS" ? <><TextInput label="DBA (optional)" value={dbaName} onChangeText={setDbaName} mode="outlined" style={styles.input} /><Text style={styles.label}>Business type</Text><View style={styles.choiceRow}>{entityTypes.map((value) => <TouchableOpacity key={value} style={[styles.choice, entityType === value && styles.choiceActive]} onPress={() => setEntityType(value)}><Text style={entityType === value ? styles.choiceTextActive : styles.choiceText}>{value.replace(/_/g, " ")}</Text></TouchableOpacity>)}</View><TextInput label="State of registration *" value={registrationState} onChangeText={setRegistrationState} autoCapitalize="characters" maxLength={2} mode="outlined" style={styles.input} /><TextInput label="Business address *" value={businessAddress} onChangeText={setBusinessAddress} mode="outlined" style={styles.input} /></> : null}
      <TextInput label={requiresPaidCompliance ? `${taxIdType} *` : taxIdType} value={taxId} onChangeText={setTaxId} keyboardType="number-pad" secureTextEntry mode="outlined" style={styles.input} />
      {profile?.tax_id_masked ? <Text style={styles.copy}>Saved tax ID: {profile.tax_id_masked}</Text> : null}
      <View style={styles.documentCard}><Text style={styles.label}>{partyType === "BUSINESS" ? "Business License" : "Driver License — Front Only"}</Text><Text style={styles.copy}>{partyType === "BUSINESS" ? "Required for a business coordinator." : "Required for an individual coordinator. This is retained by RTC only and OCR is matched to the legal name above."}</Text><Text style={styles.status}>{selectedDocument ? `Ready to upload: ${selectedDocument.name}` : uploaded ? profile?.documents?.find((item) => item.document_type === requiredDocument)?.ocr_status === "completed" ? "Verified" : `OCR: ${profile?.documents?.find((item) => item.document_type === requiredDocument)?.ocr_status || "Pending"}` : "Not uploaded"}</Text><TouchableOpacity disabled={saving} onPress={selectDocument} style={styles.secondary}><Text style={styles.secondaryText}>{uploaded || selectedDocument ? "Replace Document" : "Choose Document"}</Text></TouchableOpacity></View>
      <View style={styles.documentCard}><Text style={styles.label}>Signed W-9</Text><Text style={styles.copy}>{requiresPaidCompliance ? "Required before paid event capabilities can be verified. OCR compares it to the business compliance name and EIN." : "Optional while you only create free events. Select ticket sales or vendor fees in your profile to sign it."}</Text><Text style={styles.status}>{w9Session?.status === "SIGNED" ? w9Session?.ocr_status === "completed" ? "Verified" : `Signed — OCR: ${w9Session?.ocr_status || "Pending"}` : "Not signed"}</Text>{requiresPaidCompliance ? <TouchableOpacity disabled={saving} onPress={startW9} style={styles.secondary}><Text style={styles.secondaryText}>{w9Session ? "Replace W-9" : "Sign W-9"}</Text></TouchableOpacity> : null}</View>
      <TouchableOpacity disabled={saving} onPress={save} style={styles.primary}>{saving ? <ActivityIndicator color={AppColor.white} /> : <Text style={styles.primaryText}>Save & Run OCR</Text>}</TouchableOpacity>
    </ScrollView>
  </View>;
};

const styles = StyleSheet.create({ container:{flex:1,backgroundColor:AppColor.white}, loading:{flex:1,alignItems:"center",justifyContent:"center"}, header:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",padding:20,borderBottomWidth:1,borderColor:"#eee"}, title:{fontFamily:Mulish700,fontSize:21,color:AppColor.black}, content:{padding:20,paddingBottom:40}, complianceCard:{borderWidth:2,borderRadius:14,padding:16,marginBottom:18}, complianceHeader:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:12}, complianceCopy:{flex:1}, complianceTitle:{fontFamily:Mulish700,fontSize:20,color:AppColor.black,marginBottom:4}, scoreBadge:{width:58,height:58,borderRadius:29,alignItems:"center",justifyContent:"center",paddingHorizontal:4}, scoreText:{fontFamily:Mulish700,fontSize:14,color:AppColor.white}, progressTrack:{height:8,borderRadius:4,backgroundColor:"#E5E7EB",overflow:"hidden",marginBottom:12}, progressFill:{height:"100%",borderRadius:4}, copy:{fontFamily:Mulish400,fontSize:14,lineHeight:21,color:"#5f6d7e",marginBottom:14}, label:{fontFamily:Mulish700,fontSize:15,color:AppColor.black,marginTop:8,marginBottom:8}, choiceRow:{flexDirection:"row",flexWrap:"wrap",gap:8,marginBottom:10}, choice:{borderWidth:1,borderColor:"#cbd2da",borderRadius:18,paddingHorizontal:12,paddingVertical:8}, choiceActive:{backgroundColor:AppColor.primary,borderColor:AppColor.primary}, choiceText:{fontFamily:Mulish400,fontSize:12,color:AppColor.black}, choiceTextActive:{fontFamily:Mulish700,fontSize:12,color:AppColor.white}, input:{backgroundColor:AppColor.white,marginBottom:12}, primary:{alignItems:"center",backgroundColor:AppColor.primary,borderRadius:10,padding:16,marginTop:8}, primaryText:{fontFamily:Mulish700,color:AppColor.white,fontSize:16}, documentCard:{borderWidth:1,borderColor:"#e2e6ea",borderRadius:12,padding:16,marginTop:20}, status:{fontFamily:Mulish700,color:AppColor.primary,marginBottom:12}, secondary:{alignItems:"center",borderWidth:1,borderColor:AppColor.primary,borderRadius:10,padding:14}, secondaryText:{fontFamily:Mulish700,color:AppColor.primary} });

export default CoordinatorComplianceScreen;
