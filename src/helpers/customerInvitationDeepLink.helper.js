export const normalizeCustomerInvitationPath = (path = "") =>
  String(path).replace(/^\/?events\//, "event-invitation/");

// A shared ticket link can begin in the signed-out navigator.  Signing in
// remounts the root navigator, so retain the one requested destination until
// the signed-in navigator is ready to receive it.
let pendingCustomerNavigation = null;

export const setPendingCustomerNavigation = (destination) => {
  pendingCustomerNavigation = destination;
};

export const consumePendingCustomerNavigation = () => {
  const destination = pendingCustomerNavigation;
  pendingCustomerNavigation = null;
  return destination;
};
