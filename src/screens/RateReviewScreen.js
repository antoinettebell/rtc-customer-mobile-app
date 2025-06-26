import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";
import AppHeader from "../components/AppHeader";

const reviews = [
  {
    id: 1,
    name: "John Doe",
    rating: 5,
    text: "Great food!",
    avatar: require("../assets/images/FoodImage.png"),
  },
  {
    id: 2,
    name: "Jack Joseph",
    rating: 4,
    text: "Nice service.",
    avatar: require("../assets/images/FoodImage.png"),
  },
  {
    id: 3,
    name: "Johnny",
    rating: 5,
    text: "Loved it!",
    avatar: require("../assets/images/FoodImage.png"),
  },
  {
    id: 4,
    name: "Homan",
    rating: 4,
    text: "Tasty and quick.",
    avatar: require("../assets/images/FoodImage.png"),
  },
];

const RateReviewScreen = () => {
  const [myRating, setMyRating] = React.useState(0);
  const [myReview, setMyReview] = React.useState("");

  return (
    <View style={styles.container}>
      <AppHeader headerTitle="RATE & REVIEW" />
      <View style={styles.ratingRow}>
        <Text style={styles.ratingNum}>4.8</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Text
              key={i}
              style={{
                color: i <= 4 ? AppColor.primary : "#ccc",
                fontSize: 22,
              }}
            >
              ★
            </Text>
          ))}
        </View>
        <Text style={styles.reviewCount}>1,800 Reviews</Text>
      </View>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.reviewRow}>
            <Image source={item.avatar} style={styles.avatar} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.reviewer}>{item.name}</Text>
              <View style={{ flexDirection: "row" }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Text
                    key={i}
                    style={{
                      color: i <= item.rating ? AppColor.primary : "#ccc",
                      fontSize: 14,
                    }}
                  >
                    ★
                  </Text>
                ))}
              </View>
              <Text style={styles.reviewText}>{item.text}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 120 }}
      />
      <View style={styles.myReviewBox}>
        <Text style={styles.sectionTitle}>Your Review</Text>
        <View style={{ flexDirection: "row", marginBottom: 8 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <TouchableOpacity key={i} onPress={() => setMyRating(i)}>
              <Text
                style={{
                  color: i <= myRating ? AppColor.primary : "#ccc",
                  fontSize: 22,
                }}
              >
                ★
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.input}
          placeholder="Write your review..."
          value={myReview}
          onChangeText={setMyReview}
        />
        <TouchableOpacity style={styles.submitBtn}>
          <Text style={styles.submitBtnText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  ratingRow: { alignItems: "center", marginVertical: 16 },
  ratingNum: { fontFamily: Primary400, fontSize: 32, color: AppColor.primary },
  starsRow: { flexDirection: "row", marginVertical: 4 },
  reviewCount: {
    fontFamily: Secondary400,
    fontSize: 14,
    color: AppColor.textHighlighter,
  },
  reviewRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F1F2",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    marginHorizontal: 16,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  reviewer: { fontFamily: Primary400, fontSize: 15 },
  reviewText: { fontFamily: Secondary400, fontSize: 13 },
  myReviewBox: {
    backgroundColor: "#F0F1F2",
    borderRadius: 8,
    padding: 16,
    margin: 16,
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  sectionTitle: { fontFamily: Primary400, fontSize: 16, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    padding: 8,
    fontFamily: Secondary400,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  submitBtn: {
    backgroundColor: AppColor.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  submitBtnText: { color: "#fff", fontFamily: Primary400, fontSize: 15 },
});

export default RateReviewScreen;
