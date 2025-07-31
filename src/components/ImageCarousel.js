import React, { useState } from "react";
import { View, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import Carousel from "react-native-reanimated-carousel";
import { AppColor } from "../utils/theme";
import FastImage from "@d11/react-native-fast-image";
import AppImage from "./AppImage";

const { width } = Dimensions.get("window");

const ImageCarousel = ({
  containerHeight = 210,
  containerWidth = width,
  containerStyle = {},
  images,
  imageResizeMode = "cover",
  imageContainer = {},
  imageStyle = {},
  dotStyle,
  dotActiveStyle,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) return null;

  return (
    <View style={[styles.carouselContainer, containerStyle]}>
      <Carousel
        width={containerWidth}
        height={containerHeight}
        data={images}
        scrollAnimationDuration={500}
        onSnapToItem={setActiveIndex}
        renderItem={({ item }) => (
          <AppImage
            uri={item}
            priority={FastImage.priority.high}
            cache={FastImage.cacheControl.immutable}
            resizeMode={imageResizeMode}
            containerStyle={{
              width: "100%",
              height: "100%",
              ...imageContainer,
            }}
            imageStyle={{
              ...styles.image,
              ...imageStyle,
            }}
          />
        )}
        panGestureHandlerProps={{ activeOffsetX: [-10, 10] }}
        loop={false}
      />
      {images.length > 1 && (
        <View style={styles.dotsRow}>
          {images.map((_, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.dot,
                dotStyle,
                activeIndex === idx && [styles.dotActive, dotActiveStyle],
              ]}
              onPress={() => setActiveIndex(idx)}
              activeOpacity={0.7}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  carouselContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 10,
    right: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColor.white,
    marginHorizontal: 4,
    opacity: 0.5,
    borderWidth: 1,
    borderColor: AppColor.primary,
  },
  dotActive: {
    backgroundColor: AppColor.primary,
    opacity: 1,
  },
});

export default ImageCarousel;
