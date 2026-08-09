import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import AppImage from "./AppImage";
import { AppColor } from "../utils/theme";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const ZoomableImageModal = ({ uri, title = "Image", onClose }) => {
  const insets = useSafeAreaInsets();
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (uri) setZoom(1);
  }, [uri]);

  return (
    <Modal transparent animationType="fade" visible={!!uri} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
          <TouchableOpacity onPress={onClose} style={styles.iconButton}>
            <MaterialIcons name="close" size={25} color={AppColor.white} />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => setZoom((value) => Math.max(1, value - 0.25))}
              disabled={zoom <= 1}
              style={styles.iconButton}
            >
              <MaterialIcons name="zoom-out" size={24} color={AppColor.white} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setZoom((value) => Math.min(3, value + 0.25))}
              disabled={zoom >= 3}
              style={styles.iconButton}
            >
              <MaterialIcons name="zoom-in" size={24} color={AppColor.white} />
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView horizontal contentContainerStyle={styles.centered}>
          <ScrollView contentContainerStyle={styles.centered}>
            <AppImage
              uri={uri}
              resizeMode="contain"
              containerStyle={{
                width: screenWidth * zoom,
                height: (screenHeight - 150) * zoom,
                backgroundColor: AppColor.black,
              }}
              imageStyle={styles.image}
            />
          </ScrollView>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.96)" },
  header: {
    minHeight: 76,
    paddingHorizontal: 12,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, color: AppColor.white, fontSize: 16, fontWeight: "700" },
  actions: { flexDirection: "row" },
  centered: { flexGrow: 1, alignItems: "center", justifyContent: "center" },
  image: { width: "100%", height: "100%" },
});

export default ZoomableImageModal;
