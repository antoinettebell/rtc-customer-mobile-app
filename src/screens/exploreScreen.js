import React, { useState, useEffect } from "react";
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
import { Searchbar } from "react-native-paper";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
  withSpring,
} from "react-native-reanimated";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";
import FoodTruckListComponent from "../components/FoodTruckListComponent";
import FoodTruckGridComponent from "../components/FoodTruckGridComponent";
import StatusBarManager from "../components/StatusBarManager";
import { useNavigation } from "@react-navigation/native";
import FoodHomeHeaderSvg from "../assets/images/foodHomeHeader.svg";
import { getNearbyFoodTrucks_API } from "../apiFolder/appAPI";

const LocationPinWhite = require("../assets/images/locationPinWhite.png");
const RoundBellWhite = require("../assets/images/roundBellWhite.png");
const FT01 = require("../assets/images/FT-Demo-01.png");
const FT02 = require("../assets/images/FT-Demo-02.png");

const FT1Data = [
  { id: 1, name: "Taco Express", uri: FT02 },
  { id: 2, name: "Burger King", uri: FT01 },
];

const FT2Data = [
  { id: 1, name: "Burger King", uri: FT01 },
  { id: 2, name: "Taco Express", uri: FT02 },
  { id: 3, name: "Burger King", uri: FT01 },
  { id: 4, name: "Taco Express", uri: FT02 },
];

const FT4Data = [
  { id: 1, name: "Burger King", uri: FT01 },
  { id: 2, name: "Taco Express", uri: FT02 },
  { id: 3, name: "Burger King", uri: FT01 },
  { id: 4, name: "Taco Express", uri: FT02 },
];

const ExploreScreen = (props) => {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [popularFoodTrucks, setPopularFoodTrucks] = useState([]);

  const HEADER_MAX_HEIGHT = insets.top + 60 + 170;
  const HEADER_MIN_HEIGHT = insets.top + 60;
  const SEARCH_BAR_TOP = 30;
  const SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  const [searchQuery, setSearchQuery] = useState("");

  const handleLocationTextPress = () => {
    props.navigation.navigate("authMapScreen");
  };

  const handleNotificationBellPress = () => {};

  const fetchNearByFoodTrucks = async () => {
    try {
      setLoading(true);
      const params = {
        day: "mon",
        time: "11:17",
        userLat: "123",
        userLong: "456",
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

  useEffect(() => {
    fetchNearByFoodTrucks();
  }, []);

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
                13th street
              </Text>
              <MaterialIcons
                name="keyboard-arrow-down"
                size={18}
                color={AppColor.white}
              />
            </View>
            <Text style={styles.locationSubtitle} numberOfLines={1}>
              {"47 W 13th St, New York, NY 10011, USA"}
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
              data={FT1Data}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <FoodTruckListComponent
                  title={item.name}
                  uri={item.uri}
                  isLiked={item.isLiked}
                  foodTruckId={item._id}
                  reviews={item.reviews}
                  distance={item.distance}
                  onContainerPress={() =>
                    navigation.navigate("foodTruckDetailScreen", { item })
                  }
                  onLikePress={() => {
                    // Refresh the list if needed
                    // You can add a refresh function here
                  }}
                />
              )}
            />
          </View>

          {/* Popular nearby foortruck container */}
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
              renderItem={({ item, index }) => (
                <FoodTruckGridComponent
                  title={item.name}
                  uri={item.uri}
                  isLiked={item.isLiked}
                  foodTruckId={item._id}
                  reviews={item.reviews}
                  distance={item.distance}
                  onContainerPress={() =>
                    navigation.navigate("foodTruckDetailScreen", { item })
                  }
                  onLikePress={() => {
                    // Refresh the list if needed
                    // You can add a refresh function here
                  }}
                />
              )}
              contentContainerStyle={{
                gap: 20,
                paddingHorizontal: 20,
                paddingVertical: 10,
              }}
            />
          </View>

          {/* Nearby foortruck container */}
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
            {loading ? (
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
                renderItem={({ item, index }) => (
                  <FoodTruckGridComponent
                    title={item.name}
                    uris={item.logo}
                    isLiked={item.isLiked}
                    foodTruckId={item._id}
                    reviews={item.reviews}
                    distance={item.distanceInMeters}
                    onContainerPress={() =>
                      navigation.navigate("foodTruckDetailScreen", { item })
                    }
                    onLikePress={() => {
                      // Refresh the list if needed
                      // You can add a refresh function here
                    }}
                  />
                )}
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
              renderItem={({ item, index }) => (
                <FoodTruckGridComponent
                  title={item.name}
                  uri={item.uri}
                  isLiked={item.isLiked}
                  foodTruckId={item._id}
                  reviews={item.reviews}
                  distance={item.distance}
                  onContainerPress={() =>
                    navigation.navigate("foodTruckDetailScreen", { item })
                  }
                  onLikePress={() => {
                    // Refresh the list if needed
                    // You can add a refresh function here
                  }}
                />
              )}
              contentContainerStyle={{
                gap: 20,
                paddingHorizontal: 20,
                paddingVertical: 10,
              }}
            />
          </View>
        </View>
      </Animated.ScrollView>
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
});
