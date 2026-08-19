import React, { useRef } from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import AppHeader from "../components/AppHeader";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor } from "../utils/theme";
import { normalizeExternalUrl, styles } from "./marketplaceShared";
import { useSelector } from "react-redux";
import { getMarketplaceTicketExitRoute } from "../helpers/marketplaceTicketNavigation.helper";

const MarketplaceTicketWebViewScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useSelector((state) => state.authReducer);
  const webViewRef = useRef(null);
  const { url, title = "Tickets", returnToMyTickets = false } = route.params || {};
  const ticketUrl = normalizeExternalUrl(url);
  const exitTicket = () => {
    if (isSignedIn && returnToMyTickets) {
      if (navigation.canGoBack?.()) {
        navigation.goBack();
      } else {
        navigation.replace("marketplaceMyTicketsScreen");
      }
      return;
    }
    const destination = getMarketplaceTicketExitRoute(isSignedIn);
    navigation.reset({ index: 0, routes: [destination] });
  };

  if (!ticketUrl) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBarManager />
        <AppHeader headerTitle="Tickets" />
        <View style={[styles.body, { flex: 1 }]}>
          <View style={styles.card}>
            <Text style={styles.title}>Ticket link unavailable</Text>
            <Text style={styles.meta}>This event does not have a ticket link.</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.button, { marginTop: 16 }]}
              onPress={exitTicket}
            >
              <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />
      <AppHeader headerTitle={title} rightSide>
        <TouchableOpacity
          activeOpacity={0.7}
          hitSlop={10}
          onPress={exitTicket}
        >
          <MaterialIcons name="close" size={24} color={AppColor.primary} />
        </TouchableOpacity>
      </AppHeader>
      <View style={{ flex: 1 }}>
        <WebView
          ref={webViewRef}
          source={{ uri: ticketUrl }}
          startInLoadingState
          renderLoading={() => (
            <View
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: AppColor.white,
              }}
            >
              <ActivityIndicator color={AppColor.primary} size="large" />
            </View>
          )}
        />
      </View>
      <TouchableOpacity
        activeOpacity={0.8}
        style={{
          position: "absolute",
          left: 14,
          top: insets.top + 58,
          minHeight: 36,
          paddingHorizontal: 12,
          borderRadius: 18,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: AppColor.white,
          shadowColor: "#000",
          shadowOpacity: 0.18,
          shadowRadius: 5,
          shadowOffset: { width: 0, height: 2 },
          elevation: 4,
        }}
        onPress={exitTicket}
      >
        <MaterialIcons name="arrow-back" size={18} color={AppColor.primary} />
        <Text style={[styles.secondaryButtonText, { marginLeft: 4 }]}>
          Back
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default MarketplaceTicketWebViewScreen;
