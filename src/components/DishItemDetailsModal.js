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
import { IconButton, TextInput } from "react-native-paper";
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
        {`x${subItem?.qty}`}
        {/* {`$${(subItem?.menuItem?.price || 0).toFixed(2)}`} */}
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

import { getRewardItemsDisplay } from "../helpers/discount.helper";

const DishItemDetailsModal = ({
  actionSheetRef,
  selectedMenuItem,
  onClose,
  handleAddItem,
  handleRemoveItem,
  getItemQuantity,
  insets,
  onSelectedSubItemsChange,
  onCustomizationInputChange,
}) => {
  const customizationActionSheetRef = React.useRef(null);
  const [selectedSubItems, setSelectedSubItems] = useState(
    selectedMenuItem?.selectedSubItems || []
  );
  const [customizationInput, setCustomizationInput] = useState(
    selectedMenuItem?.customizationInput || ""
  );

  // Sync selection with existing order item or reset when menu item changes
  useEffect(() => {
    setSelectedSubItems(selectedMenuItem?.selectedSubItems || []);
    setCustomizationInput(selectedMenuItem?.customizationInput || "");
  }, [selectedMenuItem?._id, selectedMenuItem?.selectedSubItems, selectedMenuItem?.customizationInput]);

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

  // Handle customization change
  const handleCustomizationDone = useCallback(() => {
    customizationActionSheetRef.current?.hide();
    if (onCustomizationInputChange) {
      onCustomizationInputChange(customizationInput);
    }
  }, [customizationInput, onCustomizationInputChange]);

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

            {/* BOGO / BOGOHO — buy & get quantities + reward items */}
            {(() => {
              const { discountType, bogoItems, discountRules } =
                selectedMenuItem;
              const currentQty = getItemQuantity(selectedMenuItem?._id);
              const previewQty =
                currentQty > 0
                  ? currentQty
                  : Math.max(1, Number(discountRules?.buyQty) || 1);

              const hasRuleBasedOffer =
                discountRules && discountRules.discount > 0;
              const hasLegacyBogoList = bogoItems && bogoItems.length > 0;

              if (!hasRuleBasedOffer && !hasLegacyBogoList) {
                return null;
              }

              const discountVal = discountRules?.discount ?? 0;
              let promoName = "Special offer";
              if (discountVal === 1) promoName = "BOGO";
              else if (discountVal === 0.5) promoName = "BOGOHO";
              else if (hasLegacyBogoList && discountType)
                promoName = discountType;

              const buyQtyDisplay = Math.max(
                1,
                Number(discountRules?.buyQty) || 1
              );
              const getQtyShown = Math.max(
                1,
                Number(discountRules?.getQty) || 1
              );

              const repeatable = discountRules?.repeatable !== false;

              const rewardItems = getRewardItemsDisplay(
                {
                  ...selectedMenuItem,
                  quantity: previewQty,
                },
                previewQty
              );

              return (
                <View style={styles.actionSheetSection}>
                  <Text style={styles.bogoSectionHeading}>Special offer</Text>

                  <View style={styles.buyGetCard}>
                    <View style={styles.buyGetCardTop}>
                      <Text style={styles.buyGetCardTitle}>Buy & get</Text>
                      <View style={styles.promoNamePill}>
                        <Text style={styles.promoNamePillText}>
                          {promoName}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.buyGetNumbersRow}>
                      <View style={styles.buyGetQtyBlock}>
                        <Text style={styles.buyGetQtyLabel}>Buy</Text>
                        <Text style={styles.buyGetQtyValue}>
                          {buyQtyDisplay}
                        </Text>
                        <Text style={styles.buyGetQtyUnit}>paid items</Text>
                      </View>

                      <MaterialIcons
                        name="arrow-forward"
                        size={22}
                        color={AppColor.primary}
                        style={styles.buyGetArrow}
                      />

                      <View
                        style={[
                          styles.buyGetQtyBlock,
                          styles.buyGetQtyBlockGet,
                        ]}
                      >
                        <Text style={styles.buyGetQtyLabel}>Get</Text>
                        <Text style={styles.buyGetQtyValue}>{getQtyShown}</Text>
                        <Text style={styles.buyGetQtyUnit}>reward items</Text>
                      </View>
                    </View>

                    <Text style={styles.buyGetExplanation}>
                      {`Add ${buyQtyDisplay} paid ${
                        buyQtyDisplay === 1 ? "item" : "items"
                      } to your cart to unlock ${getQtyShown} reward ${
                        getQtyShown === 1 ? "item" : "items"
                      } (see below).`}
                    </Text>

                    {hasRuleBasedOffer && repeatable ? (
                      <Text style={styles.buyGetRepeatHint}>
                        Repeats for every qualifying set when you increase
                        quantity.
                      </Text>
                    ) : null}
                  </View>

                  {rewardItems.length > 0 ? (
                    <>
                      <Text style={styles.rewardRowsHeading}>Reward item</Text>
                      {rewardItems.map((itm, index) => (
                        <View
                          key={itm._id || index}
                          style={styles.subItemRowContainer}
                        >
                          <AppImage
                            uri={itm.displayImg}
                            containerStyle={styles.subItemImage}
                          />
                          <View style={{ gap: 2, flex: 1 }}>
                            <Text numberOfLines={2} style={styles.subItemName}>
                              {itm.displayName}
                            </Text>
                            {itm.displayDesc ? (
                              <Text
                                numberOfLines={2}
                                style={styles.subItemDescription}
                              >
                                {itm.displayDesc}
                              </Text>
                            ) : null}
                          </View>
                          <View style={styles.rewardRowMeta}>
                            <Text
                              style={styles.qtyMultiplier}
                            >{`×${itm.displayQty}`}</Text>
                            <Text style={styles.rewardRowPrice}>
                              {itm.displayPrice}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </>
                  ) : null}
                </View>
              );
            })()}

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

            {/* Customization Button */}
            {selectedMenuItem?.allowCustomize && (
              <View style={styles.actionSheetSection}>
                <Text style={styles.sectionTitle}>Customization:</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.customizationButton}
                  onPress={() => customizationActionSheetRef.current?.show()}
                >
                  <View style={styles.customizationContent}>
                    <Text
                      style={[
                        styles.customizationText,
                        !customizationInput && styles.customizationPlaceholder,
                      ]}
                      numberOfLines={2}
                    >
                      {customizationInput || "Add special instructions..."}
                    </Text>
                    <MaterialIcons
                      name={customizationInput ? "edit" : "add"}
                      size={20}
                      color={AppColor.primary}
                    />
                  </View>
                </TouchableOpacity>
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
                    customizationInput,
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

      {/* Customization ActionSheet */}
      <ActionSheet
        ref={customizationActionSheetRef}
        headerAlwaysVisible={true}
        gestureEnabled={false}
      >
        <View style={{ paddingVertical: 8, paddingHorizontal: 20 }}>
          <View style={styles.customizationModalHeader}>
            <Text style={styles.modalTitle}>{"Customization"}</Text>
            <IconButton
              icon="close"
              iconColor={AppColor.text}
              onPress={() => customizationActionSheetRef.current?.hide()}
              style={{ margin: 0 }}
            />
          </View>
          <TextInput
            dense
            value={customizationInput}
            onChangeText={setCustomizationInput}
            style={{ backgroundColor: AppColor.white, marginTop: 8 }}
            contentStyle={{
              minHeight: 120,
              fontFamily: Mulish400,
              fontSize: 15,
            }}
            placeholder="Enter special instructions (e.g. no onions, extra spicy)"
            placeholderTextColor={AppColor.textPlaceholder}
            mode="outlined"
            multiline={true}
            outlineColor={AppColor.border}
            activeOutlineColor={AppColor.primary}
            outlineStyle={{ borderRadius: 8 }}
            autoCapitalize="sentences"
            autoFocus={Platform.OS === "ios"}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.doneButton, { marginTop: 20, marginBottom: 10 }]}
            onPress={handleCustomizationDone}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </ActionSheet>
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
  onCustomizationInputChange: PropTypes.func,
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
  bogoSectionHeading: {
    fontSize: 17,
    fontFamily: Mulish700,
    color: AppColor.text,
    marginBottom: 10,
  },
  buyGetCard: {
    backgroundColor: "#FFF8F3",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F5E6DC",
    padding: 14,
    marginBottom: 14,
  },
  buyGetCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 8,
  },
  buyGetCardTitle: {
    fontFamily: Mulish700,
    fontSize: 15,
    color: AppColor.text,
  },
  promoNamePill: {
    backgroundColor: AppColor.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  promoNamePillText: {
    fontFamily: Mulish600,
    fontSize: 12,
    color: AppColor.white,
  },
  buyGetNumbersRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  buyGetQtyBlock: {
    flex: 1,
    alignItems: "center",
    backgroundColor: AppColor.white,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: AppColor.border,
  },
  buyGetQtyBlockGet: {
    borderColor: AppColor.primary,
    backgroundColor: "#FFF0E6",
  },
  buyGetQtyLabel: {
    fontFamily: Mulish600,
    fontSize: 11,
    color: AppColor.textHighlighter,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  buyGetQtyValue: {
    fontFamily: Mulish700,
    fontSize: 28,
    color: AppColor.text,
    lineHeight: 32,
  },
  buyGetQtyUnit: {
    fontFamily: Mulish400,
    fontSize: 12,
    color: AppColor.textHighlighter,
    marginTop: 2,
  },
  buyGetArrow: {
    marginHorizontal: 6,
  },
  buyGetExplanation: {
    fontFamily: Mulish400,
    fontSize: 13,
    color: AppColor.text,
    lineHeight: 20,
  },
  buyGetRepeatHint: {
    fontFamily: Mulish400,
    fontSize: 12,
    color: AppColor.textHighlighter,
    marginTop: 8,
    fontStyle: "italic",
  },
  rewardRowsHeading: {
    fontFamily: Mulish600,
    fontSize: 14,
    color: AppColor.text,
    marginBottom: 8,
  },
  rewardRowMeta: {
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 4,
    minWidth: 56,
  },
  rewardRowPrice: {
    fontFamily: Mulish600,
    fontSize: 13,
    color: AppColor.primary,
    textAlign: "right",
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
  customizationButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColor.border,
    backgroundColor: "#f9f9f9",
  },
  customizationContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  customizationText: {
    flex: 1,
    fontFamily: Mulish400,
    fontSize: 14,
    color: AppColor.text,
  },
  customizationPlaceholder: {
    color: AppColor.textPlaceholder,
  },
  customizationModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    marginRight: -10,
  },
  modalTitle: {
    fontFamily: Mulish700,
    fontSize: 18,
    color: AppColor.text,
  },
  doneButton: {
    backgroundColor: AppColor.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  doneButtonText: {
    fontFamily: Mulish700,
    fontSize: 16,
    color: AppColor.white,
  },
});

export default DishItemDetailsModal;
