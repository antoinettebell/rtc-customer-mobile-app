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
import AppHeader from "../components/AppHeader";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor } from "../utils/theme";
import { getMarketplaceMyEvents_API } from "../apiFolder/appAPI";
import { formatDate, styles } from "./marketplaceShared";

const MarketplaceNotificationsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const response = await getMarketplaceMyEvents_API();
      if (response?.success) {
        setEvents(response.data?.marketplaceEventList || []);
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

  const notifications = events.flatMap((event) => {
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
  });

  const openNotification = (item) => {
    navigation.navigate(item.screen, { eventId: item.eventId });
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.card}
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
                New messages and new bids/applications will appear here.
              </Text>
            </View>
          )
        }
      />
    </View>
  );
};

export default MarketplaceNotificationsScreen;
