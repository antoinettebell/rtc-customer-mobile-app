import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Platform,
} from "react-native";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Entypo from "react-native-vector-icons/Entypo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StatusBarManager from "../components/StatusBarManager";
import FastImage from "@d11/react-native-fast-image";

const addressesData = [
  {
    id: 1,
    label: "Location 1",
    address: "13th Street",
    address2: "47 W 13th St, New York, NY 10011, USA",
  },
  {
    id: 2,
    label: "Location 2",
    address: "13th Street",
    address2: "47 W 13th St, New York, NY 10011, USA",
  },
];

const AddressScreen = ({ navigation }) => {
  const [addresses, setAddresses] = useState(addressesData);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />
      {/* Header */}
      <View style={styles.headerWrap}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <MaterialIcons name="arrow-back" size={28} color={AppColor.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ADDRESS</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Entypo name="plus" size={24} color={AppColor.primary} />
        </TouchableOpacity>
      </View>
      <View
        style={{
          flex: 1,
          paddingHorizontal: 16,
          paddingVertical: 16,
          backgroundColor: "#F0F1F2",
        }}
      >
        {/* Address List */}
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id.toString()}
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
                  <Text style={styles.locationLabel}>{item.label}</Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <TouchableOpacity style={styles.iconBtn}>
                    <FastImage
                      source={require("../assets/images/bgEdit.png")}
                      style={{
                        width: 24,
                        height: 24,
                        marginRight: 12,
                      }}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn}>
                    <FastImage
                      source={require("../assets/images/bgBin.png")}
                      style={{ width: 24, height: 24 }}
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
                <Entypo
                  name="location-pin"
                  size={18}
                  color={AppColor.primary}
                  style={{ marginRight: 8 }}
                />
                <View style={{}}>
                  <Text style={styles.addressText}>{item.address}</Text>
                  <Text style={styles.addressText2}>{item.address2}</Text>
                </View>
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        />
        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColor.white,
  },
  headerWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 24,
    paddingBottom: 16,
    backgroundColor: AppColor.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColor.borderColor,
  },
  backBtn: {
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontFamily: Primary400,
    fontSize: 20,
    color: AppColor.text,
    textAlign: "center",
    letterSpacing: 1.5,
  },
  addBtn: {
    marginLeft: 8,
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
    // color: AppColor.text,
  },
  addressText2: {
    fontFamily: Primary400,
    fontSize: 12,
    // color: AppColor.text,
  },
  saveBtn: {
    height: 48,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColor.primary,
  },
  saveBtnText: {
    fontFamily: Secondary400,
    fontSize: 16,
    color: AppColor.white,
  },
});

export default AddressScreen;
