import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppColor, Mulish700, Mulish400, Mulish600 } from "../utils/theme";
import ActionSheet from "react-native-actions-sheet";
import { IconButton, SegmentedButtons } from "react-native-paper";
import moment from "moment";
import PropTypes from "prop-types";

const { width, height } = Dimensions.get("window");

const getFutureDateForDay = (dayOfWeek) => {
  const today = moment();
  const dayMap = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
  };
  const targetDayIndex = dayMap[dayOfWeek.toLowerCase()];
  const currentDayIndex = today.day();

  let daysToAdd = targetDayIndex - currentDayIndex;

  if (daysToAdd < 0) {
    daysToAdd += 7;
  }

  return today.add(daysToAdd, "days");
};

const BusinessHoursModal = ({ actionSheetRef, foodTruckDetail }) => {
  const insets = useSafeAreaInsets();
  const [segment, setSegment] = useState("business");

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
            <SegmentedButtons
              value={segment}
              onValueChange={setSegment}
              buttons={[
                {
                  value: "business",
                  label: "Business Hours",
                },
                {
                  value: "preOrder",
                  label: "Pre-Order",
                },
              ]}
              theme={{
                colors: {
                  secondaryContainer: AppColor.primary,
                  onSecondaryContainer: AppColor.white,
                },
              }}
            />
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
          {segment === "business" ? (
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
          ) : (
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
                          const dateOfTheDay = getFutureDateForDay(slot.day);
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
                              style={styles.preOrderSlot}
                            >
                              <Text style={styles.preOrderDay}>
                                {dateOfTheDay.format("ddd (DD-MMM)")}
                              </Text>
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
          )}
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
});

BusinessHoursModal.propTypes = {
  actionSheetRef: PropTypes.object.isRequired,
  foodTruckDetail: PropTypes.object.isRequired,
};

export default BusinessHoursModal;