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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { AppColor, Mulish700, Mulish400 } from "../utils/theme";
import StatusBarManager from "../components/StatusBarManager";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import FontAwesome6 from "react-native-vector-icons/FontAwesome6";
import ImageCarousel from "../components/ImageCarousel";
import MapView, { Marker } from "react-native-maps";
import { useDispatch, useSelector } from "react-redux";
import {
  toggleFavorite,
  fetchFavorites,
  clearFavorites,
} from "../redux/slices/favoritesSlice";
import {
  addItemToOrder,
  removeItemFromOrder,
  clearCurrentOrder,
  clearOrderSlice,
  updateItemProperty,
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
import BusinessHoursModal from "../components/BusinessHoursModal";
import DishItemDetailsModal from "../components/DishItemDetailsModal";
import DishItemComponent from "../components/DishItemComponent";
import AppImage from "../components/AppImage";
import { Divider, IconButton } from "react-native-paper";
import { onGuest, onSignOut } from "../redux/slices/authSlice";
import { clearUserSlice } from "../redux/slices/userSlice";
import { clearFoodTruckProfileSlice } from "../redux/slices/foodTruckProfileSlice";
import { clearLocationSlice } from "../redux/slices/locationSlice";

const socialMediaIcons = {
  FACEBOOK: facebookIcon,
  INSTAGRAM: instagramIcon,
  TWITTER: twitterIcon,
  WEB: webIcon,
};

const { width } = Dimensions.get("window");

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

  const { isSignedIn } = useSelector((state) => state.authReducer);
  // Get favorites and loading state specific to favorite actions from Redux
  const { favorites = [], loading: favoritesActionLoading = {} } = useSelector(
    (state) => state.favoritesReducer ?? {}
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

  const menuItemRequiresOptions = (menuItem) => {
    const hasFlavors =
      menuItem?.hasFlavors &&
      ((Array.isArray(menuItem?.flavorOptions) && menuItem.flavorOptions.length > 0) ||
        (Array.isArray(menuItem?.flavors) && menuItem.flavors.length > 0));
    const hasToppings =
      menuItem?.hasToppings &&
      ((Array.isArray(menuItem?.toppingOptions) && menuItem.toppingOptions.length > 0) ||
        (Array.isArray(menuItem?.toppings) && menuItem.toppings.length > 0));

    return hasFlavors || hasToppings;
  };

  const openMenuItemOptions = (menuItem) => {
    const existingOrderItem = currentOrder.items.find(
      (orderItem) => orderItem._id === menuItem._id
    );

    setSelectedMenuItem(
      existingOrderItem
        ? {
            ...menuItem,
            selectedSubItems: existingOrderItem.selectedSubItems || [],
            customizationInput: existingOrderItem.customizationInput || "",
            selectedFlavors: existingOrderItem.selectedFlavors || [],
            selectedToppings: existingOrderItem.selectedToppings || [],
            selectedDiscountFlavors:
              existingOrderItem.selectedDiscountFlavors || [],
            selectedDiscountToppings:
              existingOrderItem.selectedDiscountToppings || [],
          }
        : menuItem
    );
    actionSheetRef.current?.show();
  };

  const handleQuickAddItem = (menuItem) => {
    if (menuItemRequiresOptions(menuItem)) {
      openMenuItemOptions(menuItem);
      return;
    }

    handleAddItem(menuItem);
  };

  useEffect(() => {
    const editItemId = route.params?.editItemId;
    if (!editItemId || menuTabs.length === 0) {
      return;
    }

    const tabIndex = menuTabs.findIndex((tab) =>
      tab.items.some((menuItem) => menuItem._id === editItemId)
    );
    if (tabIndex < 0) {
      return;
    }

    const menuItem = menuTabs[tabIndex].items.find(
      (tabItem) => tabItem._id === editItemId
    );
    setSelectedTab(tabIndex);
    tabContentRef.current?.scrollToIndex({ index: tabIndex, animated: false });
    openMenuItemOptions(menuItem);
    navigation.setParams({ editItemId: undefined });
  }, [menuTabs, navigation, route.params?.editItemId]);

  const handleSelectedSubItemsChange = useCallback(
    (selectedSubItems) => {
      if (!selectedMenuItem?._id) {
        return;
      }

      const existingItem = currentOrder.items.find(
        (orderItem) => orderItem._id === selectedMenuItem._id
      );

      if (!existingItem) {
        return;
      }

      dispatch(
        updateItemProperty({
          itemId: selectedMenuItem._id,
          keyName: "selectedSubItems",
          value: selectedSubItems,
        })
      );
    },
    [dispatch, currentOrder.items, selectedMenuItem]
  );
  
  const handleCustomizationInputChange = useCallback(
    (customizationInput) => {
      if (!selectedMenuItem?._id) {
        return;
      }

      const existingItem = currentOrder.items.find(
        (orderItem) => orderItem._id === selectedMenuItem._id
      );

      if (!existingItem) {
        return;
      }

      dispatch(
        updateItemProperty({
          itemId: selectedMenuItem._id,
          keyName: "customizationInput",
          value: customizationInput,
        })
      );
    },
    [dispatch, currentOrder.items, selectedMenuItem]
  );

  const handleSelectedFlavorsChange = useCallback(
    (selectedFlavors) => {
      if (!selectedMenuItem?._id) {
        return;
      }

      const existingItem = currentOrder.items.find(
        (orderItem) => orderItem._id === selectedMenuItem._id
      );

      if (!existingItem) {
        return;
      }

      dispatch(
        updateItemProperty({
          itemId: selectedMenuItem._id,
          keyName: "selectedFlavors",
          value: selectedFlavors,
        })
      );
    },
    [dispatch, currentOrder.items, selectedMenuItem]
  );

  const handleSelectedToppingsChange = useCallback(
    (selectedToppings) => {
      if (!selectedMenuItem?._id) {
        return;
      }

      const existingItem = currentOrder.items.find(
        (orderItem) => orderItem._id === selectedMenuItem._id
      );

      if (!existingItem) {
        return;
      }

      dispatch(
        updateItemProperty({
          itemId: selectedMenuItem._id,
          keyName: "selectedToppings",
          value: selectedToppings,
        })
      );
    },
    [dispatch, currentOrder.items, selectedMenuItem]
  );

  const handleSelectedDiscountFlavorsChange = useCallback(
    (selectedDiscountFlavors) => {
      if (!selectedMenuItem?._id) {
        return;
      }

      const existingItem = currentOrder.items.find(
        (orderItem) => orderItem._id === selectedMenuItem._id
      );

      if (!existingItem) {
        return;
      }

      dispatch(
        updateItemProperty({
          itemId: selectedMenuItem._id,
          keyName: "selectedDiscountFlavors",
          value: selectedDiscountFlavors,
        })
      );
    },
    [dispatch, currentOrder.items, selectedMenuItem]
  );

  const handleSelectedDiscountToppingsChange = useCallback(
    (selectedDiscountToppings) => {
      if (!selectedMenuItem?._id) {
        return;
      }

      const existingItem = currentOrder.items.find(
        (orderItem) => orderItem._id === selectedMenuItem._id
      );

      if (!existingItem) {
        return;
      }

      dispatch(
        updateItemProperty({
          itemId: selectedMenuItem._id,
          keyName: "selectedDiscountToppings",
          value: selectedDiscountToppings,
        })
      );
    },
    [dispatch, currentOrder.items, selectedMenuItem]
  );

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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerSide}>
            <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
          </View>
          <Text style={styles.headerTitle}>{"Details"}</Text>
          <View style={styles.headerSide} />
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
                <View style={[styles.infoRowContainer, styles.flexOne]}>
                  <View style={styles.infoRowLeft}>
                    <View style={styles.iconContainer}>
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
                        styles.statusText,
                        currentStatus === "Open Now"
                          ? styles.openStatusText
                          : styles.closedStatusText,
                      ]}
                    >
                      {currentStatus}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Location Row */}
              <View style={styles.infoRowContainer}>
                <View style={[styles.infoRowContainer, styles.flexOne]}>
                  <View style={styles.infoRowLeft}>
                    <View style={styles.iconContainer}>
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
                    <Text style={[styles.infoRowValue, styles.locationTitle]}>
                      {currentLocationInfo?.title || "Not Available Now"}
                    </Text>
                  </View>
                  {currentLocationInfo?.address && (
                    <Text
                      style={[styles.infoRowValue, styles.rightAlignedText]}
                    >
                      {currentLocationInfo?.address || ""}
                    </Text>
                  )}
                </View>
              </View>

              <Divider style={styles.divider} />

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
                      style={[styles.infoRowTitle, styles.flexWrapTitle]}
                      numberOfLines={2}
                    >
                      {"Business Hours and Pre-Order Availability"}
                    </Text>
                    <IconButton
                      icon="information"
                      size={24}
                      color={AppColor.black}
                      style={styles.infoIconButton}
                      onPress={() =>
                        businessHoursActionSheetRef.current?.show()
                      }
                    />
                  </View>
                </View>
              </View>
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

                          return (
                            <DishItemComponent
                              key={menu._id}
                              menuItem={menu}
                              quantity={quantity}
                              isLastItem={isLastItem}
                              onItemPress={(item) => {
                                const existingOrderItem =
                                  currentOrder.items.find(
                                    (orderItem) => orderItem._id === item._id
                                  );

                                const mergedItem = existingOrderItem
                                  ? {
                                      ...item,
	                                      selectedSubItems:
	                                        existingOrderItem.selectedSubItems || [],
	                                      customizationInput:
	                                        existingOrderItem.customizationInput || "",
                                      selectedFlavors:
                                        existingOrderItem.selectedFlavors || [],
                                      selectedToppings:
                                        existingOrderItem.selectedToppings || [],
                                      selectedDiscountFlavors:
                                        existingOrderItem.selectedDiscountFlavors || [],
                                      selectedDiscountToppings:
                                        existingOrderItem.selectedDiscountToppings || [],
		                                    }
	                                  : item;

                                setSelectedMenuItem(mergedItem);
                                actionSheetRef.current?.show();
                              }}
	                              onAddItem={handleQuickAddItem}
                              onRemoveItem={handleRemoveItem}
                            />
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
                onPress={() => {
                  if (isSignedIn) {
                    navigation.navigate("checkoutScreen", {
                      foodTruckId: item?._id,
                    });
                  } else {
                    // navigate to login screen
                    // navigate to login screen
                    const handleSignIn = () => {
                      dispatch(onGuest(false));
                      dispatch(clearUserSlice());
                      dispatch(clearFavorites());
                      // dispatch(clearOrderSlice());
                      dispatch(clearFoodTruckProfileSlice());
                      dispatch(clearLocationSlice());
                      dispatch(onSignOut());
                    };

                    Alert.alert(
                      "Sign In",
                      "To order food, you need to sign in.",
                      [
                        {
                          text: "Cancel",
                          style: "cancel",
                        },
                        {
                          text: "OK",
                          style: "destructive",
                          onPress: () => {
                            handleSignIn();
                          },
                        },
                      ]
                    );
                  }
                }}
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
      <DishItemDetailsModal
        actionSheetRef={actionSheetRef}
        selectedMenuItem={selectedMenuItem}
        onClose={() => setSelectedMenuItem(null)}
        handleAddItem={handleAddItem}
        handleRemoveItem={handleRemoveItem}
        getItemQuantity={getItemQuantity}
        insets={insets}
	        onSelectedSubItemsChange={handleSelectedSubItemsChange}
		        onCustomizationInputChange={handleCustomizationInputChange}
		        onSelectedFlavorsChange={handleSelectedFlavorsChange}
		        onSelectedToppingsChange={handleSelectedToppingsChange}
            onSelectedDiscountFlavorsChange={handleSelectedDiscountFlavorsChange}
            onSelectedDiscountToppingsChange={handleSelectedDiscountToppingsChange}
		      />

      {/* Business Hours and Pre-Order Availability */}
      <BusinessHoursModal
        actionSheetRef={businessHoursActionSheetRef}
        foodTruckDetail={foodTruckDetail}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColor.white,
  },
  headerSide: {
    width: "20%",
  },
  iconContainer: {
    width: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    marginVertical: 8,
  },
  flexWrapTitle: {
    flex: 1,
    flexWrap: "wrap",
  },
  infoIconButton: {
    margin: 0,
  },
  flexOne: {
    flex: 1,
  },
  statusText: {
    textAlign: "right",
    padding: 6,
    borderRadius: 4,
    marginRight: 0,
  },
  openStatusText: {
    backgroundColor: AppColor.lightGreenBG,
    color: AppColor.snackbarSuccess,
  },
  closedStatusText: {
    backgroundColor: AppColor.lightRedBG,
    color: AppColor.snackbarError,
  },
  locationTitle: {
    textAlign: "right",
    backgroundColor: "transparent",
    color: AppColor.black,
    padding: 0,
    borderRadius: 0,
    marginRight: 0,
  },
  rightAlignedText: {
    textAlign: "right",
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
});

export default FoodTruckDetailScreen;
