import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconButton, Snackbar } from "react-native-paper";
import { Switch } from "react-native-paper";

import { AppColor, Mulish500, Mulish700 } from "../utils/theme";
import StatusBarManager from "../components/StatusBarManager";
import {
  getDietList_API,
  getDietRestrictList_API,
  updateDietRestrictList_API,
} from "../apiFolder/appAPI";

const DietRestrictionScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [dietList, setDietList] = useState([]);
  const [dietRestrictList, setDietRestrictList] = useState([]);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "info",
  });
  const [refreshing, setRefreshing] = useState(false);

  const handleDietRestrictionUpdate = async (dietId, newValue) => {
    let newRestrictedList;
    const currentRestrictedList = dietRestrictList; // Capture current state

    if (newValue === false) {
      // User wants to restrict (switch off)
      if (!currentRestrictedList.includes(dietId)) {
        newRestrictedList = [...currentRestrictedList, dietId];
      } else {
        newRestrictedList = currentRestrictedList;
      }
    } else {
      // User wants to unrestrict (switch on)
      newRestrictedList = currentRestrictedList.filter((id) => id !== dietId);
    }

    setDietRestrictList(newRestrictedList); // Update the state synchronously

    try {
      const response = await updateDietRestrictList_API({
        diet: newRestrictedList,
      });
      if (response.success) {
        setSnackbar({
          visible: true,
          message: "Diet restriction updated successfully!",
          type: "success",
        });
      } else {
        setSnackbar({
          visible: true,
          message: "Failed to update diet restriction.",
          type: "error",
        });
      }
    } catch (error) {
      console.log("Error updating diet restriction:", error);
      setSnackbar({
        visible: true,
        message: "Error updating diet restriction.",
        type: "error",
      });
    }
  };

  const getInitialDataFromAPI = async () => {
    setRefreshing(true);
    try {
      const response1 = await getDietList_API();
      if (response1.success && response1.data) {
        console.log("response1.data.dietList => ", response1.data.dietList);
        setDietList(response1.data.dietList);
      }

      const response2 = await getDietRestrictList_API();
      if (response2.success && response2.data) {
        const restrictedIds = response2?.data?.userRestrictDietList?.map(
          (diet) => diet._id
        );
        console.log("restrictedIds => ", restrictedIds);
        setDietRestrictList(restrictedIds);
      }
    } catch (error) {
      console.log(error);
      setSnackbar({
        visible: true,
        message: "Error fetching data",
        type: "error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    getInitialDataFromAPI();
  }, []);

  const renderDietItem = ({ item }) => (
    <View style={styles.dietItemContainer}>
      <Text style={styles.dietName}>{item.name}</Text>
      <Switch
        value={!dietRestrictList.includes(item._id)}
        onValueChange={(newValue) =>
          handleDietRestrictionUpdate(item._id, newValue)
        }
        color={AppColor.primary}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBarManager />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <View style={{ width: "20%" }}>
            <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
          </View>
          <Text style={styles.headerTitle}>{"Diet Restriction"}</Text>
          <View style={{ width: "20%" }} />
        </View>
      </View>

      {loading ? (
        <View
          style={[styles.loadingContainer, { paddingBottom: insets.bottom }]}
        >
          <ActivityIndicator size="large" color={AppColor.primary} />
        </View>
      ) : (
        <View style={styles.subContainer}>
          <FlatList
            data={dietList}
            renderItem={renderDietItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.flatListContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={getInitialDataFromAPI}
                tintColor={AppColor.primary}
              />
            }
          />
        </View>
      )}

      {/* Snackbar */}
      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={3000}
        style={{
          backgroundColor:
            snackbar.type === "success"
              ? AppColor.snackbarSuccess
              : snackbar.type === "error"
                ? AppColor.snackbarError
                : AppColor.snackbarInfo,
        }}
      >
        {snackbar.message}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColor.white,
  },
  header: {
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: AppColor.border,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: Mulish700,
    textAlign: "center",
    color: AppColor.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  subContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dietItemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColor.border,
  },
  dietName: {
    fontFamily: Mulish500,
    fontSize: 16,
    color: AppColor.text,
  },
  flatListContent: {
    paddingBottom: 20,
  },
});

export default DietRestrictionScreen;
