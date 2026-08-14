export const sanitizeCurrencyInput = (value) => {
  const cleaned = String(value ?? "").replace(/[$,\s]/g, "");
  let result = "";
  let hasDecimal = false;
  let decimalPlaces = 0;
  for (const character of cleaned) {
    if (/\d/.test(character)) {
      if (hasDecimal && decimalPlaces >= 2) continue;
      result += character;
      if (hasDecimal) decimalPlaces += 1;
    } else if (character === "." && !hasDecimal) {
      result += result ? "." : "0.";
      hasDecimal = true;
    }
  }
  return result;
};

export const normalizeCurrencyOnBlur = (value) => {
  const sanitized = sanitizeCurrencyInput(value);
  if (!sanitized || sanitized === "0.") return "";
  const numericValue = Number(sanitized);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : "";
};

export const toFormString = (value) =>
  value === null || value === undefined ? "" : String(value);

export const normalizeEventDateForForm = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    const dateOnly = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:T|$)/);
    if (dateOnly) return `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getTicketAttendancePatch = (form) => {
  if (!form?.ticket_sales_enabled) return {};
  return {
    number_of_guests: form.ga_ticket_quantity || "",
    vip_guest_count: form.vip_section_enabled ? form.vip_ticket_quantity || "" : "",
  };
};

export const canCancelCoordinatorEvent = ({ status }) =>
  ["OPEN", "REOPENED", "AWARDED"].includes(status);

export const getPermissionRequestAction = (status, results) => {
  if (status === results.GRANTED) return "GRANTED";
  if (status === results.BLOCKED) return "SETTINGS";
  if (status === results.UNAVAILABLE) return "UNAVAILABLE";
  return "REQUEST";
};

export const leaveWithFallback = (navigation, fallbackRoute) => {
  if (navigation?.canGoBack?.()) {
    navigation.goBack();
    return "BACK";
  }
  navigation?.replace?.(fallbackRoute);
  return "FALLBACK";
};

export const initializeAddressEdit = (address = {}) => ({ ...address });
