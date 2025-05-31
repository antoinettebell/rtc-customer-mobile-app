import React, { useRef, useState } from "react";
import {
  View,
  FlatList,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { AppColor } from "../utils/theme";

const { width } = Dimensions.get("window");

const ImageCarousel = ({ images, imageStyle, dotStyle, dotActiveStyle }) => {
  const flatListRef = useRef();
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewRef = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  });
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const handleDotPress = (idx) => {
    flatListRef.current?.scrollToIndex({ index: idx, animated: true });
  };

  if (!images || images.length === 0) return null;

  return (
    <View style={styles.carouselContainer}>
      <FlatList
        ref={flatListRef}
        data={images}
        keyExtractor={(_, idx) => idx.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <Image source={item} style={[styles.image, imageStyle]} />
        )}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewConfigRef.current}
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
              onPress={() => handleDotPress(idx)}
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
    width: width,
    height: 180,
    resizeMode: "cover",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 10,
    left: 0,
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
