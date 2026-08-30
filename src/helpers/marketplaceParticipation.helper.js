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
    const dessertRequirement = event.dessert_caterer_required ? 1 : 0;
    const drinksRequirement = event.drinks_caterer_required ? 1 : 0;
    const calculatedMaximum =
      Math.max(1, gaMaximum, vipRequirement) +
      dessertRequirement +
      drinksRequirement;
    return {
      gaMaximum,
      vipRequirement,
      ...(dessertRequirement ? { dessertRequirement } : {}),
      ...(drinksRequirement ? { drinksRequirement } : {}),
      calculatedMaximum,
    };
  }
  if (event.catered_vip_section_enabled) {
    const gaMaximum = Math.max(1, ceilPerHundred(gaGuests));
    const vipRequirement = 1;
    const dessertRequirement = event.dessert_caterer_required ? 1 : 0;
    const drinksRequirement = event.drinks_caterer_required ? 1 : 0;
    return {
      gaMaximum,
      vipRequirement,
      dessertRequirement,
      drinksRequirement,
      calculatedMaximum: gaMaximum + vipRequirement + dessertRequirement + drinksRequirement,
    };
  }
  const gaMaximum = Math.max(1, ceilPerHundred(gaGuests));
  return { gaMaximum, vipRequirement: 0, dessertRequirement: 0, drinksRequirement: 0, calculatedMaximum: gaMaximum };
};

export const getMarketplaceServiceRequirements = (event = {}, selectedRequirement) => {
  const capacity = getMarketplaceVendorCapacity(event);
  if (event.fully_catered_event) {
    return {
      gaRequirement: capacity.gaMaximum,
      vipRequirement: capacity.vipRequirement,
      ...(capacity.dessertRequirement ? { dessertRequirement: capacity.dessertRequirement } : {}),
      ...(capacity.drinksRequirement ? { drinksRequirement: capacity.drinksRequirement } : {}),
    };
  }
  const vipRequirement = event.catered_vip_section_enabled
    ? capacity.vipRequirement
    : 0;
  const dessertRequirement = capacity.dessertRequirement || 0;
  const drinksRequirement = capacity.drinksRequirement || 0;
  // The overall vendor target may be lower when one vendor can satisfy
  // multiple categories. That does not reduce the underlying GA need.
  const gaRequirement = capacity.gaMaximum || 0;
  return {
    gaRequirement,
    vipRequirement,
    ...(dessertRequirement ? { dessertRequirement } : {}),
    ...(drinksRequirement ? { drinksRequirement } : {}),
  };
};

export const getTicketInventory = (event = {}, type = "ga") => {
  const safeEvent = event && typeof event === "object" ? event : {};
  const capacity = Math.max(0, Number(safeEvent[`${type}_ticket_quantity`] || 0));
  const sold = Math.max(0, Number(safeEvent[`${type}_tickets_sold`] || 0));
  const reserved = Math.max(0, Number(safeEvent[`${type}_tickets_reserved`] || 0));
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
  dessertSlotsFilled = 0,
  drinksSlotsFilled = 0,
  uniqueVendorsFilled,
  combinedVendors = 0,
  separateVipVendorRequired = false,
  gaRequirement = 0,
  vipRequirement = 0,
  dessertRequirement = 0,
  drinksRequirement = 0,
} = {}) => {
  const gaFilled = Math.max(0, Number(gaSlotsFilled || 0));
  const vipFilled = Math.max(0, Number(vipSlotsFilled || 0));
  const dessertFilled = Math.max(0, Number(dessertSlotsFilled || 0));
  const drinksFilled = Math.max(0, Number(drinksSlotsFilled || 0));
  const combined = Math.min(gaFilled, vipFilled, Math.max(0, Number(combinedVendors || 0)));
  const derivedMinimumUniqueVendors = gaFilled + vipFilled - combined;
  const minimumUniqueVendors = Number.isFinite(Number(uniqueVendorsFilled))
    ? Math.max(0, Number(uniqueVendorsFilled))
    : derivedMinimumUniqueVendors;
  const remainingGaSlots = Math.max(0, Number(gaRequirement || 0) - gaFilled);
  const remainingVipSlots = Math.max(0, Number(vipRequirement || 0) - vipFilled);
  const remainingDessertSlots = Math.max(0, Number(dessertRequirement || 0) - dessertFilled);
  const remainingDrinksSlots = Math.max(0, Number(drinksRequirement || 0) - drinksFilled);
  return {
    gaSlotsFilled: gaFilled,
    vipSlotsFilled: vipFilled,
    dessertSlotsFilled: dessertFilled,
    drinksSlotsFilled: drinksFilled,
    combinedVendors: combined,
    separateVipVendorRequired: Boolean(separateVipVendorRequired),
    minimumUniqueVendors,
    totalServiceSlotsRequired: Number(gaRequirement || 0) + Number(vipRequirement || 0) + Number(dessertRequirement || 0) + Number(drinksRequirement || 0),
    totalServiceSlotsFilled: gaFilled + vipFilled + dessertFilled + drinksFilled,
    remainingGaSlots,
    remainingVipSlots,
    remainingDessertSlots,
    remainingDrinksSlots,
    remainingTotalServiceSlots: remainingGaSlots + remainingVipSlots + remainingDessertSlots + remainingDrinksSlots,
    remainingUniqueVendors: Math.max(remainingGaSlots, remainingVipSlots, remainingDessertSlots, remainingDrinksSlots),
  };
};

export const getVendorReductionProtection = ({
  requested = 0,
  filledMinimum = 0,
  gaRequirement = 0,
  vipRequirement = 0,
  dessertRequirement = 0,
  drinksRequirement = 0,
  gaFilled = 0,
  vipFilled = 0,
  dessertFilled = 0,
  drinksFilled = 0,
} = {}) => ({
  blocked:
    Number(requested) < Number(filledMinimum) ||
    Number(gaRequirement) < Number(gaFilled) ||
    Number(vipRequirement) < Number(vipFilled) ||
    Number(dessertRequirement) < Number(dessertFilled) ||
    Number(drinksRequirement) < Number(drinksFilled),
  minimum: Math.max(0, Number(filledMinimum || 0)),
});
