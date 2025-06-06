import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Platform,
  ActivityIndicator,
} from "react-native";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";
import AntDesign from "react-native-vector-icons/AntDesign";
import EvilIcons from "react-native-vector-icons/EvilIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StatusBarManager from "../components/StatusBarManager";
import FastImage from "@d11/react-native-fast-image";
import { IconButton, Snackbar } from "react-native-paper";
import {
  getAddress_API,
  addAddress_API,
  updateAddress_API,
  deleteAddress_API,
} from "../apiFolder/appAPI";
import { useDispatch } from "react-redux";
import { setSelectedLocations } from "../redux/slices/foodTruckProfileSlice";

const AddressScreen = ({ navigation }) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "success",
  });
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  // Fetch addresses on component mount and when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchAddresses();
    });

    return unsubscribe;
  }, [navigation]);

  const showSnackbar = (message, type = "success") => {
    setSnackbar({
      visible: true,
      message,
      type,
    });
  };

  // Fetch addresses from API
  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await getAddress_API({ page: 1, limit: 50 });
      if (response?.success) {
        setAddresses(response.data.addressList);
      }
    } catch (error) {
      showSnackbar(error?.message || "Failed to fetch addresses", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete address
  const handleDeleteAddress = async (addressId) => {
    try {
      const response = await deleteAddress_API(addressId);
      if (response?.success) {
        showSnackbar("Address deleted successfully");
        // Optimize: Remove only the deleted item
        setAddresses((prevAddresses) =>
          prevAddresses.filter((addr) => addr._id !== addressId)
        );
      }
    } catch (error) {
      showSnackbar(error?.message || "Failed to delete address", "error");
    }
  };

  // Handle edit address
  const handleEditAddress = (address) => {
    dispatch(
      setSelectedLocations([
        {
          title: address.title,
          address: address.address,
          lat: address.lat,
          long: address.long,
          _id: address._id,
        },
      ])
    );
    navigation.navigate("authMapScreen", { mode: "edit" });
  };

  // Handle add new address
  const handleAddAddress = () => {
    dispatch(setSelectedLocations([]));
    navigation.navigate("authMapScreen", { mode: "add" });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />

      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor={AppColor.black}
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerTitle}>{"Address"}</Text>
        <View style={styles.headerIconContainer}>
          <TouchableOpacity
            hitSlop={10}
            onPress={handleAddAddress}
            activeOpacity={0.7}
          >
            <AntDesign name="plussquareo" size={20} color={AppColor.primary} />
          </TouchableOpacity>
        </View>
      </View>
      <View
        style={{
          flex: 1,
          paddingHorizontal: 16,
          paddingVertical: 16,
          backgroundColor: "#F0F1F2",
        }}
      >
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={AppColor.primary} />
          </View>
        ) : (
          <FlatList
            data={addresses}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.addressCard}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <View style={styles.locationLabelContainer}>
                    <Text style={styles.locationLabel}>{item.title}</Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => handleDeleteAddress(item._id)}
                    >
                      <FastImage
                        source={require("../assets/images/bgBin.png")}
                        style={{
                          width: 24,
                          height: 24,
                          marginRight: 12,
                        }}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => handleEditAddress(item)}
                    >
                      <FastImage
                        source={require("../assets/images/bgEdit.png")}
                        style={{
                          width: 24,
                          height: 24,
                        }}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <EvilIcons
                    name="location"
                    size={18}
                    color={AppColor.primary}
                    style={{ marginRight: 8 }}
                  />
                  <View style={{}}>
                    <Text style={styles.addressText}>{item.title}</Text>
                    <Text style={styles.addressText2}>{item.address}</Text>
                  </View>
                </View>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          />
        )}
      </View>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={3000}
        style={[
          styles.snackbar,
          {
            backgroundColor:
              snackbar.type === "success" ? AppColor.primary : "#FF5252",
          },
        ]}
        action={{
          label: "Dismiss",
          onPress: () => setSnackbar({ ...snackbar, visible: false }),
          textColor: AppColor.white,
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
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: AppColor.white,
    paddingHorizontal: 8,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderColor: "#E5E5EA",
  },
  headerTitle: {
    color: AppColor.black,
    fontSize: 20,
    fontFamily: Primary400,
  },
  headerIconContainer: {
    width: 48,
    alignItems: "center",
  },

  addressCard: {
    borderWidth: 1,
    borderColor: AppColor.borderColor,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 20,
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
  locationLabelContainer: {
    borderRadius: 5,
    borderWidth: 1,
    borderColor: AppColor.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  locationLabel: {
    fontFamily: Secondary400,
    fontSize: 16,
    color: AppColor.primary,
  },
  iconBtn: {},
  addressText: {
    fontFamily: Primary400,
    fontSize: 16,
  },
  addressText2: {
    fontFamily: Primary400,
    fontSize: 12,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  snackbar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    margin: 16,
    borderRadius: 8,
  },
});

export default AddressScreen;
