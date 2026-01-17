import React, { useState, useEffect, useCallback, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import PropTypes from "prop-types";
import { AppColor, Mulish700, Mulish400, Mulish600 } from "../utils/theme";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FontAwesome6 from "react-native-vector-icons/FontAwesome6";
import ImageCarousel from "./ImageCarousel";
import AppImage from "./AppImage";
import ActionSheet from "react-native-actions-sheet";
import { IconButton } from "react-native-paper";
import { foodTypeStrings } from "../utils/constants";

const { width, height } = Dimensions.get("window");

/**
 * Optimized Sub-Item Row
 * Memoized to prevent re-rendering all items when one is toggled.
 */
const SubItemRow = memo(({ subItem, isSelected, onToggle }) => (
  <TouchableOpacity
    style={styles.subItemRowContainer}
    activeOpacity={0.7}
    onPress={() => onToggle(subItem?.menuItem)}
  >
    <AppImage
      uri={subItem?.menuItem?.imgUrls?.[0]}
      containerStyle={styles.subItemImage}
    />
    <View style={{ gap: 2, flex: 1 }}>
      <Text numberOfLines={1} style={styles.subItemName}>
        {subItem?.menuItem?.name}
      </Text>
      <Text numberOfLines={1} style={styles.subItemDescription}>
        {subItem?.menuItem?.description}
      </Text>
    </View>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Text style={styles.subItemPrice}>
        {`$${(subItem?.menuItem?.price || 0).toFixed(2)}`}
      </Text>
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: isSelected ? AppColor.primary : "transparent",
          },
        ]}
      >
        {isSelected && (
          <MaterialIcons name="check" size={18} color={AppColor.white} />
        )}
      </View>
    </View>
  </TouchableOpacity>
));

