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
import AntDesign from "react-native-vector-icons/AntDesign";
import AppHeader from "../components/AppHeader";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor } from "../utils/theme";
import { getMarketplaceMyEvents_API } from "../apiFolder/appAPI";
import { formatDate, formatMoney, styles } from "./marketplaceShared";

const MarketplaceMyEventsScreen = ({ navigation }) => {
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
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />
      <AppHeader headerTitle="My Events" rightSide={true}>
        <TouchableOpacity
          hitSlop={10}
          activeOpacity={0.7}
          onPress={() => navigation.navigate("marketplaceCreateEventScreen")}
        >
          <AntDesign name="plussquareo" size={22} color={AppColor.primary} />
        </TouchableOpacity>
      </AppHeader>
      {loading && !refreshing ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={AppColor.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.event_id}
          renderItem={renderEvent}
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
                No events yet
              </Text>
              <Text style={styles.emptyText}>
                Create an event to begin receiving bids from food vendors.
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.button, { marginTop: 18 }]}
                onPress={() => navigation.navigate("marketplaceCreateEventScreen")}
              >
                <Text style={styles.buttonText}>Create Event</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
};

export default MarketplaceMyEventsScreen;
