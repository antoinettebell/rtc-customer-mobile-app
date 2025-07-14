import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
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
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import { AppColor, Mulish700, Mulish400 } from "../utils/theme";
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

const socialMediaIcons = {
  FACEBOOK: facebookIcon,
  INSTAGRAM: instagramIcon,
  TWITTER: twitterIcon,
  WEB: webIcon,
};

const { width } = Dimensions.get("window");

const HR = () => <View style={styles.HR} />;

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

  const { item } = route.params;

  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(true);
  const [foodTruckDetail, setFoodTruckDetail] = useState(null);
  const [menuTabs, setMenuTabs] = useState([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [isScheduleVisible, setIsScheduleVisible] = useState(false);

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
    fetchFoodTruckDetails();
    fetchMenuDetails();
  }, [item._id]); // Re-fetch when item changes

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
      const response = await getFoodTruckDetailById_API(item._id);
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
    try {
      setMenuLoading(true);
      const response = await getFoodTruckMenuDetailById_API(item._id);
      if (response?.success) {
        const menuItems = response.data.menuList;
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
      if (!categoriesMap[item.categoryId]) {
        categoriesMap[item.categoryId] = {
          key: item.categoryId,
          label: item.category.name,
          items: [],
        };
      }

      categoriesMap[item.categoryId].items.push({
        id: item._id,
        name: item.name,
        desc: item.description,
        price: `$${item.price.toFixed(2)}`,
        img:
          item.imgUrls && item.imgUrls.length > 0
            ? { uri: item.imgUrls[0] }
            : null,
        originalItem: item,
        available: item.available,
        minQty: item.minQty || 1,
        maxQty: item.maxQty || 10,
        allowCustomize: item.allowCustomize || false,
        diet: item.diet || [],
        discount: item.discount || 0,
        itemType: item.itemType,
        subItem: item.subItem || [],
      });
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

  const INFO_ROWS = [
    {
      icon: (
        <FontAwesome6 name="location-dot" size={20} color={AppColor.primary} />
      ),
      title: "Truck Location",
      value: currentLocationInfo?.title || "Not Available Now",
      value2: currentLocationInfo?.address || "",
      metadata: { locationId: currentLocationInfo?._id },
    },
    {
      icon: (
        <MaterialIcons name="watch-later" size={20} color={AppColor.primary} />
      ),
      title: "Open Hours",
      value: todaysHours,
      icon2: (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsScheduleVisible(true)}
          hitSlop={12}
        >
          <MaterialIcons name="info" size={20} color={AppColor.black} />
        </TouchableOpacity>
      ),
    },
    {
      icon: (
        <MaterialIcons
          name="event-available"
          size={20}
          color={AppColor.primary}
        />
      ),
      title: "Status",
      value: currentStatus,
      onPress: () => {},
    },
  ];

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
    const currentQuantity = getItemQuantity(menuItem.id);

    if (currentQuantity >= menuItem.maxQty) {
      Alert.alert(
        "Maximum Quantity Reached",
        `You can only add up to ${menuItem.maxQty} of this item.`
      );
      return;
    }

    if (currentQuantity === 0 && menuItem.minQty > 1) {
      Alert.alert(
        "Minimum Quantity Required",
        `To order this item, you must add at least ${menuItem.minQty} quantity.`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: `Add ${menuItem.minQty}`,
            onPress: () => {
              dispatch(
                addItemToOrder({
                  foodTruckId: item._id,
                  foodTruckName: item.name,
                  foodTruckLogo: item.logo,
                  item: {
                    id: menuItem.id,
                    name: menuItem.name,
                    desc: menuItem.desc,
                    price: parseFloat(menuItem.price.replace("$", "")),
                    img: menuItem.img,
                    originalItem: menuItem.originalItem,
                    minQty: menuItem.minQty,
                    maxQty: menuItem.maxQty,
                    allowCustomize: menuItem.allowCustomize,
                    diet: menuItem.diet,
                    discount: menuItem.discount,
                    itemType: menuItem.itemType,
                    subItem: menuItem.subItem,
                  },
                  quantity: menuItem.minQty,
                })
              );
            },
          },
        ]
      );
      return;
    }

    dispatch(
      addItemToOrder({
        foodTruckId: item._id,
        foodTruckName: item.name,
        foodTruckLogo: item.logo,
        item: {
          id: menuItem.id,
          name: menuItem.name,
          desc: menuItem.desc,
          price: parseFloat(menuItem.price.replace("$", "")),
          img: menuItem.img,
          originalItem: menuItem.originalItem,
          minQty: menuItem.minQty,
          maxQty: menuItem.maxQty,
          allowCustomize: menuItem.allowCustomize,
          diet: menuItem.diet,
          discount: menuItem.discount,
          itemType: menuItem.itemType,
          subItem: menuItem.subItem,
        },
      })
    );
  };

  const handleRemoveItem = (menuItem) => {
    dispatch(
      removeItemFromOrder({
        itemId: menuItem.id,
      })
    );
  };

  const getItemQuantity = (itemId) => {
    const orderItem = currentOrder.items.find((item) => item.id === itemId);
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager barStyle="dark-content" />

      <AppHeader headerTitle="Details" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 120,
          backgroundColor: "#F0F1F2",
        }}
      >
        {/* Image Carousel */}
        <ImageCarousel images={images} />
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            backgroundColor: AppColor.white,
            gap: 10,
          }}
        >
          {/* Name & Subname */}
          <View style={styles.nameRow}>
            <Text style={styles.title}>{foodTruckDetail?.name}</Text>
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
              <FontAwesome name="star" size={16} color={AppColor.ratingStar} />
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
                  <FastImage source={iconSource} style={styles.socialIcon} />
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
                <Text style={styles.getDirectionBtnText}>Get Direction</Text>
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
          {INFO_ROWS.map((row, idx) => {
            const isAvailabilityRow = row.title === "Open Hours";
            const isStatusRow = row.title === "Status";
            const isOpen = row.value === "Open Now";
            const isClosed = row.value === "Closed Now";

            return (
              <View key={idx} style={styles.infoRowContainer}>
                <View style={[styles.infoRowContainer, { flex: 1 }]}>
                  <View style={styles.infoRowLeft}>
                    {row.icon}
                    <Text style={styles.infoRowTitle}>{row.title}</Text>
                  </View>
                </View>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={[
                        styles.infoRowValue,
                        {
                          textAlign: "right",
                          backgroundColor: isStatusRow
                            ? isOpen
                              ? AppColor.lightGreenBG
                              : isClosed
                                ? AppColor.lightRedBG
                                : "transparent"
                            : "transparent",
                          color: isStatusRow
                            ? isOpen
                              ? AppColor.snackbarSuccess
                              : isClosed
                                ? AppColor.snackbarError
                                : AppColor.black
                            : AppColor.black,
                          padding: isStatusRow ? 6 : 0,
                          borderRadius: isStatusRow ? 4 : 0,
                          marginRight: isAvailabilityRow ? 10 : 0,
                        },
                      ]}
                    >
                      {row.value}
                    </Text>
                    {isAvailabilityRow && row.icon2}
                  </View>
                  {row.value2 && (
                    <Text style={[styles.infoRowValue, { textAlign: "right" }]}>
                      {row.value2}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
          <FoodTruckAvailabilityModal
            visible={isScheduleVisible}
            onClose={() => setIsScheduleVisible(false)}
            availability={foodTruckDetail?.availability || []}
          />
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
                      const quantity = getItemQuantity(menu.id);
                      const isLastItem = index === tab.items.length - 1;
                      const isDisabled = !menu.available;

                      return (
                        <View
                          key={menu.id}
                          style={[
                            styles.menuItemRow,
                            !isLastItem && styles.menuItemBorder,
                            isDisabled && styles.disabledMenuItem,
                          ]}
                        >
                          {menu.img ? (
                            <Image
                              source={menu.img}
                              style={[
                                styles.menuImg,
                                isDisabled && styles.disabledImage,
                              ]}
                            />
                          ) : (
                            <View
                              style={[
                                styles.menuImgPlaceholder,
                                isDisabled && styles.disabledImage,
                              ]}
                            />
                          )}
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
                              style={[
                                styles.menuDesc,
                                isDisabled && styles.disabledText,
                              ]}
                            >
                              {menu.desc}
                            </Text>
                            <Text
                              style={[
                                styles.menuPrice,
                                isDisabled && styles.disabledText,
                              ]}
                            >
                              {menu.price}
                            </Text>
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
                                <Text style={styles.addButtonText}>Add</Text>
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
      {currentOrder.totalItems > 0 && currentOrder.foodTruckId === item._id && (
        <TouchableOpacity
          activeOpacity={0.7}
          style={[
            styles.bottomBar,
            {
              paddingBottom: insets.bottom || 12,
            },
          ]}
          onPress={() =>
            navigation.navigate("checkoutScreen", { foodTruckId: item?._id })
          }
        >
          <View style={styles.bottomBarBtn}>
            <Text style={styles.bottomBarText}>
              {currentOrder.totalItems}{" "}
              {currentOrder.totalItems === 1 ? "ITEM" : "ITEMS"} ADDED
            </Text>
            <Text style={styles.bottomBarSubText}>View your order-list</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* <ActionSheet
        ref={actionSheetRef}
        headerAlwaysVisible={true}
        gestureEnabled={true}
        onClose={() => setSelectedMenuItem(null)}
      >
        <Text>{selectedMenuItem?.name}</Text>
      </ActionSheet> */}

      <ActionSheet
        ref={actionSheetRef}
        headerAlwaysVisible={true}
        gestureEnabled={true}
        onClose={() => setSelectedMenuItem(null)}
      >
        {selectedMenuItem && (
          <View style={{ padding: 20 }}>
            {/* Header with close button */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 15,
              }}
            >
              <Text
                style={{
                  fontFamily: Mulish700,
                  fontSize: 20,
                  color: AppColor.text,
                }}
              >
                {selectedMenuItem.name || "Menu Item"}
              </Text>
              <TouchableOpacity onPress={() => actionSheetRef.current?.hide()}>
                <MaterialIcons name="close" size={24} color={AppColor.text} />
              </TouchableOpacity>
            </View>

            {/* Image - using first image from imgUrls if available */}
            {selectedMenuItem.img?.uri ||
            selectedMenuItem.originalItem?.imgUrls?.[0] ? (
              <Image
                source={{
                  uri:
                    selectedMenuItem.img?.uri ||
                    selectedMenuItem.originalItem?.imgUrls?.[0],
                }}
                style={{
                  width: "100%",
                  height: 200,
                  borderRadius: 10,
                  marginBottom: 15,
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
                  marginBottom: 15,
                }}
              >
                <MaterialIcons
                  name="fastfood"
                  size={50}
                  color={AppColor.textHighlighter}
                />
              </View>
            )}

            {/* Description */}
            {(selectedMenuItem.desc ||
              selectedMenuItem.originalItem?.description) && (
              <Text
                style={{
                  fontFamily: Mulish400,
                  fontSize: 15,
                  color: AppColor.text,
                  marginBottom: 15,
                  lineHeight: 22,
                }}
              >
                {selectedMenuItem.desc ||
                  selectedMenuItem.originalItem?.description ||
                  ""}
              </Text>
            )}

            {/* Price and Availability */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 15,
              }}
            >
              <Text
                style={{
                  fontFamily: Mulish700,
                  fontSize: 18,
                  color: AppColor.primary,
                }}
              >
                {selectedMenuItem.price ||
                  `$${(selectedMenuItem.originalItem?.price || 0).toFixed(2)}`}
                {(selectedMenuItem.discount || 0) > 0 && (
                  <Text
                    style={{
                      fontFamily: Mulish400,
                      fontSize: 14,
                      color: AppColor.snackbarError,
                      textDecorationLine: "line-through",
                      marginLeft: 5,
                    }}
                  >
                    $
                    {(
                      parseFloat(
                        (selectedMenuItem.price || "0").replace("$", "")
                      ) + (selectedMenuItem.discount || 0)
                    ).toFixed(2)}
                  </Text>
                )}
              </Text>

              <Text
                style={{
                  fontFamily: Mulish400,
                  fontSize: 14,
                  color: (
                    selectedMenuItem.available !== undefined
                      ? selectedMenuItem.available
                      : selectedMenuItem.originalItem?.available
                  )
                    ? AppColor.snackbarSuccess
                    : AppColor.snackbarError,
                  backgroundColor: (
                    selectedMenuItem.available !== undefined
                      ? selectedMenuItem.available
                      : selectedMenuItem.originalItem?.available
                  )
                    ? AppColor.lightGreenBG
                    : AppColor.lightRedBG,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 4,
                }}
              >
                {(
                  selectedMenuItem.available !== undefined
                    ? selectedMenuItem.available
                    : selectedMenuItem.originalItem?.available
                )
                  ? "Available"
                  : "Unavailable"}
              </Text>
            </View>

            {/* Dietary Information */}
            {(selectedMenuItem.diet?.length > 0 ||
              selectedMenuItem.originalItem?.diet?.length > 0) && (
              <View style={{ marginBottom: 15 }}>
                <Text
                  style={{
                    fontFamily: Mulish700,
                    fontSize: 16,
                    color: AppColor.text,
                    marginBottom: 5,
                  }}
                >
                  Dietary:
                </Text>
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
                  {(
                    selectedMenuItem.diet ||
                    selectedMenuItem.originalItem?.diet ||
                    []
                  ).map((diet, index) => {
                    // Handle both cases where diet might be string or object
                    const dietName =
                      diet?.name || (typeof diet === "string" ? diet : "");
                    return dietName ? (
                      <View
                        key={diet?._id || index}
                        style={{
                          backgroundColor: AppColor.lightGrayBG,
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 20,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: Mulish400,
                            fontSize: 13,
                            color: AppColor.text,
                          }}
                        >
                          {dietName}
                        </Text>
                      </View>
                    ) : null;
                  })}
                </View>
              </View>
            )}

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
                <Text
                  style={{
                    fontFamily: Mulish400,
                    fontSize: 15,
                    color: AppColor.text,
                    marginRight: 10,
                  }}
                >
                  Quantity:
                </Text>

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
                    disabled={getItemQuantity(selectedMenuItem.id) === 0}
                  >
                    <Text
                      style={{
                        fontFamily: Mulish700,
                        fontSize: 16,
                        color:
                          getItemQuantity(selectedMenuItem.id) === 0
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
                    {getItemQuantity(selectedMenuItem.id)}
                  </Text>

                  <TouchableOpacity
                    style={{ paddingVertical: 8, paddingHorizontal: 12 }}
                    onPress={() => handleAddItem(selectedMenuItem)}
                    disabled={
                      getItemQuantity(selectedMenuItem.id) >=
                      (selectedMenuItem.maxQty ||
                        selectedMenuItem.originalItem?.maxQty ||
                        10)
                    }
                  >
                    <Text
                      style={{
                        fontFamily: Mulish700,
                        fontSize: 16,
                        color:
                          getItemQuantity(selectedMenuItem.id) >=
                          (selectedMenuItem.maxQty ||
                            selectedMenuItem.originalItem?.maxQty ||
                            10)
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
                style={{
                  backgroundColor: AppColor.primary,
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                }}
                onPress={() => {
                  if (getItemQuantity(selectedMenuItem.id) === 0) {
                    handleAddItem(selectedMenuItem);
                  }
                  actionSheetRef.current?.hide();
                }}
                disabled={
                  !(selectedMenuItem.available !== undefined
                    ? selectedMenuItem.available
                    : selectedMenuItem.originalItem?.available)
                }
              >
                <Text
                  style={{
                    fontFamily: Mulish700,
                    fontSize: 16,
                    color: AppColor.white,
                  }}
                >
                  {getItemQuantity(selectedMenuItem.id) === 0
                    ? "Add to Order"
                    : "Update Order"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sub-items (if any) */}
            {(selectedMenuItem.subItem?.length > 0 ||
              selectedMenuItem.originalItem?.subItem?.length > 0) && (
              <View style={{ marginTop: 20 }}>
                <Text
                  style={{
                    fontFamily: Mulish700,
                    fontSize: 16,
                    color: AppColor.text,
                    marginBottom: 10,
                  }}
                >
                  Customizations:
                </Text>
                {(
                  selectedMenuItem.subItem ||
                  selectedMenuItem.originalItem?.subItem ||
                  []
                ).map((subItem, index) => {
                  const subItemName = subItem?.name || `Option ${index + 1}`;
                  const subItemPrice = subItem?.price || 0;

                  return (
                    <View
                      key={subItem?._id || index}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: Mulish400,
                          fontSize: 14,
                          color: AppColor.text,
                        }}
                      >
                        {subItemName}
                      </Text>
                      <Text
                        style={{
                          fontFamily: Mulish400,
                          fontSize: 14,
                          color: AppColor.primary,
                        }}
                      >
                        +${subItemPrice.toFixed(2)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ActionSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColor.white,
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
