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

const { width } = Dimensions.get("window");

// Example data for demonstration
const DEMO_IMAGES = [
  require("../assets/images/FT-Demo-01.png"),
  require("../assets/images/FT-Demo-02.png"),
];

const INFO_ROWS = [
  {
    icon: (
      <FontAwesome6 name="location-dot" size={20} color={AppColor.primary} />
    ),
    title: "Truck Location",
    value: "47 W 13th St, New York, NY 10011, USA",
  },
  {
    icon: (
      <MaterialIcons name="access-time" size={20} color={AppColor.primary} />
    ),
    title: "Open Hours",
    value: "11:00 AM - 9:00 PM",
  },
  {
    icon: <FontAwesome6 name="circle-info" size={20} color={AppColor.black} />,
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
  { key: "asdad", label: "Asdad", items: [] },
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerIcon}
        >
          <MaterialIcons name="arrow-back" size={24} color={AppColor.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>DETAILS</Text>
        </View>
        <View style={styles.headerIcon} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <ImageCarousel images={images} imageStyle={styles.image} />
        {/* Name & Subname */}
        <View style={styles.nameRow}>
          <Text style={styles.title}>{item.name || "BURGER EXPRESS"}</Text>
          <Text style={styles.subname}>Food Truck</Text>
        </View>
        {/* Ratings & Food Types */}
        <View style={styles.ratingsRow}>
          <FontAwesome name="star" size={16} color={AppColor.ratingStar} />
          <Text style={styles.ratingText}>4.8 (200+ reviews)</Text>
          <Text style={styles.dot}>|</Text>
          <Text style={styles.cuisineText}>Mexican, American</Text>
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
            <FontAwesome name="instagram" size={22} color={AppColor.primary} />
          </TouchableOpacity>
        </View>
        {/* Location Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>CURRENT LOCATION</Text>
            <TouchableOpacity style={styles.getDirectionBtn}>
              <Text style={styles.getDirectionText}>Get Direction</Text>
            </TouchableOpacity>
          </View>
          {/* Map Placeholder */}
          <View style={styles.mapPlaceholder}>
            <FontAwesome6
              name="location-dot"
              size={32}
              color={AppColor.primary}
            />
            <Text style={styles.mapText}>Map Placeholder</Text>
          </View>
        </View>
        {/* Dynamic Info Rows */}
        <View style={styles.infoRowsWrap}>
          {INFO_ROWS.map((row, idx) => (
            <View key={idx} style={styles.infoRowContainer}>
              <View style={styles.infoRowLeft}>
                {row.icon}
                <Text style={styles.infoRowTitle}>{row.title}</Text>
              </View>
              <TouchableOpacity
                style={styles.infoRowRight}
                onPress={row.onPress}
                activeOpacity={row.onPress ? 0.7 : 1}
              >
                <Text style={styles.infoRowValue}>{row.value}</Text>
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
            <View style={{ width }}>
              {tab.items.length === 0 ? (
                <Text style={styles.noMenuText}>
                  No items available in this section.
                </Text>
              ) : (
                tab.items.map((menu) => (
                  <View key={menu.id} style={styles.menuItemRow}>
                    <Image source={menu.img} style={styles.menuImg} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.menuTitle}>{menu.name}</Text>
                      <Text style={styles.menuDesc}>{menu.desc}</Text>
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
                  </View>
                ))
              )}
            </View>
          )}
        />
      </ScrollView>
      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom || 12 }]}>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: AppColor.white,
  },
  headerIcon: {
    width: 32,
    alignItems: "center",
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: Primary400,
    fontSize: 16,
    color: AppColor.text,
    letterSpacing: 1.5,
  },
  image: {
    width: "100%",
    height: 180,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    resizeMode: "cover",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginHorizontal: 16,
  },
  title: {
    fontFamily: Primary400,
    fontSize: 20,
    color: AppColor.text,
    marginBottom: 2,
  },
  subname: {
    fontFamily: Secondary400,
    fontSize: 13,
    color: AppColor.textHighlighter,
  },
  ratingsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    marginHorizontal: 16,
    gap: 6,
  },
  ratingText: {
    fontFamily: Secondary400,
    fontSize: 13,
    color: AppColor.textHighlighter,
    marginLeft: 4,
  },
  dot: {
    color: AppColor.textHighlighter,
    marginHorizontal: 4,
  },
  cuisineText: {
    fontFamily: Secondary400,
    fontSize: 13,
    color: AppColor.textHighlighter,
  },
  socialRow: {
    flexDirection: "row",
    gap: 12,
    marginLeft: 16,
    marginTop: 8,
  },
  section: {
    marginTop: 18,
    marginHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontFamily: Primary400,
    fontSize: 15,
    color: AppColor.text,
    letterSpacing: 1,
  },
  getDirectionBtn: {
    backgroundColor: AppColor.yellow,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  getDirectionText: {
    fontFamily: Secondary400,
    fontSize: 12,
    color: AppColor.text,
  },
  mapPlaceholder: {
    height: 110,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  mapText: {
    fontFamily: Secondary400,
    fontSize: 13,
    color: AppColor.textHighlighter,
    marginTop: 4,
  },
  infoRowsWrap: {
    marginTop: 18,
    marginHorizontal: 16,
  },
  infoRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  infoRowTitle: {
    fontFamily: Primary400,
    fontSize: 15,
    color: AppColor.text,
  },
  infoRowRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoRowValue: {
    fontFamily: Secondary400,
    fontSize: 13,
    color: AppColor.text,
  },
  tabsWrap: {
    marginTop: 18,
    marginBottom: 6,
    marginHorizontal: 0,
    paddingLeft: 8,
  },
  tabsRow: {
    flexDirection: "row",
    marginTop: 18,
    marginBottom: 6,
    marginHorizontal: 0,
    paddingLeft: 8,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    marginRight: 8,
  },
  tabBtnActive: {
    borderBottomColor: AppColor.primary,
  },
  tabText: {
    fontFamily: Secondary400,
    fontSize: 15,
    color: AppColor.textHighlighter,
  },
  tabTextActive: {
    color: AppColor.primary,
    // fontFamily: Primary400,
  },
  menuItemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColor.white,
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 10,
    ...Platform.select({
      ios: {
        shadowColor: AppColor.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  menuImg: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#D1D5DB",
  },
  menuTitle: {
    fontFamily: Primary400,
    fontSize: 15,
    color: AppColor.text,
  },
  menuDesc: {
    fontFamily: Secondary400,
    fontSize: 12,
    color: AppColor.textHighlighter,
    marginTop: 2,
  },
  menuPrice: {
    fontFamily: Primary400,
    fontSize: 14,
    color: AppColor.primary,
    marginTop: 2,
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
});

export default FoodTruckDetailScreen;
