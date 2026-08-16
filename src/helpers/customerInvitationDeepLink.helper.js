export const normalizeCustomerInvitationPath = (path = "") =>
  String(path).replace(/^\/?events\//, "invite/");
