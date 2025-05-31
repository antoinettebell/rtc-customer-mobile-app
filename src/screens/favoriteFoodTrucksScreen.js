import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";
import Entypo from "react-native-vector-icons/Entypo";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FastImage from "@d11/react-native-fast-image";
import StatusBarManager from "../components/StatusBarManager";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const favTruck1 = require("../assets/images/FT-Demo-01.png");
const favTruck2 = require("../assets/images/FT-Demo-02.png");

const trucksData = [
  {
    id: 1,
    name: "BURGER EXPRESS",
    image: favTruck1,
    reviews: "4.1 (200+ reviews)",
    distance: "0.3 miles away",
    favorite: true,
  },
  {
    id: 2,
    name: "BURGER KING",
    image: favTruck2,
    reviews: "4.1 (200+ reviews)",
    distance: "0.4 miles away",
    favorite: true,
  },
  {
    id: 3,
    name: "BURGER EXPRESS",
    image: favTruck1,
    reviews: "4.1 (200+ reviews)",
    distance: "0.5 miles away",
    favorite: true,
  },
];

const HR = () => <View style={styles.HR} />;

const FavoriteFoodTrucksScreen = ({ navigation }) => {
  const [search, setSearch] = useState("");
  const insets = useSafeAreaInsets();

  const filteredTrucks = trucksData.filter((truck) =>
    truck.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />

      {/* Header */}
      <View style={styles.headerWrap}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <MaterialIcons name="arrow-back" size={24} color={AppColor.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAVORITE FooD TRUCKS</Text>
      </View>
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

        <View style={styles.favTrucksCard}>
          <FlatList
            data={filteredTrucks}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <View style={styles.truckCard}>
                <FastImage source={item.image} style={styles.truckImg} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.truckName}>{item.name}</Text>
                  <Text style={styles.truckReview}>
                    <Text style={{ color: AppColor.ratingStar }}>★ </Text>
                    {item.reviews} - {item.distance}
                  </Text>
                </View>
                <Entypo
                  name={item.favorite ? "heart" : "heart-outlined"}
                  size={24}
                  color={AppColor.red}
                  style={{ marginLeft: 8 }}
                />
              </View>
            )}
            ItemSeparatorComponent={<HR />}
          />
        </View>
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
  backBtn: {},
  headerTitle: {
    flex: 1,
    fontFamily: Primary400,
    fontSize: 20,
    color: AppColor.text,
    textAlign: "center",
  },
  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColor.white,
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: Secondary400,
    fontSize: 15,
    color: AppColor.text,
    marginLeft: 8,
  },
  truckCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
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
  favTrucksCard: {
    borderWidth: 1,
    borderColor: AppColor.borderColor,
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 16,
    marginVertical: 16,
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
  HR: {
    height: 1,
    backgroundColor: "#E5E5EA",
  },
});

export default FavoriteFoodTrucksScreen;
