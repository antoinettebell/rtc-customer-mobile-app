import React from "react";
import { Image, StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  Ellipse,
  G,
  Line,
  Path,
  Rect,
} from "react-native-svg";

const AppLogo = require("../assets/images/AppLogo.png");

const ExploreHeaderArtwork = ({ width = 233, height = 190 }) => (
  <View style={[styles.container, { width, height }]}>
    <Svg width={width} height={height} viewBox="0 0 233 190" fill="none">
      <Rect x="0" y="0" width="233" height="190" rx="16" fill="#FFF7EF" />
      <Circle cx="190" cy="24" r="20" fill="#FFD35A" opacity="0.9" />
      <Path
        d="M3 29c18-20 43-22 64-5 11 9 25 9 36 0 28-24 59-20 85 1 12 10 27 10 42 2"
        stroke="#D9F2FF"
        strokeWidth="18"
        strokeLinecap="round"
      />
      <Path
        d="M99 28c-12-7-22-13-30-12 9 8 18 14 30 20 12-6 21-12 30-20-8-1-19 5-30 12Z"
        fill="#1D9BF0"
      />
      <Path
        d="M99 29c-8-9-12-17-12-25 8 5 13 12 16 23 11-5 20-5 28-2-9 5-19 8-32 4Z"
        fill="#0B75C9"
      />
      <Path
        d="M99 29c8-9 12-17 12-25-8 5-13 12-16 23-11-5-20-5-28-2 9 5 19 8 32 4Z"
        fill="#32B7FF"
      />
      <Circle cx="99" cy="28" r="5" fill="#0A4E85" />
      <Path d="M104 28l8-4-7 7Z" fill="#F59E0B" />
      <Path
        d="M15 112c8-14 28-14 39 0M176 107c8-12 25-12 35 0"
        stroke="#0F1F2E"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
      <G transform="translate(129 132)">
        <Rect x="10" y="18" width="75" height="33" rx="3" fill="#A9E7FF" />
        <Rect x="18" y="23" width="27" height="16" fill="#FFFFFF" />
        <Rect x="51" y="23" width="20" height="23" fill="#6CCEF5" />
        <Rect x="16" y="20" width="34" height="5" fill="#0F1F2E" />
        <Rect x="12" y="51" width="73" height="3" fill="#0F1F2E" />
        <Circle cx="25" cy="57" r="11" fill="#FFFFFF" stroke="#0F1F2E" strokeWidth="2" />
        <Circle cx="73" cy="57" r="11" fill="#FFFFFF" stroke="#0F1F2E" strokeWidth="2" />
        <Line x1="25" y1="46" x2="25" y2="68" stroke="#0F1F2E" strokeWidth="1" />
        <Line x1="14" y1="57" x2="36" y2="57" stroke="#0F1F2E" strokeWidth="1" />
        <Line x1="73" y1="46" x2="73" y2="68" stroke="#0F1F2E" strokeWidth="1" />
        <Line x1="62" y1="57" x2="84" y2="57" stroke="#0F1F2E" strokeWidth="1" />
        <Ellipse cx="51" cy="10" rx="12" ry="4" fill="#FFB020" />
        <Path d="M48 10c1-9 9-10 12-2" stroke="#F97316" strokeWidth="3" strokeLinecap="round" />
      </G>
    </Svg>
    <Image source={AppLogo} style={styles.logo} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  logo: {
    height: 92,
    left: 74,
    position: "absolute",
    resizeMode: "contain",
    top: 70,
    transform: [{ rotate: "-9deg" }],
    width: 92,
  },
});

export default ExploreHeaderArtwork;
