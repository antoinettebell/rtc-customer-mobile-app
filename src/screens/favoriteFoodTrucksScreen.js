import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform, // Import Platform for shadow styles
} from "react-native";
import { AppColor, Mulish700, Mulish400 } from "../utils/theme";
import Entypo from "react-native-vector-icons/Entypo";
import Ionicons from "react-native-vector-icons/Ionicons";
import FastImage from "@d11/react-native-fast-image";
import StatusBarManager from "../components/StatusBarManager";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Snackbar } from "react-native-paper";
import AppHeader from "../components/AppHeader";
import { useDispatch, useSelector } from "react-redux";
import { fetchFavorites, toggleFavorite } from "../redux/slices/favoritesSlice";
import AppImage from "../components/AppImage";

const favTruck1 = require("../assets/images/FT-Demo-01.png");

const HR = () => <View style={styles.HR} />;

const FavoriteFoodTrucksScreen = ({ navigation }) => {
  const [search, setSearch] = useState("");
  const dispatch = useDispatch();
  // Get favoriteTrucks (renamed from 'favorites' for clarity in this screen) and loading/error states from Redux
  const {
    favorites: favoriteTrucks,
    loading: individualLoadingState, // Renamed to clearly separate from global fetch loading
    isLoadingFavorites, // NEW: global loading state for fetching favorites list
    error,
  } = useSelector((state) => state.favoritesReducer);

  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "info",
  });
  const insets = useSafeAreaInsets();

  const handleRemoveFavorite = async (foodTruckId) => {
    try {
      const resultAction = await dispatch(
        toggleFavorite({ foodTruckId, isCurrentlyLiked: true })
      );

      if (toggleFavorite.fulfilled.match(resultAction)) {
        setSnackbar({
          visible: true,
          message: "Removed from favorites",
          type: "success",
        });
      } else if (toggleFavorite.rejected.match(resultAction)) {
        setSnackbar({
          visible: true,
          message: resultAction.payload || "Failed to remove from favorites",
          type: "error",
        });
      }
    } catch (error) {
      console.log("Error removing favorite:", error);
      setSnackbar({
        visible: true,
        message: error?.message || "Failed to remove from favorites",
        type: "error",
      });
    }
  };

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchFavorites()); // Fetch favorites whenever the screen is focused
    }, [dispatch])
  );

  // Filter favorites based on search query
  const filteredFavoriteTrucks = favoriteTrucks.filter((item) =>
    item.foodTruck?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const renderContent = () => {
    console.log("favoriteTrucks => ", favoriteTrucks);
    // Use isLoadingFavorites for the main list loading state
    if (isLoadingFavorites) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={AppColor.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    if (filteredFavoriteTrucks.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.noDataText}>No favorite trucks found</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredFavoriteTrucks}
        keyExtractor={(item) => item._id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.favTrucksCard}
        renderItem={({ item }) => (
          <TouchableOpacity
            key={item._id}
            style={styles.truckCard}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate("foodTruckDetailScreen", {
                item: item.foodTruck,
              })
            }
          >
            <AppImage
              uri={item.foodTruck?.logo}
              containerStyle={styles.truckImg}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.truckName}>{item.foodTruck?.name}</Text>
              <Text style={styles.truckReview}>
                <Text style={{ color: AppColor.ratingStar }}>★ </Text>
                {item.foodTruck?.totalReviews || "0"} reviews
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleRemoveFavorite(item.foodTruck?._id)}
              style={{ marginLeft: 8 }}
              // Disable button while this specific item is loading
              disabled={individualLoadingState[item.foodTruck?._id]}
            >
              {/* Check if this specific item is loading */}
              {individualLoadingState[item.foodTruck?._id] ? (
                <ActivityIndicator size="small" color={AppColor.red} />
              ) : (
                <Entypo name="heart" size={24} color={AppColor.red} />
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={<HR />}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />

      <AppHeader headerTitle="Favorite Food Trucks" />

      <View
        style={{
          flex: 1,
          paddingHorizontal: 16,
          paddingVertical: 16,
          backgroundColor: "#F0F1F2",
        }}
      >
        {/* Search Bar */}
        {favoriteTrucks?.length > 0 && (
          <View style={styles.searchBarWrap}>
            <Ionicons
              name="search"
              size={20}
              color={AppColor.textHighlighter}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search food trucks"
              placeholderTextColor={AppColor.textHighlighter}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              returnKeyLabel="Search"
            />
          </View>
        )}

        {/* List */}
        {renderContent()}
      </View>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={4000}
        style={{
          backgroundColor:
            snackbar.type === "success"
              ? AppColor.snackbarSuccess
              : snackbar.type === "error"
                ? AppColor.snackbarError
                : AppColor.snackbarDefault,
        }}
      >
        {snackbar.message}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColor.white,
  },
  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColor.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: Mulish400,
    fontSize: 15,
    color: AppColor.text,
    marginLeft: 8,
    height: 40,
  },
  favTrucksCard: {
    borderWidth: 1,
    borderColor: AppColor.borderColor,
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 16,
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
  truckCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },
  truckImg: {
    width: 54,
    height: 54,
    borderRadius: 8,
  },
  truckName: {
    fontFamily: Mulish700,
    fontSize: 14,
    color: AppColor.text,
    marginBottom: 4,
  },
  truckReview: {
    fontFamily: Mulish400,
    fontSize: 12,
    color: AppColor.textHighlighter,
    marginTop: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: AppColor.snackbarError,
    fontFamily: Mulish400,
    fontSize: 14,
    textAlign: "center",
  },
  noDataText: {
    color: AppColor.textHighlighter,
    fontFamily: Mulish400,
    fontSize: 14,
    textAlign: "center",
  },
  HR: {
    height: 1,
    backgroundColor: "#E5E5EA",
  },
});

export default FavoriteFoodTrucksScreen;
