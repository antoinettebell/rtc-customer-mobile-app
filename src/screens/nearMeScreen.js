import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  FlatList,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import Geolocation from "@react-native-community/geolocation";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import usePermission from "../hooks/usePermission";
import { permission } from "../helpers/permission.helper";
import { RESULTS } from "react-native-permissions";
import Config from "react-native-config";

const { width, height } = Dimensions.get("window");
const GOOGLE_MAP_API_KEY = Config.GOOGLE_MAP_API_KEY;

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
  const mapRef = useRef(null);

  // Permission hook
  const { checkAndRequestPermission: locationPermissionStatus } = usePermission(
    permission.location
  );

  // State management
  const [currentLocation, setCurrentLocation] = useState(null);
  const [region, setRegion] = useState(initialRegion);
  const [foodTrucks, setFoodTrucks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [filteredTrucks, setFilteredTrucks] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const flatListRef = useRef(null);
  const doNotShowAsOfNow = true;
  // Mock data for food trucks (replace with actual API data)
  const mockFoodTrucks = [
    {
      id: "1",
      name: "BURGER EXPRESS",
      cuisine: "American Burgers",
      rating: 4.5,
      distance: "0.5 km",
      image: require("../assets/images/FT-Demo-01.png"),
      latitude: 37.78925,
      longitude: -122.4314,
      isOpen: true,
      estimatedTime: "15-20 min",
      priceRange: "$$",
    },
    {
      id: "2",
      name: "TACO FIESTA",
      cuisine: "Mexican Tacos",
      rating: 4.2,
      distance: "0.8 km",
      image: require("../assets/images/FT-Demo-01.png"),
      latitude: 37.78725,
      longitude: -122.4334,
      isOpen: true,
      estimatedTime: "10-15 min",
      priceRange: "$",
    },
    {
      id: "3",
      name: "PIZZA ON WHEELS",
      cuisine: "Italian Pizza",
      rating: 4.7,
      distance: "1.2 km",
      image: require("../assets/images/FT-Demo-01.png"),
      latitude: 37.79025,
      longitude: -122.4294,
      isOpen: false,
      estimatedTime: "20-25 min",
      priceRange: "$$",
    },
    {
      id: "4",
      name: "ASIAN FUSION",
      cuisine: "Asian Noodles",
      rating: 4.3,
      distance: "1.5 km",
      image: require("../assets/images/FT-Demo-01.png"),
      latitude: 37.78625,
      longitude: -122.4354,
      isOpen: true,
      estimatedTime: "12-18 min",
      priceRange: "$$",
    },
    {
      id: "5",
      name: "SWEET TREATS",
      cuisine: "Desserts & Ice Cream",
      rating: 4.6,
      distance: "0.3 km",
      image: require("../assets/images/FT-Demo-01.png"),
      latitude: 37.78975,
      longitude: -122.4304,
      isOpen: true,
      estimatedTime: "5-10 min",
      priceRange: "$",
    },
  ];

  // Initialize component
  useEffect(() => {
    initializeScreen();
  }, []);

  // Filter trucks based on search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredTrucks(foodTrucks);
    } else {
      const filtered = foodTrucks.filter(
        (truck) =>
          truck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          truck.cuisine.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTrucks(filtered);
    }
  }, [searchQuery, foodTrucks]);

  const initializeScreen = async () => {
    try {
      setIsLoading(true);

      // Load mock data
      setFoodTrucks(mockFoodTrucks);
      setFilteredTrucks(mockFoodTrucks);

      // Get user location
      await getCurrentLocation();
    } catch (error) {
      console.error("Initialize screen error:", error);
      Alert.alert(
        "Error",
        "Failed to initialize the screen. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setIsLocationLoading(true);

      const permissionResult = await locationPermissionStatus();

      if (permissionResult !== RESULTS.GRANTED) {
        Alert.alert(
          "Location Permission",
          "Please enable location permission to find nearby food trucks.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Settings", onPress: () => openSettings() },
          ]
        );
        return;
      }

      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newRegion = {
            latitude,
            longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          };

          setCurrentLocation({ latitude, longitude });
          setRegion(newRegion);

          // Animate to user location
          if (mapRef.current) {
            mapRef.current.animateToRegion(newRegion, 1000);
          }
        },
        (error) => {
          console.error("Location error:", error);
          Alert.alert(
            "Location Error",
            "Unable to get your current location. Using default location."
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    } catch (error) {
      console.error("Get location error:", error);
    } finally {
      setIsLocationLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const handleTruckPress = (truck, index) => {
    setSelectedTruck(truck);
    setSelectedIndex(index);

    // Animate to truck location
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: truck.latitude,
          longitude: truck.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        1000
      );
    }

    // Scroll to the corresponding card in horizontal list
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index,
        animated: true,
      });
    }
  };

  const handleMarkerPress = (truck) => {
    const index = filteredTrucks.findIndex((t) => t.id === truck.id);
    if (index !== -1) {
      setSelectedTruck(truck);
      setSelectedIndex(index);

      // Scroll to the corresponding card
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index,
          animated: true,
        });
      }
    }
  };

  const handleCardScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const cardWidth = width - 80; // Card width + margins
    const currentIndex = Math.round(contentOffset / cardWidth);

    if (
      currentIndex !== selectedIndex &&
      currentIndex < filteredTrucks.length
    ) {
      const truck = filteredTrucks[currentIndex];
      setSelectedIndex(currentIndex);
      setSelectedTruck(truck);

      // Animate to truck location
      if (mapRef.current && truck) {
        mapRef.current.animateToRegion(
          {
            latitude: truck.latitude,
            longitude: truck.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          },
          1000
        );
      }
    }
  };

  const handleMyLocationPress = () => {
    getCurrentLocation();
  };

  const handleListToggle = () => {
    // Toggle functionality can be removed or repurposed
    // Since we're now using horizontal swiper
  };

  const renderHorizontalTruckCard = ({ item, index }) => {
    const isSelected = selectedIndex === index;

    return (
      <TouchableOpacity
        style={[
          styles.horizontalCard,
          isSelected && styles.selectedHorizontalCard,
        ]}
        onPress={() => handleTruckPress(item, index)}
        activeOpacity={0.9}
      >
        <View style={styles.cardImageContainer}>
          <Image source={item.image} style={styles.horizontalCardImage} />
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: item.isOpen ? "#4CAF50" : "#FF5722" },
            ]}
          >
            <Text style={styles.statusBadgeText}>
              {item.isOpen ? "OPEN" : "CLOSED"}
            </Text>
          </View>
        </View>

        <View style={styles.horizontalCardContent}>
          <Text style={styles.horizontalCardName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.horizontalCardCuisine} numberOfLines={1}>
            {item.cuisine}
          </Text>

          <View style={styles.horizontalCardDetails}>
            <View style={styles.ratingContainer}>
              <MaterialIcons name="star" size={14} color="#FFD700" />
              <Text style={styles.horizontalRatingText}>{item.rating}</Text>
            </View>
            <Text style={styles.horizontalDistanceText}>{item.distance}</Text>
          </View>

          <View style={styles.horizontalCardFooter}>
            <Text style={styles.horizontalTimeText}>{item.estimatedTime}</Text>
            <Text style={styles.horizontalPriceText}>{item.priceRange}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSelectedTruckInfo = () => {
    if (!selectedTruck) return null;

    return (
      <View style={styles.selectedTruckContainer}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setSelectedTruck(null)}
        >
          <MaterialIcons name="close" size={20} color={AppColor.text} />
        </TouchableOpacity>

        <View style={styles.selectedTruckContent}>
          <Image
            source={selectedTruck.image}
            style={styles.selectedTruckImage}
          />
          <View style={styles.selectedTruckInfo}>
            <Text style={styles.selectedTruckName}>{selectedTruck.name}</Text>
            <Text style={styles.selectedTruckCuisine}>
              {selectedTruck.cuisine}
            </Text>

            <View style={styles.selectedTruckDetails}>
              <View style={styles.ratingContainer}>
                <MaterialIcons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>{selectedTruck.rating}</Text>
              </View>
              <Text style={styles.distanceText}>{selectedTruck.distance}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.viewMenuButton}
          onPress={() => {
            // Navigate to truck details/menu
            navigation.navigate("TruckDetails", { truck: selectedTruck });
          }}
        >
          <Text style={styles.viewMenuText}>View Menu</Text>
        </TouchableOpacity>
      </View>
    );
  };

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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NEAR BY FOOD TRUCKS</Text>
      </View>
      {!doNotShowAsOfNow ? (
        <>
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
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
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
              showsUserLocation={true}
              showsMyLocationButton={false}
              loadingEnabled={true}
            >
              {filteredTrucks.map((truck) => (
                <Marker
                  key={truck.id}
                  coordinate={{
                    latitude: truck.latitude,
                    longitude: truck.longitude,
                  }}
                  onPress={() => handleMarkerPress(truck)}
                >
                  <View
                    style={[
                      styles.marker,
                      selectedTruck?.id === truck.id && styles.selectedMarker,
                    ]}
                  >
                    <Ionicons
                      name="location"
                      size={16}
                      color={AppColor.primary}
                    />

                    {/* HERE */}
                  </View>
                </Marker>
              ))}
            </MapView>

            {/* Map Controls */}
            <TouchableOpacity
              style={styles.myLocationButton}
              onPress={handleMyLocationPress}
              disabled={isLocationLoading}
            >
              {isLocationLoading ? (
                <ActivityIndicator size="small" color={AppColor.primary} />
              ) : (
                <MaterialIcons
                  name="my-location"
                  size={24}
                  color={AppColor.primary}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => {
                // You can implement filter functionality here
                Alert.alert("Filter", "Filter functionality can be added here");
              }}
            >
              <MaterialIcons name="tune" size={24} color={AppColor.primary} />
            </TouchableOpacity>

            {/* Selected Truck Info */}
            {/* {selectedTruck && renderSelectedTruckInfo()} */}
          </View>

          {/* Horizontal Food Trucks List */}
          {filteredTrucks.length > 0 && (
            <View style={styles.horizontalListContainer}>
              <FlatList
                ref={flatListRef}
                data={filteredTrucks}
                renderItem={renderHorizontalTruckCard}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalListContent}
                snapToInterval={width - 80} // Card width + margins
                snapToAlignment="start"
                decelerationRate="fast"
                onMomentumScrollEnd={handleCardScroll}
                getItemLayout={(data, index) => ({
                  length: width - 80,
                  offset: (width - 80) * index,
                  index,
                })}
              />
            </View>
          )}

          {/* No Results Message */}
          {filteredTrucks.length === 0 && !isLoading && (
            <View style={styles.noResultsContainer}>
              <MaterialIcons
                name="search-off"
                size={48}
                color={AppColor.textPlaceholder}
              />
              <Text style={styles.noResultsText}>
                No food trucks found matching your search
              </Text>
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => handleSearch("")}
              >
                <Text style={styles.clearSearchText}>Clear Search</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : null}
      {/* Bottom Navigation would go here */}
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
    fontFamily: Secondary400,
    fontSize: 16,
    color: AppColor.text,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: AppColor.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColor.border,
  },
  headerTitle: {
    fontFamily: Primary400,
    fontSize: 18,
    fontWeight: "600",
    color: AppColor.text,
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColor.inputBackground || "#F5F5F5",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: AppColor.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontFamily: Secondary400,
    fontSize: 16,
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
    fontFamily: Primary400,
    fontSize: 16,
    fontWeight: "600",
    color: AppColor.text,
    marginBottom: 4,
  },
  selectedTruckCuisine: {
    fontFamily: Secondary400,
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
    fontFamily: Secondary400,
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
    fontFamily: Primary400,
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
    fontFamily: Primary400,
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
    fontFamily: Secondary400,
    fontSize: 12,
    fontWeight: "500",
  },
  truckCuisine: {
    fontFamily: Secondary400,
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
    fontFamily: Secondary400,
    fontSize: 14,
    color: AppColor.text,
    marginLeft: 4,
  },
  distanceText: {
    fontFamily: Secondary400,
    fontSize: 12,
    color: AppColor.textSecondary,
    marginRight: 16,
  },
  timeText: {
    fontFamily: Secondary400,
    fontSize: 12,
    color: AppColor.textSecondary,
  },
  priceRange: {
    fontFamily: Secondary400,
    fontSize: 14,
    color: AppColor.primary,
    fontWeight: "600",
  },
  // Horizontal List Styles
  horizontalListContainer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    height: 180,
  },
  horizontalListContent: {
    paddingHorizontal: 20,
  },
  horizontalCard: {
    width: width - 80,
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
    transform: [{ scale: 1.02 }],
  },
  cardImageContainer: {
    position: "relative",
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
    position: "absolute",
    top: -5,
    right: width / 2 - 60,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusBadgeText: {
    color: AppColor.white,
    fontSize: 10,
    fontFamily: Secondary400,
    fontWeight: "600",
  },
  horizontalCardContent: {
    alignItems: "center",
  },
  horizontalCardName: {
    fontFamily: Primary400,
    fontSize: 16,
    fontWeight: "600",
    color: AppColor.text,
    textAlign: "center",
    marginBottom: 4,
  },
  horizontalCardCuisine: {
    fontFamily: Secondary400,
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
    fontFamily: Secondary400,
    fontSize: 12,
    color: AppColor.text,
    marginLeft: 2,
    marginRight: 12,
  },
  horizontalDistanceText: {
    fontFamily: Secondary400,
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
    fontFamily: Secondary400,
    fontSize: 11,
    color: AppColor.textSecondary,
  },
  horizontalPriceText: {
    fontFamily: Secondary400,
    fontSize: 12,
    color: AppColor.primary,
    fontWeight: "600",
  },
  // No Results Styles
  noResultsContainer: {
    position: "absolute",
    bottom: 100,
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
    fontFamily: Secondary400,
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
    fontFamily: Secondary400,
    fontSize: 14,
    fontWeight: "600",
  },
});

export default NearMeScreen;
