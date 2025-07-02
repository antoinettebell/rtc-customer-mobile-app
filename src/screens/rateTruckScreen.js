import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";
import { useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppHeader from "../components/AppHeader";
import ImagePicker from "react-native-image-crop-picker";
import usePermission from "../hooks/usePermission";
import { permission } from "../helpers/permission.helper";
import { RESULTS } from "react-native-permissions";
import FastImage from "@d11/react-native-fast-image";

const RateTruckScreen = (props) => {
  const { params } = useRoute();
  const order = params?.order;
  const insets = useSafeAreaInsets();

  const { checkAndRequestPermission: cameraPermissionStatus } = usePermission(
    permission.camera
  );

  // Configuration for max photos
  const MAX_PHOTOS = 3;

  // State management
  const [rating, setRating] = useState(4);
  const [review, setReview] = useState("");
  const [capturedImages, setCapturedImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Camera handling functions
  const handleCameraPress = async () => {
    try {
      const cameraStatus = await cameraPermissionStatus();
      if (cameraStatus !== RESULTS.GRANTED) return;

      setTimeout(
        async () => {
          await ImagePicker.openCamera({
            cropping: false,
            mediaType: "photo",
            width: 500,
            height: 500,
          })
            .then((image) => {
              const newImage = {
                id: Date.now().toString(),
                uri: image.path,
                width: image.width,
                height: image.height,
                mime: image.mime,
              };
              setCapturedImages((prev) => [...prev, newImage]);
            })
            .catch((error) => {
              if (error.message !== "User cancelled image selection") {
                console.log("Camera error => ", error);
                Alert.alert(
                  "Error",
                  "Failed to capture image. Please try again."
                );
              }
            });
        },
        Platform.OS === "ios" ? 600 : 0
      );
    } catch (error) {
      console.error("Camera permission error => ", error);
      Alert.alert(
        "Error",
        "Failed to access camera. Please check permissions."
      );
    }
  };

  const handleAddPhoto = () => {
    if (capturedImages.length >= MAX_PHOTOS) {
      Alert.alert(
        "Limit Reached",
        `You can only add up to ${MAX_PHOTOS} photos.`
      );
      return;
    }
    handleCameraPress();
  };

  const handleRemoveImage = (imageId) => {
    Alert.alert("Remove Photo", "Are you sure you want to remove this photo?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          setCapturedImages((prev) => prev.filter((img) => img.id !== imageId));
        },
      },
    ]);
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert(
        "Rating Required",
        "Please select a rating before submitting."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Here you would typically upload images and submit the review
      // For now, we'll simulate the submission

      const reviewData = {
        rating,
        review: review.trim(),
        images: capturedImages,
        orderId: order?.id,
        timestamp: new Date().toISOString(),
      };

      console.log("Submitting review:", reviewData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      Alert.alert(
        "Thank You!",
        "Your review has been submitted successfully.",
        [
          {
            text: "OK",
            onPress: () => {
              // Navigate back to previous screen
              props.navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Submit review error:", error);
      Alert.alert("Error", "Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((i) => (
      <TouchableOpacity
        key={i}
        onPress={() => setRating(i)}
        style={styles.starButton}
        activeOpacity={0.7}
      >
        <Text style={[styles.star, i <= rating && styles.starActive]}>★</Text>
      </TouchableOpacity>
    ));
  };

  const renderCapturedImages = () => {
    if (capturedImages.length === 0) return null;

    return (
      <View style={styles.imagesContainer}>
        <Text style={styles.imagesTitle}>
          Photos ({capturedImages.length}/{MAX_PHOTOS})
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imagesScrollView}
        >
          {capturedImages.map((image, index) => (
            <View key={image.id} style={styles.imageWrapper}>
              <Image source={{ uri: image.uri }} style={styles.capturedImage} />
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => handleRemoveImage(image.id)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="close" size={16} color={AppColor.white} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />
      <AppHeader headerTitle="RATE TRUCK" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <FastImage
              source={require("../assets/images/rateTruck.png")}
              style={styles.icon}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>RATE FOOD TRUCK</Text>

          <View style={styles.starsRow}>{renderStars()}</View>

          <View style={styles.ratingText}>
            <Text style={styles.ratingLabel}>
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Write your review here..."
            value={review}
            onChangeText={setReview}
            placeholderTextColor={AppColor.textPlaceholder}
            multiline
            textAlignVertical="top"
          />

          {renderCapturedImages()}

          <TouchableOpacity
            style={[
              styles.addPhotoBtn,
              capturedImages.length >= MAX_PHOTOS && styles.addPhotoBtnDisabled,
            ]}
            onPress={handleAddPhoto}
            disabled={capturedImages.length >= MAX_PHOTOS}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="add-a-photo"
              size={24}
              color={
                capturedImages.length >= MAX_PHOTOS
                  ? AppColor.textPlaceholder
                  : AppColor.primary
              }
              style={styles.addPhotoIcon}
            />
            <Text
              style={[
                styles.addPhotoText,
                capturedImages.length >= MAX_PHOTOS &&
                  styles.addPhotoTextDisabled,
              ]}
            >
              Add Photos ({capturedImages.length}/{MAX_PHOTOS})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={handleSubmitReview}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <Text style={styles.submitBtnText}>
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColor.white,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 20,
  },
  iconContainer: {
    height: 100,
    width: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 40,
    backgroundColor: AppColor.primary + "15",
  },
  icon: {
    width: 60,
    height: 60,
    tintColor: AppColor.primary,
  },
  title: {
    fontFamily: Primary400,
    fontSize: 20,
    textAlign: "center",
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  starButton: {
    marginHorizontal: 2,
    marginBottom: 20,
  },
  star: {
    fontSize: 36,
    color: AppColor.border,
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  starActive: {
    color: AppColor.ratingStar,
  },
  ratingText: {
    alignItems: "center",
  },
  ratingLabel: {
    fontFamily: Secondary400,
    fontSize: 16,
    color: AppColor.text,
  },
  input: {
    borderWidth: 1,
    borderColor: AppColor.border,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    fontFamily: Secondary400,
    fontSize: 16,
    minHeight: 100,
    maxHeight: 150,
    color: AppColor.text,
    backgroundColor: AppColor.inputBackground || AppColor.white,
  },
  imagesContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  imagesTitle: {
    fontFamily: Secondary400,
    fontSize: 16,
    color: AppColor.text,
    marginBottom: 12,
  },
  imagesScrollView: {
    flexDirection: "row",
  },
  imageWrapper: {
    // position: "relative",
    marginRight: 12,
    paddingVertical: 10,
  },
  capturedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColor.border,
  },
  removeImageBtn: {
    position: "absolute",
    right: -10,
    backgroundColor: AppColor.snackbarError,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: AppColor.white,
  },
  addPhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: AppColor.primary,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    borderStyle: "dashed",
    backgroundColor: "rgba(255, 107, 53, 0.05)",
  },
  addPhotoBtnDisabled: {
    borderColor: AppColor.textPlaceholder,
    backgroundColor: AppColor.disabled || "#F5F5F5",
  },
  addPhotoIcon: {
    marginRight: 12,
  },
  addPhotoText: {
    color: AppColor.primary,
    fontFamily: Secondary400,
    fontSize: 16,
  },
  addPhotoTextDisabled: {
    color: AppColor.textPlaceholder,
  },
  submitBtn: {
    backgroundColor: AppColor.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 8,
  },
  submitBtnDisabled: {
    backgroundColor: AppColor.textPlaceholder,
  },
  submitBtnText: {
    color: AppColor.white,
    fontFamily: Secondary400,
    fontSize: 18,
    textAlign: "center",
  },
});

export default RateTruckScreen;
