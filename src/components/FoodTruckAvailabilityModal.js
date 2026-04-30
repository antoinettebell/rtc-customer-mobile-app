import React, { useState } from "react";
import { Platform, View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import moment from "moment";
import { AppColor, Mulish700, Mulish400 } from "../utils/theme";

const FoodTruckAvailabilityModal = ({ visible, onClose, availability }) => {
  const daysOrder = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  // Group availability by day
  const groupedAvailability = daysOrder.map((day) => {
    const slots = availability.filter(
      (slot) => slot.day === day && slot.available
    );
    return { day, slots };
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{"Open Hours"}</Text>
          <Text style={styles.modalSubTitle}>{"See weekly open hours."}</Text>
          <View style={styles.HR} />

          {groupedAvailability.map(({ day, slots }) => (
            <View key={day} style={styles.dayRow}>
              <Text style={styles.dayName}>
                {moment().day(day).format("ddd")}
              </Text>

              {slots.length > 0 ? (
                <View style={styles.timeSlots}>
                  {slots.map((slot, idx) => (
                    <Text key={idx} style={styles.timeSlot}>
                      : {formatTime(slot.startTime)} -{" "}
                      {formatTime(slot.endTime)}
                    </Text>
                  ))}
                </View>
              ) : (
                <Text style={styles.closedText}>{"Closed"}</Text>
              )}
            </View>
          ))}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>{"Close"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Reuse your existing formatTime function
const formatTime = (timeStr) => {
  if (!timeStr || timeStr === "00:00") return "12:00 AM";
  return moment(timeStr, "HH:mm").format("h:mm A");
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "90%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 24,
    marginBottom: 5,
    fontFamily: Mulish700,
  },
  modalSubTitle: {
    fontSize: 18,
    color: AppColor.gray,
    fontFamily: Mulish400,
  },
  HR: {
    height: 1,
    marginVertical: 15,
    backgroundColor: AppColor.borderColor,
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  dayName: {
    width: 80,
    fontFamily: Mulish400,
    fontSize: 16,
  },
  timeSlots: {
    flex: 1,
  },
  timeSlot: {
    marginBottom: 4,
    fontFamily: Mulish400,
    fontSize: 16,
    color: AppColor.gray,
  },
  closedText: {},
  closeButton: {
    width: "100%",
    height: 48,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColor.primary,
    marginTop: 15,
    ...Platform.select({
      ios: {
        shadowColor: AppColor.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  closeButtonText: {
    color: "white",
    fontFamily: Mulish400,
    fontSize: 16,
  },
});

export default FoodTruckAvailabilityModal;
