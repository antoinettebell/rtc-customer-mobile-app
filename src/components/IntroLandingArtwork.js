import React from "react";
import { Image, StyleSheet, View } from "react-native";

const customerAuthHero = require("../assets/images/customer-auth-hero.jpg");

const IntroLandingArtwork = ({
  width = 412,
  height = 486,
  resizeMode = "cover",
}) => (
  <View style={[styles.container, { width, height }]}>
    <Image
      accessibilityIgnoresInvertColors
      accessibilityLabel="Round Da’ Corner food truck in a city park"
      resizeMode={resizeMode}
      source={customerAuthHero}
      style={styles.image}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#D9EEFC",
    overflow: "hidden",
  },
  image: {
    height: "100%",
    width: "100%",
  },
});

export default IntroLandingArtwork;
