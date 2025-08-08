import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  Keyboard,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor, Mulish700, Mulish400, Mulish600 } from "../utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { getNearbyFoodTrucks_API } from "../apiFolder/appAPI";
import { useFocusEffect } from "@react-navigation/native";
import Carousel from "react-native-reanimated-carousel";
import { useSharedValue } from "react-native-reanimated";
import FastImage from "@d11/react-native-fast-image";
import AppImage from "../components/AppImage";
import ActionSheet, { ScrollView } from "react-native-actions-sheet";
import { setDefaultLocation } from "../redux/slices/locationSlice";
import { Divider, RadioButton } from "react-native-paper";

const LocationPinWhite = require("../assets/images/locationPinWhite.png");
const { width, height } = Dimensions.get("window");

// Set up geolocation for navigator
navigator.geolocation = require("@react-native-community/geolocation");

const initialRegion = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const NearMeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const mapRef = useRef(null);
  const carouselRef = useRef(null);
  const actionSheetRef = useRef(null);
  const animatedKeyboardHeight = useRef(new Animated.Value(0)).current;
  const progress = useSharedValue(0);

  const { isSignedIn } = useSelector((state) => state.authReducer);
  const { defaultLocation, allLocations } = useSelector(
    (state) => state.locationReducer
  );

  // State management
  const [region, setRegion] = useState(initialRegion);
  const [foodTrucks, setFoodTrucks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [filteredTrucks, setFilteredTrucks] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [tempSelectedLocation, setTempSelectedLocation] =
    useState(defaultLocation);

  const fetchNearByFoodTrucks = async () => {
    if (!defaultLocation) return; // Don't fetch if no location is set
    try {
      setIsLoading(true);

      setRegion({
        latitude: parseFloat(defaultLocation.lat),
        longitude: parseFloat(defaultLocation.long),
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });

      const params = {
        page: 1,
        limit: 100,
        distanceInMeters: 32186.9, // 20 miles in meters
        userLat: defaultLocation?.lat || 0,
        userLong: defaultLocation?.long || 0,
      };

      const response = await getNearbyFoodTrucks_API(params);
      console.log("response => ", response);
      if (response?.success && response?.data) {
        const trucks = response?.data?.foodtruckList;
        setFoodTrucks(trucks);
        setFilteredTrucks(trucks);

        // Set first truck as selected by default
        if (trucks.length > 0) {
          setSelectedIndex(0);

          // Center map on first truck
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.animateToRegion(
                {
                  latitude: parseFloat(trucks[0].location.lat),
                  longitude: parseFloat(trucks[0].location.long),
                  latitudeDelta: region.latitudeDelta,
                  longitudeDelta: region.longitudeDelta,
                },
                1000
              );
            }

            // Scroll carousel to first item
            if (carouselRef.current) {
              carouselRef.current.scrollTo({ index: 0, animated: true });
            }
          }, 500);
        }
      }
    } catch (error) {
      console.error("Error fetching food trucks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const scrollCarouselToIndex = (index) => {
    if (carouselRef.current && index >= 0) {
      carouselRef.current.scrollTo({ index, animated: true });
    }
  };

  const handleMarkerPress = (truck) => {
    try {
      if (!truck) return;

      const index = filteredTrucks.findIndex((t) => t._id === truck._id);
      if (index === -1) return;

      setSelectedIndex(index); // This will trigger the useEffect
      scrollCarouselToIndex(index);
    } catch (error) {
      console.log("Error in handleMarkerPress:", error);
    }
  };

  const renderHorizontalTruckCard = useCallback(
    ({ item }) => {
      return (
        <Pressable
          key={item._id}
          style={styles.horizontalCard}
          onPress={() => navigation.navigate("foodTruckDetailScreen", { item })}
        >
          <View style={styles.cardImageContainer}>
            <AppImage
              uri={item.logo}
              containerStyle={styles.horizontalCardImage}
            />
          </View>

          <View style={styles.horizontalCardContent}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Text
                style={[styles.horizontalCardName, { maxWidth: "70%" }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text style={styles.statusBadgeText}>
                {`(${item?.currentLocation ? " Open " : " Closed "})`}
              </Text>
            </View>
            <View style={styles.horizontalCardDetails}>
              <View style={styles.ratingContainer}>
                <MaterialIcons name="star" size={16} color={AppColor.text} />
                <Text
                  style={styles.horizontalRatingText}
                >{`${item.avgRate} (${item.totalReviews} reviews)`}</Text>
              </View>
              <Text style={styles.horizontalDistanceText}>
                {(item?.distanceInMeters * 0.000621371).toFixed(2) +
                  " miles away" || "0 miles away"}
              </Text>
            </View>
          </View>
        </Pressable>
      );
    },
    [selectedIndex]
  );

  // Modify the Carousel component props to update selectedIndex
  const onSnapToItem = (index) => {
    setSelectedIndex(index);
  };

  const handleLocationTextPress = () => {
    // If user is a guest OR a signed-in user with no addresses, navigate to the map screen.
    if (!isSignedIn || (isSignedIn && allLocations.length === 0)) {
      navigation.navigate("authMapScreen", { mode: "add" });
    } else {
      // Otherwise, for a signed-in user with addresses, show the selection modal.
      actionSheetRef.current?.show();
      setTempSelectedLocation(defaultLocation);
    }
  };

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery.trim() === "") {
      setFilteredTrucks(foodTrucks);
    } else {
      const query = debouncedQuery.toLowerCase();
      const filtered = foodTrucks.filter((truck) => {
        const nameMatch = truck.name.toLowerCase().includes(query);
        const cuisineMatch = truck.cuisine?.some((cuisine) =>
          cuisine.name.toLowerCase().includes(query)
        );
        return nameMatch || cuisineMatch;
      });
      setFilteredTrucks(filtered);
    }
  }, [debouncedQuery, foodTrucks]);

  // Add this effect to sync map with carousel changes
  useEffect(() => {
    const syncMapWithCarousel = () => {
      if (selectedIndex >= 0 && filteredTrucks.length > 0) {
        const truck = filteredTrucks[selectedIndex];
        if (truck && mapRef.current) {
          mapRef.current.animateToRegion(
            {
              latitude: parseFloat(truck.location.lat),
              longitude: parseFloat(truck.location.long),
              latitudeDelta: region.latitudeDelta,
              longitudeDelta: region.longitudeDelta,
            },
            500
          );
        }
      }
    };

    syncMapWithCarousel();
  }, [selectedIndex, filteredTrucks]);

  useEffect(() => {
    fetchNearByFoodTrucks();
  }, [defaultLocation]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", (e) => {
      const newKeyboardHeight = e.endCoordinates.height - (insets.bottom + 60);
      setKeyboardHeight(newKeyboardHeight);
      Animated.timing(animatedKeyboardHeight, {
        toValue: newKeyboardHeight,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
      Animated.timing(animatedKeyboardHeight, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [insets.bottom, animatedKeyboardHeight]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBarManager />
        <ActivityIndicator size="large" color={AppColor.primary} />
        <Text style={styles.loadingText}>Finding nearby food trucks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBarManager />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleLocationTextPress}
          style={styles.locationContainer}
        >
          <Ionicons name="location-sharp" size={30} color={AppColor.primary} />
          <View style={{ flex: 1 }}>
            <View style={styles.locationRow}>
              <Text style={styles.locationTitle} numberOfLines={1}>
                {defaultLocation?.title || "NA"}
              </Text>
              <MaterialIcons
                name="keyboard-arrow-down"
                size={18}
                color={AppColor.primary}
              />
            </View>
            <Text style={styles.locationSubtitle} numberOfLines={1}>
              {defaultLocation?.address || "Please select a location"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons
          name="search"
          size={20}
          color={AppColor.textPlaceholder}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search food trucks or cuisine..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor={AppColor.textPlaceholder}
          returnKeyType="search"
          returnKeyLabel="Search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleSearch("")}
            style={styles.clearButton}
          >
            <MaterialIcons
              name="clear"
              size={20}
              color={AppColor.textPlaceholder}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation={false}
          showsMyLocationButton={false}
          loadingEnabled={true}
        >
          {/* <Marker
            coordinate={{
              latitude: parseFloat(defaultLocation?.lat) || 0,
              longitude: parseFloat(defaultLocation?.long) || 0,
            }}
          >
            <View key={"static_user_pin"}>
              <MaterialIcons
                name="location-history"
                size={40}
                color={AppColor.white}
                style={{ backgroundColor: AppColor.primary, borderRadius: 5 }}
              />
            </View>
          </Marker> */}
          <Marker
            coordinate={{
              latitude: parseFloat(defaultLocation?.lat) || 0,
              longitude: parseFloat(defaultLocation?.long) || 0,
            }}
          />
          {filteredTrucks.map((truck, index) => {
            const isSameLocationAsUser =
              parseFloat(truck.location.lat) ===
                parseFloat(defaultLocation?.lat) &&
              parseFloat(truck.location.long) ===
                parseFloat(defaultLocation?.long);

            const truckLongitude = isSameLocationAsUser
              ? parseFloat(truck.location.long) + 0.00001 // Add a small offset to avoid marker flicker
              : parseFloat(truck.location.long);

            return (
              <Marker
                key={truck._id}
                coordinate={{
                  latitude: parseFloat(truck.location.lat),
                  longitude: truckLongitude,
                }}
                onPress={() => handleMarkerPress(truck)}
              >
                <MaterialIcons
                  name="location-pin"
                  size={40}
                  color={AppColor.primary}
                />
              </Marker>
            );
          })}
        </MapView>
      </View>

      {/* Horizontal Food Trucks List */}
      {filteredTrucks.length > 0 && (
        <Animated.View
          style={[
            styles.horizontalListContainer,
            {
              bottom: animatedKeyboardHeight,
            },
          ]}
        >
          <Carousel
            ref={carouselRef}
            mode="parallax"
            modeConfig={{
              parallaxScrollingScale: 0.9,
              parallaxAdjacentItemScale: 0.62,
            }}
            width={width}
            data={filteredTrucks}
            onProgressChange={progress}
            renderItem={renderHorizontalTruckCard}
            loop={false}
            autoPlay={false}
            scrollAnimationDuration={500}
            onSnapToItem={onSnapToItem}
          />
        </Animated.View>
      )}

      {/* No Results Message */}
      {filteredTrucks.length === 0 && searchQuery && !isLoading && (
        <Animated.View
          style={[
            styles.noResultsContainer,
            {
              bottom: Animated.add(10, animatedKeyboardHeight),
            },
          ]}
        >
          <MaterialIcons
            name="search-off"
            size={48}
            color={AppColor.textPlaceholder}
          />
          <Text style={styles.noResultsText}>
            No food trucks found matching your search
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.clearSearchButton}
            onPress={() => handleSearch("")}
          >
            <Text style={styles.clearSearchText}>Clear Search</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <ActionSheet ref={actionSheetRef} gestureEnabled={true}>
        <View
          style={{
            maxHeight: height - insets.top - insets.bottom - 10,
            paddingVertical: 10,
            paddingHorizontal: 20,
          }}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderText}>{"Select a Location"}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                actionSheetRef.current?.hide();
                navigation.navigate("authMapScreen", { mode: "add" });
              }}
            >
              <MaterialIcons name="add" size={28} color={AppColor.primary} />
            </TouchableOpacity>
          </View>

          <Divider style={{ marginTop: 16 }} />

          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            {allLocations?.map((item) => (
              <TouchableOpacity
                key={item?._id}
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
                    <Text style={styles.locationModalAddress}>
                      {item.address}
                    </Text>
                  </View>
                  <RadioButton.Android
                    value={item._id}
                    status={
                      tempSelectedLocation?._id === item._id
                        ? "checked"
                        : "unchecked"
                    }
                    onPress={() => setTempSelectedLocation(item)}
                    color={AppColor.primary}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Divider style={{ marginBottom: 6 }} />

          <View
            style={[
              styles.bottomButtonContainer,
              { paddingBottom: insets.bottom },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => actionSheetRef.current?.hide()}
            >
              <Text style={styles.cancelButtonText}>{"Cancel"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.modalButton, styles.selectButton]}
              onPress={() => {
                dispatch(setDefaultLocation(tempSelectedLocation));
                actionSheetRef.current?.hide();
              }}
            >
              <Text style={styles.selectButtonText}>{"Select Location"}</Text>
            </TouchableOpacity>
          </View>
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
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontFamily: Mulish400,
    fontSize: 16,
    color: AppColor.text,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColor.border,
    backgroundColor: AppColor.white,
  },
  headerTitle: {
    fontFamily: Mulish700,
    fontSize: 18,
    color: AppColor.text,
  },
  locationContainer: {
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
    color: AppColor.primary,
    fontFamily: Mulish400,
    fontSize: 20,
  },
  locationSubtitle: {
    fontFamily: Mulish400,
    fontSize: 14,
    color: AppColor.primary,
    maxWidth: "95%",
  },
  iconImage: {
    height: 37,
    width: 37,
    resizeMode: "contain",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColor.inputBackground || "#F5F5F5",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    // paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: AppColor.border,
  },
  searchInput: {
    flex: 1,
    height: 46,
    marginLeft: 12,
    paddingVertical: 0,
    fontSize: 14,
    fontFamily: Mulish400,
    color: AppColor.text,
  },
  clearButton: {
    padding: 4,
  },
  mapContainer: {
    flex: 1,
    // position: "relative",
  },
  map: {
    flex: 1,
  },
  marker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedMarker: {
    transform: [{ scale: 2 }],
  },
  myLocationButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: AppColor.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: AppColor.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  listToggleButton: {
    position: "absolute",
    bottom: 80,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: AppColor.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: AppColor.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  filterButton: {
    position: "absolute",
    bottom: 80,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: AppColor.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: AppColor.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  selectedTruckContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 80,
    backgroundColor: AppColor.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: AppColor.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 1,
  },
  selectedTruckContent: {
    flexDirection: "row",
    marginBottom: 12,
  },
  selectedTruckImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  selectedTruckInfo: {
    flex: 1,
  },
  selectedTruckName: {
    fontFamily: Mulish700,
    fontSize: 16,
    fontWeight: "600",
    color: AppColor.text,
    marginBottom: 4,
  },
  selectedTruckCuisine: {
    fontFamily: Mulish400,
    fontSize: 14,
    color: AppColor.textSecondary,
    marginBottom: 8,
  },
  selectedTruckDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewMenuButton: {
    backgroundColor: AppColor.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  viewMenuText: {
    color: AppColor.white,
    fontFamily: Mulish400,
    fontSize: 14,
    fontWeight: "600",
  },
  trucksListContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: AppColor.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.6,
    shadowColor: AppColor.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: AppColor.border,
  },
  listHeaderText: {
    fontFamily: Mulish700,
    fontSize: 18,
    fontWeight: "600",
    color: AppColor.text,
  },
  listContent: {
    paddingBottom: 20,
  },
  truckCard: {
    flexDirection: "row",
    backgroundColor: AppColor.white,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: AppColor.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: AppColor.border,
  },
  truckImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  truckInfo: {
    flex: 1,
  },
  truckHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  truckName: {
    fontFamily: Mulish700,
    fontSize: 16,
    fontWeight: "600",
    color: AppColor.text,
    flex: 1,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontFamily: Mulish400,
    fontSize: 12,
    fontWeight: "500",
  },
  truckCuisine: {
    fontFamily: Mulish400,
    fontSize: 14,
    color: AppColor.textSecondary,
    marginBottom: 8,
  },
  truckDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  ratingText: {
    fontFamily: Mulish400,
    fontSize: 14,
    color: AppColor.text,
    marginLeft: 4,
  },
  distanceText: {
    fontFamily: Mulish400,
    fontSize: 12,
    color: AppColor.textSecondary,
    // marginRight: 16,
  },
  timeText: {
    fontFamily: Mulish400,
    fontSize: 12,
    color: AppColor.textSecondary,
  },
  priceRange: {
    fontFamily: Mulish400,
    fontSize: 14,
    color: AppColor.primary,
    fontWeight: "600",
  },
  // Horizontal List Styles
  horizontalListContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  horizontalListContent: {
    paddingHorizontal: 20,
  },
  horizontalCard: {
    backgroundColor: AppColor.white,
    borderRadius: 16,
    marginHorizontal: 8,
    padding: 16,
    shadowColor: AppColor.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedHorizontalCard: {
    borderColor: AppColor.primary,
    // transform: [{ scale: 1.02 }],
  },
  cardImageContainer: {
    // position: "relative",
    alignItems: "center",
    marginBottom: 12,
  },
  horizontalCardImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: AppColor.border,
  },
  statusBadge: {
    // position: "absolute",
    // top: -5,
    // right: width / 2 - 60,
    paddingHorizontal: 8,
    paddingVertical: 2,
    // borderRadius: 10,
  },
  statusBadgeText: {
    color: AppColor.primary,
    fontSize: 10,
    fontFamily: Mulish600,
  },
  horizontalCardContent: {
    alignItems: "center",
    gap: 4,
  },
  horizontalCardName: {
    fontFamily: Mulish700,
    fontSize: 16,
    fontWeight: "600",
    color: AppColor.text,
    textAlign: "center",
  },
  horizontalCardCuisine: {
    fontFamily: Mulish400,
    fontSize: 12,
    color: AppColor.textSecondary,
    textAlign: "center",
    marginBottom: 8,
  },
  horizontalCardDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  horizontalRatingText: {
    fontFamily: Mulish400,
    fontSize: 12,
    color: AppColor.text,
    marginLeft: 2,
    // marginRight: 12,
  },
  horizontalDistanceText: {
    fontFamily: Mulish400,
    fontSize: 12,
    color: AppColor.textSecondary,
  },
  horizontalCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  horizontalTimeText: {
    fontFamily: Mulish400,
    fontSize: 11,
    color: AppColor.textSecondary,
  },
  horizontalPriceText: {
    fontFamily: Mulish400,
    fontSize: 12,
    color: AppColor.primary,
    fontWeight: "600",
  },
  // No Results Styles
  noResultsContainer: {
    position: "absolute",
    bottom: 10,
    left: 20,
    right: 20,
    backgroundColor: AppColor.white,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: AppColor.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  noResultsText: {
    fontFamily: Mulish400,
    fontSize: 16,
    color: AppColor.textSecondary,
    textAlign: "center",
    marginVertical: 12,
  },
  clearSearchButton: {
    backgroundColor: AppColor.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  clearSearchText: {
    color: AppColor.white,
    fontFamily: Mulish400,
    fontSize: 14,
    fontWeight: "600",
  },

  // Action sheet
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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

export default NearMeScreen;
