export const normalizeCustomerInvitationPath = (path = "") =>
  String(path)
    .replace(/^\/?events\//, "event-invitation/")
    .replace(/^\/?invite\//, "event-invitation/");

export const getCustomerInvitationShareTokenFromUrl = (url = "") => {
  const value = String(url);
  const path = (value.startsWith("rtc-customer://")
    ? value.replace(/^rtc-customer:\/\//, "")
    : value.replace(/^[A-Za-z][A-Za-z0-9+.-]*:\/\/[^/]+\/?/, ""))
    .split(/[?#]/, 1)[0];
  const match = path.match(/(?:^|\/)(?:events|invite)\/([A-Za-z0-9_-]{16,256})(?:\/|$)/);

  return match?.[1] || null;
};

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

export const hasPendingCustomerNavigation = () =>
  Boolean(pendingCustomerNavigation);
