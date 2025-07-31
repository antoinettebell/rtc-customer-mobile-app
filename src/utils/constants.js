export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,15}$/;

export const PROFILE_AVATAR = "https://avatar.iran.liara.run/public/12";

export const orderCurrentStatusNames = {
  PLACED: "Placed",
  CANCEL: "Cancel",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  PREPARING: "Preparing",
  READY_FOR_PICKUP: "Ready for pickup",
  COMPLETED: "Completed",
};

export const orderStatusStrings = {
  placed: "PLACED",
  cancel: "CANCEL",
  accepted: "ACCEPTED",
  rejected: "REJECTED",
  preparing: "PREPARING",
  ready_for_pickup: "READY_FOR_PICKUP",
  completed: "COMPLETED",
};

export const onlinePyamentApplicablePlanList = ["SUB_PLATINUM", "SUB_ELITE"];
