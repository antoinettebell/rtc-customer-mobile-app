import React, { useEffect, useRef, useState } from "react";
import {
  Text,
  View,
  FlatList,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconButton, Searchbar } from "react-native-paper";
import { useSelector } from "react-redux";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor, Mulish700, Mulish400, Mulish600 } from "../utils/theme";
import {
  getNearbyFoodTrucks_API,
  getRecentFoodTrucks_API,
} from "../apiFolder/appAPI";
import FoodTruckListComponent from "../components/FoodTruckListComponent";

const LIMIT = 15;
const DEBOUNCE_DELAY = 500;

const SeeAllTrucksScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const debounceTimerRef = useRef(null);
  const params = route?.params;

  const { defaultLocation } = useSelector((state) => state.locationReducer);
  const { isSignedIn } = useSelector((state) => state.authReducer);

  const [searchQuery, setSearchQuery] = useState("");
  const [trucksList, setTrucksList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPage, setTotalPage] = useState(1);

  const getTruckList = async (page = currentPage, searchText = searchQuery) => {
    if (page === 0) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      let response = undefined;

      if (params?.screenType === "recent_food_trucks") {
        response = await getRecentFoodTrucks_API({
          page: page + 1,
          limit: LIMIT,
          search: searchText,
        });
      } else if (params?.screenType === "popular_nearby_trucks") {
        response = await getNearbyFoodTrucks_API({
          userLat: defaultLocation?.lat || 0,
          userLong: defaultLocation?.long || 0,
          page: page + 1,
          limit: LIMIT,
          search: searchText,
        });
      } else if (params?.screenType === "nearby_food_trucks") {
        response = await getNearbyFoodTrucks_API({
          userLat: defaultLocation?.lat || 0,
          userLong: defaultLocation?.long || 0,
          page: page + 1,
          limit: LIMIT,
          search: searchText,
        });
      } else if (params?.screenType === "featured_food_trucks") {
        response = await getNearbyFoodTrucks_API({
          page: page + 1,
          limit: LIMIT,
          userLat: defaultLocation?.lat || 0,
          userLong: defaultLocation?.long || 0,
          featured: true,
          search: searchText,
        });
      }

      if (response?.success && response?.data) {
        if (page === 0) {
          // Reset the list when refreshing
          setTrucksList(response?.data?.foodtruckList);
        } else {
          // Append new data to existing list when loading more
          setTrucksList((prevList) => [
            ...prevList,
            ...response?.data?.foodtruckList,
          ]);
        }
        setCurrentPage(response?.data?.page);
        setTotalPage(response?.data?.totalPages);
      }
    } catch (error) {
      console.log("error =>", error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const renderTruckComponent = ({ item }) => {
    return (
      <FoodTruckListComponent
        key={item._id.toString()}
        title={item.name}
        uri={item.logo}
        foodTruckId={item._id}
        reviews={item.totalReviews}
        showLikeButton={isSignedIn}
        showDistance={item?.distanceInMeters != undefined}
        distance={item.distanceInMeters || 0}
        onContainerPress={() =>
          navigation.navigate("foodTruckDetailScreen", { item })
        }
      />
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyComponentContainer}>
      {loading || refreshing ? (
        <ActivityIndicator size="large" color={AppColor.primary} />
      ) : (
        <Text
          numberOfLines={3}
          style={styles.emptyComponentText}
        >{`${params.screenTitle} not found.`}</Text>
      )}
    </View>
  );

  const renderFooter = () => {
    return loading ? (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="large" color={AppColor.primary} />
      </View>
    ) : null;
  };

  const handleLoadMore = () => {
    if (!loading && currentPage < totalPage) {
      getTruckList(currentPage);
    }
  };

  const handleRefresh = () => {
    getTruckList(0);
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);

    // Clear previous timer if exists
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for debounce
    debounceTimerRef.current = setTimeout(() => {
      getTruckList(0, text);
    }, DEBOUNCE_DELAY);
  };

  useEffect(() => {
    if (defaultLocation) {
      getTruckList(0);
    }
  }, [defaultLocation]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBarManager />

      {/* Header Container */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <IconButton
          icon="arrow-left"
          iconColor={AppColor.black}
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerTitle} numberOfLines={1}>
          {params?.screenTitle || ""}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      {/* Search Container */}
      <View style={styles.searchContainer}>
        <Searchbar
          autoFocus={true}
          placeholder="Search food trucks or cuisines..."
          placeholderTextColor={AppColor.textPlaceholder}
          iconColor={AppColor.textPlaceholder}
          onChangeText={handleSearchChange}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={styles.searchbarInput}
        />
      </View>

      {/* Content Container */}
      <View style={styles.contentContainer}>
        <FlatList
          data={trucksList}
          extraData={trucksList}
          keyExtractor={(item) => item._id.toString()}
          renderItem={renderTruckComponent}
          contentContainerStyle={styles.flatListContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.8}
          ListFooterComponent={renderFooter}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={renderEmptyComponent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

export default SeeAllTrucksScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderColor: "#E5E5EA",
    backgroundColor: AppColor.white,
  },
  headerTitle: {
    color: AppColor.black,
    fontSize: 20,
    fontFamily: Mulish700,
  },

  // Search
  searchContainer: {
    margin: 16,
    borderRadius: 30,
    ...Platform.select({
      ios: {
        shadowColor: AppColor.black,
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchbar: {
    backgroundColor: AppColor.white,
  },
  searchbarInput: {
    fontFamily: Mulish400,
    color: AppColor.text,
  },

  contentContainer: {
    flex: 1,
  },
  flatListContent: {
    flexGrow: 1,
  },
  emptyComponentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyComponentText: {
    fontSize: 16,
    fontFamily: Mulish600,
    color: AppColor.black,
  },
  footerContainer: {
    height: 50,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
