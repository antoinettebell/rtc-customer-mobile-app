import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AntDesign from "react-native-vector-icons/AntDesign";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import AppHeader from "../components/AppHeader";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor } from "../utils/theme";
import { getMarketplaceMyEvents_API } from "../apiFolder/appAPI";
import { formatDate, formatEventTime, formatMoney, styles } from "./marketplaceShared";

const MarketplaceMyEventsScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const statusFilter = route?.params?.statusFilter;
  const visibleEvents = statusFilter
    ? events.filter((event) => event.status === statusFilter)
    : events;
  const notificationCount = visibleEvents.reduce(
    (total, event) =>
      total +
      Number(event.unread_message_count || 0) +
      Number(event.unseen_submission_count || 0),
    0
  );

  const loadEvents = async () => {
    setLoading(true);
    try {
      const response = await getMarketplaceMyEvents_API();
      if (response?.success) {
        setEvents(response.data?.marketplaceEventList || []);
      }
    } catch (error) {
      console.log("Marketplace events error", error);
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

  const getVendorName = (bid) => {
    const foodTruck = bid?.food_truck_id;
    const vendor = bid?.vendor_user_id;
    if (foodTruck?.name) return foodTruck.name;
    return [vendor?.firstName, vendor?.lastName].filter(Boolean).join(" ") || "Vendor";
  };

  const openDocument = async (url) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.log("Open marketplace document error", error);
    }
  };

  const getBidDocuments = (bid) => [
    ...(bid?.menu_pdf_url ? [{ label: "Menu PDF", url: bid.menu_pdf_url }] : []),
    ...(bid?.agreement_document_url
      ? [{ label: "Agreement Document", url: bid.agreement_document_url }]
      : []),
    ...(bid?.signed_document_url
      ? [{ label: "Signed Document", url: bid.signed_document_url }]
      : []),
    ...(bid?.attachments || [])
      .filter((attachment) => attachment.file_url || attachment.url)
      .map((attachment, index) => ({
        label: attachment.original_name || attachment.attachment_type || `Document ${index + 1}`,
        url: attachment.file_url || attachment.url,
      })),
  ];

  const renderAwardedBid = (bid) => {
    const documents = getBidDocuments(bid);
    return (
      <View key={bid.bid_id} style={{ marginTop: 12 }}>
        <Text style={styles.label}>{getVendorName(bid)}</Text>
        <Text style={styles.meta}>Awarded Amount: {formatMoney(bid.full_bid_amount)}</Text>
        <Text style={styles.meta}>Vendor Payment: {bid.payment_status || "NOT_REQUIRED"}</Text>
        <Text style={styles.meta}>
          Agreement / Signing: {bid.agreement_status || "NOT_REQUIRED"}
        </Text>
        {documents.length ? (
          <View style={{ marginTop: 6 }}>
            {documents.map((document) => (
              <TouchableOpacity
                key={`${bid.bid_id}-${document.label}-${document.url}`}
                activeOpacity={0.7}
                onPress={() => openDocument(document.url)}
              >
                <Text style={styles.secondaryButtonText}>{document.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.meta}>Documents: Not available</Text>
        )}
      </View>
    );
  };

  const renderAwardedEvent = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.card}
      onPress={() =>
        navigation.navigate("marketplaceEventDetailsScreen", {
          eventId: item.event_id,
        })
      }
    >
      <Text style={styles.title}>{item.event_name}</Text>
      <Text style={styles.meta}>
        {formatDate(item.event_date)}
        {item.event_time ? ` - ${formatEventTime(item.event_time, item)}` : ""}
      </Text>
      <Text style={styles.meta}>
        {[item.event_address, item.event_city, item.event_state]
          .filter(Boolean)
          .join(", ")}
      </Text>
      <Text style={styles.meta}>
        Booking Payment: {item.award_payment_status || "NOT_REQUIRED"}
      </Text>
      <Text style={styles.meta}>
        Event Agreement / Signing: {item.agreement_status || "NOT_REQUIRED"}
      </Text>
      {(item.awarded_bids || []).length ? (
        item.awarded_bids.map(renderAwardedBid)
      ) : (
        <Text style={styles.meta}>Awarded vendors: Not available</Text>
      )}
    </TouchableOpacity>
  );

  const renderEvent = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.card}
      onPress={() =>
        navigation.navigate("marketplaceEventDetailsScreen", {
          eventId: item.event_id,
        })
      }
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={[styles.title, { flex: 1, paddingRight: 8 }]}>
          {item.event_name}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.meta}>
        {formatDate(item.event_date)} • {item.event_city}, {item.event_state}
      </Text>
      <Text style={styles.meta}>
        {item.number_of_guests} guests • {item.number_of_vendors_needed} vendors needed
      </Text>
      <Text style={styles.meta}>
        {item.bid_count || 0} bids • Budget {formatMoney(item.budgeted_amount)}
      </Text>
      {Number(item.unread_message_count || 0) ||
      Number(item.unseen_submission_count || 0) ? (
        <Text style={[styles.meta, { color: AppColor.primary, marginTop: 8 }]}>
          {Number(item.unread_message_count || 0)} unread message(s) •{" "}
          {Number(item.unseen_submission_count || 0)} new bid/application(s)
        </Text>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />
      <AppHeader
        headerTitle={statusFilter === "AWARDED" ? "Awarded Bids" : "My Events"}
        rightSide={!statusFilter}
      >
        {!statusFilter ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <TouchableOpacity
              hitSlop={10}
              activeOpacity={0.7}
              style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}
              onPress={() => navigation.navigate("marketplaceNotificationsScreen")}
            >
              <MaterialIcons
                name={notificationCount ? "notifications-active" : "notifications-none"}
                size={24}
                color={notificationCount ? AppColor.primary : AppColor.gray}
              />
              {notificationCount ? (
                <View
                  style={{
                    position: "absolute",
                    top: -3,
                    right: -5,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    paddingHorizontal: 3,
                    backgroundColor: AppColor.primary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: AppColor.white, fontSize: 10, fontWeight: "700" }}>
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity
              hitSlop={10}
              activeOpacity={0.7}
              onPress={() => navigation.navigate("marketplaceCreateEventScreen")}
            >
              <AntDesign name="plussquareo" size={22} color={AppColor.primary} />
            </TouchableOpacity>
          </View>
        ) : null}
      </AppHeader>
      {loading && !refreshing ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={AppColor.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={visibleEvents}
          keyExtractor={(item) => item.event_id}
          renderItem={statusFilter === "AWARDED" ? renderAwardedEvent : renderEvent}
          contentContainerStyle={styles.body}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={AppColor.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.card}>
              <Text style={[styles.title, { textAlign: "center" }]}>
                {statusFilter === "AWARDED" ? "No awarded bids yet" : "No events yet"}
              </Text>
              <Text style={styles.emptyText}>
                {statusFilter === "AWARDED"
                  ? "Award vendors from one of your events to see them here."
                  : "Create an event to begin receiving bids from food vendors."}
              </Text>
              {!statusFilter ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.button, { marginTop: 18 }]}
                  onPress={() => navigation.navigate("marketplaceCreateEventScreen")}
                >
                  <Text style={styles.buttonText}>Create Event</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
        />
      )}
    </View>
  );
};

export default MarketplaceMyEventsScreen;
