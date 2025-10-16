import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from "react-native";
import FastImage from "@d11/react-native-fast-image";
import { AppColor, Mulish700, Mulish400 } from "../utils/theme";
import AppImage from "./AppImage";

const DishItemComponent = ({
  menuItem,
  quantity,
  isLastItem,
  onItemPress,
  onAddItem,
  onRemoveItem,
}) => {
  const isDisabled = !menuItem.available;

  return (
    <View
      style={[
        styles.menuItemRow,
        !isLastItem && styles.menuItemBorder,
        isDisabled && styles.disabledMenuItem,
      ]}
    >
      <View>
        <AppImage
          uri={menuItem.imgUrls[0]}
          containerStyle={styles.menuImg}
        />
        {menuItem?.newDish ? (
          <FastImage
            source={require("../assets/images/new.png")}
            style={styles.newDishBadge}
          />
        ) : null}
      </View>
      <Pressable
        onPress={() => onItemPress(menuItem)}
        style={styles.menuDetails}
        disabled={isDisabled}
      >
        <Text
          style={[
            styles.menuTitle,
            isDisabled && styles.disabledText,
          ]}
        >
          {menuItem.name}
        </Text>
        <Text
          numberOfLines={2}
          style={[
            styles.menuDesc,
            isDisabled && styles.disabledText,
          ]}
        >
          {menuItem.description}
        </Text>
        <View style={styles.priceContainer}>
          <Text style={styles.discountedPrice}>
            {`$${parseFloat(menuItem.price || "0").toFixed(2)} `}
          </Text>
          {(menuItem?.strikePrice || 0) > 0 && (
            <Text
              style={[
                styles.regularPrice,
                (menuItem?.strikePrice || 0) > 0
                  ? styles.strikethroughPrice
                  : {},
              ]}
            >
              {`$${(menuItem?.strikePrice || 0).toFixed(2)} `}
            </Text>
          )}
        </View>
        {isDisabled && (
          <Text style={styles.unavailableText}>
            Currently Unavailable
          </Text>
        )}
      </Pressable>
      {!isDisabled ? (
        quantity === 0 ? (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.addButton}
            onPress={() => onAddItem(menuItem)}
          >
            <Text style={styles.addButtonText}>
              Add
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.quantityButton}
              onPress={() => onRemoveItem(menuItem)}
            >
              <Text style={styles.quantityButtonText}>
                -
              </Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>
              {quantity}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.quantityButton}
              onPress={() => onAddItem(menuItem)}
              disabled={quantity >= menuItem.maxQty}
            >
              <Text
                style={[
                  styles.quantityButtonText,
                  quantity >= menuItem.maxQty &&
                    styles.disabledButtonText,
                ]}
              >
                +
              </Text>
            </TouchableOpacity>
          </View>
        )
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  menuItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: AppColor.borderColor,
  },
  menuImg: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  menuDetails: {
    flex: 1,
    marginLeft: 10,
    gap: 6,
  },
  menuTitle: {
    fontFamily: Mulish700,
    fontSize: 16,
  },
  menuDesc: {
    fontFamily: Mulish400,
    fontSize: 14,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  discountedPrice: {
    fontFamily: Mulish700,
    fontSize: 14,
    color: AppColor.text,
  },
  regularPrice: {
    fontFamily: Mulish400,
    fontSize: 14,
    color: AppColor.textHighlighter,
  },
  strikethroughPrice: {
    textDecorationLine: "line-through",
  },
  addButton: {
    backgroundColor: AppColor.primary,
    borderRadius: 8,
  },
  addButtonText: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    color: AppColor.white,
    fontFamily: Mulish700,
    fontSize: 14,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColor.primary,
  },
  quantityButton: {
    paddingVertical: 6,
    paddingHorizontal: 9,
  },
  quantityButtonText: {
    fontFamily: Mulish700,
    fontSize: 14,
    color: AppColor.primary,
  },
  quantityText: {
    fontFamily: Mulish700,
    fontSize: 14,
    color: AppColor.text,
    marginHorizontal: 4,
  },
  disabledMenuItem: {
    opacity: 0.6,
  },
  disabledText: {
    color: AppColor.textHighlighter,
  },
  disabledButtonText: {
    color: AppColor.textHighlighter,
  },
  unavailableText: {
    fontFamily: Mulish400,
    fontSize: 12,
    color: AppColor.snackbarError,
    marginTop: 4,
  },
  newDishBadge: {
    position: "absolute",
    top: -5,
    left: -5,
    width: 30,
    height: 30,
  },
});

export default DishItemComponent;