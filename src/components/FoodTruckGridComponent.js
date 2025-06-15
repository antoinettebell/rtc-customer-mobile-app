import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import FontAwesome6 from "react-native-vector-icons/FontAwesome6";
import {
  addFavoriteFoodTruck_API,
  removeFavoriteFoodTruck_API,
} from "../apiFolder/appAPI";

const FoodTruckGridComponent = ({
  title,
  uris,
  isLiked,
  onLikePress,
  onContainerPress,
  foodTruckId,
  reviews,
  distance,
}) => {
  const [loading, setLoading] = useState(false);
  const [localIsLiked, setLocalIsLiked] = useState(isLiked);

  const handleLikePress = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (localIsLiked) {
        const response = await removeFavoriteFoodTruck_API(foodTruckId);
        if (response?.success) {
          setLocalIsLiked(false);
          onLikePress && onLikePress(false);
        }
      } else {
        const response = await addFavoriteFoodTruck_API(foodTruckId);
        if (response?.success) {
          setLocalIsLiked(true);
          onLikePress && onLikePress(true);
        }
      }
    } catch (error) {
      console.log("Error toggling favorite:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.7}
      onPress={onContainerPress}
    >
      <Image
        source={{
          uri: uris,
        }}
        style={styles.image}
      />
      <View style={styles.subContainer}>
        <Text style={styles.titleText}>{title}</Text>
        <View style={styles.reatingContainer}>
          <View style={styles.iconContainer}>
            <FontAwesome name="star" size={16} color={AppColor.yellow} />
          </View>
          <Text style={styles.ratingText}>{reviews || "0 reviews"}</Text>
        </View>
        <View style={styles.reatingContainer}>
          <View style={styles.iconContainer}>
            <FontAwesome6 name="location-dot" size={16} color={AppColor.gray} />
          </View>
          <Text style={styles.ratingText} numberOfLines={1}>
            {(distance * 0.000621371).toFixed(2) + " miles away" ||
              "0 miles away"}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleLikePress}
        style={styles.likeContainer}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={AppColor.primary} />
        ) : (
          <MaterialCommunityIcons
            name={localIsLiked ? "heart" : "heart-outline"}
            color={localIsLiked ? AppColor.snackbarError : AppColor.white}
            size={30}
          />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default FoodTruckGridComponent;

const styles = StyleSheet.create({
  container: {
    // marginVertical: 10,
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
        elevation: 2,
      },
    }),
  },
  image: {
    height: 118,
    width: 160,
    borderRadius: 10,
    backgroundColor: "#D1D5DB",
    resizeMode: "cover",
  },
  subContainer: {
    gap: 8,
    marginTop: 10,
  },
  titleText: {
    fontFamily: Primary400,
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
    fontFamily: Secondary400,
    fontSize: 14,
    color: "#8C8F9A",
  },
  likeContainer: {
    position: "absolute",
    top: 20,
    right: 20,
  },
});
