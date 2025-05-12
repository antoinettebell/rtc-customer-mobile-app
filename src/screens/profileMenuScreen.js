import React from "react";
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";
import { useDispatch, useSelector } from "react-redux";
import { onSignOut } from "../redux/slices/authSlice";
import { clearUserSlice } from "../redux/slices/userSlice";
import StatusBarManager from "../components/StatusBarManager";

const ProfileMenuScreen = () => {
  const dispatch = useDispatch();
  const { isSignedIn, isGuest } = useSelector((state) => state.authReducer);
  const { user } = useSelector((state) => state.userReducer);

  const handleSignInOut = () => {
    if (isSignedIn) {
      dispatch(onSignOut());
      dispatch(clearUserSlice());
    } else {
      dispatch(onSignOut());
    }
  };

  return (
    <View style={styles.container}>
      <StatusBarManager />

      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        {isSignedIn ? (
          <Text
            style={{
              fontSize: 20,
              fontFamily: Primary400,
              color: AppColor.text,
            }}
          >{`Hello, ${user?.firstName}`}</Text>
        ) : null}
      </View>

      <TouchableOpacity
        onPress={handleSignInOut}
        activeOpacity={0.7}
        style={styles.signInButton}
      >
        <Text style={styles.buttonLabel}>
          {isSignedIn ? "Sign Out" : "Sign In"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProfileMenuScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 16,
  },
  signInButton: {
    height: 48,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColor.primary,
    ...Platform.select({
      ios: {
        shadowColor: AppColor.black,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonLabel: {
    fontFamily: Secondary400,
    fontSize: 16,
    color: AppColor.white,
  },
});
