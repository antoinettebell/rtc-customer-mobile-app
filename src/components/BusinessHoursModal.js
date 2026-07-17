import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppColor, Mulish400, Mulish600 } from "../utils/theme";
import ActionSheet from "react-native-actions-sheet";
import { IconButton } from "react-native-paper";
import moment from "moment";
import PropTypes from "prop-types";

const { height } = Dimensions.get("window");

const dayLabels = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

const getTruckLabel = (foodTruckDetail, truckUnitId) => {
  const activeUnits = (foodTruckDetail?.truck_units || []).filter(
    (unit) => !unit.is_archived
  );
  const unitIndex = activeUnits.findIndex(
    (unit) => unit._id?.toString() === truckUnitId?.toString()
  );
  if (unitIndex >= 0) {
    return `Truck ${unitIndex + 1}`;
  }
  return activeUnits.length > 1 ? "Truck" : null;
};

const BusinessHoursModal = ({ actionSheetRef, foodTruckDetail }) => {
  const insets = useSafeAreaInsets();

  return (
    <ActionSheet
      ref={actionSheetRef}
      gestureEnabled={true}
      isModal={Platform.OS === "ios"}
    >
      <View
        style={{
          maxHeight: height - insets.top - insets.bottom - 10,
          paddingBottom: Platform.OS === "ios" ? 10 : 0,
          paddingHorizontal: 20,
        }}
      >
        {/* Header with close button */}
        <View style={styles.actionSheetHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.modalTitle}>Business Hours</Text>
          </View>
          <IconButton
            icon="close"
            iconColor={AppColor.text}
            onPress={() => actionSheetRef.current?.hide()}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.actionSheetScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View>
              {foodTruckDetail?.locations.map((loc) => {
                const locationAvailability =
                  foodTruckDetail.businessHours.filter(
                    (slot) => slot.locationId === loc._id && slot.available
                  );
                return (
                  <View key={loc._id}>
                    {/* Location Title */}
                    <View style={styles.locationTitleContainer}>
                      <Text style={styles.locationTitle}>
                        {`${loc.title}\n`}
                        <Text style={styles.locationAddress}>
                          {`${loc.address}`}
                        </Text>
                      </Text>
                    </View>

                    {/* Availability of Locations */}
                    {locationAvailability.length === 0 ? (
                      <View style={styles.noAvailabilityContainer}>
                        <Text>No business hours for this location.</Text>
                      </View>
                    ) : (
                      <View style={styles.availabilityContainer}>
                        {locationAvailability.map((slot) => {
                          const openTime = moment(
                            slot.startTime,
                            "HH:mm"
                          ).format("hh:mm A");
                          const closeTime = moment(
                            slot.endTime,
                            "HH:mm"
                          ).format("hh:mm A");

                          return (
                            <View
                              key={slot._id}
                              style={styles.businessHourSlot}
                            >
                              <Text
                                numberOfLines={1}
                                style={styles.businessHourText}
                              >
                                {`${openTime} - ${closeTime}`}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          <Text style={[styles.modalTitle, styles.sectionTitle]}>
            Weekly Schedule
          </Text>
          <View>
              {foodTruckDetail?.locations.map((loc) => {
                const locationAvailability =
                  foodTruckDetail.availability.filter(
                    (slot) => slot.locationId === loc._id && slot.available
                  );
                return (
                  <View key={loc._id}>
                    {/* Location Title */}
                    <View style={styles.locationTitleContainer}>
                      <Text style={styles.locationTitle}>
                        {`${loc.title}\n`}
                        <Text style={styles.locationAddress}>
                          {`${loc.address}`}
                        </Text>
                      </Text>
                    </View>

                    {/* Availability of Locations */}
                    {locationAvailability.length === 0 ? (
                      <View style={styles.noAvailabilityContainer}>
                        <Text>No availability for this location.</Text>
                      </View>
                    ) : (
                      <View style={styles.availabilityContainer}>
                        {locationAvailability.map((slot) => {
                          const openTime = moment(
                            slot.startTime,
                            "HH:mm"
                          ).format("hh:mm A");
                          const closeTime = moment(
                            slot.endTime,
                            "HH:mm"
                          ).format("hh:mm A");
                          const truckLabel = getTruckLabel(
                            foodTruckDetail,
                            slot.truckUnitId
                          );

                          return (
                            <View
                              key={slot._id}
                              style={styles.preOrderSlot}
                            >
                              <Text style={styles.preOrderDay}>
                                {dayLabels[slot.day] || slot.day}
                              </Text>
                              {truckLabel ? (
                                <Text style={styles.truckLabel}>
                                  {truckLabel}
                                </Text>
                              ) : null}
                              <Text
                                numberOfLines={1}
                                style={styles.preOrderTime}
                              >
                                {`${openTime} - ${closeTime}`}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
        </ScrollView>
      </View>
    </ActionSheet>
  );
};

const styles = StyleSheet.create({
  actionSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingBottom: 10,
  },
  actionSheetScrollContent: {
    paddingBottom: 20,
  },
  modalTitle: {
    fontFamily: Mulish600,
    fontSize: 18,
    color: AppColor.text,
  },
  sectionTitle: {
    marginTop: 18,
    marginBottom: 4,
  },
  locationTitleContainer: {
    borderWidth: 1,
    borderColor: AppColor.primary,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
    backgroundColor: AppColor.primary + 20,
  },
  locationTitle: {
    fontFamily: Mulish600,
    fontSize: 15,
  },
  locationAddress: {
    fontFamily: Mulish400,
    fontSize: 14,
  },
  noAvailabilityContainer: {
    marginLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: AppColor.primary,
    paddingLeft: 16,
    paddingVertical: 10,
  },
  availabilityContainer: {
    marginLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: AppColor.primary,
    paddingTop: 10,
    paddingLeft: 16,
    gap: 10,
    marginBottom: 8,
  },
  businessHourSlot: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 6,
    borderColor: AppColor.borderColor,
  },
  businessHourText: {
    fontSize: 15,
    fontFamily: Mulish400,
    textTransform: "capitalize",
    color: AppColor.text,
  },
  preOrderSlot: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 6,
    borderColor: AppColor.borderColor,
  },
  preOrderDay: {
    fontFamily: Mulish400,
    fontSize: 15,
    textTransform: "capitalize",
    color: AppColor.text,
  },
  preOrderTime: {
    fontSize: 15,
    fontFamily: Mulish400,
    textTransform: "capitalize",
    color: AppColor.text,
  },
  truckLabel: {
    fontFamily: Mulish600,
    fontSize: 13,
    color: AppColor.textHighlighter,
    marginHorizontal: 8,
  },
});

BusinessHoursModal.propTypes = {
  actionSheetRef: PropTypes.object.isRequired,
  foodTruckDetail: PropTypes.object.isRequired,
};

export default BusinessHoursModal;
