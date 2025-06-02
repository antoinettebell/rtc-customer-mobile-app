import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";
import { useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RateTruckScreen = (props) => {
  const { params } = useRoute();
  const order = params?.order;
  const insets = useSafeAreaInsets();

  const [rating, setRating] = useState(4);
  const [review, setReview] = useState("");

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />
      {/* Header */}
      <View style={styles.headerWrap}>
        <TouchableOpacity
          onPress={() => props.navigation.goBack()}
          style={styles.backBtn}
        >
          <MaterialIcons name="arrow-back" size={28} color={AppColor.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>RATE TRUCK</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.iconWrap}>
        <Image
          source={require("../assets/images/FT-Demo-01.png")}
          style={styles.icon}
        />
      </View>
      <Text style={styles.title}>RATE FooD TRUCK</Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <TouchableOpacity key={i} onPress={() => setRating(i)}>
            <Text style={[styles.star, i <= rating && styles.starActive]}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={styles.input}
        placeholder="Write review"
        value={review}
        onChangeText={setReview}
        placeholderTextColor={AppColor.textPlaceholder}
        multiline
      />
      <TouchableOpacity style={styles.addPhotoBtn}>
        <Image
          source={require("../assets/images/bin.png")}
          style={styles.addPhotoIcon}
        />
        <Text style={styles.addPhotoText}>Add Photos</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.submitBtn}>
        <Text style={styles.submitBtnText}>Submit Review</Text>
      </TouchableOpacity>
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
  headerSpacer: {
    width: 28,
  },
  iconWrap: { alignItems: "center", marginTop: 16 },
  icon: { width: 64, height: 64, borderRadius: 32 },
  title: {
    fontFamily: Primary400,
    fontSize: 18,
    textAlign: "center",
    marginVertical: 8,
    color: AppColor.text,
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 8,
  },
  star: { fontSize: 32, color: AppColor.border },
  starActive: { color: AppColor.ratingStar },
  input: {
    borderWidth: 1,
    borderColor: AppColor.border,
    borderRadius: 8,
    padding: 8,
    margin: 16,
    fontFamily: Secondary400,
    minHeight: 60,
  },
  addPhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: AppColor.primary,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  addPhotoIcon: {
    width: 24,
    height: 24,
    tintColor: AppColor.primary,
    marginRight: 8,
  },
  addPhotoText: {
    color: AppColor.primary,
    fontFamily: Secondary400,
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: AppColor.primary,
    borderRadius: 5,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
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
  submitBtnText: {
    color: AppColor.white,
    fontFamily: Secondary400,
    fontSize: 16,
    textAlign: "center",
  },
});

export default RateTruckScreen;
