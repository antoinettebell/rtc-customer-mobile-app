import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
  FlatList,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";
import StatusBarManager from "../components/StatusBarManager";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import FontAwesome6 from "react-native-vector-icons/FontAwesome6";
import ImageCarousel from "../components/ImageCarousel";
import AppHeader from "../components/AppHeader";
import MapView, { Marker } from "react-native-maps";

const { width } = Dimensions.get("window");

// Example data for demonstration
const DEMO_IMAGES = [
  require("../assets/images/FT-Demo-01.png"),
  require("../assets/images/FT-Demo-02.png"),
  require("../assets/images/FT-Demo-01.png"),
];
const HR = () => <View style={styles.HR} />;

const INFO_ROWS = [
  {
    icon: (
      <FontAwesome6 name="location-dot" size={20} color={AppColor.primary} />
    ),
    title: "Truck Location",
    value: "47 W 13th St, New York, NY",
    value2: "10011, USA",
  },
  {
    icon: (
      <MaterialIcons name="watch-later" size={20} color={AppColor.primary} />
    ),
    title: "Open Hours",
    value: "11:00 AM - 9:00 PM",
    icon2: <MaterialIcons name="info" size={20} color={AppColor.black} />,
  },
  {
    icon: (
      <MaterialIcons
        name="event-available"
        size={20}
        color={AppColor.primary}
      />
    ),
    title: "Status",
    value: "Open Now",
    onPress: () => console.log("Info icon pressed"),
  },
];

const MENU_TABS = [
  {
    key: "burger",
    label: "Burger",
    items: [
      {
        id: 1,
        name: "Taco Express",
        desc: "Corn tortilla, beef, lettuce, cheese",
        price: "$9.49",
        img: require("../assets/images/FT-Demo-02.png"),
      },
      {
        id: 2,
        name: "Burrito Bowl",
        desc: "Rice, beans, salsa",
        price: "$11.98",
        img: require("../assets/images/FT-Demo-01.png"),
      },
      {
        id: 3,
        name: "Burrito Bowl",
        desc: "Rice, beans, salsa",
        price: "$11.98",
        img: require("../assets/images/FT-Demo-01.png"),
      },
    ],
  },
  { key: "pizza", label: "Pizza", items: [] },
  { key: "combo", label: "Combo", items: [] },
  { key: "chips", label: "Chips & Drinks", items: [] },
  { key: "sandwiches", label: "Sandwiches", items: [] },
];

