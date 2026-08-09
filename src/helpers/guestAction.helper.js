import { Alert } from "react-native";
export const showGuestSignupRequired = (navigation) => {
  Alert.alert(
    "Sign Up Required",
    "Please Sign Up to complete this action.",
    [
      {
        text: "OK",
        onPress: () => {
          navigation?.navigate?.("signin", { returnToPrevious: true });
        },
      },
    ],
    { cancelable: false }
  );
};
