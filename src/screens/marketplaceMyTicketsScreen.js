import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
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
import {
  filterTicketOrders,
  MY_TICKET_FILTERS,
} from "../helpers/marketplaceMyTickets.helper";
import { formatDate, formatMoney, styles } from "./marketplaceShared";

const MarketplaceMyTicketsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState(MY_TICKET_FILTERS.UPCOMING);
  const [expandedOrderIds, setExpandedOrderIds] = useState(() => new Set());

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
    });
  };

  const toggleOrderExpanded = (orderId) => {
    setExpandedOrderIds((current) => {
      const next = new Set(current);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  };

  const visibleOrders = filterTicketOrders(orders, activeFilter);
  const emptyFilterMessage =
    activeFilter === MY_TICKET_FILTERS.PAST
      ? "No past event tickets"
      : "No upcoming event tickets";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager /><AppHeader headerTitle="My Tickets" />
      {loading ? <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={AppColor.primary} size="large" /></View> :
        <ScrollView contentContainerStyle={styles.body} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={AppColor.primary} />}>
          {!orders.length ? <View style={styles.card}><Text style={styles.title}>No tickets yet</Text><Text style={styles.meta}>Tickets purchased through Round Da&apos; Corner will appear here.</Text></View> : null}
          {orders.length ? (
            <View style={ticketStyles.filterRow}>
              {[
                [MY_TICKET_FILTERS.UPCOMING, "Upcoming Events"],
                [MY_TICKET_FILTERS.PAST, "Past Events"],
              ].map(([value, label]) => {
                const selected = activeFilter === value;
                return (
                  <TouchableOpacity
                    key={value}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setActiveFilter(value)}
                    style={[ticketStyles.filterButton, selected && ticketStyles.filterButtonActive]}
                  >
                    <Text style={[ticketStyles.filterText, selected && ticketStyles.filterTextActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}
          {orders.length && !visibleOrders.length ? (
            <View style={styles.card}>
              <Text style={styles.title}>{emptyFilterMessage}</Text>
              <Text style={styles.meta}>Select the other filter to review additional tickets.</Text>
            </View>
          ) : null}
          {visibleOrders.map((order) => {
            const expanded = expandedOrderIds.has(order.ticket_order_id);
            const ticketCount = Array.isArray(order.tickets) ? order.tickets.length : 0;
            return (
              <View style={styles.card} key={order.ticket_order_id}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  onPress={() => toggleOrderExpanded(order.ticket_order_id)}
                  style={ticketStyles.orderHeader}
                >
                  <View style={ticketStyles.orderHeaderText}>
                    <Text style={styles.title}>{order.event?.event_name || "Event"}</Text>
                    <Text style={styles.meta}>{formatDate(order.event?.event_date)} · {formatMoney(order.total_amount)}</Text>
                    <Text style={styles.meta}>{ticketCount} ticket{ticketCount === 1 ? "" : "s"} · Order status: {order.status?.replaceAll("_", " ")}</Text>
                  </View>
                  <Text style={ticketStyles.chevron}>{expanded ? "−" : "+"}</Text>
                </TouchableOpacity>
                {expanded
                  ? (order.tickets || []).map((ticket) => (
                    <View key={ticket.ticket_id} style={ticketStyles.ticketSection}>
                      <Text style={styles.label}>{ticket.attendee_label} · {ticket.ticket_type}</Text>
                      <Text style={styles.meta}>Status: {ticket.status?.replaceAll("_", " ")}</Text>
                      <View style={ticketStyles.actionRow}>
                        <TouchableOpacity style={[styles.button, { flex: 1 }]} onPress={() => navigation.navigate("marketplaceTicketWebViewScreen", { url: ticket.ticket_url, title: order.event?.event_name || "Ticket", returnToMyTickets: true })}><Text style={styles.buttonText}>View QR</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={() => shareTicket(ticket, order.event?.event_name || "Event")}><Text style={styles.secondaryButtonText}>Share</Text></TouchableOpacity>
                      </View>
                    </View>
                  ))
                  : null}
              </View>
            );
          })}
        </ScrollView>}
    </View>
  );
};

const ticketStyles = StyleSheet.create({
  filterRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  filterButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: AppColor.primary,
    borderRadius: 10,
    backgroundColor: AppColor.white,
  },
  filterButtonActive: {
    backgroundColor: AppColor.primary,
  },
  filterText: {
    color: AppColor.primary,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  filterTextActive: {
    color: AppColor.white,
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  orderHeaderText: {
    flex: 1,
  },
  chevron: {
    color: AppColor.primary,
    fontSize: 30,
    fontWeight: "600",
    lineHeight: 34,
  },
  ticketSection: {
    marginTop: 16,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: AppColor.borderColor,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
});

export default MarketplaceMyTicketsScreen;
