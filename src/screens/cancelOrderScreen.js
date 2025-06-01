import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
} from "react-native";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";
import { useNavigation } from "@react-navigation/native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FastImage from "@d11/react-native-fast-image";

const reasonsList = [
  "Order by mistake",
  "No response from food truck",
  "Take too much time",
  "Other",
];

const CancelOrderScreen = () => {
  const [selected, setSelected] = useState([]);
  const [reason, setReason] = useState("");
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const toggleReason = (idx) => {
    if (selected.includes(idx)) setSelected(selected.filter((i) => i !== idx));
    else setSelected([...selected, idx]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />
      {/* Header */}
      <View style={styles.headerWrap}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <MaterialIcons name="arrow-back" size={28} color={AppColor.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CANCEL ORDER</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.iconWrap}>
        {/* <Image
          source={require("../assets/images/lock.png")}
          style={styles.icon}
        /> */}
        <FastImage
          source={require("../assets/images/orderCancel.png")}
          style={styles.icon}
        />
      </View>
      <Text style={styles.title}>CANCEL ORDER</Text>
      <View style={styles.card}>
        {reasonsList.map((r, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.row}
            onPress={() => toggleReason(idx)}
          >
            <View
              style={[
                styles.checkbox,
                selected.includes(idx) && styles.checkboxActive,
              ]}
            />
            <Text style={styles.reasonText}>{r}</Text>
          </TouchableOpacity>
        ))}
        {selected.includes(3) && (
          <TextInput
            style={styles.input}
            placeholder="Reason"
            value={reason}
            onChangeText={setReason}
            placeholderTextColor={AppColor.textPlaceholder}
          />
        )}
      </View>
      <TouchableOpacity style={styles.submitBtn}>
        <Text style={styles.submitBtnText}>Submit</Text>
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
  iconWrap: {
    height: 110,
    width: 110,
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 60,
    backgroundColor: AppColor.primary + "20",
  },
  icon: {
    width: 64,
    height: 64,
    tintColor: AppColor.primary,
  },
  title: {
    fontFamily: Primary400,
    fontSize: 18,
    textAlign: "center",
    marginTop: 15,
    marginBottom: 30,
  },
  card: {
    borderWidth: 1,
    borderColor: AppColor.borderColor,
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: AppColor.white,
    marginHorizontal: 16,
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: AppColor.primary,
    borderRadius: 4,
    marginRight: 8,
  },
  checkboxActive: {
    backgroundColor: AppColor.primary,
  },
  reasonText: {
    fontFamily: Secondary400,
    fontSize: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: AppColor.border,
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    fontFamily: Secondary400,
  },
  submitBtn: {
    backgroundColor: AppColor.primary,
    borderRadius: 5,
    paddingVertical: 12,
    marginTop: 16,
    marginHorizontal: 16,
  },
  submitBtnText: {
    color: AppColor.white,
    fontFamily: Secondary400,
    fontSize: 16,
    textAlign: "center",
  },
});

export default CancelOrderScreen;
