import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Platform,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Searchbar, RadioButton } from "react-native-paper";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import EvilIcons from "react-native-vector-icons/EvilIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import Modal from "react-native-modal";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";
import FoodTruckListComponent from "../components/FoodTruckListComponent";
import FoodTruckGridComponent from "../components/FoodTruckGridComponent";
import StatusBarManager from "../components/StatusBarManager";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import FoodHomeHeaderSvg from "../assets/images/foodHomeHeader.svg";
import { getNearbyFoodTrucks_API, getAddress_API } from "../apiFolder/appAPI";
import { useDispatch, useSelector } from "react-redux";
import { fetchFavorites } from "../redux/slices/favoritesSlice";
import {
  setDefaultLocation,
  setAllLocations,
} from "../redux/slices/locationSlice";
import moment from "moment";

const LocationPinWhite = require("../assets/images/locationPinWhite.png");
const RoundBellWhite = require("../assets/images/roundBellWhite.png");
const FT01 = require("../assets/images/FT-Demo-01.png");
const FT02 = require("../assets/images/FT-Demo-02.png");

// Mock Data (replace with real data fetching as needed)
const FT1Data = [
  { id: "1", name: "Taco Express", uri: FT02, isLiked: false },
  { id: "2", name: "Burger King", uri: FT01, isLiked: true },
];

const FT2Data = [
  { id: "3", name: "Burger King", uri: FT01, isLiked: false },
  { id: "4", name: "Taco Express", uri: FT02, isLiked: true },
  { id: "5", name: "Pizza Hut", uri: FT01, isLiked: false },
  { id: "6", name: "KFC", uri: FT02, isLiked: true },
];

const FT4Data = [
  { id: "7", name: "Subway", uri: FT01, isLiked: false },
  { id: "8", name: "Dominos", uri: FT02, isLiked: true },
  { id: "9", name: "Starbucks", uri: FT01, isLiked: false },
  { id: "10", name: "McDonalds", uri: FT02, isLiked: true },
];

