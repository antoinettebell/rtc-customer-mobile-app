import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
  Linking,
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { AppColor, Mulish700, Mulish400, Mulish600 } from "../utils/theme";
import StatusBarManager from "../components/StatusBarManager";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import FontAwesome6 from "react-native-vector-icons/FontAwesome6";
import ImageCarousel from "../components/ImageCarousel";
import AppHeader from "../components/AppHeader";
import MapView, { Marker } from "react-native-maps";
import { useDispatch, useSelector } from "react-redux";
import { toggleFavorite, fetchFavorites } from "../redux/slices/favoritesSlice";
import {
  addItemToOrder,
  removeItemFromOrder,
  clearCurrentOrder,
} from "../redux/slices/orderSlice";
import {
  getFoodTruckDetailById_API,
  getFoodTruckMenuDetailById_API,
} from "../apiFolder/appAPI";
import facebookIcon from "../assets/images/facebook.png";
import instagramIcon from "../assets/images/instagram.png";
import twitterIcon from "../assets/images/twitter.png";
import webIcon from "../assets/images/global.png";
import FastImage from "@d11/react-native-fast-image";
import moment from "moment";
import FoodTruckAvailabilityModal from "../components/FoodTruckAvailabilityModal";
import ActionSheet from "react-native-actions-sheet";
import AppImage from "../components/AppImage";
import { Divider, IconButton, SegmentedButtons } from "react-native-paper";

const socialMediaIcons = {
  FACEBOOK: facebookIcon,
  INSTAGRAM: instagramIcon,
  TWITTER: twitterIcon,
  WEB: webIcon,
};

const { width, height } = Dimensions.get("window");

const formatCuisines = (cuisines, maxDisplay = 2) => {
  if (!cuisines?.length) return "";

  const names = cuisines.map((c) => c.name);

  if (names.length <= maxDisplay) {
    return names.join(", ");
  }

  return `${names.slice(0, maxDisplay).join(", ")} & more`;
};

const handleSocialPress = (url) => {
  const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
  Linking.openURL(formattedUrl).catch((err) => {
    console.error("Failed to open URL:", err);
  });
};

const getCurrentLocation = (currentLocation, locations) => {
  if (!currentLocation) return null;

  const matchedLocation = locations.find((loc) => loc._id === currentLocation);

  if (!matchedLocation) return null;

  return {
    latitude: parseFloat(matchedLocation.lat),
    longitude: parseFloat(matchedLocation.long),
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };
};

const getLocationInfo = (currentLocation, locations) => {
  if (!currentLocation) return null;

  const matchedLocation = locations.find((loc) => loc._id === currentLocation);
  if (!matchedLocation) return null;

  return {
    _id: matchedLocation._id,
    title: matchedLocation.title,
    address: matchedLocation.address,
  };
};

const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const getTodaysAvailability = (availability) => {
  if (!availability?.length) return "Closed Today";
  const today = days[new Date().getDay()];

  const todaysSlots = availability.filter(
    (slot) => slot.day === today && slot.available
  );

  if (!todaysSlots.length) return "Closed Today";

  const formattedSlots = todaysSlots.map((slot) => {
    const start = formatTime(slot.startTime);
    const end = formatTime(slot.endTime);
    return `${start} - ${end}`;
  });

  return formattedSlots.join(", ");
};

const formatTime = (timeStr) => {
  if (!timeStr || timeStr === "00:00") return "12:00 AM";
  return moment(timeStr, "HH:mm").format("h:mm A");
};

const getCurrentStatus = (availability) => {
  const todaysHours = getTodaysAvailability(availability);
  if (todaysHours === "Closed Today") return "Closed Now";

  const now = moment();
  const isOpen = availability.some((slot) => {
    if (slot?.day !== days[new Date().getDay()] || !slot.available)
      return false;

    const start = moment(slot.startTime, "HH:mm");
    const end = moment(
      slot.endTime === "00:00" ? "23:59" : slot.endTime,
      "HH:mm"
    );
    return now.isBetween(start, end);
  });

  return isOpen ? "Open Now" : "Closed Now";
};

const FoodTruckDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const tabListRef = useRef();
  const tabContentRef = useRef();
  const actionSheetRef = useRef(null);
  const businessHoursActionSheetRef = useRef(null);

  const { item } = route.params;

  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(true);
  const [foodTruckDetail, setFoodTruckDetail] = useState(null);
  const [menuTabs, setMenuTabs] = useState([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [segment, setSegment] = useState("business");

  const { isSignedIn } = useSelector((state) => state.authReducer);
  // Get favorites and loading state specific to favorite actions from Redux
  const { favorites, loading: favoritesActionLoading } = useSelector(
    (state) => state.favoritesReducer
  );
  const currentOrder = useSelector((state) => state.orderReducer.currentOrder);

  // Check if the current food truck is liked based on Redux state
  const isFoodTruckFavorite = favorites.some(
    (fav) => fav.foodTruck?._id === foodTruckDetail?._id
  );
  // Check if the favorite toggle for *this specific food truck* is loading
  const isFavoriteToggleLoading =
    favoritesActionLoading[foodTruckDetail?._id] || false;

  useEffect(() => {
    if (item?._id) {
      fetchFoodTruckDetails();
      fetchMenuDetails();
    }
  }, [item?._id]); // Re-fetch when item changes

  useFocusEffect(
    useCallback(() => {
      if (isSignedIn) {
        dispatch(fetchFavorites());
      } // Fetch favorites whenever the screen is focused
    }, [dispatch])
  );

  const fetchFoodTruckDetails = async () => {
    try {
      setLoading(true);
      const response = await getFoodTruckDetailById_API(item?._id);
      console.log("response => ", response);
      if (response?.success && response?.data) {
        setFoodTruckDetail(response?.data?.foodtruck);
      }
    } catch (error) {
      console.error("Error fetching food truck details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuDetails = async () => {
    setMenuLoading(true);
    try {
      const response = await getFoodTruckMenuDetailById_API(item?._id);
      console.log("response => ", response);
      if (response?.success && response?.data) {
        let menuItems = response.data.menuList;
        // Sort menu items: popularDish = true items come first
        menuItems.sort(
          (a, b) => (b.popularDish ? 1 : 0) - (a.popularDish ? 1 : 0)
        );
        // response.data.menuList = [
        //   {
        //         "_id": "688789ed1a838d68e81b3815",
        //         "name": "Test Discount",
        //         "description": "10 price\n\n2% discount",
        //         "imgUrls": [
        //             "https://ft-media-storage.s3.us-east-1.amazonaws.com/72a0edcf-3b08-4c27-a5ce-7b29640d1d5a.JPG",
        //             "https://ft-media-storage.s3.us-east-1.amazonaws.com/1979164d-e8cb-4a25-8f6b-907c349cd779.JPG",
        //             "https://ft-media-storage.s3.us-east-1.amazonaws.com/cc43b321-061e-4347-99a2-cc041705079b.JPG",
        //             "https://ft-media-storage.s3.us-east-1.amazonaws.com/4e9c89ae-476f-42b2-ab47-2cb4a866630c.JPG"
        //         ],
        //         "strikePrice": 19,
        //         "discountType": "PERCENTAGE",
        //         "discount": 90,
        //         "price": 1.8999999999999986,
        //         "minQty": 1,
        //         "maxQty": 10,
        //         "available": true,
        //         "itemType": "INDIVIDUAL",
        //         "meatWellness": "Chicken wellness",
        //         "categoryId": "688726fbb009955ccf2c311f",
        //         "meatId": "687b9791a4d17e420060e52b",
        //         "preparationTime": 10,
        //         "allowCustomize": false,
        //         "newDish": false,
        //         "popularDish": false,
        //         "diet": [
        //             {
        //                 "_id": "683de39944f5ea8f91a26d0b",
        //                 "name": "Pescatarian",
        //                 "deletedAt": null,
        //                 "createdAt": "2025-06-02T17:47:05.519Z",
        //                 "updatedAt": "2025-06-02T17:47:05.519Z",
        //                 "__v": 0
        //             },
        //             {
        //                 "_id": "683de38a44f5ea8f91a26cfd",
        //                 "name": "Non-Veg",
        //                 "deletedAt": null,
        //                 "createdAt": "2025-06-02T17:46:50.589Z",
        //                 "updatedAt": "2025-06-02T17:46:50.589Z",
        //                 "__v": 0
        //             }
        //         ],
        //         "subItem": [],
        //         "userId": "6831bc7a7115c023f983d442",
        //         "deletedAt": null,
        //         "createdAt": "2025-07-28T14:32:13.447Z",
        //         "updatedAt": "2025-07-30T19:08:32.729Z",
        //         "__v": 0,
        //         "category": {
        //             "_id": "688726fbb009955ccf2c311f",
        //             "name": "Popular item",
        //             "userId": "6831bc7a7115c023f983d442",
        //             "deletedAt": null,
        //             "createdAt": "2025-07-28T07:30:03.684Z",
        //             "updatedAt": "2025-07-28T07:30:03.684Z",
        //             "__v": 0
        //         },
        //         "meat": {
        //             "_id": "687b9791a4d17e420060e52b",
        //             "name": "Chicken",
        //             "deletedAt": null,
        //             "createdAt": "2025-07-19T13:03:13.760Z",
        //             "updatedAt": "2025-07-19T13:03:13.760Z",
        //             "__v": 0
        //         }
        //     }
        // ]
        processMenuItems(menuItems);
      }
    } catch (error) {
      console.error("Error fetching menu details:", error);
    } finally {
      setMenuLoading(false);
    }
  };

  const processMenuItems = (menuItems) => {
    const categoriesMap = {};

    menuItems.forEach((item) => {
      // Only process items that are available
      if (item.available) {
        if (!categoriesMap[item.categoryId]) {
          categoriesMap[item.categoryId] = {
            key: item.categoryId,
            label: item.category.name,
            items: [],
          };
        }
        categoriesMap[item.categoryId].items.push({ ...item });
      }
    });

    const tabs = Object.values(categoriesMap);
    setMenuTabs(tabs);
  };

  const currentLocationInfo = getLocationInfo(
    foodTruckDetail?.currentLocation,
    foodTruckDetail?.locations
  );

  const todaysHours = getTodaysAvailability(foodTruckDetail?.availability);

  // const currentStatus = getCurrentStatus(foodTruckDetail?.availability);
  const currentStatus = foodTruckDetail?.currentLocation
    ? "Open Now"
    : "Closed Now";

  const images =
    foodTruckDetail?.photos && foodTruckDetail?.photos?.length > 0
      ? foodTruckDetail?.photos
      : [];

  const handleTabPress = (idx) => {
    setSelectedTab(idx);
    tabContentRef.current?.scrollToIndex({ index: idx, animated: true });
  };

  const handleTabContentScroll = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    if (selectedTab !== idx) setSelectedTab(idx);
    tabListRef.current?.scrollToIndex({ index: idx, animated: true });
  };

  const handleAddItem = (menuItem) => {
    if (
      currentOrder.foodTruckId &&
      currentOrder.foodTruckId !== item._id &&
      currentOrder.items.length > 0
    ) {
      Alert.alert(
        "Different Food Truck",
        `You already have items from ${currentOrder.foodTruckName}. Would you like to clear your current order and add items from ${item.name}?`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Clear & Add",
            onPress: () => {
              dispatch(clearCurrentOrder());
              addItemToOrderHandler(menuItem);
            },
          },
        ]
      );
      return;
    }

    addItemToOrderHandler(menuItem);
  };

  const addItemToOrderHandler = (menuItem) => {
    const currentQuantity = getItemQuantity(menuItem._id);

    if (currentQuantity >= menuItem.maxQty) {
      Alert.alert(
        "Maximum Quantity Reached",
        `You can only add up to ${menuItem.maxQty} of this item.`
      );
      return;
    }

    dispatch(
      addItemToOrder({
        foodTruckId: item._id,
        foodTruckName: item.name,
        foodTruckLogo: item.logo,
        item: { ...menuItem },
      })
    );
  };

  const handleRemoveItem = (menuItem) => {
    dispatch(
      removeItemFromOrder({
        itemId: menuItem._id,
      })
    );
  };

  const getItemQuantity = (itemId) => {
    const orderItem = currentOrder.items.find((item) => item._id === itemId);
    return orderItem ? orderItem.quantity : 0;
  };

  const truckLocation = getCurrentLocation(
    foodTruckDetail?.currentLocation,
    foodTruckDetail?.locations
  );

  const handleGetDirection = async () => {
    if (!truckLocation) {
      Alert.alert("Location Not Available", "Food truck location is not set.");
      return;
    }

    const { latitude, longitude } = truckLocation;

    const googleMapWebUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    const googleMapAppUrl = `comgooglemaps://?q=${latitude},${longitude}`;
    const appleMapUrl = `maps://?q=${latitude},${longitude}`;

    if (Platform.OS === "ios") {
      const canOpenGoogleMaps = await Linking.canOpenURL(googleMapAppUrl);
      if (canOpenGoogleMaps) {
        await Linking.openURL(googleMapAppUrl);
        return;
      }

      const canOpenAppleMaps = await Linking.canOpenURL(appleMapUrl);
      if (canOpenAppleMaps) {
        await Linking.openURL(appleMapUrl);
        return;
      }

      // Fallback to web
      await Linking.openURL(googleMapWebUrl);
    } else {
      // Android: open Google Maps in browser (will redirect to app if available)
      await Linking.openURL(googleMapWebUrl);
    }
  };

  const getFutureDateForDay = (dayOfWeek) => {
    const today = moment();
    const dayMap = {
      sun: 0,
      mon: 1,
      tue: 2,
      wed: 3,
      thu: 4,
      fri: 5,
      sat: 6,
    };
    const targetDayIndex = dayMap[dayOfWeek.toLowerCase()];
    const currentDayIndex = today.day();

    let daysToAdd = targetDayIndex - currentDayIndex;

    if (daysToAdd < 0) {
      daysToAdd += 7;
    }

    return today.add(daysToAdd, "days");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={{ width: "20%" }}>
            <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
          </View>
          <Text style={styles.headerTitle}>{"Details"}</Text>
          <View style={{ width: "20%" }} />
        </View>
      </View>

      {loading ? (
        <View style={[styles.loadingView, { paddingBottom: insets.bottom }]}>
          <ActivityIndicator size="large" color={AppColor.primary} />
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollViewContent}
          >
            {/* Image Carousel */}
            <ImageCarousel
              images={images}
              imageContainer={{ borderRadius: 0 }}
            />
            <View style={styles.infoContainer}>
              {/* Name & Subname */}
              <View style={styles.nameRow}>
                <View style={styles.nameRowLeft}>
                  <AppImage
                    uri={foodTruckDetail?.logo}
                    containerStyle={styles.logoImage}
                  />
                  <View style={styles.titleContainer}>
                    <Text style={styles.title} numberOfLines={2}>
                      {foodTruckDetail?.name}
                    </Text>
                  </View>
                </View>
                <Text style={styles.subname}>
                  {foodTruckDetail?.infoType === "caterer"
                    ? "Food Caterer"
                    : "Food Truck"}
                </Text>
              </View>
              {/* Ratings & Food Types */}
              <View style={styles.ratingAndHeartContainer}>
                <TouchableOpacity
                  style={styles.ratingsRow}
                  activeOpacity={0.7}
                  onPress={() =>
                    navigation.navigate("rateReviewScreen", {
                      foodTruckId: item?._id,
                    })
                  }
                >
                  <FontAwesome
                    name="star"
                    size={16}
                    color={AppColor.ratingStar}
                  />
                  <Text
                    style={styles.ratingText}
                  >{` ${foodTruckDetail?.avgRate || 0} (${foodTruckDetail?.totalReviews || 0} reviews)`}</Text>
                  <Text style={styles.dot}>|</Text>
                  <Text style={styles.cuisineText}>
                    {formatCuisines(foodTruckDetail?.cuisine)}
                  </Text>
                </TouchableOpacity>
                {foodTruckDetail && isSignedIn && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      dispatch(
                        toggleFavorite({
                          foodTruckId: foodTruckDetail._id,
                          isCurrentlyLiked: isFoodTruckFavorite,
                          foodTruckData: {
                            name: foodTruckDetail.name,
                            logo: foodTruckDetail.logo,
                            reviews: foodTruckDetail.reviews,
                            distanceInMeters: foodTruckDetail.distanceInMeters,
                          },
                        })
                      )
                    }
                    disabled={isFavoriteToggleLoading} // Disable button while this specific item is loading
                  >
                    {isFavoriteToggleLoading ? (
                      <ActivityIndicator size="small" color={AppColor.red} />
                    ) : (
                      <FontAwesome
                        name={isFoodTruckFavorite ? "heart" : "heart-o"}
                        size={22}
                        color={AppColor.red}
                      />
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* Social Media Icons */}
              <View style={styles.socialRow}>
                {foodTruckDetail?.socialMedia?.map((social, index) => {
                  const iconSource = socialMediaIcons[social.mediaType];
                  if (!iconSource) return null;

                  return (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      key={`${social.mediaType}-${index}`}
                      onPress={() => handleSocialPress(social.mediaUrl)}
                    >
                      <FastImage
                        source={iconSource}
                        style={styles.socialIcon}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Location Section */}
            {currentStatus === "Open Now" && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>{"Current Location"}</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.getDirectionBtn}
                    onPress={handleGetDirection}
                  >
                    <Text style={styles.getDirectionBtnText}>
                      Get Direction
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.mapViewWrap}>
                  {truckLocation ? (
                    <MapView
                      provider="google"
                      style={styles.mapView}
                      initialRegion={truckLocation}
                      region={truckLocation}
                      scrollEnabled={false}
                      zoomEnabled={false}
                      pitchEnabled={false}
                      rotateEnabled={false}
                      pointerEvents="none"
                    >
                      <Marker coordinate={truckLocation}>
                        <FontAwesome6
                          name="location-dot"
                          size={32}
                          color={AppColor.primary}
                        />
                      </Marker>
                    </MapView>
                  ) : (
                    <View style={styles.mapPlaceholder}>
                      <Text>No location available</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Dynamic Info Rows */}
            <View style={styles.infoRowsWrap}>
              {/* Status Row */}
              <View style={styles.infoRowContainer}>
                <View style={[styles.infoRowContainer, { flex: 1 }]}>
                  <View style={styles.infoRowLeft}>
                    <View
                      style={{
                        width: 24,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <MaterialIcons
                        name="event-available"
                        size={20}
                        color={AppColor.primary}
                      />
                    </View>
                    <Text style={styles.infoRowTitle}>{"Status"}</Text>
                  </View>
                </View>
                <View style={styles.infoRowRight}>
                  <View style={styles.infoRowValueContainer}>
                    <Text
                      style={[
                        styles.infoRowValue,
                        {
                          textAlign: "right",
                          backgroundColor:
                            currentStatus === "Open Now"
                              ? AppColor.lightGreenBG
                              : currentStatus === "Closed Now"
                                ? AppColor.lightRedBG
                                : "transparent",
                          color:
                            currentStatus === "Open Now"
                              ? AppColor.snackbarSuccess
                              : currentStatus === "Closed Now"
                                ? AppColor.snackbarError
                                : AppColor.black,
                          padding: 6,
                          borderRadius: 4,
                          marginRight: 0,
                        },
                      ]}
                    >
                      {currentStatus}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Location Row */}
              <View style={styles.infoRowContainer}>
                <View style={[styles.infoRowContainer, { flex: 1 }]}>
                  <View style={styles.infoRowLeft}>
                    <View
                      style={{
                        width: 24,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <FontAwesome6
                        name="location-dot"
                        size={20}
                        color={AppColor.primary}
                      />
                    </View>
                    <Text style={styles.infoRowTitle}>{"Truck Location"}</Text>
                  </View>
                </View>
                <View style={styles.infoRowRight}>
                  <View style={styles.infoRowValueContainer}>
                    <Text
                      style={[
                        styles.infoRowValue,
                        {
                          textAlign: "right",
                          backgroundColor: "transparent",
                          color: AppColor.black,
                          padding: 0,
                          borderRadius: 0,
                          marginRight: 0,
                        },
                      ]}
                    >
                      {currentLocationInfo?.title || "Not Available Now"}
                    </Text>
                  </View>
                  {currentLocationInfo?.address && (
                    <Text style={[styles.infoRowValue, { textAlign: "right" }]}>
                      {currentLocationInfo?.address || ""}
                    </Text>
                  )}
                </View>
              </View>

              <Divider style={{ marginVertical: 8 }} />

              {/* Business Hours Row */}
              <View style={styles.infoRowContainer}>
                <View style={[styles.infoRowContainer, { flex: 1 }]}>
                  <View style={styles.infoRowLeft}>
                    <View
                      style={{
                        width: 24,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <MaterialIcons
                        name="watch-later"
                        size={20}
                        color={AppColor.primary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.infoRowTitle,
                        { flex: 1, flexWrap: "wrap" },
                      ]}
                      numberOfLines={2}
                    >
                      {"Business Hours and Pre-Order Availability"}
                    </Text>
                    <IconButton
                      icon="information"
                      size={24}
                      color={AppColor.black}
                      style={{ margin: 0 }}
                      onPress={() =>
                        businessHoursActionSheetRef.current?.show()
                      }
                    />
                  </View>
                </View>
              </View>

              {/* <FoodTruckAvailabilityModal
                visible={isScheduleVisible}
                onClose={() => setIsScheduleVisible(false)}
                availability={foodTruckDetail?.availability || []}
              /> */}
            </View>

            {/* Dynamic Tabs (swipeable & tappable) - Always displayed */}
            {menuLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={AppColor.primary} />
              </View>
            ) : menuTabs.length > 0 ? (
              <>
                <View style={styles.tabsWrap}>
                  <FlatList
                    ref={tabListRef}
                    data={menuTabs}
                    keyExtractor={(tab) => tab.key}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsRow}
                    renderItem={({ item: tab, index }) => (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={[
                          styles.tabBtn,
                          selectedTab === index && styles.tabBtnActive,
                        ]}
                        onPress={() => handleTabPress(index)}
                      >
                        <Text
                          style={[
                            styles.tabText,
                            selectedTab === index && styles.tabTextActive,
                          ]}
                        >
                          {tab.label}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
                <FlatList
                  ref={tabContentRef}
                  data={menuTabs}
                  keyExtractor={(tab) => tab.key}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tabContentContainer}
                  onMomentumScrollEnd={handleTabContentScroll}
                  getItemLayout={(_, index) => ({
                    length: width,
                    offset: width * index,
                    index,
                  })}
                  renderItem={({ item: tab }) => (
                    <View style={styles.tabContent}>
                      {tab.items.length === 0 ? (
                        <Text style={styles.noMenuText}>
                          No items available in this section.
                        </Text>
                      ) : (
                        tab?.items?.map((menu, index) => {
                          const quantity = getItemQuantity(menu._id);
                          const isLastItem = index === tab.items.length - 1;
                          const isDisabled = !menu.available;

                          return (
                            <View
                              key={menu._id}
                              style={[
                                styles.menuItemRow,
                                !isLastItem && styles.menuItemBorder,
                                isDisabled && styles.disabledMenuItem,
                              ]}
                            >
                              <View>
                                <AppImage
                                  uri={menu.imgUrls[0]}
                                  containerStyle={styles.menuImg}
                                />
                                {menu?.newDish ? (
                                  <FastImage
                                    source={require("../assets/images/new.png")}
                                    style={styles.newDishBadge}
                                  />
                                ) : null}
                              </View>
                              <Pressable
                                onPress={() => {
                                  console.log("menu item => ", menu);
                                  setSelectedMenuItem(menu);
                                  actionSheetRef.current?.show();
                                }}
                                style={styles.menuDetails}
                                disabled={isDisabled}
                              >
                                <Text
                                  style={[
                                    styles.menuTitle,
                                    isDisabled && styles.disabledText,
                                  ]}
                                >
                                  {menu.name}
                                </Text>
                                <Text
                                  numberOfLines={2}
                                  style={[
                                    styles.menuDesc,
                                    isDisabled && styles.disabledText,
                                  ]}
                                >
                                  {menu.description}
                                </Text>
                                <View style={styles.priceContainer}>
                                  <Text style={styles.discountedPrice}>
                                    {`$${parseFloat(menu.price || "0").toFixed(2)} `}
                                  </Text>
                                  {(menu?.strikePrice || 0) > 0 && (
                                    <Text
                                      style={[
                                        styles.regularPrice,
                                        (menu?.strikePrice || 0) > 0
                                          ? styles.strikethroughPrice
                                          : {},
                                      ]}
                                    >
                                      {`$${(menu?.strikePrice || 0).toFixed(2)} `}
                                    </Text>
                                  )}
                                </View>
                                {isDisabled && (
                                  <Text style={styles.unavailableText}>
                                    Currently Unavailable
                                  </Text>
                                )}
                              </Pressable>
                              {!isDisabled ? (
                                quantity === 0 ? (
                                  <TouchableOpacity
                                    activeOpacity={0.7}
                                    style={styles.addButton}
                                    onPress={() => handleAddItem(menu)}
                                  >
                                    <Text style={styles.addButtonText}>
                                      Add
                                    </Text>
                                  </TouchableOpacity>
                                ) : (
                                  <View style={styles.quantityContainer}>
                                    <TouchableOpacity
                                      activeOpacity={0.7}
                                      style={styles.quantityButton}
                                      onPress={() => handleRemoveItem(menu)}
                                    >
                                      <Text style={styles.quantityButtonText}>
                                        -
                                      </Text>
                                    </TouchableOpacity>
                                    <Text style={styles.quantityText}>
                                      {quantity}
                                    </Text>
                                    <TouchableOpacity
                                      activeOpacity={0.7}
                                      style={styles.quantityButton}
                                      onPress={() => handleAddItem(menu)}
                                      disabled={quantity >= menu.maxQty}
                                    >
                                      <Text
                                        style={[
                                          styles.quantityButtonText,
                                          quantity >= menu.maxQty &&
                                            styles.disabledButtonText,
                                        ]}
                                      >
                                        +
                                      </Text>
                                    </TouchableOpacity>
                                  </View>
                                )
                              ) : null}
                            </View>
                          );
                        })
                      )}
                    </View>
                  )}
                />
              </>
            ) : (
              <View style={styles.noMenuContainer}>
                <Text style={styles.noMenuText}>No menu items available</Text>
              </View>
            )}
          </ScrollView>

          {/* Bottom Bar - Conditional display */}
          {currentOrder.totalItems > 0 &&
            currentOrder.foodTruckId === item._id && (
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.bottomBar,
                  {
                    paddingBottom: insets.bottom || 12,
                  },
                ]}
                onPress={() =>
                  navigation.navigate("checkoutScreen", {
                    foodTruckId: item?._id,
                  })
                }
              >
                <View style={styles.bottomBarBtn}>
                  <Text style={styles.bottomBarText}>
                    {currentOrder.totalItems}{" "}
                    {currentOrder.totalItems === 1 ? "ITEM" : "ITEMS"} ADDED
                  </Text>
                  <Text style={styles.bottomBarSubText}>
                    View your order-list
                  </Text>
                </View>
              </TouchableOpacity>
            )}
        </>
      )}

      {/* Dish/Item Details */}
      <ActionSheet
        ref={actionSheetRef}
        gestureEnabled={true}
        isModal={Platform.OS === "ios"}
        onClose={() => setSelectedMenuItem(null)}
      >
        {selectedMenuItem && (
          <View
            style={{
              maxHeight: height - insets.top - insets.bottom - 10,
              paddingBottom: Platform.OS === "ios" ? 10 : 0,
              paddingHorizontal: 20,
            }}
          >
            {/* Header with close button */}
            <View style={styles.actionSheetHeader}>
              <Text style={styles.actionSheetTitle} numberOfLines={2}>
                {selectedMenuItem.name || "Menu Item"}
              </Text>
              <IconButton
                icon="close"
                iconColor={AppColor.text}
                onPress={() => actionSheetRef.current?.hide()}
                style={{ margin: 0 }}
              />
            </View>

            <ScrollView
              contentContainerStyle={styles.actionSheetScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Images */}
              {selectedMenuItem?.imgUrls?.length > 0 ? (
                <ImageCarousel
                  images={selectedMenuItem?.imgUrls}
                  imageResizeMode="cover"
                  containerHeight={200}
                  containerWidth={width - 40}
                  containerStyle={styles.actionSheetImageCarousel}
                  imageContainer={{
                    borderRadius: 0,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: "100%",
                    height: 200,
                    borderRadius: 10,
                    backgroundColor: "#f0f0f0",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <MaterialIcons
                    name="fastfood"
                    size={50}
                    color={AppColor.textHighlighter}
                  />
                </View>
              )}

              {/* Price and Food Type */}
              <View style={styles.actionSheetPriceRow}>
                <View style={styles.actionSheetPriceContainer}>
                  <Text style={styles.actionSheetPrice}>
                    {`$${(selectedMenuItem?.price || 0).toFixed(2)} `}
                  </Text>
                  {selectedMenuItem?.strikePrice > 0 ? (
                    <Text style={styles.actionSheetStrikePrice}>
                      {`$${(selectedMenuItem?.strikePrice || 0).toFixed(2)} `}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.actionSheetFoodTypeContainer}>
                  <FontAwesome6
                    name="clock"
                    size={14}
                    color={AppColor.textPlaceholder}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: Mulish400,
                      color: AppColor.textPlaceholder,
                    }}
                  >
                    {`${selectedMenuItem?.preparationTime} mins`}
                  </Text>
                </View>
              </View>

              {selectedMenuItem?.newDish ||
              selectedMenuItem?.popularDish ||
              selectedMenuItem.itemType === "COMBO" ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    marginBottom: 8,
                  }}
                >
                  {selectedMenuItem?.newDish ? (
                    <Text style={styles.newBadge}>{"New"}</Text>
                  ) : null}
                  {selectedMenuItem?.popularDish ? (
                    <Text style={styles.popularBadge}>{"Popular"}</Text>
                  ) : null}
                  {selectedMenuItem.itemType === "COMBO" ? (
                    <Text style={styles.comboBadge}>{"Combo"}</Text>
                  ) : null}
                </View>
              ) : null}

              {/* Description */}
              <View style={styles.actionSheetDescriptionContainer}>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: Mulish700,
                    color: AppColor.text,
                    marginBottom: 2,
                  }}
                >
                  {"Description:"}
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: Mulish400,
                    color: AppColor.text,
                    lineHeight: 22,
                  }}
                >
                  {selectedMenuItem?.description || ""}
                </Text>
              </View>

              {/* Dietary Information */}
              {selectedMenuItem?.meat?.name && (
                <View
                  style={{
                    marginBottom: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Text style={styles.actionSheetSectionTitle}>
                    {"Meat Type:"}
                  </Text>
                  <Text style={styles.actionSheetDescription}>
                    {selectedMenuItem?.meat?.name}
                  </Text>
                </View>
              )}

              {/* Dietary Information */}
              {selectedMenuItem?.meatWellness && (
                <View style={styles.actionSheetSection}>
                  <Text
                    style={[
                      styles.actionSheetSectionTitle,
                      styles.actionSheetSectionTitleWithMargin,
                    ]}
                  >
                    {"Meat Information:"}
                  </Text>
                  <Text style={styles.actionSheetDescription}>
                    {selectedMenuItem?.meatWellness}
                  </Text>
                </View>
              )}

              {/* Dietary Information */}
              {selectedMenuItem.diet?.length > 0 && (
                <View style={styles.actionSheetSection}>
                  <Text
                    style={[
                      styles.actionSheetSectionTitle,
                      styles.actionSheetSectionTitleWithMargin,
                    ]}
                  >
                    {"Dietary Information:"}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    {(selectedMenuItem.diet || []).map((diet, index) => {
                      // Handle both cases where diet might be string or object
                      const dietName =
                        diet?.name || (typeof diet === "string" ? diet : "");
                      return dietName ? (
                        <Text
                          key={diet?._id || index}
                          style={{
                            fontFamily: Mulish400,
                            fontSize: 13,
                            borderRadius: 20,
                            paddingVertical: 4,
                            paddingHorizontal: 10,
                            color: AppColor.text,
                            backgroundColor: AppColor.lightGreenBG,
                          }}
                        >
                          {dietName}
                        </Text>
                      ) : null;
                    })}
                  </View>
                </View>
              )}

              {/* Sub-items (if any) */}
              {selectedMenuItem.subItem?.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: Mulish700,
                      color: AppColor.text,
                      marginBottom: 8,
                    }}
                  >
                    {"Combo Items:"}
                  </Text>
                  {(selectedMenuItem.subItem || []).map((subItem, index) => (
                    <View
                      key={subItem?._id || index}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 8,
                        gap: 8,
                      }}
                    >
                      <AppImage
                        uri={subItem?.menuItem?.imgUrls?.[0]}
                        containerStyle={{
                          width: 50,
                          height: 50,
                          borderRadius: 4,
                        }}
                      />
                      <View style={{ gap: 2, flex: 1 }}>
                        <Text
                          numberOfLines={1}
                          style={{
                            fontSize: 14,
                            fontFamily: Mulish700,
                            color: AppColor.text,
                          }}
                        >
                          {subItem?.menuItem?.name}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={{
                            fontSize: 14,
                            fontFamily: Mulish400,
                            color: AppColor.textHighlighter,
                          }}
                        >
                          {subItem?.menuItem?.description}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontFamily: Mulish600,
                          fontSize: 16,
                          color: AppColor.primary,
                        }}
                      >
                        {`x${subItem?.qty}`}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Quantity Controls */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 20,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {/* <Text
                  style={{
                    fontFamily: Mulish400,
                    fontSize: 15,
                    color: AppColor.text,
                    marginRight: 10,
                  }}
                >
                  Quantity:
                </Text> */}

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: AppColor.primary,
                  }}
                >
                  <TouchableOpacity
                    style={{ paddingVertical: 8, paddingHorizontal: 12 }}
                    onPress={() => handleRemoveItem(selectedMenuItem)}
                    disabled={getItemQuantity(selectedMenuItem._id) === 0}
                  >
                    <Text
                      style={{
                        fontFamily: Mulish700,
                        fontSize: 16,
                        color:
                          getItemQuantity(selectedMenuItem._id) === 0
                            ? AppColor.textHighlighter
                            : AppColor.primary,
                      }}
                    >
                      -
                    </Text>
                  </TouchableOpacity>

                  <Text
                    style={{
                      fontFamily: Mulish700,
                      fontSize: 16,
                      color: AppColor.text,
                      marginHorizontal: 10,
                    }}
                  >
                    {getItemQuantity(selectedMenuItem._id)}
                  </Text>

                  <TouchableOpacity
                    style={{ paddingVertical: 8, paddingHorizontal: 12 }}
                    onPress={() => handleAddItem(selectedMenuItem)}
                    disabled={
                      getItemQuantity(selectedMenuItem._id) >=
                      (selectedMenuItem.maxQty || 10)
                    }
                  >
                    <Text
                      style={{
                        fontFamily: Mulish700,
                        fontSize: 16,
                        color:
                          getItemQuantity(selectedMenuItem._id) >=
                          (selectedMenuItem.maxQty || 10)
                            ? AppColor.textHighlighter
                            : AppColor.primary,
                      }}
                    >
                      +
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.actionSheetAddButton}
                onPress={() => {
                  if (getItemQuantity(selectedMenuItem._id) === 0) {
                    handleAddItem(selectedMenuItem);
                  }
                  actionSheetRef.current?.hide();
                }}
                disabled={!selectedMenuItem.available}
              >
                <Text style={styles.actionSheetAddButtonText}>
                  {getItemQuantity(selectedMenuItem._id) === 0
                    ? "Add to Order"
                    : "Update Order"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ActionSheet>

      {/* Business Hours  and Pre-Order Availability */}
      <ActionSheet
        ref={businessHoursActionSheetRef}
        gestureEnabled={true}
        isModal={Platform.OS === "ios"}
      >
        <View
          style={{
            maxHeight: height - insets.top - insets.bottom - 10,
            paddingBottom: Platform.OS === "ios" ? 10 : 0,
            paddingHorizontal: 20,
          }}
        >
          {/* Header with close button */}
          <View style={styles.actionSheetHeader}>
            <View style={{ flex: 1 }}>
              <SegmentedButtons
                value={segment}
                onValueChange={setSegment}
                buttons={[
                  {
                    value: "business",
                    label: "Business Hours",
                  },
                  {
                    value: "preOrder",
                    label: "Pre-Order",
                  },
                ]}
                theme={{
                  colors: {
                    secondaryContainer: AppColor.primary,
                    onSecondaryContainer: AppColor.white,
                  },
                }}
              />
            </View>
            <IconButton
              icon="close"
              iconColor={AppColor.text}
              onPress={() => businessHoursActionSheetRef.current?.hide()}
            />
          </View>

          <ScrollView
            contentContainerStyle={styles.actionSheetScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {segment === "business" ? (
              <View>
                {foodTruckDetail?.locations.map((loc) => {
                  const locationAvailability =
                    foodTruckDetail.businessHours.filter(
                      (slot) => slot.locationId === loc._id && slot.available
                    );
                  return (
                    <View key={loc._id}>
                      {/* Location Title */}
                      <View
                        style={{
                          borderWidth: 1,
                          borderColor: AppColor.primary,
                          borderRadius: 6,
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          marginTop: 8,
                          backgroundColor: AppColor.primary + 20,
                        }}
                      >
                        <Text style={{ fontFamily: Mulish600, fontSize: 15 }}>
                          {`${loc.title}\n`}
                          <Text style={{ fontFamily: Mulish400, fontSize: 14 }}>
                            {`${loc.address}`}
                          </Text>
                        </Text>
                      </View>

                      {/* Availability of Locations */}
                      {locationAvailability.length === 0 ? (
                        <View
                          style={{
                            marginLeft: 16,
                            borderLeftWidth: 2,
                            borderLeftColor: AppColor.primary,
                            paddingLeft: 16,
                            paddingVertical: 10,
                          }}
                        >
                          <Text>No business hours for this location.</Text>
                        </View>
                      ) : (
                        <View
                          style={{
                            marginLeft: 16,
                            borderLeftWidth: 2,
                            borderLeftColor: AppColor.primary,
                            paddingTop: 10,
                            paddingLeft: 16,
                            gap: 10,
                            marginBottom: 8,
                          }}
                        >
                          {locationAvailability.map((slot) => {
                            const openTime = moment(
                              slot.startTime,
                              "HH:mm"
                            ).format("hh:mm A");
                            const closeTime = moment(
                              slot.endTime,
                              "HH:mm"
                            ).format("hh:mm A");

                            return (
                              <View
                                key={slot._id}
                                style={{
                                  paddingHorizontal: 16,
                                  paddingVertical: 8,
                                  borderWidth: 1,
                                  borderRadius: 6,
                                  borderColor: AppColor.borderColor,
                                }}
                              >
                                <Text
                                  numberOfLines={1}
                                  style={{
                                    fontSize: 15,
                                    fontFamily: Mulish400,
                                    textTransform: "capitalize",
                                    color: AppColor.text,
                                  }}
                                >
                                  {`${openTime} - ${closeTime}`}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ) : (
              <View>
                {foodTruckDetail?.locations.map((loc) => {
                  const locationAvailability =
                    foodTruckDetail.availability.filter(
                      (slot) => slot.locationId === loc._id && slot.available
                    );
                  return (
                    <View key={loc._id}>
                      {/* Location Title */}
                      <View
                        style={{
                          borderWidth: 1,
                          borderColor: AppColor.primary,
                          borderRadius: 6,
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          marginTop: 8,
                          backgroundColor: AppColor.primary + 20,
                        }}
                      >
                        <Text style={{ fontFamily: Mulish600, fontSize: 15 }}>
                          {`${loc.title}\n`}
                          <Text style={{ fontFamily: Mulish400, fontSize: 14 }}>
                            {`${loc.address}`}
                          </Text>
                        </Text>
                      </View>

                      {/* Availability of Locations */}
                      {locationAvailability.length === 0 ? (
                        <View
                          style={{
                            marginLeft: 16,
                            borderLeftWidth: 2,
                            borderLeftColor: AppColor.primary,
                            paddingLeft: 16,
                            paddingVertical: 10,
                          }}
                        >
                          <Text>No availability for this location.</Text>
                        </View>
                      ) : (
                        <View
                          style={{
                            marginLeft: 16,
                            borderLeftWidth: 2,
                            borderLeftColor: AppColor.primary,
                            paddingTop: 10,
                            paddingLeft: 16,
                            gap: 10,
                            marginBottom: 8,
                          }}
                        >
                          {locationAvailability.map((slot) => {
                            const dateOfTheDay = getFutureDateForDay(slot.day);
                            const openTime = moment(
                              slot.startTime,
                              "HH:mm"
                            ).format("hh:mm A");
                            const closeTime = moment(
                              slot.endTime,
                              "HH:mm"
                            ).format("hh:mm A");

                            return (
                              <View
                                key={slot._id}
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  paddingHorizontal: 16,
                                  paddingVertical: 8,
                                  borderWidth: 1,
                                  borderRadius: 6,
                                  borderColor: AppColor.borderColor,
                                }}
                              >
                                <Text
                                  style={{
                                    fontFamily: Mulish400,
                                    fontSize: 15,
                                    textTransform: "capitalize",
                                    color: AppColor.text,
                                  }}
                                >
                                  {dateOfTheDay.format("ddd (DD-MMM)")}
                                </Text>
                                <Text
                                  numberOfLines={1}
                                  style={{
                                    fontSize: 15,
                                    fontFamily: Mulish400,
                                    textTransform: "capitalize",
                                    color: AppColor.text,
                                  }}
                                >
                                  {`${openTime} - ${closeTime}`}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>
      </ActionSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColor.white,
  },
  header: {
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: AppColor.border,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: Mulish700,
    textAlign: "center",
    color: AppColor.text,
  },
  loadingView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColor.white,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 100,
    backgroundColor: "#F0F1F2",
  },
  infoContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: AppColor.white,
    gap: 16,
  },
  nameRowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoImage: {
    height: 40,
    width: 40,
    borderRadius: 20,
  },
  titleContainer: {
    flex: 1,
  },
  infoRowRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  infoRowValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  tooltipContent: {
    padding: 18,
    borderRadius: 8,
    backgroundColor: AppColor.text,
  },
  tooltipText: {
    fontSize: 14,
    fontFamily: Mulish400,
    color: AppColor.white,
  },
  newDishBadge: {
    height: 32,
    width: 32,
    position: "absolute",
    top: -10,
    left: -10,
    transform: [{ rotate: "-20deg" }],
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  discountedPrice: {
    fontFamily: Mulish700,
    fontSize: 14,
    color: AppColor.primary,
  },
  regularPrice: {
    fontFamily: Mulish700,
    fontSize: 14,
    color: AppColor.primary,
  },
  strikethroughPrice: {
    fontFamily: Mulish400,
    fontSize: 12,
    color: AppColor.text,
    textDecorationLine: "line-through",
  },
  dietaryInfoContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  actionSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    marginRight: -10, // for icon button alignment
  },
  actionSheetTitle: {
    fontFamily: Mulish700,
    fontSize: 20,
    color: AppColor.text,
  },
  actionSheetScrollContent: {
    flexGrow: 1,
  },
  actionSheetImageCarousel: {
    borderRadius: 10,
    marginBottom: 16,
    overflow: "hidden",
  },
  actionSheetPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  actionSheetPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionSheetPrice: {
    fontFamily: Mulish700,
    fontSize: 18,
    color: AppColor.primary,
  },
  actionSheetStrikePrice: {
    fontFamily: Mulish400,
    fontSize: 14,
    color: AppColor.text,
    textDecorationLine: "line-through",
  },
  actionSheetFoodTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  newBadge: {
    fontFamily: Mulish400,
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 20,
    color: AppColor.white,
    backgroundColor: AppColor.orderProgressbar,
  },
  popularBadge: {
    fontFamily: Mulish400,
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 20,
    color: AppColor.white,
    backgroundColor: AppColor.primary,
  },
  comboBadge: {
    fontFamily: Mulish400,
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 20,
    color: AppColor.primary,
    backgroundColor: AppColor.lightGreenBG,
  },
  actionSheetDescriptionContainer: {
    marginBottom: 16,
    marginTop: 8,
  },
  actionSheetDescription: {
    fontFamily: Mulish400,
    fontSize: 14,
    color: AppColor.text,
  },
  actionSheetSectionTitle: {
    fontSize: 16,
    fontFamily: Mulish700,
    color: AppColor.text,
  },
  actionSheetSectionTitleWithMargin: {
    marginBottom: 8,
  },
  actionSheetSection: {
    marginBottom: 16,
  },
  actionSheetAddButton: {
    backgroundColor: AppColor.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  actionSheetAddButtonText: {
    fontFamily: Mulish700,
    fontSize: 16,
    color: AppColor.white,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: Mulish700,
    fontSize: 18,
    color: AppColor.text,
  },
  subname: {
    fontFamily: Mulish400,
    fontSize: 14,
  },
  ratingAndHeartContainer: {
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
  },
  ratingsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontFamily: Mulish400,
    fontSize: 14,
    color: AppColor.textHighlighter,
  },
  dot: {
    color: AppColor.textHighlighter,
    marginHorizontal: 4,
  },
  cuisineText: {
    fontFamily: Mulish400,
    fontSize: 14,
    color: AppColor.textHighlighter,
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  socialIcon: {
    width: 22,
    height: 22,
  },
  section: {
    padding: 16,
    marginTop: 18,
    backgroundColor: AppColor.white,
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontFamily: Mulish700,
    fontSize: 18,
  },
  getDirectionBtn: {
    backgroundColor: "#FC7B0338",
    borderRadius: 8,
    padding: 6,
  },
  getDirectionBtnText: {
    color: AppColor.primary,
    fontFamily: Mulish400,
    fontSize: 14,
  },
  mapViewWrap: {
    height: 170,
  },
  mapView: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  infoRowsWrap: {
    padding: 16,
    marginVertical: 18,
    backgroundColor: AppColor.white,
    gap: 10,
  },
  infoRowContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoRowTitle: {
    fontFamily: Mulish400,
    fontSize: 16,
  },
  infoRowValue: {
    fontFamily: Mulish400,
    fontSize: 14,
  },
  tabsWrap: {
    backgroundColor: AppColor.white,
  },
  tabsRow: {
    flexDirection: "row",
    borderBlockColor: AppColor.borderColor,
    borderBottomWidth: 1,
    flexGrow: 1,
  },
  tabBtn: {
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    marginRight: 8,
    paddingVertical: 18,
  },
  tabBtnActive: {
    borderBottomColor: AppColor.primary,
  },
  tabText: {
    fontFamily: Mulish400,
    fontSize: 16,
  },
  tabTextActive: {
    color: AppColor.primary,
  },
  tabContentContainer: {
    flexGrow: 1,
    backgroundColor: AppColor.white,
  },
  tabContent: {
    width,
    backgroundColor: AppColor.white,
  },
  menuItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: AppColor.borderColor,
  },
  menuImg: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  menuImgPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
  },
  menuDetails: {
    flex: 1,
    marginLeft: 10,
    gap: 6,
  },
  menuTitle: {
    fontFamily: Mulish700,
    fontSize: 16,
  },
  menuDesc: {
    fontFamily: Mulish400,
    fontSize: 14,
  },
  menuPrice: {
    fontFamily: Mulish700,
    fontSize: 14,
    color: AppColor.primary,
  },
  addButton: {
    backgroundColor: AppColor.primary,
    borderRadius: 8,
  },
  addButtonText: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    color: AppColor.white,
    fontFamily: Mulish700,
    fontSize: 14,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColor.primary,
  },
  quantityButton: {
    paddingVertical: 6,
    paddingHorizontal: 9,
  },
  quantityButtonText: {
    fontFamily: Mulish700,
    fontSize: 14,
    color: AppColor.primary,
  },
  quantityText: {
    fontFamily: Mulish700,
    fontSize: 14,
    color: AppColor.text,
    marginHorizontal: 4,
  },
  bottomBar: {
    backgroundColor: AppColor.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginTop: 4,
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  bottomBarBtn: {
    alignItems: "center",
  },
  bottomBarText: {
    fontFamily: Mulish700,
    fontSize: 17,
    color: AppColor.white,
    letterSpacing: 1,
  },
  bottomBarSubText: {
    fontFamily: Mulish400,
    fontSize: 13,
    color: AppColor.white,
    marginTop: 2,
  },
  noMenuText: {
    fontFamily: Mulish400,
    fontSize: 15,
    color: AppColor.textHighlighter,
    marginHorizontal: 16,
  },
  noMenuContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColor.white,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColor.white,
  },
  HR: {
    height: 1,
    backgroundColor: AppColor.borderColor,
  },
  disabledMenuItem: {
    opacity: 0.6,
  },
  disabledImage: {
    opacity: 0.5,
  },
  disabledText: {
    color: AppColor.textHighlighter,
  },
  disabledButtonText: {
    color: AppColor.textHighlighter,
  },
  unavailableText: {
    fontFamily: Mulish400,
    fontSize: 12,
    color: AppColor.snackbarError,
    marginTop: 4,
  },
});

export default FoodTruckDetailScreen;
