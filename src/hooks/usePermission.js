import { useState, useEffect, useCallback } from "react";
import { Alert, Linking } from "react-native";
import { request, check, RESULTS } from "react-native-permissions";

const usePermission = (permissionType) => {
  const [permissionStatus, setPermissionStatus] = useState(null);

  //checking permission status
  useEffect(() => {
    checkPermissionStatus();
  }, [checkPermissionStatus]);

  const checkPermissionStatus = useCallback(async () => {
    try {
      const status = await check(permissionType);
      setPermissionStatus(status);
    } catch (error) {
      console.error("Error checking permission:", error);
    }
  }, [permissionType]);

  const checkAndRequestPermission = async () => {
    try {
      const currentStatus = await check(permissionType);
      if (currentStatus === RESULTS.GRANTED) {
        setPermissionStatus(currentStatus);
        return currentStatus;
      }
      if (currentStatus === RESULTS.BLOCKED) {
        setPermissionStatus(currentStatus);
        handleBlockedPermission();
        return currentStatus;
      }
      const status = await request(permissionType);
      setPermissionStatus(status);
      if (status === RESULTS.BLOCKED) {
        handleBlockedPermission();
      }
      return status;
    } catch (error) {
      console.error("Error requesting permission:", error);
    }
  };

  const handleBlockedPermission = () => {
    const normalizedPermission = String(permissionType || "").toLowerCase();
    const permissionName = normalizedPermission.includes("camera")
      ? "Camera"
      : normalizedPermission.includes("photo") || normalizedPermission.includes("media")
        ? "Photos"
        : normalizedPermission.includes("location")
          ? "Location"
          : "This permission";
    Alert.alert(
      `${permissionName} Permission Blocked`,
      `${permissionName} access is disabled. Open Settings to enable it for Round Da'Corner.`,
      [
        {
          text: "Cancel",
          onPress: () => {
            setPermissionStatus(null);
          },
        },
        {
          text: "Go to settings",
          onPress: () => {
            Linking.openSettings();
          },
        },
      ],
      { cancelable: false }
    );
  };

  return { permissionStatus, checkAndRequestPermission };
};

export default usePermission;
