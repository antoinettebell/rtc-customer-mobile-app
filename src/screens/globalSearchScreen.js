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
import { IconButton, Searchbar } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor, Mulish400, Mulish600, Mulish700 } from "../utils/theme";
import { useSelector } from "react-redux";
import AppImage from "../components/AppImage";
import { getGlobalSearchResult_API } from "../apiFolder/appAPI";

const DEBOUNCE_DELAY = 500;

const GlobalSearchScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const debounceTimerRef = useRef(null);

  const { isSignedIn } = useSelector((state) => state.authReducer);
  const { defaultLocation } = useSelector((state) => state.locationReducer);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [foodTruckHeaderItem, setFoodTruckHeaderItem] = useState(null);
  const [lastSearchQuery, setLastSearchQuery] = useState("");

  const getSearchResultFromAPI = async (searchText = searchQuery) => {
    setLoading(true);
    try {
      let payload = {
        userLat: defaultLocation?.lat || 0,
        userLong: defaultLocation?.long || 0,
      };
      if (searchText?.trim()?.length > 0) {
        payload.search = searchText;
      }
      const response = await getGlobalSearchResult_API(payload);
      console.log("response => ", response);
      if (response?.success && response?.data) {
        const searchList = response?.data?.searchList || [];
        setSearchResult(searchList);
        setLastSearchQuery(searchText);

        const firstFoodTruck = searchList.find(
          (item) => item.recordType === "FOOD_TRUCK"
        );
        setFoodTruckHeaderItem(firstFoodTruck || null);
      } else {
        setFoodTruckHeaderItem(null);
        setLastSearchQuery("");
      }
    } catch (error) {
      console.log("error =>", error);
    } finally {
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
      setSearchResult([]);
      setFoodTruckHeaderItem(null);
      setLastSearchQuery("");
      return;
    }

    // Set new timer for debounce
    debounceTimerRef.current = setTimeout(() => {
      getSearchResultFromAPI(text);
    }, DEBOUNCE_DELAY);
  };

  const renderSearchResult = ({ item }) => {
    return (
      <Pressable
        style={styles.resultItemContainer}
        onPress={() => {
          if (item.recordType === "FOOD_TRUCK") {
            navigation.navigate("foodTruckDetailScreen", { item });
          } else {
            navigation.navigate("searchResultScreen", {
              searchString: item.name,
            });
          }
        }}
      >
        <AppImage
          uri={item.recordType === "FOOD_TRUCK" ? item.logo : item.imgUrls[0]}
          containerStyle={styles.resultItemImage}
        />
        <View style={styles.resultItemTextContainer}>
          <Text style={styles.resultItemName}>{item.name}</Text>
          <Text style={styles.resultItemType}>
            {item.recordType === "FOOD_TRUCK" ? "Food Truck" : "Dish"}
          </Text>
        </View>
        <IconButton
          icon="chevron-right"
          iconColor={AppColor.textSecondary}
          size={24}
        />
      </Pressable>
    );
  };

  const renderHeaderComponent = () => {
    if (!foodTruckHeaderItem) {
      return null;
    }
    return (
      <Pressable
        style={styles.resultItemContainer}
        onPress={() => {
          navigation.navigate("searchResultScreen", {
            searchString: searchQuery,
          });
        }}
      >
        <AppImage
          uri={foodTruckHeaderItem?.logo}
          containerStyle={styles.resultItemImage}
        />
        <View style={styles.resultItemTextContainer}>
          <Text style={styles.resultItemName}>{lastSearchQuery}</Text>
          <Text
            style={[
              styles.resultItemType,
              { color: AppColor.primary, fontFamily: Mulish700 },
            ]}
          >
            {"See all trucks"}
          </Text>
        </View>
        <IconButton
          icon="chevron-right"
          iconColor={AppColor.textSecondary}
          size={24}
        />
      </Pressable>
    );
  };

  const renderEmptyComponent = () => (
    <View
      style={[styles.emptyComponentContainer, { paddingBottom: insets.bottom }]}
    >
      {loading ? (
        <ActivityIndicator size="large" color={AppColor.primary} />
      ) : (
        <Text numberOfLines={3} style={styles.emptyComponentText}>
          {searchQuery?.trim()?.length > 0
            ? `No results found for "${searchQuery}"`
            : `Search something like Pizza, Burger, Sushi etc.`}
        </Text>
      )}
    </View>
  );

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
        <View style={{ width: "20%" }}>
          <IconButton
            icon="arrow-left"
            iconColor={AppColor.black}
            size={24}
            onPress={() => navigation.goBack()}
          />
        </View>
        <Text style={styles.headerTitle}>{"Search"}</Text>
        <View style={{ width: "20%" }} />
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
          data={searchResult}
          extraData={searchResult}
          keyExtractor={(item) => item._id.toString()}
          contentContainerStyle={[
            styles.flatListContent,
            { paddingBottom: insets.bottom },
          ]}
          renderItem={renderSearchResult}
          ListHeaderComponent={renderHeaderComponent}
          ListEmptyComponent={renderEmptyComponent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

export default GlobalSearchScreen;

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
