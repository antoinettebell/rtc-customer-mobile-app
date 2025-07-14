import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { AppColor, Mulish700, Mulish400 } from "../utils/theme";
import AppHeader from "../components/AppHeader";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { getAllCoupons_API, validateCoupon_API } from "../apiFolder/appAPI";

const CouponCodeScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const setCoupon = route.params?.setCoupon;
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await getAllCoupons_API();
      if (response?.data?.couponList) {
        setCoupons(response.data.couponList);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch coupons");
      console.error("Error fetching coupons:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async (coupon) => {
    try {
      const validationResponse = await validateCoupon_API(coupon.code);
      if (validationResponse?.data?.valid) {
        setSelected(coupon.code);
        setCoupon && setCoupon(coupon); // Pass the entire coupon object
        navigation.goBack();
      } else {
        setError("This coupon is not valid");
      }
    } catch (err) {
      setError(err.message || "Failed to validate coupon");
      console.error("Error validating coupon:", err);
    }
  };

  const handleSearchApply = async () => {
    if (!search.trim()) return;

    try {
      // Validate the searched coupon
      const validationResponse = await validateCoupon_API(search.trim());
      if (validationResponse?.data?.valid) {
        const foundCoupon = coupons.find((c) => c.code === search.trim());
        if (foundCoupon) {
          setSelected(search.trim());
          setCoupon && setCoupon(foundCoupon); // Pass the found coupon object
          navigation.goBack();
        } else {
          setError("Coupon not found");
        }
      } else {
        setError("Coupon not found or invalid");
      }
    } catch (err) {
      setError(err.message || "Failed to validate coupon");
      console.error("Error validating coupon:", err);
    }
  };

  const filteredCoupons = coupons.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <AppHeader headerTitle="Copon Code" />
        <View style={[styles.centerContainer, { flex: 1 }]}>
          <ActivityIndicator size="large" color={AppColor.primary} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <AppHeader headerTitle="Copon Code" />
        <View style={[styles.centerContainer, { flex: 1 }]}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={fetchCoupons}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppHeader headerTitle="Copon Code" />
      <View
        style={{
          flex: 1,
          paddingHorizontal: 16,
          paddingVertical: 16,
        }}
      >
        <View style={styles.searchBarContainer}>
          <MaterialIcons
            name="search"
            size={22}
            color={AppColor.textPlaceholder}
            style={{ marginLeft: 10 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Have you a coupon code?"
            placeholderTextColor={AppColor.textPlaceholder}
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.searchApplyBtn}
            onPress={handleSearchApply}
          >
            <Text style={styles.searchApplyText}>Apply</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredCoupons}
          keyExtractor={(item) => item._id}
          style={{
            marginVertical: 16,
          }}
          contentContainerStyle={{
            gap: 15,
            backgroundColor: AppColor.white,
            borderRadius: 10,
            paddingBottom: insets.bottom,
          }}
          renderItem={({ item }) => (
            <View style={styles.couponCard}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={styles.couponTitle}>
                    {item.type === "PERCENTAGE"
                      ? `GET ${item.value}% OFF`
                      : `GET $${item.value} OFF`}
                  </Text>
                  <Text style={styles.couponDesc}>
                    {item.usageLimit === "NOLIMIT"
                      ? "No usage limit"
                      : "Limited usage"}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.couponApplyBtn}
                  onPress={() => handleApplyCoupon(item)}
                  disabled={selected === item.code}
                >
                  <Text style={styles.couponApplyBtnText}>
                    {selected === item.code ? "Applied" : "Apply"}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.couponCodeBox}>
                <Text style={styles.couponCodeText}>{item.code}</Text>
                <MaterialIcons
                  name={
                    selected === item.code
                      ? "check-box"
                      : "check-box-outline-blank"
                  }
                  size={22}
                  color={
                    selected === item.code
                      ? AppColor.primary
                      : AppColor.textPlaceholder
                  }
                  style={{ marginLeft: 8 }}
                />
              </View>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No coupons found matching your search.
            </Text>
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColor.white,
  },
  centerContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  screenGenericCard: {
    borderWidth: 1,
    borderColor: AppColor.borderColor,
    borderRadius: 10,
    marginVertical: 16,
    paddingVertical: 20,
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
        elevation: 1,
      },
    }),
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: AppColor.borderColor,
    borderRadius: 10,
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
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontFamily: Mulish400,
    fontSize: 16,
    color: AppColor.text,
    backgroundColor: "transparent",
  },
  searchApplyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  searchApplyText: {
    color: AppColor.primary,
    fontFamily: Mulish400,
    fontSize: 16,
  },
  couponCard: {
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: AppColor.borderColor,
  },
  couponTitle: {
    fontFamily: Mulish700,
    fontSize: 18,
  },
  couponDesc: {
    fontFamily: Mulish400,
    fontSize: 10,
    color: AppColor.gray,
  },
  couponApplyBtn: {
    borderRadius: 8,
    backgroundColor: AppColor.primary,
  },
  couponApplyBtnText: {
    color: "#fff",
    fontFamily: Mulish400,
    fontSize: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  couponCodeBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: AppColor.border,
    borderRadius: 6,
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  couponCodeText: {
    fontFamily: Mulish700,
    fontSize: 12,
    color: "#001246",
    letterSpacing: 1,
  },
  errorText: {
    color: AppColor.error,
    fontFamily: Mulish400,
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: AppColor.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  retryButtonText: {
    color: AppColor.white,
    fontFamily: Mulish700,
  },
  emptyText: {
    textAlign: "center",
    color: AppColor.subText,
    fontFamily: Mulish400,
  },
});

export default CouponCodeScreen;
