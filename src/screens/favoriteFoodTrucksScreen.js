import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";
import Entypo from "react-native-vector-icons/Entypo";
import Ionicons from "react-native-vector-icons/Ionicons";
import FastImage from "@d11/react-native-fast-image";
import StatusBarManager from "../components/StatusBarManager";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {
  getFavoriteFoodTruck_API,
  removeFavoriteFoodTruck_API,
} from "../apiFolder/appAPI";
import { Snackbar } from "react-native-paper";
import AppHeader from "../components/AppHeader";

const favTruck1 = require("../assets/images/FT-Demo-01.png");

const HR = () => <View style={styles.HR} />;

const FavoriteFoodTrucksScreen = ({ navigation }) => {
  const [search, setSearch] = useState("");
  const [favoriteTrucks, setFavoriteTrucks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "info",
  });
  const insets = useSafeAreaInsets();

  const fetchFavoriteTrucks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getFavoriteFoodTruck_API({
        search: search || undefined,
      });
      if (response?.success && response?.data?.favoriteList) {
        setFavoriteTrucks(response.data.favoriteList);
      } else {
        setError("Failed to fetch favorite trucks");
      }
    } catch (error) {
      console.log("Error fetching favorite trucks:", error);
      setError(error?.message || "Failed to fetch favorite trucks");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (foodTruckId) => {
    try {
      const response = await removeFavoriteFoodTruck_API(foodTruckId);
      if (response?.success) {
        setSnackbar({
          visible: true,
          message: "Removed from favorites",
          type: "success",
        });
        // Refresh the list
        fetchFavoriteTrucks();
      } else {
        setSnackbar({
          visible: true,
          message: response?.message || "Failed to remove from favorites",
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
      fetchFavoriteTrucks();
    }, [search])
  );

  const renderContent = () => {
    if (loading) {
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

    if (favoriteTrucks.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.noDataText}>No favorite trucks found</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={favoriteTrucks}
        keyExtractor={(item) => item._id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.favTrucksCard}
        renderItem={({ item }) => (
          <View style={styles.truckCard}>
            <FastImage
              source={
                item.foodTruck?.logo ? { uri: item.foodTruck?.logo } : favTruck1
              }
              style={styles.truckImg}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.truckName}>{item.foodTruck?.name}</Text>
              <Text style={styles.truckReview}>
                <Text style={{ color: AppColor.ratingStar }}>★ </Text>
                {item.reviews || "0"} reviews - {item.distance || "0"} miles
                away
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleRemoveFavorite(item.foodTruck?._id)}
              style={{ marginLeft: 8 }}
            >
              <Entypo name="heart" size={24} color={AppColor.red} />
            </TouchableOpacity>
          </View>
        )}
        ItemSeparatorComponent={<HR />}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />

      <AppHeader headerTitle="FAVORITE FOOD TRUCKS" />

      <View
        style={{
          flex: 1,
          paddingHorizontal: 16,
          paddingVertical: 16,
          backgroundColor: "#F0F1F2",
        }}
      >
        {/* Search Bar */}
        <View style={styles.searchBarWrap}>
          <Ionicons name="search" size={20} color={AppColor.textHighlighter} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search food trucks"
            placeholderTextColor={AppColor.textHighlighter}
            value={search}
            onChangeText={setSearch}
          />
        </View>

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
    fontFamily: Secondary400,
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
    fontFamily: Primary400,
    fontSize: 14,
    color: AppColor.text,
    marginBottom: 4,
  },
  truckReview: {
    fontFamily: Secondary400,
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
    fontFamily: Secondary400,
    fontSize: 14,
    textAlign: "center",
  },
  noDataText: {
    color: AppColor.textHighlighter,
    fontFamily: Secondary400,
    fontSize: 14,
    textAlign: "center",
  },
  HR: {
    height: 1,
    backgroundColor: "#E5E5EA",
  },
});

export default FavoriteFoodTrucksScreen;
