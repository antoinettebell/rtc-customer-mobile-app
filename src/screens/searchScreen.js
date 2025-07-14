import React, { useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  FlatList,
} from "react-native";
import { IconButton, Searchbar } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor, Mulish400, Mulish600, Mulish700 } from "../utils/theme";
import { useSelector } from "react-redux";
import FoodTruckListComponent from "../components/FoodTruckListComponent";
import { getNearbyFoodTrucks_API } from "../apiFolder/appAPI";

const LIMIT = 15;
const DEBOUNCE_DELAY = 500;

const SearchScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const debounceTimerRef = useRef(null);

  const { isSignedIn } = useSelector((state) => state.authReducer);
  const { defaultLocation } = useSelector((state) => state.locationReducer);

  const [searchQuery, setSearchQuery] = useState("");
  const [trucksList, setTrucksList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPage, setTotalPage] = useState(1);

  const getTruckList = async (page = 0, searchText = searchQuery) => {
    if (page === 0) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      let payload = {
        page: page + 1,
        limit: LIMIT,
        userLat: defaultLocation?.lat || 0,
        userLong: defaultLocation?.long || 0,
        distanceInMeters: 160934, // 100 miles in meter
      };
      if (searchText?.trim()?.length > 0) {
        payload.search = searchText;
      }
      const response = await getNearbyFoodTrucks_API(payload);
      if (response?.success && response?.data) {
        if (page === 0) {
          // Reset list if it's first page
          setTrucksList(response?.data?.foodtruckList || []);
        } else {
          // Append to list if it's subsequent page
          setTrucksList((prev) => [
            ...prev,
            ...(response?.data?.foodtruckList || []),
          ]);
        }
        setCurrentPage(response?.data?.page || 0);
        setTotalPage(response?.data?.totalPages || 1);
      }
    } catch (error) {
      console.log("error =>", error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);

    // Clear previous timer if exists
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If search is cleared, reset everything
    if (text.trim().length === 0) {
      setTrucksList([]);
      setCurrentPage(0);
      setTotalPage(1);
      return;
    }

    // Set new timer for debounce
    debounceTimerRef.current = setTimeout(() => {
      getTruckList(0, text);
    }, DEBOUNCE_DELAY);
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
        <Text numberOfLines={3} style={styles.emptyComponentText}>
          {searchQuery?.trim()?.length > 0
            ? `No results found for "${searchQuery}"`
            : `Search anything`}
        </Text>
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
    if (!loading && currentPage < totalPage && searchQuery.trim().length > 0) {
      getTruckList(currentPage);
    }
  };

  const handleRefresh = () => {
    if (searchQuery.trim().length > 0) {
      getTruckList(0);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBarManager />

      {/* Header Container */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <IconButton
          icon="arrow-left"
          iconColor={AppColor.black}
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerTitle}>{"My Orders"}</Text>
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

      {/* Content List Container */}
      <View style={styles.contentContainer}>
        <FlatList
          data={trucksList}
          extraData={trucksList}
          keyExtractor={(item) => item._id.toString()}
          renderItem={renderTruckComponent}
          contentContainerStyle={[
            styles.flatListContent,
            { paddingBottom: insets.bottom },
          ]}
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

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  // Header
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: AppColor.border,
    backgroundColor: AppColor.white,
  },
  headerTitle: {
    fontFamily: Mulish700,
    fontSize: 18,
    color: AppColor.text,
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
    // paddingHorizontal: 16,
    // borderRadius: 0,
    backgroundColor: AppColor.white,
  },
  searchbarInput: {
    // borderRadius: 0,
    fontFamily: Mulish400,
    color: AppColor.text,
  },

  // Content Container
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
