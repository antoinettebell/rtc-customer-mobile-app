import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Platform,
  FlatList,
  Dimensions,
  Pressable,
  Alert,
} from "react-native";
import { Searchbar, RadioButton, IconButton } from "react-native-paper";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import Modal from "react-native-modal";
import { AppColor, Mulish700, Mulish400, Mulish600 } from "../utils/theme";
import FoodTruckListComponent from "../components/FoodTruckListComponent";
import FoodTruckGridComponent from "../components/FoodTruckGridComponent";
import StatusBarManager from "../components/StatusBarManager";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import FoodHomeHeaderSvg from "../assets/images/foodHomeHeader.svg";
import {
  getNearbyFoodTrucks_API,
  getAddress_API,
  updateFcmToken_API,
  getRecentFoodTrucks_API,
  getAllBanner_API,
} from "../apiFolder/appAPI";
import { useDispatch, useSelector } from "react-redux";
import { fetchFavorites } from "../redux/slices/favoritesSlice";
import {
  setDefaultLocation,
  setAllLocations,
} from "../redux/slices/locationSlice";
import moment from "moment";
import { getMessaging } from "@react-native-firebase/messaging";
import { checkInstallationId } from "../helpers/notification.helper";
import Carousel from "react-native-reanimated-carousel";
import FastImage from "@d11/react-native-fast-image";
import { clearCurrentOrder, clearOrderSlice } from "../redux/slices/orderSlice";
import AppImage from "../components/AppImage";

const LocationPinWhite = require("../assets/images/locationPinWhite.png");
const RoundBellWhite = require("../assets/images/roundBellWhite.png");

const { width, height } = Dimensions.get("window");

