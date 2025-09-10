import React, { useState, useEffect, useRef } from "react";
import {
  Platform,
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
} from "react-native";
import { IconButton } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor, Mulish400, Mulish600, Mulish700 } from "../utils/theme";
import { useSelector } from "react-redux";
import AppImage from "../components/AppImage";
import { getNearbyFoodTrucks_API } from "../apiFolder/appAPI";

const LIMIT = 15;

const SearchResultScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const params = route.params;

  const { defaultLocation } = useSelector((state) => state.locationReducer);

  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPage, setTotalPage] = useState(1);

  const getSearchResultFromAPI = async (
    page = currentPage,
    searchText = params.searchString
  ) => {
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
      };
      if (searchText?.trim()?.length > 0) {
        payload.search = searchText;
      }
      const response = await getNearbyFoodTrucks_API(payload);
      console.log("response => ", response);
      if (response?.success && response?.data) {
        if (page === 0) {
          // Reset the list when refreshing
          setSearchResult(response?.data?.foodtruckList);
        } else {
          // Append new data to existing list when loading more
          setSearchResult((prevList) => [
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

  const renderSearchResult = ({ item }) => {
    return (
      <Pressable
        style={styles.resultItemContainer}
        onPress={() => navigation.navigate("foodTruckDetailScreen", { item })}
      >
        <AppImage uri={item.logo} containerStyle={styles.resultItemImage} />
        <View style={styles.resultItemTextContainer}>
          <Text style={styles.resultItemName}>{item.name}</Text>
          <Text style={styles.resultItemType}>{"Food Truck"}</Text>
        </View>
        <IconButton
          icon="chevron-right"
          iconColor={AppColor.textSecondary}
          size={24}
        />
      </Pressable>
    );
  };

  const renderFooter = () => {
    return loading ? (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="large" color={AppColor.primary} />
      </View>
    ) : null;
  };

  const renderEmptyComponent = () => (
    <View
      style={[styles.emptyComponentContainer, { paddingBottom: insets.bottom }]}
    >
      {loading || refreshing ? (
        <ActivityIndicator size="large" color={AppColor.primary} />
      ) : (
        <Text numberOfLines={3} style={styles.emptyComponentText}>
          {params?.searchString?.trim()?.length > 0
            ? `No results found for "${params?.searchString}"`
            : `Search something like Pizza, Burger, Sushi etc.`}
        </Text>
      )}
    </View>
  );

  const handleLoadMore = () => {
    if (!loading && currentPage < totalPage) {
      getSearchResultFromAPI(currentPage);
    }
  };

  const handleRefresh = () => {
    getSearchResultFromAPI(0);
  };

  useEffect(() => {
    if (params.searchString) {
      getSearchResultFromAPI(0, params.searchString);
    }
  }, [params]);

  return (
    <View style={styles.container}>
      <StatusBarManager />

      {/* Header Container */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={{ width: "20%" }}>
          <IconButton
            icon="arrow-left"
            iconColor={AppColor.black}
            size={24}
            onPress={() => navigation.goBack()}
          />
        </View>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {params?.searchString}
        </Text>
        <View style={{ width: "20%" }} />
      </View>

      {/* Content List Container */}
      <View style={styles.contentContainer}>
        <FlatList
          data={searchResult}
          extraData={searchResult}
          keyExtractor={(item) => item._id.toString()}
          renderItem={renderSearchResult}
          contentContainerStyle={[
            styles.flatListContent,
            { paddingBottom: insets.bottom },
          ]}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.8}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmptyComponent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

export default SearchResultScreen;

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
    fontSize: 20,
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
    textAlign: "center",
    marginHorizontal: "20%",
  },
  footerContainer: {
    height: 50,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  // Search Result Item
  resultItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: AppColor.border,
  },
  resultItemImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  resultItemTextContainer: {
    flex: 1,
  },
  resultItemName: {
    fontFamily: Mulish700,
    fontSize: 16,
    color: AppColor.text,
  },
  resultItemType: {
    fontFamily: Mulish400,
    fontSize: 12,
    color: AppColor.textSecondary,
    marginTop: 4,
  },
});
