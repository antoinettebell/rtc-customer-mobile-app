import React, { useState, useRef, useEffect } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";
import StatusBarManager from "../components/StatusBarManager";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import FontAwesome6 from "react-native-vector-icons/FontAwesome6";
import ImageCarousel from "../components/ImageCarousel";
import AppHeader from "../components/AppHeader";
import MapView, { Marker } from "react-native-maps";
import { useDispatch, useSelector } from "react-redux";
import {
  addItemToOrder,
  removeItemFromOrder,
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

const FoodTruckDetailScreen = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { item } = route.params;
  const [selectedTab, setSelectedTab] = useState(0);
  const tabListRef = useRef();
  const tabContentRef = useRef();
  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(true);
  const [foodTruckDetail, setFoodTruckDetail] = useState(null);
  const [menuTabs, setMenuTabs] = useState([]);
  const [isScheduleVisible, setIsScheduleVisible] = useState(false);

  useEffect(() => {
    fetchFoodTruckDetails();
    fetchMenuDetails();
  }, []);

  const fetchFoodTruckDetails = async () => {
    try {
      setLoading(true);
      const response = await getFoodTruckDetailById_API(item._id);
      if (response?.success) {
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
    // Group items by category
    const categoriesMap = {};

    menuItems.forEach((item) => {
      if (!item.available) return; // Skip unavailable items

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
        originalItem: item, // Store the original item for reference
      });
    });

    // Convert to array and set state
    const tabs = Object.values(categoriesMap);
    setMenuTabs(tabs);
  };

  const currentLocationInfo = getLocationInfo(
    foodTruckDetail?.currentLocation,
    foodTruckDetail?.locations
  );

  const todaysHours = getTodaysAvailability(foodTruckDetail?.availability);

  const currentStatus = getCurrentStatus(foodTruckDetail?.availability);

  const INFO_ROWS = [
    {
      icon: (
        <FontAwesome6 name="location-dot" size={20} color={AppColor.primary} />
      ),
      title: "Truck Location",
      value: currentLocationInfo?.title || "Not Available",
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

  const currentOrder = useSelector((state) => state.orderReducer.currentOrder);

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
    dispatch(
      addItemToOrder({
        foodTruckId: item._id,
        foodTruckName: item.name,
        item: {
          id: menuItem.id,
          name: menuItem.name,
          desc: menuItem.desc,
          price: parseFloat(menuItem.price.replace("$", "")),
          img: menuItem.img,
          originalItem: menuItem.originalItem,
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager barStyle="dark-content" />
      <AppHeader headerTitle="DETAILS" />
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
          <View
            style={{
              alignItems: "center",
              justifyContent: "space-between",
              flexDirection: "row",
            }}
          >
            <TouchableOpacity
              style={styles.ratingsRow}
              activeOpacity={0.7}
              onPress={() => navigation.navigate("rateReviewScreen")}
            >
              <FontAwesome name="star" size={16} color={AppColor.ratingStar} />
              <Text style={styles.ratingText}>4.8 (200+ reviews)</Text>
              <Text style={styles.dot}>|</Text>
              <Text style={styles.cuisineText}>
                {formatCuisines(foodTruckDetail?.cuisine)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <FontAwesome name="heart-o" size={22} color={AppColor.red} />
            </TouchableOpacity>
          </View>
          {/* Social Media Icons */}
          <View style={styles.socialRow}>
            {foodTruckDetail?.socialMedia?.map((social, index) => {
              const iconSource = socialMediaIcons[social.mediaType];
              if (!iconSource) return null;

              return (
                <TouchableOpacity
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
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>CURRENT LOCATION</Text>
            {/* <TouchableOpacity
              style={styles.getDirectionBtn}
              onPress={() => {
                // Open maps with direction
                const url = `https://www.google.com/maps/dir/?api=1&destination=${truckLocation.latitude},${truckLocation.longitude}`;
                if (Platform.OS === "web") {
                  window.open(url, "_blank");
                } else {
                  // Use Linking for mobile
                  import("react-native").then(({ Linking }) =>
                    Linking.openURL(url)
                  );
                }
              }}
            > */}
            <Text style={styles.getDirectionBtn}>Get Direction</Text>
            {/* </TouchableOpacity> */}
          </View>
          <View style={styles.mapViewWrap}>
            {truckLocation ? (
              <MapView
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

        {/* Dynamic Tabs (swipeable & tappable) */}
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
              contentContainerStyle={{ backgroundColor: "red" }}
              onMomentumScrollEnd={handleTabContentScroll}
              getItemLayout={(_, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
              renderItem={({ item: tab }) => (
                <View
                  style={{
                    width,
                    backgroundColor: AppColor.white,
                  }}
                >
                  {tab.items.length === 0 ? (
                    <Text style={styles.noMenuText}>
                      No items available in this section.
                    </Text>
                  ) : (
                    tab?.items?.map((menu, index) => {
                      const quantity = getItemQuantity(menu.id);
                      const isLastItem = index === tab?.item?.length - 1;
                      return (
                        <View
                          key={menu.id}
                          style={[
                            styles.menuItemRow,
                            !isLastItem && {
                              borderBottomWidth: 1,
                              borderBottomColor: AppColor.borderColor,
                            },
                          ]}
                        >
                          {menu.img ? (
                            <Image source={menu.img} style={styles.menuImg} />
                          ) : (
                            <View style={styles.menuImgPlaceholder} />
                          )}
                          <View style={{ flex: 1, marginLeft: 10, gap: 6 }}>
                            <Text style={styles.menuTitle}>{menu.name}</Text>
                            <Text style={styles.menuDesc}>{menu.desc}</Text>
                            <Text style={styles.menuPrice}>{menu.price}</Text>
                          </View>
                          {quantity === 0 ? (
                            <TouchableOpacity
                              style={styles.addButton}
                              onPress={() => handleAddItem(menu)}
                            >
                              <Text style={styles.addButtonText}>Add</Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.quantityContainer}>
                              <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={() => handleRemoveItem(menu)}
                              >
                                {quantity === 1 ? (
                                  <MaterialIcons
                                    name="delete-outline"
                                    size={20}
                                    color={AppColor.primary}
                                  />
                                ) : (
                                  <Text style={styles.quantityButtonText}>
                                    -
                                  </Text>
                                )}
                              </TouchableOpacity>
                              <Text style={styles.quantityText}>
                                {quantity}
                              </Text>
                              <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={() => handleAddItem(menu)}
                              >
                                <Text style={styles.quantityButtonText}>+</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                          <View
                            style={{ backgroundColor: "green", height: 10 }}
                          />
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
      {/* Bottom Bar */}
      {currentOrder.totalItems > 0 && (
        <View
          style={[
            styles.bottomBar,
            {
              paddingBottom: insets.bottom || 12,
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.bottomBarBtn}
            onPress={() =>
              navigation.navigate("checkoutScreen", { order: currentOrder })
            }
          >
            <Text style={styles.bottomBarText}>
              {currentOrder.totalItems}{" "}
              {currentOrder.totalItems === 1 ? "ITEM" : "ITEMS"} ADDED
            </Text>
            <Text style={styles.bottomBarSubText}>View your order-list</Text>
          </TouchableOpacity>
        </View>
      )}
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
    fontFamily: Primary400,
    fontSize: 18,
    color: AppColor.text,
  },
  subname: {
    fontFamily: Secondary400,
    fontSize: 14,
  },
  ratingsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontFamily: Secondary400,
    fontSize: 14,
    color: AppColor.textHighlighter,
  },
  dot: {
    color: AppColor.textHighlighter,
    marginHorizontal: 4,
  },
  cuisineText: {
    fontFamily: Secondary400,
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
    fontFamily: Primary400,
    fontSize: 18,
  },
  getDirectionBtn: {
    backgroundColor: "#FC7B0338",
    color: AppColor.primary,
    borderRadius: 8,
    padding: 6,
    fontFamily: Secondary400,
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
    fontFamily: Secondary400,
    fontSize: 16,
  },
  infoRowValue: {
    fontFamily: Secondary400,
    fontSize: 14,
  },
  tabsWrap: {
    // paddingHorizontal: 16,
    backgroundColor: AppColor.white,
  },
  tabsRow: {
    flexDirection: "row",
    borderBlockColor: AppColor.borderColor,
    borderBottomWidth: 1,
    flex: 1,
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
    fontFamily: Secondary400,
    fontSize: 16,
  },
  tabTextActive: {
    color: AppColor.primary,
  },
  menuItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
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
  menuTitle: {
    fontFamily: Primary400,
    fontSize: 16,
  },
  menuDesc: {
    fontFamily: Secondary400,
    fontSize: 14,
  },
  menuPrice: {
    fontFamily: Primary400,
    fontSize: 14,
    color: AppColor.primary,
  },
  addButton: {
    backgroundColor: AppColor.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: AppColor.white,
    fontFamily: Primary400,
    fontSize: 14,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  quantityButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  quantityButtonText: {
    fontFamily: Primary400,
    fontSize: 18,
    color: AppColor.primary,
  },
  quantityText: {
    fontFamily: Primary400,
    fontSize: 15,
    color: AppColor.text,
    marginHorizontal: 4,
  },
  bottomBar: {
    backgroundColor: AppColor.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: 4,
  },
  bottomBarBtn: {
    alignItems: "center",
  },
  bottomBarText: {
    fontFamily: Primary400,
    fontSize: 17,
    color: AppColor.white,
    letterSpacing: 1,
  },
  bottomBarSubText: {
    fontFamily: Secondary400,
    fontSize: 13,
    color: AppColor.white,
    marginTop: 2,
  },
  noMenuText: {
    fontFamily: Secondary400,
    fontSize: 15,
    color: AppColor.textHighlighter,
    marginHorizontal: 16,
    marginTop: 10,
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
    backgroundColor: "#E5E5EA",
  },
});

export default FoodTruckDetailScreen;
