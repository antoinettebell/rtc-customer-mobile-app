import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import PropTypes from "prop-types";
import { AppColor, Mulish700, Mulish400, Mulish600 } from "../utils/theme";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FontAwesome6 from "react-native-vector-icons/FontAwesome6";
import ImageCarousel from "./ImageCarousel";
import AppImage from "./AppImage";
import ActionSheet from "react-native-actions-sheet";
import { IconButton } from "react-native-paper";

const { width, height } = Dimensions.get("window");

const DishItemDetailsModal = ({
  actionSheetRef,
  selectedMenuItem,
  onClose,
  handleAddItem,
  handleRemoveItem,
  getItemQuantity,
  insets,
}) => {
  return (
    <ActionSheet
      ref={actionSheetRef}
      gestureEnabled={true}
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
          {/* Header with close button */}
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
                imageContainer={{
                  borderRadius: 0,
                }}
              />
            ) : (
              <View
                style={{
                  width: "100%",
                  height: 200,
                  borderRadius: 10,
                  backgroundColor: "#f0f0f0",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <MaterialIcons
                  name="fastfood"
                  size={50}
                  color={AppColor.textHighlighter}
                />
              </View>
            )}

            {/* Price and Food Type */}
            <View style={styles.actionSheetPriceRow}>
              <View style={styles.actionSheetPriceContainer}>
                <Text style={styles.actionSheetPrice}>
                  {`$${(selectedMenuItem?.price || 0).toFixed(2)} `}
                </Text>
                {selectedMenuItem?.strikePrice > 0 ? (
                  <Text style={styles.actionSheetStrikePrice}>
                    {`$${(selectedMenuItem?.strikePrice || 0).toFixed(2)} `}
                  </Text>
                ) : null}
              </View>

              <View style={styles.actionSheetFoodTypeContainer}>
                <FontAwesome6
                  name="clock"
                  size={14}
                  color={AppColor.textPlaceholder}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: Mulish400,
                    color: AppColor.textPlaceholder,
                  }}
                >
                  {`${selectedMenuItem?.preparationTime} mins`}
                </Text>
              </View>
            </View>

            {selectedMenuItem?.newDish ||
            selectedMenuItem?.popularDish ||
            selectedMenuItem.itemType === "COMBO" ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  marginBottom: 8,
                }}
              >
                {selectedMenuItem?.newDish ? (
                  <Text style={styles.newBadge}>{"New"}</Text>
                ) : null}
                {selectedMenuItem?.popularDish ? (
                  <Text style={styles.popularBadge}>{"Popular"}</Text>
                ) : null}
                {selectedMenuItem.itemType === "COMBO" ? (
                  <Text style={styles.comboBadge}>{"Combo"}</Text>
                ) : null}
              </View>
            ) : null}

            {/* Description */}
            <View style={styles.actionSheetDescriptionContainer}>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: Mulish700,
                  color: AppColor.text,
                  marginBottom: 2,
                }}
              >
                {"Description:"}
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: Mulish400,
                  color: AppColor.text,
                  lineHeight: 22,
                }}
              >
                {selectedMenuItem?.description || ""}
              </Text>
            </View>

            {/* Dietary Information */}
            {selectedMenuItem?.meat?.name && (
              <View
                style={{
                  marginBottom: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Text style={styles.actionSheetSectionTitle}>
                  {"Meat Type:"}
                </Text>
                <Text style={styles.actionSheetDescription}>
                  {selectedMenuItem?.meat?.name}
                </Text>
              </View>
            )}

            {/* Dietary Information */}
            {selectedMenuItem?.meatWellness && (
              <View style={styles.actionSheetSection}>
                <Text
                  style={[
                    styles.actionSheetSectionTitle,
                    styles.actionSheetSectionTitleWithMargin,
                  ]}
                >
                  {"Meat Information:"}
                </Text>
                <Text style={styles.actionSheetDescription}>
                  {selectedMenuItem?.meatWellness}
                </Text>
              </View>
            )}

            {/* Dietary Information */}
            {selectedMenuItem.diet?.length > 0 && (
              <View style={styles.actionSheetSection}>
                <Text
                  style={[
                    styles.actionSheetSectionTitle,
                    styles.actionSheetSectionTitleWithMargin,
                  ]}
                >
                  {"Dietary Information:"}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  {(selectedMenuItem.diet || []).map((diet, index) => {
                    // Handle both cases where diet might be string or object
                    const dietName =
                      diet?.name || (typeof diet === "string" ? diet : "");
                    return dietName ? (
                      <Text
                        key={diet?._id || index}
                        style={{
                          fontFamily: Mulish400,
                          fontSize: 13,
                          borderRadius: 20,
                          paddingVertical: 4,
                          paddingHorizontal: 10,
                          color: AppColor.text,
                          backgroundColor: AppColor.lightGreenBG,
                        }}
                      >
                        {dietName}
                      </Text>
                    ) : null;
                  })}
                </View>
              </View>
            )}

            {/* Sub-items (if any) */}
            {selectedMenuItem.subItem?.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: Mulish700,
                    color: AppColor.text,
                    marginBottom: 8,
                  }}
                >
                  {"Combo Items:"}
                </Text>
                {(selectedMenuItem.subItem || []).map((subItem, index) => (
                  <View
                    key={subItem?._id || index}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                      gap: 8,
                    }}
                  >
                    <AppImage
                      uri={subItem?.menuItem?.imgUrls?.[0]}
                      containerStyle={{
                        width: 50,
                        height: 50,
                        borderRadius: 4,
                      }}
                    />
                    <View style={{ gap: 2, flex: 1 }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 14,
                          fontFamily: Mulish700,
                          color: AppColor.text,
                        }}
                      >
                        {subItem?.menuItem?.name}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 14,
                          fontFamily: Mulish400,
                          color: AppColor.textHighlighter,
                        }}
                      >
                        {subItem?.menuItem?.description}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontFamily: Mulish600,
                        fontSize: 16,
                        color: AppColor.primary,
                      }}
                    >
                      {`x${subItem?.qty}`}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Quantity Controls */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 20,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: AppColor.primary,
                }}
              >
                <TouchableOpacity
                  style={{ paddingVertical: 8, paddingHorizontal: 12 }}
                  onPress={() => handleRemoveItem(selectedMenuItem)}
                  disabled={getItemQuantity(selectedMenuItem._id) === 0}
                >
                  <Text
                    style={{
                      fontFamily: Mulish700,
                      fontSize: 16,
                      color:
                        getItemQuantity(selectedMenuItem._id) === 0
                          ? AppColor.textHighlighter
                          : AppColor.primary,
                    }}
                  >
                    -
                  </Text>
                </TouchableOpacity>

                <Text
                  style={{
                    fontFamily: Mulish700,
                    fontSize: 16,
                    color: AppColor.text,
                    marginHorizontal: 10,
                  }}
                >
                  {getItemQuantity(selectedMenuItem._id)}
                </Text>

                <TouchableOpacity
                  style={{ paddingVertical: 8, paddingHorizontal: 12 }}
                  onPress={() => handleAddItem(selectedMenuItem)}
                  disabled={
                    getItemQuantity(selectedMenuItem._id) >=
                    (selectedMenuItem.maxQty || 10)
                  }
                >
                  <Text
                    style={{
                      fontFamily: Mulish700,
                      fontSize: 16,
                      color:
                        getItemQuantity(selectedMenuItem._id) >=
                        (selectedMenuItem.maxQty || 10)
                          ? AppColor.textHighlighter
                          : AppColor.primary,
                    }}
                  >
                    +
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.actionSheetAddButton}
              onPress={() => {
                if (getItemQuantity(selectedMenuItem._id) === 0) {
                  handleAddItem(selectedMenuItem);
                }
                actionSheetRef.current?.hide();
              }}
              disabled={!selectedMenuItem.available}
            >
              <Text style={styles.actionSheetAddButtonText}>
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
};

const styles = StyleSheet.create({
  actionSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    marginRight: -10, // for icon button alignment
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
  actionSheetDescriptionContainer: {
    marginBottom: 16,
    marginTop: 8,
  },
  actionSheetDescription: {
    fontFamily: Mulish400,
    fontSize: 14,
    color: AppColor.text,
  },
  actionSheetSectionTitle: {
    fontSize: 16,
    fontFamily: Mulish700,
    color: AppColor.text,
  },
  actionSheetSectionTitleWithMargin: {
    marginBottom: 8,
  },
  actionSheetSection: {
    marginBottom: 16,
  },
  actionSheetAddButton: {
    backgroundColor: AppColor.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  actionSheetAddButtonText: {
    fontFamily: Mulish700,
    fontSize: 16,
    color: AppColor.white,
  },
});

export default DishItemDetailsModal;