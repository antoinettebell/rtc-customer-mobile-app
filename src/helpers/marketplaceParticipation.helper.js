export const getExpectedVipGuests = (event = {}) =>
  event.vip_section_enabled
    ? Math.max(0, Number(event.vip_guest_count || 0))
    : 0;

export const getMarketplaceBudget = (event = {}) => {
  const gaGuests = Math.max(0, Number(event.number_of_guests || 0));
  const vipGuests = getExpectedVipGuests(event);
  const cateredGuests = event.fully_catered_event
    ? gaGuests + vipGuests
    : event.catered_vip_section_enabled
      ? vipGuests
      : 0;
  return {
    gaGuests,
    vipGuests,
    cateredGuests,
    minimumBudget: cateredGuests * 25,
  };
};

const ceilPerHundred = (value) => {
  const count = Math.max(0, Number(value || 0));
  return count > 0 ? Math.ceil(count / 100) : 0;
};

const FOOD_VENDOR_SERVICE_TYPES = new Set([
  "food truck", "full service catering", "buffet", "drop off catering",
  "served stations", "beverage and alcohol", "beverage alcohol service", "alcohol",
]);
const FOOD_VENDOR_SERVICE_STYLES = new Set([
  "plated", "buffet", "food truck", "family style stations",
]);
const normalizeServiceValue = (value) => String(value || "")
  .trim()
  .toLowerCase()
  .replace(/&/g, " and ")
  .replace(/[^a-z0-9]+/g, " ")
  .replace(/\s+/g, " ")
  .trim();
const normalizedServices = (value) => (Array.isArray(value) ? value : [value])
  .map(normalizeServiceValue)
  .filter(Boolean);

export const isFoodVendorMarketplaceEvent = (event = {}) => {
  const serviceTypes = [
    ...normalizedServices(event.service_type),
    ...normalizedServices(event.service_types),
  ];
  const serviceStyles = [
    ...normalizedServices(event.primary_service_style),
    ...normalizedServices(event.service_styles),
  ];
  return serviceTypes.some((value) => FOOD_VENDOR_SERVICE_TYPES.has(value)) ||
    serviceStyles.some((value) => FOOD_VENDOR_SERVICE_STYLES.has(value));
};

export const getMarketplaceVendorCapacity = (event = {}) => {
  const gaGuests = Math.max(0, Number(event.number_of_guests || 0));
  const vipGuests = getExpectedVipGuests(event);
  if (event.fully_catered_event) {
    const gaMaximum = ceilPerHundred(gaGuests);
    const vipRequirement = ceilPerHundred(vipGuests);
    const calculatedMaximum = Math.max(1, gaMaximum, vipRequirement);
    return {
      gaMaximum,
      vipRequirement,
      calculatedMaximum,
    };
  }
  if (event.catered_vip_section_enabled) {
    const gaMaximum = event.ga_food_sales_allowed
      ? ceilPerHundred(gaGuests)
      : 0;
    const vipRequirement = Math.max(1, ceilPerHundred(vipGuests));
    const calculatedMaximum = event.separate_vip_vendor_required
      ? gaMaximum + vipRequirement
      : Math.max(gaMaximum, vipRequirement);
    return { gaMaximum, vipRequirement, calculatedMaximum };
  }
  const gaMaximum = Math.max(1, ceilPerHundred(gaGuests));
  return { gaMaximum, vipRequirement: 0, calculatedMaximum: gaMaximum };
};

export const getMarketplaceServiceRequirements = (event = {}, selectedRequirement) => {
  const capacity = getMarketplaceVendorCapacity(event);
  const selected = Number.isFinite(Number(selectedRequirement))
    ? Math.max(0, Number(selectedRequirement))
    : capacity.calculatedMaximum;
  if (event.fully_catered_event) {
    return {
      gaRequirement: capacity.gaMaximum,
      vipRequirement: capacity.vipRequirement,
    };
  }
  const vipRequirement = event.catered_vip_section_enabled
    ? capacity.vipRequirement
    : 0;
  const gaRequirement = event.separate_vip_vendor_required
    ? Math.max(0, selected - vipRequirement)
    : Math.min(capacity.gaMaximum, selected);
  return { gaRequirement, vipRequirement };
};

export const getTicketInventory = (event = {}, type = "ga") => {
  const capacity = Math.max(0, Number(event[`${type}_ticket_quantity`] || 0));
  const sold = Math.max(0, Number(event[`${type}_tickets_sold`] || 0));
  const reserved = Math.max(0, Number(event[`${type}_tickets_reserved`] || 0));
  return {
    capacity,
    sold,
    reserved,
    remaining: Math.max(0, capacity - sold - reserved),
  };
};

export const isTicketInventorySoldOut = (event = {}) => {
  const ga = getTicketInventory(event, "ga");
  const vip = getTicketInventory(event, "vip");
  return ga.capacity + vip.capacity > 0 && ga.remaining + vip.remaining === 0;
};

export const getMarketplaceFilledSlotSummary = ({
  gaSlotsFilled = 0,
  vipSlotsFilled = 0,
  combinedVendors = 0,
  separateVipVendorRequired = false,
  gaRequirement = 0,
  vipRequirement = 0,
} = {}) => {
  const gaFilled = Math.max(0, Number(gaSlotsFilled || 0));
  const vipFilled = Math.max(0, Number(vipSlotsFilled || 0));
  const combined = Math.min(gaFilled, vipFilled, Math.max(0, Number(combinedVendors || 0)));
  const minimumUniqueVendors = gaFilled + vipFilled - combined;
  const remainingGaSlots = Math.max(0, Number(gaRequirement || 0) - gaFilled);
  const remainingVipSlots = Math.max(0, Number(vipRequirement || 0) - vipFilled);
  return {
    gaSlotsFilled: gaFilled,
    vipSlotsFilled: vipFilled,
    combinedVendors: combined,
    separateVipVendorRequired: Boolean(separateVipVendorRequired),
    minimumUniqueVendors,
    totalServiceSlotsRequired: Number(gaRequirement || 0) + Number(vipRequirement || 0),
    totalServiceSlotsFilled: gaFilled + vipFilled,
    remainingGaSlots,
    remainingVipSlots,
    remainingTotalServiceSlots: remainingGaSlots + remainingVipSlots,
    remainingUniqueVendors: Math.max(remainingGaSlots, remainingVipSlots),
  };
};

export const getVendorReductionProtection = ({
  requested = 0,
  filledMinimum = 0,
  gaRequirement = 0,
  vipRequirement = 0,
  gaFilled = 0,
  vipFilled = 0,
} = {}) => ({
  blocked:
    Number(requested) < Number(filledMinimum) ||
    Number(gaRequirement) < Number(gaFilled) ||
    Number(vipRequirement) < Number(vipFilled),
  minimum: Math.max(0, Number(filledMinimum || 0)),
});
