import { Alert } from "react-native";

export const showGuestSignupRequired = (navigation) => {
  Alert.alert(
    "Sign Up Required",
    "Please Sign Up to complete this action.",
    [
      {
        text: "OK",
        onPress: () => {
          if (navigation?.canGoBack?.()) {
            navigation.goBack();
            return;
          }

          navigation?.navigate?.("bottomRoot", { screen: "nearMeScreen" });
        },
      },
    ],
    { cancelable: false }
  );
};
