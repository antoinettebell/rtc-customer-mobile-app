import React, { useEffect } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";

// Icon mapping for different status types
const statusIcons = {
  "Order Placed": "check-circle",
  "Order Accepted": "check-circle",
  Preparing: "restaurant",
  "Ready for Pickup": "local-dining",
  "On the Way": "directions-bike",
  Delivered: "notifications",
  Cancelled: "cancel",
  default: "radio-button-unchecked",
};

const OrderTrackingSteps = ({ steps, currentStep }) => {
  // Animation values for the ripple effect
  const rippleScale = new Animated.Value(1);
  const rippleOpacity = new Animated.Value(0.7);

  useEffect(() => {
    // Create ripple animation for current step
    const rippleAnimation = Animated.loop(
      Animated.parallel([
        Animated.timing(rippleScale, {
          toValue: 1.8,
          duration: 1500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(rippleOpacity, {
          toValue: 0,
          duration: 1500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    rippleAnimation.start();

    return () => {
      rippleAnimation.stop();
      rippleScale.setValue(1);
      rippleOpacity.setValue(0.7);
    };
  }, [currentStep]);

  const getIconForStep = (stepTitle, index) => {
    if (index < currentStep) return "check-circle";
    if (index === currentStep)
      return statusIcons[stepTitle] || statusIcons.default;
    return statusIcons[stepTitle] || statusIcons.default;
  };

  return (
    <View>
      {steps.map((step, idx) => (
        <View key={`step-${idx}`} style={styles.stepRow}>
          <View style={styles.iconCol}>
            {idx === currentStep ? (
              <View style={styles.rippleContainer}>
                {/* Ripple effect layer */}
                <Animated.View
                  style={[
                    styles.ripple,
                    {
                      transform: [{ scale: rippleScale }],
                      opacity: rippleOpacity,
                      borderColor: AppColor.primary,
                    },
                  ]}
                />
                {/* Main icon */}
                <View style={[styles.iconCircle, styles.iconActive]}>
                  <MaterialIcons
                    name={getIconForStep(step.title, idx)}
                    size={20}
                    color={AppColor.primary}
                  />
                </View>
              </View>
            ) : (
              <View
                style={[
                  styles.iconCircle,
                  idx < currentStep ? styles.iconDone : styles.iconInactive,
                ]}
              >
                <MaterialIcons
                  name={getIconForStep(step.title, idx)}
                  size={20}
                  color={idx < currentStep ? AppColor.white : AppColor.subText}
                />
              </View>
            )}
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
                idx < currentStep && styles.stepTitleDone,
              ]}
            >
              {step.title}
            </Text>
            {step.time && <Text style={styles.stepTime}>{step.time}</Text>}
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  stepRow: {
    flexDirection: "row",
  },
  iconCol: {
    alignItems: "center",
  },
  rippleContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  ripple: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: AppColor.primary,
    opacity: 0.2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  iconDone: {
    backgroundColor: AppColor.primary,
  },
  iconActive: {
    backgroundColor: AppColor.white,
    borderWidth: 1,
    borderColor: AppColor.primary,
    zIndex: 2, // Ensure icon stays above ripple
  },
  iconInactive: {
    backgroundColor: AppColor.border,
  },
  verticalLine: {
    width: 2,
    flex: 1,
    borderRadius: 2,
    minHeight: 20,
  },
  lineActive: {
    backgroundColor: AppColor.primary,
  },
  lineInactive: {
    backgroundColor: AppColor.border,
  },
  stepTextWrap: {
    paddingLeft: 8,
    marginVertical: 2,
  },
  stepTitle: {
    fontFamily: Secondary400,
    fontSize: 15,
    color: AppColor.subText,
  },
  stepTitleActive: {
    color: AppColor.primary,
    fontFamily: Primary400,
  },
  stepTitleDone: {
    color: AppColor.text,
    fontFamily: Primary400,
  },
  stepTime: {
    fontFamily: Secondary400,
    fontSize: 13,
    color: AppColor.subText,
  },
});

export default OrderTrackingSteps;
