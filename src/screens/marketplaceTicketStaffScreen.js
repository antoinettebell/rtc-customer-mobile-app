import React, { useCallback, useState } from "react";
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppHeader from "../components/AppHeader";
import StatusBarManager from "../components/StatusBarManager";
import { createTicketStaffScannerSession_API, getMyMarketplaceTicketStaff_API, respondMarketplaceTicketStaff_API } from "../apiFolder/appAPI";
import { formatDate, formatEventTime, styles } from "./marketplaceShared";
import { ticketStaffDeclineConfirmation, visibleTicketStaffAssignments } from "../helpers/marketplaceTicketStaff.helper";

const DISMISSED_TICKET_STAFF_KEY = "marketplace-dismissed-ticket-staff-notifications";

export default function MarketplaceTicketStaffScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [assignments, setAssignments] = useState([]);
  const [dismissedAssignmentIds, setDismissedAssignmentIds] = useState([]);
  const pendingCount = assignments.filter(
    (item) => item.status === "PENDING" && !dismissedAssignmentIds.includes(item.assignment_id),
  ).length;
  const load = useCallback(async () => {
    try {
      const [response, dismissedValue] = await Promise.all([
        getMyMarketplaceTicketStaff_API(),
        AsyncStorage.getItem(DISMISSED_TICKET_STAFF_KEY),
      ]);
      setAssignments(visibleTicketStaffAssignments(response?.data?.assignmentList || []));
      try {
        setDismissedAssignmentIds(JSON.parse(dismissedValue || "[]"));
      } catch (_error) {
        setDismissedAssignmentIds([]);
      }
    } catch (_error) {
      setAssignments([]);
      setDismissedAssignmentIds([]);
    }
  }, []);
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
  return <View style={[styles.container, { paddingTop: insets.top }]}><StatusBarManager /><AppHeader headerTitle="My Event Gigs" onBack={() => navigation.goBack()}><TouchableOpacity hitSlop={10} activeOpacity={0.7} style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }} onPress={() => navigation.navigate("marketplaceNotificationsScreen")}><MaterialIcons name={pendingCount ? "notifications-active" : "notifications-none"} size={24} color={pendingCount ? "#F15B40" : "#6B7280"} />{pendingCount ? <View style={{ position: "absolute", top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 3, backgroundColor: "#F15B40", alignItems: "center", justifyContent: "center" }}><Text style={{ color: "white", fontSize: 10, fontWeight: "700" }}>{pendingCount > 99 ? "99+" : pendingCount}</Text></View> : null}</TouchableOpacity></AppHeader><ScrollView contentContainerStyle={styles.body}>{assignments.map((item) => {
    const event = item.marketplaceEvent || {};
    return <View key={item.assignment_id} style={styles.card}><Text style={styles.title}>{event.event_name || "Event"}</Text><Text style={styles.meta}>{formatDate(event.event_date)} · {formatEventTime(event.event_time)}</Text><Text style={styles.meta}>{[event.event_address, event.event_city, event.event_state].filter(Boolean).join(", ")}</Text><Text style={styles.label}>Status: {item.status}</Text>{item.status === "PENDING" ? <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}><TouchableOpacity style={[styles.button, { flex: 1 }]} onPress={() => respond(item, "ACCEPTED")}><Text style={styles.buttonText}>Accept</Text></TouchableOpacity><TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={() => respond(item, "DECLINED")}><Text style={styles.secondaryButtonText}>Decline</Text></TouchableOpacity></View> : null}{item.status === "ACCEPTED" ? <TouchableOpacity style={[styles.button, { marginTop: 12 }]} onPress={() => scan(item)}><Text style={styles.buttonText}>Scan Tickets</Text></TouchableOpacity> : null}</View>;
  })}{!assignments.length ? <View style={styles.card}><Text style={styles.emptyText}>You do not have any active ticket staff invitations.</Text></View> : null}</ScrollView></View>;
}
