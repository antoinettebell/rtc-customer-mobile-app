import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
} from "react-native";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";
import AppHeader from "../components/AppHeader";

const coupons = [
  { code: "GETDESERT1", desc: "GET 50% OFF FOR ALL ORDERS OVER $5.00" },
  { code: "GETDESERT2", desc: "GET 50% OFF FOR ALL ORDERS OVER $5.00" },
  { code: "GETDESERT3", desc: "GET 50% OFF FOR ALL ORDERS OVER $5.00" },
];

const CouponCodeScreen = ({ navigation, route }) => {
  const setCoupon = route.params?.setCoupon;
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState(null);

  const filteredCoupons = coupons.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <AppHeader headerTitle="COUPON CODE" />
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Have you a coupon code?"
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={styles.applyBtn}>
          <Text style={styles.applyBtnText}>Apply</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filteredCoupons}
        keyExtractor={(item) => item.code}
        renderItem={({ item }) => (
          <View
            style={[
              styles.couponRow,
              selected === item.code && styles.couponRowSelected,
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.couponDesc}>{item.desc}</Text>
              <Text style={styles.couponCode}>{item.code}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.couponApplyBtn,
                selected === item.code && styles.couponApplyBtnSelected,
              ]}
              onPress={() => {
                setSelected(item.code);
                setCoupon && setCoupon(item.code);
                navigation.goBack();
              }}
              disabled={selected === item.code}
            >
              <Text
                style={[
                  styles.couponApplyBtnText,
                  selected === item.code && styles.couponApplyBtnTextSelected,
                ]}
              >
                {selected === item.code ? "Applied" : "Apply"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    padding: 10,
    fontFamily: Secondary400,
    backgroundColor: "#F8F8F8",
  },
  applyBtn: {
    backgroundColor: AppColor.primary,
    borderRadius: 8,
    padding: 12,
    marginLeft: 8,
  },
  applyBtnText: { color: "#fff", fontFamily: Primary400 },
  couponRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FC7B0338",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  couponRowSelected: {
    borderColor: AppColor.primary,
    backgroundColor: "#FFF6ED",
  },
  couponDesc: { fontFamily: Secondary400, fontSize: 14 },
  couponCode: {
    fontFamily: Primary400,
    fontSize: 15,
    color: AppColor.primary,
    marginTop: 2,
  },
  couponApplyBtn: {
    backgroundColor: AppColor.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginLeft: 10,
  },
  couponApplyBtnSelected: { backgroundColor: AppColor.textHighlighter },
  couponApplyBtnText: { color: "#fff", fontFamily: Primary400 },
  couponApplyBtnTextSelected: { color: AppColor.primary },
});

export default CouponCodeScreen;
