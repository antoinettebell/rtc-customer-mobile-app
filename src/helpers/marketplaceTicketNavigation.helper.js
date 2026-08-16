export const getMarketplaceTicketExitRoute = (isSignedIn) =>
  isSignedIn
    ? { name: "bottomRoot", params: { screen: "exploreScreen" } }
    : { name: "signin" };