const DishItemDetailsModal = ({
  actionSheetRef,
  selectedMenuItem,
  onClose,
  handleAddItem,
  handleRemoveItem,
  getItemQuantity,
  insets,
  onSelectedSubItemsChange,
}) => {
  const [selectedSubItems, setSelectedSubItems] = useState(
    selectedMenuItem?.selectedSubItems || []
  );

  // Sync selection with existing order item or reset when menu item changes
  useEffect(() => {
    setSelectedSubItems(selectedMenuItem?.selectedSubItems || []);
  }, [selectedMenuItem?._id, selectedMenuItem?.selectedSubItems]);

  // Clear subitems when main item quantity becomes 0
  useEffect(() => {
    const mainItemId = selectedMenuItem?._id;

    if (!mainItemId || !getItemQuantity) {
      return;
    }

    const quantity = getItemQuantity(mainItemId);

    if (!quantity && selectedSubItems.length) {
      setSelectedSubItems([]);

      if (onSelectedSubItemsChange) {
        requestAnimationFrame(() => {
          onSelectedSubItemsChange([]);
        });
      }
    }
  }, [
    selectedMenuItem?._id,
    getItemQuantity,
    selectedSubItems.length,
    onSelectedSubItemsChange,
  ]);

  // Optimized toggle function
  const toggleSubItemSelection = useCallback(
    (menuItem) => {
      const mainItemId = selectedMenuItem?._id;
      const mainItemQuantity =
        mainItemId && getItemQuantity ? getItemQuantity(mainItemId) : 0;

      if (!mainItemQuantity) {
        Alert.alert(
          "Add Item First",
          "Please add the main item before selecting combo items."
        );
        return;
      }

      if (!menuItem?._id) {
        return;
      }

      setSelectedSubItems((prevItems) => {
        const isSelected = prevItems.some((item) => item?._id === menuItem._id);
        const newSelectedItems = isSelected
          ? prevItems.filter((item) => item?._id !== menuItem._id)
          : [...prevItems, menuItem];

        if (onSelectedSubItemsChange) {
          requestAnimationFrame(() => {
            onSelectedSubItemsChange(newSelectedItems);
          });
        }

        return newSelectedItems;
      });
    },
    [onSelectedSubItemsChange, getItemQuantity, selectedMenuItem?._id]
  );

  return (
    <ActionSheet
      ref={actionSheetRef}
      gestureEnabled={false}
      isModal={Platform.OS === "ios"}
      onClose={onClose}
    >
      {selectedMenuItem && (
        <View
          style={{
            maxHeight: height - insets.top - insets.bottom - 10,
            paddingBottom: Platform.OS === "ios" ? 10 : 0,
            paddingHorizontal: 20,
          }}
        >
          {/* Header */}
          <View style={styles.actionSheetHeader}>
            <Text style={styles.actionSheetTitle} numberOfLines={2}>
              {selectedMenuItem.name || "Menu Item"}
            </Text>
            <IconButton
              icon="close"
              iconColor={AppColor.text}
              onPress={() => actionSheetRef.current?.hide()}
              style={{ margin: 0 }}
            />
          </View>

          <ScrollView
            contentContainerStyle={styles.actionSheetScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Images */}
            {selectedMenuItem?.imgUrls?.length > 0 ? (
              <ImageCarousel
                images={selectedMenuItem?.imgUrls}
                imageResizeMode="cover"
                containerHeight={200}
                containerWidth={width - 40}
                containerStyle={styles.actionSheetImageCarousel}
                imageContainer={{ borderRadius: 0 }}
              />
            ) : (
              <View style={styles.placeholderImage}>
                <MaterialIcons
                  name="fastfood"
                  size={50}
                  color={AppColor.textHighlighter}
                />
              </View>
            )}

            {/* Price Row */}
            <View style={styles.actionSheetPriceRow}>
              <View style={styles.actionSheetPriceContainer}>
                <Text style={styles.actionSheetPrice}>
                  {`$${(selectedMenuItem?.price || 0).toFixed(2)} `}
                </Text>
                {selectedMenuItem?.strikePrice > 0 && (
                  <Text style={styles.actionSheetStrikePrice}>
                    {`$${(selectedMenuItem?.strikePrice || 0).toFixed(2)} `}
                  </Text>
                )}
              </View>

              <View style={styles.actionSheetFoodTypeContainer}>
                <FontAwesome6
                  name="clock"
                  size={14}
                  color={AppColor.textPlaceholder}
                />
                <Text style={styles.prepTimeText}>
                  {`${selectedMenuItem?.preparationTime} mins`}
                </Text>
              </View>
            </View>

            {/* Badges */}
            {selectedMenuItem?.newDish ||
            selectedMenuItem?.popularDish ||
            selectedMenuItem?.discountType === "BOGO" ||
            selectedMenuItem?.discountType === "BOGOHO" ||
            selectedMenuItem.itemType === foodTypeStrings.combo ? (
              <View style={styles.badgeContainer}>
                {selectedMenuItem?.newDish && (
                  <Text style={styles.newBadge}>New</Text>
                )}
                {selectedMenuItem?.popularDish && (
                  <Text style={styles.popularBadge}>Popular</Text>
                )}
                {selectedMenuItem?.discountType === "BOGO" && (
                  <Text style={styles.popularBadge}>BOGO</Text>
                )}
                {selectedMenuItem?.discountType === "BOGOHO" && (
                  <Text style={styles.popularBadge}>BOGOHO</Text>
                )}
                {selectedMenuItem.itemType === foodTypeStrings.combo && (
                  <Text style={styles.comboBadge}>Combo</Text>
                )}
              </View>
            ) : null}

            {/* Description */}
            <View style={styles.actionSheetSection}>
              <Text style={styles.sectionTitle}>Description:</Text>
              <Text style={styles.descriptionText}>
                {selectedMenuItem?.description || ""}
              </Text>
            </View>

            {/* Meat Info */}
            {selectedMenuItem?.meat?.name && (
              <View style={styles.rowInfo}>
                <Text style={styles.sectionTitle}>Meat Type: </Text>
                <Text style={styles.actionSheetDescription}>
                  {selectedMenuItem?.meat?.name}
                </Text>
              </View>
            )}

            {/* Meat Wellness Info */}
            {selectedMenuItem?.meatWellness && (
              <View style={styles.rowInfo}>
                <Text style={styles.sectionTitle}>Meat Information: </Text>
                <Text style={styles.actionSheetDescription}>
                  {selectedMenuItem?.meatWellness}
                </Text>
              </View>
            )}

            {/* Dietary Info */}
            {selectedMenuItem.diet?.length > 0 && (
              <View style={styles.actionSheetSection}>
                <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>
                  Dietary Information:
                </Text>
                <View style={styles.dietContainer}>
                  {selectedMenuItem.diet.map((diet, index) => {
                    const dietName =
                      diet?.name || (typeof diet === "string" ? diet : "");
                    return dietName ? (
                      <Text key={diet?._id || index} style={styles.dietBadge}>
                        {dietName}
                      </Text>
                    ) : null;
                  })}
                </View>
              </View>
            )}

            {/* BOGO Items */}
            {selectedMenuItem.bogoItems?.length > 0 && (
              <View style={styles.actionSheetSection}>
                <Text
                  style={styles.sectionTitle}
                >{`${selectedMenuItem.discountType} Item:`}</Text>
                {selectedMenuItem.bogoItems.map((bogoItem, index) => (
                  <View
                    key={bogoItem?._id || index}
                    style={styles.subItemRowContainer}
                  >
                    <AppImage
                      uri={bogoItem?.itemId?.imgUrls?.[0]}
                      containerStyle={styles.subItemImage}
                    />
                    <View style={{ gap: 2, flex: 1 }}>
                      <Text numberOfLines={1} style={styles.subItemName}>
                        {bogoItem?.itemId?.name || "-"}
                      </Text>
                      <Text numberOfLines={1} style={styles.subItemDescription}>
                        {bogoItem?.itemId?.description || "-"}
                      </Text>
                    </View>
                    <View>
                      <Text
                        style={styles.qtyMultiplier}
                      >{`x${bogoItem?.qty}`}</Text>
                      {selectedMenuItem.discountType === "BOGOHO" && (
                        <Text
                          style={styles.qtyMultiplier}
                        >{`${((bogoItem?.itemId?.price || 0) * 0.5).toFixed(2)}`}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Combo Items */}
            {selectedMenuItem.subItem?.length > 0 && (
              <View style={styles.actionSheetSection}>
                <Text style={styles.sectionTitle}>Combo Items:</Text>
                {selectedMenuItem.subItem.map((subItem) => (
                  <SubItemRow
                    key={subItem?._id}
                    subItem={subItem}
                    isSelected={selectedSubItems.some(
                      (item) => item?._id === subItem?.menuItem?._id
                    )}
                    onToggle={toggleSubItemSelection}
                  />
                ))}
              </View>
            )}
          </ScrollView>

          {/* Footer Quantity Controls */}
          <View style={styles.footer}>
            <View style={styles.qtySelector}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => handleRemoveItem(selectedMenuItem)}
                disabled={getItemQuantity(selectedMenuItem._id) === 0}
              >
                <Text
                  style={[
                    styles.qtyBtnText,
                    getItemQuantity(selectedMenuItem._id) === 0 && {
                      color: AppColor.textHighlighter,
                    },
                  ]}
                >
                  -
                </Text>
              </TouchableOpacity>
              <Text style={styles.qtyText}>
                {getItemQuantity(selectedMenuItem._id)}
              </Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => handleAddItem(selectedMenuItem)}
                disabled={
                  getItemQuantity(selectedMenuItem._id) >=
                  (selectedMenuItem.maxQty || 10)
                }
              >
                <Text
                  style={[
                    styles.qtyBtnText,
                    getItemQuantity(selectedMenuItem._id) >=
                      (selectedMenuItem.maxQty || 10) && {
                      color: AppColor.textHighlighter,
                    },
                  ]}
                >
                  +
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                if (getItemQuantity(selectedMenuItem._id) === 0)
                  handleAddItem({
                    ...selectedMenuItem,
                    selectedSubItems,
                  });
                actionSheetRef.current?.hide();
              }}
              disabled={!selectedMenuItem.available}
            >
              <Text style={styles.addButtonText}>
                {getItemQuantity(selectedMenuItem._id) === 0
                  ? "Add to Order"
                  : "Update Order"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ActionSheet>
  );
};

DishItemDetailsModal.propTypes = {
  actionSheetRef: PropTypes.object.isRequired,
  selectedMenuItem: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  handleAddItem: PropTypes.func.isRequired,
  handleRemoveItem: PropTypes.func.isRequired,
  getItemQuantity: PropTypes.func.isRequired,
  insets: PropTypes.object.isRequired,
  onSelectedSubItemsChange: PropTypes.func,
};

const styles = StyleSheet.create({
  actionSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    marginRight: -10,
  },
  actionSheetTitle: {
    fontFamily: Mulish700,
    fontSize: 20,
    color: AppColor.text,
  },
  actionSheetScrollContent: {
    flexGrow: 1,
  },
  actionSheetImageCarousel: {
    borderRadius: 10,
    marginBottom: 16,
    overflow: "hidden",
  },
  placeholderImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  actionSheetPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  actionSheetPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionSheetPrice: {
    fontFamily: Mulish700,
    fontSize: 18,
    color: AppColor.primary,
  },
  actionSheetStrikePrice: {
    fontFamily: Mulish400,
    fontSize: 14,
    color: AppColor.text,
    textDecorationLine: "line-through",
  },
  actionSheetFoodTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  prepTimeText: {
    fontSize: 14,
    fontFamily: Mulish400,
    color: AppColor.textPlaceholder,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 8,
  },
  newBadge: {
    fontFamily: Mulish400,
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 20,
    color: AppColor.white,
    backgroundColor: AppColor.orderProgressbar,
  },
  popularBadge: {
    fontFamily: Mulish400,
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 20,
    color: AppColor.white,
    backgroundColor: AppColor.primary,
  },
  comboBadge: {
    fontFamily: Mulish400,
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 20,
    color: AppColor.primary,
    backgroundColor: AppColor.lightGreenBG,
  },
  actionSheetSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Mulish700,
    color: AppColor.text,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 15,
    fontFamily: Mulish400,
    color: AppColor.text,
    lineHeight: 22,
  },
  rowInfo: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionSheetDescription: {
    fontFamily: Mulish400,
    fontSize: 14,
    color: AppColor.text,
  },
  dietContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dietBadge: {
    fontFamily: Mulish400,
    fontSize: 13,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    color: AppColor.text,
    backgroundColor: AppColor.lightGreenBG,
  },
  subItemRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  subItemImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
  },
  subItemName: {
    fontSize: 14,
    fontFamily: Mulish700,
    color: AppColor.text,
  },
  subItemDescription: {
    fontSize: 14,
    fontFamily: Mulish400,
    color: AppColor.textHighlighter,
  },
  subItemPrice: {
    fontFamily: Mulish600,
    fontSize: 16,
    color: AppColor.primary,
  },
  qtyMultiplier: {
    fontFamily: Mulish600,
    fontSize: 16,
    color: AppColor.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: AppColor.primary,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  qtySelector: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColor.primary,
  },
  qtyBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  qtyBtnText: {
    fontFamily: Mulish700,
    fontSize: 16,
    color: AppColor.primary,
  },
  qtyText: {
    fontFamily: Mulish700,
    fontSize: 16,
    color: AppColor.text,
    marginHorizontal: 10,
  },
  addButton: {
    backgroundColor: AppColor.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  addButtonText: {
    fontFamily: Mulish700,
    fontSize: 16,
    color: AppColor.white,
  },
});

export default DishItemDetailsModal;
