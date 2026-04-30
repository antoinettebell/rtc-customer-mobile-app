/**
 * @format
 */

import { AppRegistry, LogBox } from "react-native";
import React, { useEffect } from "react";
import App from "./App";
import appConfig from "./app.json";
import { Provider } from "react-redux";
import { DefaultTheme, PaperProvider } from "react-native-paper";
import { persistor, store } from "./src/redux/store";
import {
  handleNotificationAction,
  onDisplayNotification,
} from "./src/helpers/notification.helper";
import { getMessaging } from "@react-native-firebase/messaging";
import notifee, { EventType } from "@notifee/react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BootSplash from "react-native-bootsplash";

const appName = appConfig.expo.name;

const processOnNotification = async (notification) => {
  // Android: when user clicked on backgroud state notification
  console.log("processOnNotification => ", notification);
  await handleNotificationAction(notification);
};

const setupNotificationListeners = () => {
  try {
    const messaging = getMessaging();
    const unsubscribeMessage = messaging.onMessage(async (notification) => {
      console.log("Forground Remote-Message => ", notification);
      await onDisplayNotification(notification);
      await handleNotificationAction(notification);
    });

    const unsubscribeOpened =
      messaging.onNotificationOpenedApp(processOnNotification);

    const unsubscribeForeground = notifee.onForegroundEvent(
      // android/ios both: function trigger when any notification trigger on foreground state
      // also triggred when onDisplayNotification called, beacuse onDisplayNotification is displaying notification for foreground state
      ({ type, detail }) => {
        switch (type) {
          case EventType.DISMISSED:
            console.log("User dismissed notification", detail.notification);
            break;
          case EventType.PRESS:
            console.log("User pressed notification", detail.notification);
            processOnNotification(detail.notification);
            break;
        }
      }
    );

    return () => {
      unsubscribeMessage?.();
      unsubscribeOpened?.();
      unsubscribeForeground?.();
    };
  } catch (error) {
    console.log("Notification listener setup error => ", error);
    return undefined;
  }
};

LogBox.ignoreLogs([
  "VirtualizedLists should never be nested inside plain ScrollViews with the same orientation",
]);

const RnApp = () => {
  const [bootstrapped, setBootstrapped] = React.useState(
    persistor.getState().bootstrapped
  );

  useEffect(() => setupNotificationListeners(), []);

  useEffect(() => {
    const unsubscribe = persistor.subscribe(() => {
      if (persistor.getState().bootstrapped) {
        setBootstrapped(true);
      }
    });

    const fallback = setTimeout(() => {
      setBootstrapped(true);
    }, 2000);

    return () => {
      unsubscribe();
      clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    if (bootstrapped) {
      BootSplash.hide({ fade: true });
    }
  }, [bootstrapped]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PaperProvider theme={DefaultTheme}>
          {bootstrapped ? <App /> : null}
        </PaperProvider>
      </Provider>
    </GestureHandlerRootView>
  );
};

AppRegistry.registerComponent(appName, () => RnApp);
