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
import { AppColor, Secondary400 } from "../utils/theme";
import AntDesign from "react-native-vector-icons/AntDesign";
import EvilIcons from "react-native-vector-icons/EvilIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StatusBarManager from "../components/StatusBarManager";
import { Snackbar, Menu } from "react-native-paper";
import { getAddress_API, deleteAddress_API } from "../apiFolder/appAPI";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedLocations } from "../redux/slices/foodTruckProfileSlice";
import AppHeader from "../components/AppHeader";
import {
  setAllLocations,
  setDefaultLocation,
} from "../redux/slices/locationSlice";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

const AddressScreen = ({ navigation }) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(null);

  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "success",
  });
  const { allLocations, defaultLocation } = useSelector(
    (state) => state.locationReducer
  );
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchAddresses);
    return unsubscribe;
  }, [navigation]);

  const showSnackbar = (message, type = "success") => {
    setSnackbar({ visible: true, message, type });
  };

  useEffect(() => {
    setAddresses(allLocations);
  }, [allLocations]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await getAddress_API({ page: 1, limit: 1000 });
      if (response?.success) {
        dispatch(setAllLocations(response.data.addressList));
      }
    } catch (error) {
      showSnackbar(error?.message || "Failed to fetch addresses", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      const response = await deleteAddress_API(addressId);
      if (response?.success) {
        showSnackbar("Address deleted successfully");
        const tempAddressData = allLocations.filter(
          (addr) => addr._id !== addressId
        );
        dispatch(setAllLocations(tempAddressData));
      }
    } catch (error) {
      showSnackbar(error?.message || "Failed to delete address", "error");
    }
  };

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

  const handleAddAddress = () => {
    dispatch(setSelectedLocations([]));
    navigation.navigate("authMapScreen", { mode: "add" });
  };

  const renderItem = ({ item, index }) => (
    <View
      style={[
        styles.addressCard,
        {
          borderColor:
            item._id === defaultLocation?._id
              ? AppColor.primary
              : AppColor.borderColor,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.locationLabelContainer}>
          <Text style={styles.locationLabel}>Location {index + 1}</Text>
        </View>
        <Menu
          mode="flat"
          visible={menuVisible === index}
          onDismiss={() => setMenuVisible(null)}
          anchor={
            <TouchableOpacity
              onPress={() => setMenuVisible(index)}
              style={{
                height: 24,
                width: 24,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIcons
                name="more-vert"
                size={24}
                color={AppColor.black}
              />
            </TouchableOpacity>
          }
          contentStyle={{
            backgroundColor: AppColor.white,
            borderWidth: 1,
            borderColor: AppColor.border,
            elevation: 1,
            shadowColor: AppColor.black,
            shadowOffset: {
              width: 0,
              height: 1,
            },
            shadowOpacity: 0.1,
            shadowRadius: 2,
          }}
        >
          <Menu.Item
            onPress={() => {
              setMenuVisible(null);
              handleEditAddress(item);
            }}
            title="Edit"
            leadingIcon={"pencil"}
          />
          <Menu.Item
            onPress={() => {
              setMenuVisible(null);
              handleDeleteAddress(item._id);
            }}
            title="Delete"
            leadingIcon={"trash-can"}
          />
          <Menu.Item
            onPress={() => {
              setMenuVisible(null);
              dispatch(setDefaultLocation(item));
            }}
            title="Set as Default"
            leadingIcon={"google-maps"}
          />
        </Menu>
      </View>

      <View style={styles.addressRow}>
        <EvilIcons
          name="location"
          size={18}
          color={AppColor.primary}
          style={styles.locationIcon}
        />
        <View style={{ flex: 1, paddingRight: 20 }}>
          <Text style={styles.addressText}>{item.title}</Text>
          <Text style={styles.addressText2}>{item.address}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />

      <AppHeader headerTitle="Address" rightSide={true}>
        <TouchableOpacity
          hitSlop={10}
          onPress={handleAddAddress}
          activeOpacity={0.7}
        >
          <AntDesign name="plussquareo" size={20} color={AppColor.primary} />
        </TouchableOpacity>
      </AppHeader>

      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={AppColor.primary} />
          </View>
        ) : (
          <FlatList
            data={addresses}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#F0F1F2",
  },
  addressCard: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 20,
    backgroundColor: AppColor.white,
    ...Platform.select({
      ios: {
        shadowColor: AppColor.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  locationLabelContainer: {
    borderRadius: 5,
    borderWidth: 1,
    borderColor: AppColor.primary,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  locationLabel: {
    fontFamily: Secondary400,
    fontSize: 16,
    color: AppColor.primary,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationIcon: {
    marginRight: 8,
  },
  addressText: {
    fontFamily: Secondary400,
    fontSize: 18,
  },
  addressText2: {
    fontFamily: Secondary400,
    fontSize: 12,
    color: AppColor.grayText,
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
  separator: {
    height: 16,
  },
});

export default AddressScreen;