const FoodTruckDetailScreen = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation();
  const { item } = route.params;
  const [selectedTab, setSelectedTab] = useState(0);
  const [cartCount, setCartCount] = useState(1);
  const tabListRef = useRef();
  const tabContentRef = useRef();

  // For demo, use DEMO_IMAGES. In real, use item.images or similar.
  const images =
    item.images && item.images.length > 0 ? item.images : DEMO_IMAGES;

  // Tab change by tap
  const handleTabPress = (idx) => {
    setSelectedTab(idx);
    tabContentRef.current?.scrollToIndex({ index: idx, animated: true });
  };
  // Tab change by swipe
  const handleTabContentScroll = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    if (selectedTab !== idx) setSelectedTab(idx);
    tabListRef.current?.scrollToIndex({ index: idx, animated: true });
  };

  // Demo location for MapView
  const truckLocation = {
    latitude: 40.7397,
    longitude: -74.0059,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager barStyle="dark-content" />
      <AppHeader headerTitle="DETAILS" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 120,
          backgroundColor: "#F0F1F2",
        }}
      >
        {/* Image Carousel */}
        <ImageCarousel images={images} />
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            backgroundColor: AppColor.white,
            gap: 10,
          }}
        >
          {/* Name & Subname */}
          <View style={styles.nameRow}>
            <Text style={styles.title}>{item.name || "BURGER EXPRESS"}</Text>
            <Text style={styles.subname}>Food Truck</Text>
          </View>
          {/* Ratings & Food Types */}
          <View
            style={{
              alignItems: "center",
              justifyContent: "space-between",
              flexDirection: "row",
            }}
          >
            <View style={styles.ratingsRow}>
              <FontAwesome name="star" size={16} color={AppColor.ratingStar} />
              <Text style={styles.ratingText}>4.8 (200+ reviews)</Text>
              <Text style={styles.dot}>|</Text>
              <Text style={styles.cuisineText}>Mexican, American</Text>
            </View>
            <TouchableOpacity>
              <FontAwesome name="heart-o" size={22} color={AppColor.red} />
            </TouchableOpacity>
          </View>
          {/* Social Media Icons */}
          <View style={styles.socialRow}>
            <TouchableOpacity>
              <FontAwesome
                name="facebook-square"
                size={22}
                color={AppColor.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity>
              <FontAwesome
                name="instagram"
                size={22}
                color={AppColor.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>CURRENT LOCATION</Text>
            {/* <TouchableOpacity
              style={styles.getDirectionBtn}
              onPress={() => {
                // Open maps with direction
                const url = `https://www.google.com/maps/dir/?api=1&destination=${truckLocation.latitude},${truckLocation.longitude}`;
                if (Platform.OS === "web") {
                  window.open(url, "_blank");
                } else {
                  // Use Linking for mobile
                  import("react-native").then(({ Linking }) =>
                    Linking.openURL(url)
                  );
                }
              }}
            > */}
            <Text style={styles.getDirectionBtn}>Get Direction</Text>
            {/* </TouchableOpacity> */}
          </View>
          <View style={styles.mapViewWrap}>
            <MapView
              style={styles.mapView}
              initialRegion={truckLocation}
              region={truckLocation}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
              pointerEvents="none"
            >
              <Marker coordinate={truckLocation}>
                <FontAwesome6
                  name="location-dot"
                  size={32}
                  color={AppColor.primary}
                />
              </Marker>
            </MapView>
          </View>
        </View>

        {/* Dynamic Info Rows */}
        <View style={styles.infoRowsWrap}>
          {INFO_ROWS.map((row, idx) => (
            <View key={idx} style={styles.infoRowContainer}>
              <View key={idx} style={[styles.infoRowContainer, { flex: 1 }]}>
                <View style={styles.infoRowLeft}>
                  {row.icon}
                  <Text style={styles.infoRowTitle}>{row.title}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={{
                  flex: 1,
                  alignItems: "flex-end",
                }}
              >
                <Text style={[styles.infoRowValue, { textAlign: "right" }]}>
                  {row.value}
                </Text>
                {row.value2 && (
                  <Text style={styles.infoRowValue}>{row.value2}</Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Dynamic Tabs (swipeable & tappable) */}
        <View style={styles.tabsWrap}>
          <FlatList
            ref={tabListRef}
            data={MENU_TABS}
            keyExtractor={(tab) => tab.key}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsRow}
            renderItem={({ item: tab, index }) => (
              <TouchableOpacity
                style={[
                  styles.tabBtn,
                  selectedTab === index && styles.tabBtnActive,
                ]}
                onPress={() => handleTabPress(index)}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedTab === index && styles.tabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
        <FlatList
          ref={tabContentRef}
          data={MENU_TABS}
          keyExtractor={(tab) => tab.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleTabContentScroll}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          renderItem={({ item: tab }) => (
            <View style={{ width, backgroundColor: AppColor.white }}>
              {tab.items.length === 0 ? (
                <Text style={styles.noMenuText}>
                  No items available in this section.
                </Text>
              ) : (
                tab.items.map((menu) => (
                  <View key={menu.id} style={styles.menuItemRow}>
                    <Image source={menu.img} style={styles.menuImg} />
                    <View style={{ flex: 1, marginLeft: 10, gap: 6 }}>
                      <Text style={styles.menuTitle}>{menu.name}</Text>
                      <Text style={styles.menuDesc}>
                        {menu.desc + menu.desc}
                      </Text>
                      <Text style={styles.menuPrice}>{menu.price}</Text>
                    </View>
                    <View style={styles.menuQtyBox}>
                      <TouchableOpacity
                        onPress={() => setCartCount(Math.max(1, cartCount - 1))}
                        style={styles.qtyBtn}
                      >
                        <Text style={styles.qtyBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{cartCount}</Text>
                      <TouchableOpacity
                        onPress={() => setCartCount(cartCount + 1)}
                        style={styles.qtyBtn}
                      >
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <HR />
                  </View>
                ))
              )}
            </View>
          )}
        />
      </ScrollView>
      {/* Bottom Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: insets.bottom || 12,
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
          },
        ]}
      >
        <TouchableOpacity style={styles.bottomBarBtn}>
          <Text style={styles.bottomBarText}>1 ITEM ADDED</Text>
          <Text style={styles.bottomBarSubText}>View your order-list</Text>
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
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: Primary400,
    fontSize: 18,
    color: AppColor.text,
  },
  subname: {
    fontFamily: Secondary400,
    fontSize: 14,
  },
  ratingsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontFamily: Secondary400,
    fontSize: 14,
    color: AppColor.textHighlighter,
  },
  dot: {
    color: AppColor.textHighlighter,
    marginHorizontal: 4,
  },
  cuisineText: {
    fontFamily: Secondary400,
    fontSize: 14,
    color: AppColor.textHighlighter,
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  section: {
    padding: 16,
    marginTop: 18,
    backgroundColor: AppColor.white,
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontFamily: Primary400,
    fontSize: 18,
  },
  getDirectionBtn: {
    backgroundColor: "#FC7B0338",
    color: AppColor.primary,
    borderRadius: 8,
    padding: 6,
    fontFamily: Secondary400,
    fontSize: 14,
  },
  mapViewWrap: {
    height: 170,
  },
  mapView: {
    flex: 1,
  },
  infoRowsWrap: {
    padding: 16,
    marginVertical: 18,
    backgroundColor: AppColor.white,
    gap: 10,
  },
  infoRowContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoRowTitle: {
    fontFamily: Primary400,
    fontSize: 16,
  },
  infoRowValue: {
    fontFamily: Secondary400,
    fontSize: 14,
  },
  tabsWrap: {
    paddingHorizontal: 16,
    backgroundColor: AppColor.white,
  },
  tabsRow: {
    flexDirection: "row",
    borderBlockColor: AppColor.borderColor,
    borderBottomWidth: 1,
  },
  tabBtn: {
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    marginRight: 8,
    paddingVertical: 18,
  },
  tabBtnActive: {
    borderBottomColor: AppColor.primary,
  },
  tabText: {
    fontFamily: Secondary400,
    fontSize: 16,
  },
  tabTextActive: {
    color: AppColor.primary,
  },
  menuItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  menuImg: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  menuTitle: {
    fontFamily: Primary400,
    fontSize: 16,
  },
  menuDesc: {
    fontFamily: Secondary400,
    fontSize: 14,
  },
  menuPrice: {
    fontFamily: Primary400,
    fontSize: 14,
    color: AppColor.primary,
  },
  menuQtyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 10,
  },
  qtyBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  qtyBtnText: {
    fontFamily: Primary400,
    fontSize: 18,
    color: AppColor.primary,
  },
  qtyText: {
    fontFamily: Primary400,
    fontSize: 15,
    color: AppColor.text,
    marginHorizontal: 4,
  },
  bottomBar: {
    backgroundColor: AppColor.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: 4,
  },
  bottomBarBtn: {
    alignItems: "center",
  },
  bottomBarText: {
    fontFamily: Primary400,
    fontSize: 17,
    color: AppColor.white,
    letterSpacing: 1,
  },
  bottomBarSubText: {
    fontFamily: Secondary400,
    fontSize: 13,
    color: AppColor.white,
    marginTop: 2,
  },
  noMenuText: {
    fontFamily: Secondary400,
    fontSize: 15,
    color: AppColor.textHighlighter,
    marginHorizontal: 16,
    marginTop: 10,
  },
  HR: {
    height: 1,
    backgroundColor: "#E5E5EA",
  },
});

export default FoodTruckDetailScreen;
