import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppHeader from "../components/AppHeader";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor } from "../utils/theme";
import {
  getMarketplaceMyEvents_API,
  getMyMarketplaceTicketStaff_API,
} from "../apiFolder/appAPI";
import { formatDate, styles } from "./marketplaceShared";
import { pendingTicketStaffAssignments } from "../helpers/marketplaceTicketStaff.helper";

const DISMISSED_TICKET_STAFF_KEY = "marketplace-dismissed-ticket-staff-notifications";

const MarketplaceNotificationsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState([]);
  const [staffAssignments, setStaffAssignments] = useState([]);
  const [dismissedStaffIds, setDismissedStaffIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const [response, staffResponse, dismissedValue] = await Promise.all([
        getMarketplaceMyEvents_API(),
        getMyMarketplaceTicketStaff_API().catch(() => null),
        AsyncStorage.getItem(DISMISSED_TICKET_STAFF_KEY),
      ]);
      if (response?.success) {
        setEvents(response.data?.marketplaceEventList || []);
      }
      setStaffAssignments(
        pendingTicketStaffAssignments(staffResponse?.data?.assignmentList || []),
      );
      try {
        setDismissedStaffIds(JSON.parse(dismissedValue || "[]"));
      } catch (_error) {
        setDismissedStaffIds([]);
      }
    } catch (error) {
      console.log("Marketplace notifications error", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const notifications = [
    ...staffAssignments
      .filter((assignment) => !dismissedStaffIds.includes(assignment.assignment_id))
      .map((assignment) => ({
        id: `ticket-staff-${assignment.assignment_id}`,
        assignmentId: assignment.assignment_id,
        eventName: assignment.marketplaceEvent?.event_name || "Event",
        eventDate: formatDate(assignment.marketplaceEvent?.event_date),
        count: 1,
        icon: "badge",
        title: "Ticket staff assignment",
        subtitle: "Accept or decline this ticket-scanning assignment.",
        screen: "marketplaceTicketStaffScreen",
      })),
    ...events.flatMap((event) => {
    const eventId = event.event_id;
    const eventName = event.event_name || "Untitled Event";
    const eventDate = formatDate(event.event_date);
    const unreadMessages = Number(event.unread_message_count || 0);
    const unseenSubmissions = Number(event.unseen_submission_count || 0);
    const rows = [];

    if (unreadMessages > 0) {
      rows.push({
        id: `${eventId}-messages`,
        eventId,
        eventName,
        eventDate,
        count: unreadMessages,
        icon: "chat-bubble-outline",
        title: `${unreadMessages} unread message${unreadMessages === 1 ? "" : "s"}`,
        subtitle: "Open messages and coordinator/vendor questions.",
        screen: "marketplaceEventMessagesScreen",
      });
    }

    if (unseenSubmissions > 0) {
      rows.push({
        id: `${eventId}-submissions`,
        eventId,
        eventName,
        eventDate,
        count: unseenSubmissions,
        icon: "assignment",
        title: `${unseenSubmissions} new bid/application${unseenSubmissions === 1 ? "" : "s"}`,
        subtitle: "Review vendor bids and applications for this event.",
        screen: "marketplaceAwardBidsScreen",
      });
    }

      return rows;
    }),
  ];

  const openNotification = (item) => {
    navigation.navigate(item.screen, {
      eventId: item.eventId,
      assignmentId: item.assignmentId,
    });
  };

  const dismissTicketStaffNotification = async (item) => {
    const nextIds = [...new Set([...dismissedStaffIds, item.assignmentId])];
    setDismissedStaffIds(nextIds);
    await AsyncStorage.setItem(DISMISSED_TICKET_STAFF_KEY, JSON.stringify(nextIds));
  };

  const renderNotification = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => openNotification(item)}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#FFF1E6",
          }}
        >
          <MaterialIcons name={item.icon} size={21} color={AppColor.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
            <Text style={[styles.title, { flex: 1 }]}>{item.title}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.count > 99 ? "99+" : item.count}</Text>
            </View>
          </View>
          <Text style={styles.label}>{item.eventName}</Text>
          <Text style={styles.meta}>{item.eventDate}</Text>
          <Text style={styles.meta}>{item.subtitle}</Text>
        </View>
        </View>
      </TouchableOpacity>
      {item.assignmentId ? (
        <TouchableOpacity
          activeOpacity={0.7}
          style={{ marginTop: 10, alignSelf: "flex-start" }}
          onPress={() => dismissTicketStaffNotification(item)}
        >
          <Text style={styles.secondaryButtonText}>Clear notification</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />
      <AppHeader headerTitle="Notifications" />
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={AppColor.primary}
          />
        }
        ListHeaderComponent={
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.secondaryButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={18} color={AppColor.primary} />
            <Text style={styles.secondaryButtonText}>Back to My Events</Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          loading && !refreshing ? (
            <View style={{ paddingVertical: 40 }}>
              <ActivityIndicator color={AppColor.primary} size="large" />
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={[styles.title, { textAlign: "center" }]}>
                No unread notifications
              </Text>
              <Text style={styles.emptyText}>
                New messages, bids/applications, and ticket staff assignments will appear here.
              </Text>
            </View>
          )
        }
      />
    </View>
  );
};

export default MarketplaceNotificationsScreen;