const ExploreScreen = (props) => {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [popularFoodTrucks, setPopularFoodTrucks] = useState([]);
  const [isLocationModalVisible, setLocationModalVisible] = useState(false);
  const [initialLocationsFetched, setInitialLocationsFetched] = useState(false);

  const { favorites, isLoadingFavorites } = useSelector(
    (state) => state.favoritesReducer
  );
  const { allLocations, defaultLocation } = useSelector(
    (state) => state.locationReducer
  );
  const { isSignedIn } = useSelector((state) => state.authReducer);

  const [tempSelectedLocation, setTempSelectedLocation] =
    useState(defaultLocation);

  useEffect(() => {
    if (isLocationModalVisible) {
      setTempSelectedLocation(defaultLocation);
    }
  }, [isLocationModalVisible, defaultLocation]);

  const handleConfirmSelection = () => {
    if (tempSelectedLocation) {
      dispatch(setDefaultLocation(tempSelectedLocation));
    }
    setLocationModalVisible(false);
  };

  const handleCancelSelection = () => {
    setLocationModalVisible(false);
  };

  const HEADER_MAX_HEIGHT = insets.top + 60 + 170;
  const HEADER_MIN_HEIGHT = insets.top + 60;
  const SEARCH_BAR_TOP = 30;
  const SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  const [searchQuery, setSearchQuery] = useState("");

  const handleLocationTextPress = () => {
    // If user is a guest OR a signed-in user with no addresses, navigate to the map screen.
    if (!isSignedIn || (isSignedIn && allLocations.length === 0)) {
      navigation.navigate("authMapScreen", { mode: "add" });
    } else {
      // Otherwise, for a signed-in user with addresses, show the selection modal.
      setLocationModalVisible(true);
    }
  };

  const handleNotificationBellPress = () => {};

  const fetchAllAddresses = async () => {
    try {
      const response = await getAddress_API({ page: 1, limit: 1000 });
      if (response?.success) {
        dispatch(setAllLocations(response.data.addressList));
      }
    } catch (error) {
      console.error("Error fetching all addresses:", error);
    }
  };

  const fetchNearByFoodTrucks = async () => {
    if (!defaultLocation) return; // Don't fetch if no location is set
    try {
      setLoading(true);
      const params = {
        day: moment().format("ddd")?.toLocaleLowerCase(),
        time: moment().format("HH:mm"),
        userLat: defaultLocation?.lat || 0,
        userLong: defaultLocation?.long || 0,
      };

      const response = await getNearbyFoodTrucks_API(params);

      if (response?.success) {
        setPopularFoodTrucks(response.data.foodtruckList);
      }
    } catch (error) {
      console.error("Error fetching popular food trucks:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (isSignedIn && allLocations.length === 0 && !initialLocationsFetched) {
        fetchAllAddresses(); // Fetch all addresses on initial load for signed-in users if not already fetched
        setInitialLocationsFetched(true); // Mark as fetched
      }
      fetchNearByFoodTrucks();
      if (isSignedIn) {
        dispatch(fetchFavorites()); // Fetch favorites whenever the screen is focused
      }
    }, [
      dispatch,
      isSignedIn,
      defaultLocation,
      allLocations,
      initialLocationsFetched,
    ])
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE],
      [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT + SEARCH_BAR_TOP],
      Extrapolate.CLAMP
    );

    return {
      height,
    };
  });

  const headerContentStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE * 0.7],
      [1, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity,
    };
  });

  const searchBarStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE],
      [0, -SCROLL_DISTANCE + SEARCH_BAR_TOP],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateY }],
    };
  });

  const circleStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE],
      [1, 0.5],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE * 0.7],
      [1, 0],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const renderLocationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.locationModalItem}
      onPress={() => setTempSelectedLocation(item)}
    >
      <View style={styles.addressRow}>
        <EvilIcons
          name="location"
          size={24}
          color={AppColor.primary}
          style={styles.locationModalIcon}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.locationModalTitle}>{item.title}</Text>
          <Text style={styles.locationModalAddress}>{item.address}</Text>
        </View>
        <RadioButton.Android
          value={item._id}
          status={
            tempSelectedLocation?._id === item._id ? "checked" : "unchecked"
          }
          onPress={() => setTempSelectedLocation(item)}
          color={AppColor.primary}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBarManager barStyle="light-content" />

      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { top: insets.top }]}>
        <TouchableOpacity
          onPress={handleLocationTextPress}
          activeOpacity={0.7}
          style={styles.locationContainer}
        >
          <Image source={LocationPinWhite} style={styles.iconImage} />
          <View>
            <View style={styles.locationRow}>
              <Text style={styles.locationTitle} numberOfLines={1}>
                {defaultLocation?.title || "NA"}
              </Text>
              <MaterialIcons
                name="keyboard-arrow-down"
                size={18}
                color={AppColor.white}
              />
            </View>
            <Text style={styles.locationSubtitle} numberOfLines={1}>
              {defaultLocation?.address || "Please select a location"}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleNotificationBellPress}
          activeOpacity={0.7}
        >
          <Image source={RoundBellWhite} style={styles.iconImage} />
        </TouchableOpacity>
      </View>

      {/* Animated Header */}
      <Animated.View style={[styles.animatedHeader, headerStyle]}>
        <Animated.View style={[styles.headerCircle, circleStyle]} />
        <Animated.View
          style={[
            styles.headerTextContainer,
            {
              marginTop: insets.top + 40,
            },
            headerContentStyle,
          ]}
        >
          <Text style={styles.headerText}>
            {"Feeling Snacky?\nWe Got You...!"}
          </Text>
          <View style={{ flex: 1 }} />
          <FoodHomeHeaderSvg />
        </Animated.View>
      </Animated.View>

      {/* Animated Search Bar */}
      <Animated.View
        renderToHardwareTextureAndroid={true}
        style={[
          styles.animatedSearchBar,
          {
            top: HEADER_MAX_HEIGHT - SEARCH_BAR_TOP,
          },
          searchBarStyle,
        ]}
      >
        <Searchbar
          placeholder="Search food trucks or cuisines..."
          placeholderTextColor={AppColor.textPlaceholder}
          iconColor={AppColor.textPlaceholder}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={styles.searchbarInput}
        />
      </Animated.View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: SEARCH_BAR_TOP + 20 },
        ]}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
      >
        <View style={styles.scrollViewContaier}>
          {/* Past orders container */}
          <View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginHorizontal: 20,
                marginBottom: 10,
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: Primary400,
                  fontSize: 18,
                  color: AppColor.black,
                }}
              >
                {"Past Orders"}
              </Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => {}}>
                <Text
                  style={{
                    fontFamily: Secondary400,
                    fontSize: 14,
                    color: AppColor.black,
                    paddingHorizontal: 20,
                  }}
                >
                  {"See All"}
                </Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={FT1Data} // This is mock data, consider fetching real past orders
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isFavorite = favorites.some(
                  (fav) => fav.foodTruck?._id === item.id
                );
                return (
                  <FoodTruckListComponent
                    title={item.name}
                    uri={item.uri}
                    isLiked={isFavorite}
                    foodTruckId={item.id}
                    reviews={item.reviews}
                    distance={item.distance}
                    onContainerPress={() =>
                      navigation.navigate("foodTruckDetailScreen", {
                        item: { ...item, _id: item.id },
                      })
                    }
                  />
                );
              }}
            />
          </View>

          {/* Popular nearby foodtruck container */}
          <View
            style={{
              marginVertical: 10,
              paddingVertical: 16,
              backgroundColor: "#F2F2F7",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginHorizontal: 20,
                marginBottom: 10,
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: Primary400,
                  fontSize: 18,
                  color: AppColor.black,
                }}
              >
                {"Popular Nearby Food Trucks"}
              </Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => {}}>
                <Text
                  style={{
                    fontFamily: Secondary400,
                    fontSize: 14,
                    color: AppColor.black,
                    paddingHorizontal: 20,
                  }}
                >
                  {"See All"}
                </Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              data={FT2Data}
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => {
                const isFavorite = favorites.some(
                  (fav) => fav.foodTruck?._id === item.id
                );
                return (
                  <FoodTruckGridComponent
                    title={item.name}
                    uris={item.uri}
                    isLiked={isFavorite}
                    foodTruckId={item.id}
                    reviews={item.reviews}
                    distance={item.distance}
                    onContainerPress={() =>
                      navigation.navigate("foodTruckDetailScreen", {
                        item: { ...item, _id: item.id },
                      })
                    }
                  />
                );
              }}
              contentContainerStyle={{
                gap: 20,
                paddingHorizontal: 20,
                paddingVertical: 10,
              }}
            />
          </View>

          {/* Nearby foodtruck container */}
          <View
            style={{
              marginVertical: 10,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginHorizontal: 20,
                marginBottom: 10,
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: Primary400,
                  fontSize: 18,
                  color: AppColor.black,
                }}
              >
                {"Nearby Food Trucks"}
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate("nearbyFoodTrucksScreen")}
              >
                <Text
                  style={{
                    fontFamily: Secondary400,
                    fontSize: 14,
                    color: AppColor.black,
                    paddingHorizontal: 20,
                  }}
                >
                  {"See All"}
                </Text>
              </TouchableOpacity>
            </View>
            {loading || isLoadingFavorites ? (
              <ActivityIndicator
                size="small"
                color={AppColor.primary}
                style={{ marginVertical: 20 }}
              />
            ) : (
              <FlatList
                horizontal
                data={popularFoodTrucks}
                keyExtractor={(item) => item._id.toString()}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isFavorite = favorites.some(
                    (fav) => fav.foodTruck?._id === item._id
                  );
                  return (
                    <FoodTruckGridComponent
                      title={item.name}
                      uris={item.logo}
                      showLikeButton={isSignedIn}
                      isLiked={isFavorite}
                      foodTruckId={item._id}
                      reviews={item.reviews}
                      distance={item.distanceInMeters}
                      onContainerPress={() =>
                        navigation.navigate("foodTruckDetailScreen", { item })
                      }
                    />
                  );
                }}
                contentContainerStyle={{
                  gap: 20,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                }}
              />
            )}
          </View>

          {/* Featured foodtruck container */}
          <View
            style={{
              marginVertical: 10,
              paddingVertical: 16,
              backgroundColor: "#F2F2F7",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginHorizontal: 20,
                marginBottom: 10,
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: Primary400,
                  fontSize: 18,
                  color: AppColor.black,
                }}
              >
                {"Featured Food Trucks"}
              </Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => {}}>
                <Text
                  style={{
                    fontFamily: Secondary400,
                    fontSize: 14,
                    color: AppColor.black,
                    paddingHorizontal: 20,
                  }}
                >
                  {"See All"}
                </Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              data={FT4Data}
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => {
                const isFavorite = favorites.some(
                  (fav) => fav.foodTruck?._id === item.id
                );
                return (
                  <FoodTruckGridComponent
                    title={item.name}
                    uris={item.uri}
                    isLiked={isFavorite}
                    foodTruckId={item.id}
                    reviews={item.reviews}
                    distance={item.distance}
                    onContainerPress={() =>
                      navigation.navigate("foodTruckDetailScreen", {
                        item: { ...item, _id: item.id },
                      })
                    }
                  />
                );
              }}
              contentContainerStyle={{
                gap: 20,
                paddingHorizontal: 20,
                paddingVertical: 10,
              }}
            />
          </View>
        </View>
      </Animated.ScrollView>

      {/* Guest User Prompt */}
      {!defaultLocation && (
        <View
          style={[
            styles.guestPromptContainer,
            { paddingBottom: insets.bottom + 10 },
          ]}
        >
          <Text style={styles.guestPromptText}>
            Set your location to discover nearby food trucks!
          </Text>
          <TouchableOpacity
            style={styles.guestPromptButton}
            onPress={() =>
              navigation.navigate("authMapScreen", { mode: "add" })
            }
          >
            <Text style={styles.guestPromptButtonText}>Set Location</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Location Selection Modal */}
      <Modal
        isVisible={isLocationModalVisible}
        onSwipeComplete={handleCancelSelection}
        swipeDirection={["down"]}
        onBackdropPress={handleCancelSelection}
        style={styles.locationModal}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        backdropOpacity={0.4}
      >
        <View
          style={[
            styles.locationModalContainer,
            { paddingBottom: insets.bottom },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderText}>Select a Location</Text>
            <TouchableOpacity
              onPress={() => {
                setLocationModalVisible(false);
                navigation.navigate("authMapScreen", { mode: "add" });
              }}
            >
              <MaterialIcons name="add" size={28} color={AppColor.primary} />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <FlatList
              data={allLocations}
              keyExtractor={(item) => item._id}
              renderItem={renderLocationItem}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              showsVerticalScrollIndicator={false}
            />
          </View>

          <View style={styles.bottomButtonContainer}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={handleCancelSelection}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.selectButton]}
              onPress={handleConfirmSelection}
            >
              <Text style={styles.selectButtonText}>Select Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ExploreScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColor.white,
  },
  fixedHeader: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingTop: 5,
    zIndex: 100,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  locationContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  locationTitle: {
    color: AppColor.white,
    fontFamily: Secondary400,
    fontSize: 20,
  },
  locationSubtitle: {
    fontFamily: Secondary400,
    fontSize: 14,
    color: AppColor.white,
    maxWidth: "95%",
  },
  iconImage: {
    height: 37,
    width: 37,
    resizeMode: "contain",
  },
  animatedHeader: {
    backgroundColor: AppColor.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: "hidden",
  },
  headerCircle: {
    backgroundColor: "#E97000",
    height: 494,
    width: 494,
    borderRadius: 450,
    position: "absolute",
    left: 166,
    top: 34,
  },
  headerTextContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    fontSize: 24,
    fontFamily: Primary400,
    color: AppColor.white,
    position: "absolute",
    left: 20,
    zIndex: 1,
  },
  animatedSearchBar: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 90,
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
    fontFamily: Secondary400,
    color: AppColor.text,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  scrollViewContaier: {
    backgroundColor: AppColor.white,
  },
  guestPromptContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: AppColor.primary,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  guestPromptText: {
    color: AppColor.white,
    fontFamily: Secondary400,
    fontSize: 14,
    flex: 1,
  },
  guestPromptButton: {
    marginLeft: 12,
    backgroundColor: AppColor.white,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  guestPromptButtonText: {
    color: AppColor.primary,
    fontFamily: Primary400,
    fontSize: 14,
  },
  // Modal Styles
  locationModal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  locationModalContainer: {
    backgroundColor: AppColor.white,
    height: "90%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalHeaderText: {
    fontSize: 20,
    fontFamily: Primary400,
    color: AppColor.black,
  },
  locationModalItem: {
    paddingVertical: 15,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationModalIcon: {
    marginRight: 10,
  },
  locationModalTitle: {
    fontFamily: Secondary400,
    fontSize: 18,
    color: AppColor.black,
  },
  locationModalAddress: {
    fontFamily: Secondary400,
    fontSize: 12,
    color: "#6b7280", // gray-500
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: "#e5e7eb", // gray-200
  },
  bottomButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  modalButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: "#F3F4F6", // gray-100
    marginRight: 10,
  },
  cancelButtonText: {
    color: AppColor.black,
    fontFamily: Primary400,
    fontSize: 16,
  },
  selectButton: {
    backgroundColor: AppColor.primary,
  },
  selectButtonText: {
    color: AppColor.white,
    fontFamily: Primary400,
    fontSize: 16,
  },
});
