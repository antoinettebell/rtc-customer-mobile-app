import React, { useCallback, useState } from "react";
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppHeader from "../components/AppHeader";
import StatusBarManager from "../components/StatusBarManager";
import { createTicketStaffScannerSession_API, getMyMarketplaceTicketStaff_API, respondMarketplaceTicketStaff_API } from "../apiFolder/appAPI";
import { formatDate, formatEventTime, styles } from "./marketplaceShared";
import { ticketStaffDeclineConfirmation, visibleTicketStaffAssignments } from "../helpers/marketplaceTicketStaff.helper";

export default function MarketplaceTicketStaffScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [assignments, setAssignments] = useState([]);
  const load = useCallback(() => getMyMarketplaceTicketStaff_API().then((response) => setAssignments(visibleTicketStaffAssignments(response?.data?.assignmentList || []))).catch(() => setAssignments([])), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const respond = (item, response) => Alert.alert(
    response === "ACCEPTED" ? "Accept Ticket Staff Assignment?" : "Decline Ticket Staff Assignment?",
    response === "DECLINED"
      ? ticketStaffDeclineConfirmation
      : `This applies to ${item.marketplaceEvent?.event_name || "this event"}.`,
    [{ text: "Cancel", style: "cancel" }, { text: response === "ACCEPTED" ? "Accept" : "Decline", style: response === "DECLINED" ? "destructive" : "default", onPress: async () => { await respondMarketplaceTicketStaff_API(item.assignment_id, response); load(); } }],
  );
  const scan = async (item) => {
    try {
      const response = await createTicketStaffScannerSession_API(item.assignment_id);
      const url = response?.data?.scanner_url;
      if (!url) throw new Error("Scanner unavailable");
      await Linking.openURL(url);
    } catch (error) { Alert.alert("Scan Tickets", error?.message || "Ticket scanning is not currently available."); }
  };
  return <View style={[styles.container, { paddingTop: insets.top }]}><StatusBarManager /><AppHeader headerTitle="My Event Gigs" onBack={() => navigation.goBack()} /><ScrollView contentContainerStyle={styles.body}>{assignments.map((item) => {
    const event = item.marketplaceEvent || {};
    return <View key={item.assignment_id} style={styles.card}><Text style={styles.title}>{event.event_name || "Event"}</Text><Text style={styles.meta}>{formatDate(event.event_date)} · {formatEventTime(event.event_time)}</Text><Text style={styles.meta}>{[event.event_address, event.event_city, event.event_state].filter(Boolean).join(", ")}</Text><Text style={styles.label}>Status: {item.status}</Text>{item.status === "PENDING" ? <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}><TouchableOpacity style={[styles.button, { flex: 1 }]} onPress={() => respond(item, "ACCEPTED")}><Text style={styles.buttonText}>Accept</Text></TouchableOpacity><TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={() => respond(item, "DECLINED")}><Text style={styles.secondaryButtonText}>Decline</Text></TouchableOpacity></View> : null}{item.status === "ACCEPTED" ? <TouchableOpacity style={[styles.button, { marginTop: 12 }]} onPress={() => scan(item)}><Text style={styles.buttonText}>Scan Tickets</Text></TouchableOpacity> : null}</View>;
  })}{!assignments.length ? <View style={styles.card}><Text style={styles.emptyText}>You do not have any active ticket staff invitations.</Text></View> : null}</ScrollView></View>;
}
