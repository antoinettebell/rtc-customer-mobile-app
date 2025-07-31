import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import { AppColor, Mulish700, Mulish400 } from "../utils/theme";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import FontAwesome6 from "react-native-vector-icons/FontAwesome6";
import { useDispatch, useSelector } from "react-redux";
import { toggleFavorite } from "../redux/slices/favoritesSlice";
import FastImage from "@d11/react-native-fast-image";
import AppImage from "./AppImage";

const FoodTruckGridComponent = ({
  title,
  uris,
  onContainerPress,
  foodTruckId,
  reviews,
  distance,
  showReviews = true,
  showDistance = true,
  showLikeButton,
}) => {
  const dispatch = useDispatch();
  // Get favorites and the individual loading state map from Redux
  const { favorites, loading: individualLoadingState } = useSelector(
    (state) => state.favoritesReducer
  );

  // Determine if the current food truck is liked based on Redux state
  const isLiked = favorites.some((fav) => fav.foodTruck?._id === foodTruckId);

  // Check loading status for this specific food truck
  const isLoading = individualLoadingState[foodTruckId] || false;

  const handleLikePress = async () => {
    dispatch(
      toggleFavorite({
        foodTruckId,
        isCurrentlyLiked: isLiked,
        foodTruckData: {
          name: title,
          logo: uris,
          totalReviews: reviews,
          distanceInMeters: distance,
        },
      })
    );
  };

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.7}
      onPress={onContainerPress}
    >
      <AppImage uri={uris} containerStyle={styles.image} />
      <View style={styles.subContainer}>
        <Text style={styles.titleText} numberOfLines={1}>
          {title}
        </Text>
        {showReviews && (
          <View style={styles.reatingContainer}>
            <View style={styles.iconContainer}>
              <FontAwesome name="star" size={16} color={AppColor.yellow} />
            </View>
            <Text style={styles.ratingText} numberOfLines={1}>
              {reviews}
            </Text>
          </View>
        )}
        {showDistance ? (
          <View style={styles.reatingContainer}>
            <View style={styles.iconContainer}>
              <FontAwesome6
                name="location-dot"
                size={16}
                color={AppColor.gray}
              />
            </View>
            <Text style={styles.ratingText} numberOfLines={1}>
              {(distance * 0.000621371).toFixed(2) + " miles away" ||
                "0 miles away"}
            </Text>
          </View>
        ) : null}
      </View>
      {showLikeButton && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleLikePress}
          style={styles.likeContainer}
          disabled={isLoading} // Disable button while this specific item is loading
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={AppColor.primary} />
          ) : (
            <MaterialCommunityIcons
              name={isLiked ? "heart" : "heart-outline"}
              color={isLiked ? AppColor.snackbarError : AppColor.white}
              size={30}
            />
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

export default FoodTruckGridComponent;

const styles = StyleSheet.create({
  container: {
    width: 160 + 32, // image width + horizontal padding
    borderRadius: 10,
    padding: 16,
    backgroundColor: AppColor.white,
    ...Platform.select({
      ios: {
        shadowColor: AppColor.black,
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  image: {
    height: 118,
    width: 160,
    borderRadius: 10,
  },
  subContainer: {
    gap: 8,
    marginTop: 10,
  },
  titleText: {
    fontFamily: Mulish700,
    fontSize: 16,
    color: AppColor.black,
  },
  reatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  iconContainer: {
    height: 16,
    width: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingText: {
    fontFamily: Mulish400,
    fontSize: 14,
    color: "#8C8F9A",
  },
  likeContainer: {
    position: "absolute",
    top: 20,
    right: 20,
  },
});
