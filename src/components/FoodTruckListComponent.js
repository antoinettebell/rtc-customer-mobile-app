import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { AppColor, Mulish700, Mulish400 } from "../utils/theme";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import FontAwesome6 from "react-native-vector-icons/FontAwesome6";

import { useDispatch, useSelector } from "react-redux";
import { toggleFavorite } from "../redux/slices/favoritesSlice";
import AppImage from "./AppImage";

const FoodTruckListComponent = ({
  title,
  uri,
  onContainerPress,
  foodTruckId,
  reviews,
  distance,
  showReviews = true,
  showDistance = true,
  showLikeButton = true,
}) => {
  const dispatch = useDispatch();
  // Get favorites and the individual loading state map from Redux
  const { favorites = [], loading: individualLoadingState = {} } = useSelector(
    (state) => state.favoritesReducer ?? {}
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
          logo: uri,
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
      <AppImage uri={uri} containerStyle={styles.image} />
      <View style={styles.subContainer}>
        <Text style={styles.titleText}>{title}</Text>
        {showReviews && (
          <View style={styles.reatingContainer}>
            <View style={styles.iconContainer}>
              <FontAwesome name="star" size={16} color={AppColor.yellow} />
            </View>
            <Text style={styles.ratingText}>{reviews}</Text>
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
            <Text style={styles.ratingText}>
              {(distance * 0.000621371).toFixed(2) + " miles away" ||
                "0 miles away"}
            </Text>
          </View>
        ) : null}
      </View>
      {showLikeButton ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleLikePress}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={AppColor.primary} />
          ) : (
            <MaterialCommunityIcons
              name={isLiked ? "heart" : "heart-outline"}
              color={isLiked ? AppColor.primary : AppColor.likePlaceholder}
              size={30}
            />
          )}
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
};

export default FoodTruckListComponent;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginVertical: 10,
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
    height: 83,
    width: 83,
    borderRadius: 10,
  },
  subContainer: {
    flex: 1,
    gap: 5,
    marginHorizontal: 10,
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
});