const ExploreScreen = (props) => {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const carouselRef = useRef(null);
  const progress = useSharedValue(0);

  const [loading, setLoading] = useState(false);
  const [recentTrucks, setRecentTrucks] = useState([]);
  const [recentTruckLoading, setRecentTruckLoading] = useState(false);
  const [popularFoodTrucks, setPopularFoodTrucks] = useState([]);
  const [popularTruckLoading, setPopularTruckLoading] = useState(false);
  const [nearbyFoodTrucks, setNearbyFoodTrucks] = useState([]);
  const [nearbyTruckLoading, setNearbyTruckLoading] = useState(false);
  const [featuredFoodTrucks, setFeaturedFoodTrucks] = useState([]);
  const [featuredTruckLoading, setFeaturedTruckLoading] = useState(false);
  const [bannerList, setBannerList] = useState([]);
  const [isLocationModalVisible, setLocationModalVisible] = useState(false);
  const [initialLocationsFetched, setInitialLocationsFetched] = useState(false);

  const { allLocations, defaultLocation } = useSelector(
    (state) => state.locationReducer
  );
  const { isSignedIn } = useSelector((state) => state.authReducer);
  const OrderReducerStates = useSelector((state) => state.orderReducer);

  const [tempSelectedLocation, setTempSelectedLocation] =
    useState(defaultLocation);

  useEffect(() => {
    if (isLocationModalVisible) {
      setTempSelectedLocation(defaultLocation);
    }
  }, [isLocationModalVisible, defaultLocation]);

  useEffect(() => {
    const unsubscribe = getMessaging().onTokenRefresh(async (newToken) => {
      console.log("FCM-Token Refreshed =>", newToken);

      const deviceId = await checkInstallationId();
      if (!deviceId) return;

      try {
        const payload = { token: newToken };
        const response = await updateFcmToken_API({ deviceId, payload });
        console.log("response => ", response);
      } catch (error) {
        console.log("error => ", error);
      }
    });

    return unsubscribe;
  }, []);

  const handleConfirmSelection = () => {
    if (tempSelectedLocation) {
      dispatch(setDefaultLocation(tempSelectedLocation));
    }
    setLocationModalVisible(false);
  };

  const handleCancelSelection = () => {
    setLocationModalVisible(false);
  };

  useFocusEffect(
    useCallback(() => {
      // Check if currentOrder needs to be cleared based on lastUpdate
      if (OrderReducerStates?.currentOrder?.lastUpdate) {
        const lastUpdate = moment(OrderReducerStates.currentOrder.lastUpdate);
        const now = moment();
        const diffHours = now.diff(lastUpdate, "hours");

        if (diffHours >= 24) {
          Alert.alert(
            "Cart Cleared",
            "Your previous cart has been cleared due to inactivity (over 24 hours).",
            [
              {
                text: "Okay",
                onPress: () => {
                  dispatch(clearCurrentOrder());
                },
              },
            ],
            {
              cancelable: false,
            }
          );
        }
      }
    }, [])
  );

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
        dispatch(setAllLocations(response.data.addressList || []));
      }
    } catch (error) {
      console.error("Error fetching all addresses:", error);
    }
  };

  const fetchRecentFoodTrucks = async () => {
    try {
      setRecentTruckLoading(true);
      const params = { page: 1, limit: 2 };

      const response = await getRecentFoodTrucks_API(params);
      console.log("response =>", response);
      if (response?.success && response?.data) {
        setRecentTrucks(response.data.foodtruckList);
      }
    } catch (error) {
      console.error("Error fetching recent food trucks:", error);
    } finally {
      setRecentTruckLoading(false);
    }
  };

  const fetchNearByFoodTrucks = async () => {
    if (!defaultLocation) return; // Don't fetch if no location is set
    try {
      setNearbyTruckLoading(true);
      const params = {
        page: 1,
        limit: 10,
        userLat: defaultLocation?.lat || 0,
        userLong: defaultLocation?.long || 0,
        distanceInMeters: 160934, // 100 miles in meter
      };
      const response = await getNearbyFoodTrucks_API(params);
      if (response?.success && response?.data) {
        const { foodtruckList } = response.data;
        setNearbyFoodTrucks(foodtruckList);
        setPopularFoodTrucks([...foodtruckList].reverse());
      }
    } catch (error) {
      console.error("Error fetching nearby food trucks:", error);
    } finally {
      setNearbyTruckLoading(false);
    }
  };

  const fetchFeaturedFoodTrucks = async () => {
    if (!defaultLocation) return; // Don't fetch if no location is set
    try {
      setFeaturedTruckLoading(true);
      const params = {
        page: 1,
        limit: 10,
        userLat: defaultLocation?.lat || 0,
        userLong: defaultLocation?.long || 0,
        featured: true,
      };
      const response = await getNearbyFoodTrucks_API(params);
      if (response?.success && response?.data) {
        setFeaturedFoodTrucks(response?.data?.foodtruckList || []);
      }
    } catch (error) {
      console.error("Error fetching featured food trucks:", error);
    } finally {
      setFeaturedTruckLoading(false);
    }
  };

  // get all banner
  const fetchAllBanner = async () => {
    try {
      const response = await getAllBanner_API();
      if (response?.success && response?.data) {
        setBannerList(response.data.bannerList);
      }
    } catch (error) {
      console.error("Error fetching banner:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (isSignedIn && allLocations.length === 0 && !initialLocationsFetched) {
        fetchAllAddresses(); // Fetch all addresses on initial load for signed-in users if not already fetched
        setInitialLocationsFetched(true); // Mark as fetched
      }
      fetchAllBanner();
      fetchRecentFoodTrucks();
      fetchNearByFoodTrucks();
      fetchFeaturedFoodTrucks();
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
      activeOpacity={0.7}
      style={styles.locationModalItem}
      onPress={() => setTempSelectedLocation(item)}
    >
      <View style={styles.addressRow}>
        <Ionicons
          name="location-outline"
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

  const renderBanner = ({ item }) => {
    return (
      <AppImage
        key={item._id}
        uri={item.imageUrl}
        containerStyle={{ width: "100%", height: "100%", borderRadius: 5 }}
      />
    );
  };

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
        {/* <TouchableOpacity
          onPress={handleNotificationBellPress}
          activeOpacity={0.7}
        >
          <Image source={RoundBellWhite} style={styles.iconImage} />
        </TouchableOpacity> */}
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
          editable={false}
        />
        <Pressable
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            borderRadius: 30,
          }}
          onPress={() => navigation.navigate("globalSearchScreen")}
        />
      </Animated.View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: SEARCH_BAR_TOP },
        ]}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
      >
        <View style={styles.scrollViewContaier}>
          {bannerList?.length > 0 && (
            <View style={{ height: 150, marginVertical: 10 }}>
              <Carousel
                ref={carouselRef}
                mode="parallax"
                modeConfig={{
                  parallaxScrollingScale: 0.9,
                  parallaxAdjacentItemScale: 0.55,
                }}
                width={width}
                data={bannerList}
                onProgressChange={progress}
                renderItem={renderBanner}
                loop={true}
                autoPlay={true}
                autoPlayInterval={10000}
                scrollAnimationDuration={700}
              />
            </View>
          )}

          {/* Recent Trucks Container */}
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
                  fontFamily: Mulish700,
                  fontSize: 18,
                  color: AppColor.black,
                }}
              >
                {"Recent Trucks"}
              </Text>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate("seeAllTrucksScreen", {
                    screenTitle: "Recent Food Trucks",
                    screenType: "recent_food_trucks",
                  })
                }
              >
                <Text
                  style={{
                    fontFamily: Mulish400,
                    fontSize: 14,
                    color: AppColor.black,
                    paddingHorizontal: 20,
                  }}
                >
                  {"See All"}
                </Text>
              </TouchableOpacity>
            </View>
            {recentTrucks?.map((item) => (
              <FoodTruckListComponent
                key={item._id}
                title={item.name}
                uri={item.logo}
                foodTruckId={item._id}
                reviews={`${item.avgRate} (${item.totalReviews} reviews)`}
                showLikeButton={isSignedIn}
                showDistance={false}
                onContainerPress={() =>
                  navigation.navigate("foodTruckDetailScreen", { item })
                }
              />
            ))}
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
                  fontFamily: Mulish700,
                  fontSize: 18,
                  color: AppColor.black,
                }}
              >
                {"Popular Nearby Food Trucks"}
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate("seeAllTrucksScreen", {
                    screenTitle: "Popular Nearby Food Trucks",
                    screenType: "popular_nearby_trucks",
                  })
                }
              >
                <Text
                  style={{
                    fontFamily: Mulish400,
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
              data={popularFoodTrucks}
              extraData={popularFoodTrucks}
              keyExtractor={(item) => item._id.toString()}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => {
                return (
                  <FoodTruckGridComponent
                    title={item.name}
                    uris={item.logo}
                    showLikeButton={isSignedIn}
                    foodTruckId={item._id}
                    reviews={`${item.avgRate} (${item.totalReviews} reviews)`}
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
              ListEmptyComponent={() => (
                <View
                  style={{
                    width: width - 40,
                    height: 100,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: Mulish600,
                      color: AppColor.black,
                    }}
                  >
                    {"No Food Trucks Available."}
                  </Text>
                </View>
              )}
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
                  fontFamily: Mulish700,
                  fontSize: 18,
                  color: AppColor.black,
                }}
              >
                {"Nearby Food Trucks"}
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate("seeAllTrucksScreen", {
                    screenTitle: "Nearby Food Trucks",
                    screenType: "nearby_food_trucks",
                  })
                }
              >
                <Text
                  style={{
                    fontFamily: Mulish400,
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
              data={nearbyFoodTrucks}
              extraData={nearbyFoodTrucks}
              keyExtractor={(item) => item._id.toString()}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => {
                return (
                  <FoodTruckGridComponent
                    title={item.name}
                    uris={item.logo}
                    showLikeButton={isSignedIn}
                    foodTruckId={item._id}
                    reviews={`${item.avgRate} (${item.totalReviews} reviews)`}
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
              ListEmptyComponent={() => (
                <View
                  style={{
                    width: width - 40,
                    height: 100,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: Mulish600,
                      color: AppColor.black,
                    }}
                  >
                    {"No Food Trucks Available."}
                  </Text>
                </View>
              )}
            />
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
                  fontFamily: Mulish700,
                  fontSize: 18,
                  color: AppColor.black,
                }}
              >
                {"Featured Food Trucks"}
              </Text>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate("seeAllTrucksScreen", {
                    screenTitle: "Featured Food Trucks",
                    screenType: "featured_food_trucks",
                  })
                }
              >
                <Text
                  style={{
                    fontFamily: Mulish400,
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
              data={featuredFoodTrucks}
              extraData={featuredFoodTrucks}
              keyExtractor={(item) => item._id.toString()}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => {
                return (
                  <FoodTruckGridComponent
                    title={item.name}
                    uris={item.logo}
                    showLikeButton={isSignedIn}
                    foodTruckId={item._id}
                    reviews={`${item.avgRate} (${item.totalReviews} reviews)`}
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
              ListEmptyComponent={() => (
                <View
                  style={{
                    width: width - 40,
                    height: 100,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: Mulish600,
                      color: AppColor.black,
                    }}
                  >
                    {"No Food Trucks Available."}
                  </Text>
                </View>
              )}
            />
          </View>
        </View>
      </Animated.ScrollView>

      {/* Guest User Prompt */}
      {!defaultLocation && (
        <View
          style={[
            styles.guestPromptContainer,
            // { paddingBottom: insets.bottom + 10 },
          ]}
        >
          <Text style={styles.guestPromptText}>
            Set your location to discover nearby food trucks!
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.guestPromptButton}
            onPress={() =>
              navigation.navigate("authMapScreen", { mode: "add" })
            }
          >
            <Text style={styles.guestPromptButtonText}>Set Location</Text>
          </TouchableOpacity>
        </View>
      )}

      {OrderReducerStates?.currentOrder?.foodTruckId && (
        <View
          style={{
            position: "absolute",
            bottom: !defaultLocation ? 80 : 10,
            left: 16,
            right: 16,
            padding: 16,
            paddingRight: 0,
            flexDirection: "row",
            alignItems: "center",
            borderRadius: 8,
            backgroundColor: AppColor.white,
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
          }}
        >
          <AppImage
            uri={OrderReducerStates?.currentOrder?.foodTruckLogo}
            containerStyle={{ height: 50, width: 50, borderRadius: 5 }}
          />
          <Pressable
            onPress={() =>
              navigation.navigate("foodTruckDetailScreen", {
                item: { _id: OrderReducerStates?.currentOrder?.foodTruckId },
              })
            }
            style={{ flex: 1, marginHorizontal: 8, gap: 4 }}
          >
            <Text
              numberOfLines={1}
              style={{
                fontFamily: Mulish700,
                fontSize: 15,
                color: AppColor.text,
              }}
            >
              {OrderReducerStates?.currentOrder?.foodTruckName}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: Mulish600,
                fontSize: 14,
                color: AppColor.primary,
              }}
            >
              {"View Menu"}
            </Text>
          </Pressable>
          <TouchableOpacity
            activeOpacity={0.7}
            style={{
              height: "100%",
              justifyContent: "center",
              paddingVertical: 2,
              paddingHorizontal: 16,
              borderRadius: 10,
              backgroundColor: AppColor.primary,
            }}
            onPress={() => {
              // navigate to 2 screen for previous screen history
              navigation.navigate("foodTruckDetailScreen", {
                item: { _id: OrderReducerStates?.currentOrder?.foodTruckId },
              });
              navigation.navigate("checkoutScreen", {
                foodTruckId: OrderReducerStates?.currentOrder?.foodTruckId,
              });
            }}
          >
            <Text
              style={{
                color: AppColor.white,
                fontFamily: Mulish700,
                fontSize: 15,
              }}
            >
              {"View Cart"}
            </Text>
            <Text
              style={{
                color: AppColor.white,
                fontFamily: Mulish400,
                fontSize: 14,
                textAlign: "center",
              }}
            >
              {`${OrderReducerStates?.currentOrder?.items?.length || 0} item${OrderReducerStates?.currentOrder?.items?.length > 1 ? "s" : ""}`}
            </Text>
          </TouchableOpacity>
          <IconButton
            icon="close"
            iconColor={AppColor.black}
            size={22}
            onPress={() => {
              Alert.alert(
                "Discard Cart",
                "Are you sure you want to discart your cart?",
                [
                  {
                    text: "Cancel",
                    style: "cancel",
                  },
                  {
                    text: "OK",
                    style: "destructive",
                    onPress: () => {
                      dispatch(clearOrderSlice());
                    },
                  },
                ],
                { cancelable: false }
              );
            }}
          />
        </View>
      )}

      <View
        style={{
          position: "absolute",
          inset: 0,
          flex: 1,
        }}
      >
        {/* Location Selection Modal */}
        <Modal
          isVisible={isLocationModalVisible}
          // onSwipeComplete={handleCancelSelection}
          // swipeDirection={["down"]}
          onBackdropPress={handleCancelSelection}
          style={styles.locationModal}
          // animationIn="slideInUp"
          // animationOut="slideOutDown"
          backdropOpacity={0.4}
          statusBarTranslucent={true}
          useNativeDriver={true}
          useNativeDriverForBackdrop={true}
        >
          <View
            style={[
              styles.locationModalContainer,
              { paddingBottom: insets.bottom || 10 },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderText}>Select a Location</Text>
              <TouchableOpacity
                activeOpacity={0.7}
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
                activeOpacity={0.7}
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelSelection}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.modalButton, styles.selectButton]}
                onPress={handleConfirmSelection}
              >
                <Text style={styles.selectButtonText}>Select Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
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
    fontFamily: Mulish400,
    fontSize: 20,
  },
  locationSubtitle: {
    fontFamily: Mulish400,
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
    fontFamily: Mulish700,
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
    fontFamily: Mulish400,
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
    height: 70, // fixed height for prompt
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
    fontFamily: Mulish600,
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
    fontFamily: Mulish700,
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
    fontFamily: Mulish700,
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
    fontFamily: Mulish400,
    fontSize: 18,
    color: AppColor.black,
  },
  locationModalAddress: {
    fontFamily: Mulish400,
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
    fontFamily: Mulish700,
    fontSize: 16,
  },
  selectButton: {
    backgroundColor: AppColor.primary,
  },
  selectButtonText: {
    color: AppColor.white,
    fontFamily: Mulish700,
    fontSize: 16,
  },
});
