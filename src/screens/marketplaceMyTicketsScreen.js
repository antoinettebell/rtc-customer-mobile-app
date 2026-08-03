import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppHeader from "../components/AppHeader";
import StatusBarManager from "../components/StatusBarManager";
import { getMarketplaceMyTickets_API } from "../apiFolder/appAPI";
import { AppColor } from "../utils/theme";
import { formatDate, formatMoney, styles } from "./marketplaceShared";

const MarketplaceMyTicketsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const response = await getMarketplaceMyTickets_API();
      setOrders(response?.data?.ticketOrders || []);
    } catch (error) {
      Alert.alert("My Tickets", error?.message || "Unable to load tickets.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const shareTicket = async (ticket, eventName) => {
    await Share.share({
      title: `${eventName} ticket`,
      message: `${eventName} — ${ticket.attendee_label} (${ticket.ticket_type})\n${ticket.ticket_url}`,
      url: ticket.ticket_url,
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager /><AppHeader headerTitle="My Tickets" />
      {loading ? <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={AppColor.primary} size="large" /></View> :
        <ScrollView contentContainerStyle={styles.body} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={AppColor.primary} />}>
          {!orders.length ? <View style={styles.card}><Text style={styles.title}>No tickets yet</Text><Text style={styles.meta}>Tickets purchased through Round Da&apos; Corner will appear here.</Text></View> : null}
          {orders.map((order) => (
            <View style={styles.card} key={order.ticket_order_id}>
              <Text style={styles.title}>{order.event?.event_name || "Event"}</Text>
              <Text style={styles.meta}>{formatDate(order.event?.event_date)} · {formatMoney(order.total_amount)}</Text>
              <Text style={styles.meta}>Order status: {order.status?.replaceAll("_", " ")}</Text>
              {(order.tickets || []).map((ticket) => (
                <View key={ticket.ticket_id} style={{ marginTop: 16 }}>
                  <Text style={styles.label}>{ticket.attendee_label} · {ticket.ticket_type}</Text>
                  <Text style={styles.meta}>Status: {ticket.status?.replaceAll("_", " ")}</Text>
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                    <TouchableOpacity style={[styles.button, { flex: 1 }]} onPress={() => navigation.navigate("marketplaceTicketWebViewScreen", { url: ticket.ticket_url, title: order.event?.event_name || "Ticket" })}><Text style={styles.buttonText}>View QR</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={() => shareTicket(ticket, order.event?.event_name || "Event")}><Text style={styles.secondaryButtonText}>Share</Text></TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>}
    </View>
  );
};

export default MarketplaceMyTicketsScreen;
