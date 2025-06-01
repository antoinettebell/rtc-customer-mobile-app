import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";

const OrderTrackingSteps = ({ steps, currentStep }) => {
  return (
    <View style={styles.container}>
      {steps.map((step, idx) => (
        <View key={idx} style={styles.stepRow}>
          <View style={styles.iconCol}>
            <View
              style={[
                styles.iconCircle,
                idx < currentStep
                  ? styles.iconDone
                  : idx === currentStep
                    ? styles.iconActive
                    : styles.iconInactive,
              ]}
            >
              {idx < currentStep ? <Text style={styles.check}>✓</Text> : null}
            </View>
            {idx < steps.length - 1 && (
              <View
                style={[
                  styles.verticalLine,
                  idx < currentStep ? styles.lineActive : styles.lineInactive,
                ]}
              />
            )}
          </View>
          <View style={styles.stepTextWrap}>
            <Text
              style={[
                styles.stepTitle,
                idx === currentStep && styles.stepTitleActive,
              ]}
            >
              {step.title}
            </Text>
            <Text style={styles.stepTime}>{step.time}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 12 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", minHeight: 48 },
  iconCol: { alignItems: "center", width: 32 },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  iconDone: { backgroundColor: AppColor.primary },
  iconActive: {
    backgroundColor: AppColor.white,
    borderWidth: 2,
    borderColor: AppColor.primary,
  },
  iconInactive: { backgroundColor: AppColor.border },
  check: { color: AppColor.white, fontWeight: "bold", fontSize: 16 },
  verticalLine: { width: 3, flex: 1, marginTop: 2, borderRadius: 2 },
  lineActive: { backgroundColor: AppColor.primary },
  lineInactive: { backgroundColor: AppColor.border },
  stepTextWrap: { flex: 1, paddingTop: 2 },
  stepTitle: {
    fontFamily: Secondary400,
    fontSize: 15,
    color: AppColor.subText,
  },
  stepTitleActive: { color: AppColor.primary, fontFamily: Primary400 },
  stepTime: { fontFamily: Secondary400, fontSize: 13, color: AppColor.subText },
});

export default OrderTrackingSteps;
