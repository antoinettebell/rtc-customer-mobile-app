import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppColor } from "../utils/theme";
import FoodTruckListComponent from "../components/FoodTruckListComponent";
import { getNearbyFoodTrucks_API } from "../apiFolder/appAPI";
import StatusBarManager from "../components/StatusBarManager";
import { useNavigation } from "@react-navigation/native";

const NearbyFoodTrucksScreen = ({ route }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [foodTrucks, setFoodTrucks] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const fetchFoodTrucks = async (pageNum = 1, shouldRefresh = false) => {
    try {
      setLoading(true);
      const params = {
        day: "mon", // You might want to get this from route params or context
        time: "11:17", // You might want to get this from route params or context
        userLat: "123", // You might want to get this from route params or context
        userLong: "456", // You might want to get this from route params or context
        page: pageNum,
        limit: 10,
      };

      const response = await getNearbyFoodTrucks_API(params);

      if (response?.success) {
        const newFoodTrucks = response.data.foodtruckList;
        setFoodTrucks(
          shouldRefresh ? newFoodTrucks : [...foodTrucks, ...newFoodTrucks]
        );
        setTotalPages(response.data.totalPages);
        setHasMore(pageNum < response.data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching food trucks:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFoodTrucks();
  }, []);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFoodTrucks(nextPage);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchFoodTrucks(1, true);
  };

  const renderItem = ({ item }) => (
    <FoodTruckListComponent
      title={item.name}
      uri={item.logo}
      isLiked={item.isLiked}
      foodTruckId={item._id}
      reviews={item.reviews}
      distance={item.distanceInMeters}
      onContainerPress={() =>
        navigation.navigate("foodTruckDetailScreen", { item })
      }
      onLikePress={() => {
        // Handle like press
      }}
    />
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={AppColor.primary} />
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager barStyle="dark-content" />
      <FlatList
        data={foodTrucks}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[AppColor.primary]}
          />
        }
      />
    </View>
  );
};

export default NearbyFoodTrucksScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColor.white,
  },
  listContainer: {
    padding: 16,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
