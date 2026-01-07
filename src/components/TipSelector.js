import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { TextInput } from "react-native-paper";
import { AppColor, Mulish400, Mulish600, Mulish700 } from "../utils/theme";

const TipSelector = ({ preTipTotal = 0, onTipChange }) => {
  const [selectedPercentage, setSelectedPercentage] = useState(null);
  const [customTip, setCustomTip] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const textInputRef = useRef(null);

  const tipPercentages = [5, 8, 10, 12];

  useEffect(() => {
    if (selectedPercentage !== null && !showCustomInput) {
      const tipAmount = (preTipTotal * selectedPercentage) / 100;
      onTipChange?.(tipAmount);
    } else if (showCustomInput) {
      // Handle edge cases for custom tip
      if (customTip === "" || customTip === ".") {
        onTipChange?.(0);
      } else {
        const customAmount = parseFloat(customTip) || 0;
        onTipChange?.(customAmount);
      }
    } else if (!showCustomInput && !selectedPercentage) {
      onTipChange?.(0);
    }
  }, [
    selectedPercentage,
    customTip,
    showCustomInput,
    preTipTotal,
    onTipChange,
  ]);

  const handlePercentageSelect = (percentage) => {
    setSelectedPercentage(percentage);
    setShowCustomInput(false);
    setCustomTip("");
  };

  const handleCustomClick = () => {
    // If a percentage is selected, calculate the tip amount and set it as default value
    if (selectedPercentage !== null) {
      const currentTipAmount = (preTipTotal * selectedPercentage) / 100;
      setCustomTip(currentTipAmount.toFixed(2));
    }
    setShowCustomInput(true);
    setSelectedPercentage(null);
  };

  // Focus the input when it becomes visible
  useEffect(() => {
    if (showCustomInput && textInputRef.current) {
      // Small delay to ensure the input is rendered before focusing
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    }
  }, [showCustomInput]);

  const handleCustomTipChange = (value) => {
    // Allow only numbers and decimal point
    const numericValue = value.replace(/[^0-9.]/g, "");
    // Ensure only one decimal point
    const parts = numericValue.split(".");
    if (parts.length > 2) {
      return;
    }
    setCustomTip(numericValue);
  };

  const handleCustomInputBlur = () => {
    // Hide the input when blurred
    setShowCustomInput(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.optionsContainer}>
        {/* Percentage Options */}
        <View style={styles.percentageContainer}>
          {tipPercentages.map((percentage, index) => (
            <React.Fragment key={percentage}>
              <TouchableOpacity
                style={[
                  styles.percentageOption,
                  selectedPercentage === percentage &&
                    styles.percentageOptionActive,
                ]}
                onPress={() => handlePercentageSelect(percentage)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.percentageText,
                    selectedPercentage === percentage &&
                      styles.percentageTextActive,
                  ]}
                >
                  {percentage}%
                </Text>
              </TouchableOpacity>
              {index < tipPercentages.length - 1 && (
                <View style={styles.separator} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Custom Button */}
        <TouchableOpacity
          style={[
            styles.customButton,
            showCustomInput && styles.customButtonActive,
          ]}
          onPress={handleCustomClick}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.customButtonText,
              showCustomInput && styles.customButtonTextActive,
            ]}
          >
            Custom
          </Text>
        </TouchableOpacity>
      </View>

      {/* Custom Input */}
      {showCustomInput && (
        <View style={styles.customInputContainer}>
          <TextInput
            ref={textInputRef}
            dense
            value={customTip}
            onChangeText={handleCustomTipChange}
            onBlur={handleCustomInputBlur}
            style={styles.customInput}
            contentStyle={styles.customInputText}
            placeholder="Enter amount"
            placeholderTextColor={AppColor.placeholderTextColor}
            mode="outlined"
            outlineColor={AppColor.border}
            activeOutlineColor={AppColor.primary}
            outlineStyle={{ borderRadius: 8 }}
            keyboardType="decimal-pad"
            returnKeyType="done"
            theme={{ colors: { onSurfaceVariant: "#777" } }}
            left={
              <TextInput.Icon
                icon="currency-usd"
                iconColor={AppColor.primary}
                size={20}
              />
            }
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  optionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  percentageContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColor.screenBg,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
    flex: 1,
  },
  percentageOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  percentageOptionActive: {
    backgroundColor: AppColor.white,
    borderRadius: 6,
  },
  percentageText: {
    fontFamily: Mulish600,
    fontSize: 16,
    color: AppColor.primary,
  },
  percentageTextActive: {
    fontFamily: Mulish700,
  },
  separator: {
    width: 1,
    height: 24,
    backgroundColor: AppColor.border,
    marginHorizontal: 4,
  },
  customButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginLeft: 8,
  },
  customButtonActive: {
    backgroundColor: AppColor.screenBg,
    borderRadius: 8,
  },
  customButtonText: {
    fontFamily: Mulish600,
    fontSize: 16,
    color: AppColor.primary,
  },
  customButtonTextActive: {
    fontFamily: Mulish700,
  },
  customInputContainer: {
    marginTop: 12,
  },
  customInput: {
    backgroundColor: AppColor.white,
  },
  customInputText: {
    fontSize: 14,
    fontFamily: Mulish400,
  },
});

export default TipSelector;
