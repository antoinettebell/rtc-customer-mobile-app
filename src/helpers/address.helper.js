const getAddressPart = (components = [], type, field = "long_name") =>
  components.find((component) => component.types?.includes(type))?.[field] || "";

const parseFallbackAddress = (formattedAddress = "") => {
  const parts = String(formattedAddress)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (/^(?:USA|US|United States)$/i.test(parts[parts.length - 1] || "")) {
    parts.pop();
  }
  const stateZipIndex = parts.length - 1;
  const stateZipMatch = (parts[stateZipIndex] || "").match(
    /^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i,
  );
  const cityStateZipMatch = (parts[stateZipIndex] || "").match(
    /^(.+?)\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i,
  );
  const cityIndex = stateZipMatch
    ? stateZipIndex - 1
    : cityStateZipMatch
      ? stateZipIndex
      : -1;

  return {
    line1: cityIndex > 0 ? parts.slice(0, cityIndex).join(", ") : "",
    city: cityStateZipMatch
      ? cityStateZipMatch[1].trim()
      : cityIndex >= 0
        ? parts[cityIndex]
        : "",
    state: (stateZipMatch?.[1] || cityStateZipMatch?.[2] || "").toUpperCase(),
    zip: stateZipMatch?.[2] || cityStateZipMatch?.[3] || "",
  };
};

export const parseUsAddressFromGooglePlace = ({
  data,
  details,
  fallbackAddress = "",
}) => {
  const components = details?.address_components || [];
  const formattedAddress =
    details?.formatted_address || data?.description || fallbackAddress || "";
  const fallbackParts = parseFallbackAddress(formattedAddress);
  const street = [
    getAddressPart(components, "street_number"),
    getAddressPart(components, "route"),
  ]
    .filter(Boolean)
    .join(" ");
  const city =
    getAddressPart(components, "locality") ||
    getAddressPart(components, "postal_town") ||
    getAddressPart(components, "administrative_area_level_3") ||
    getAddressPart(components, "administrative_area_level_2") ||
    fallbackParts.city;
  const state =
    getAddressPart(components, "administrative_area_level_1", "short_name") ||
    fallbackParts.state;
  const zip = getAddressPart(components, "postal_code", "short_name") || fallbackParts.zip;
  const latitude = details?.geometry?.location?.lat;
  const longitude = details?.geometry?.location?.lng;
  const country = getAddressPart(components, "country", "short_name") || "US";

  return {
    line1: street || fallbackParts.line1 || formattedAddress,
    city,
    state,
    zip,
    latitude: latitude != null ? String(latitude) : "",
    longitude: longitude != null ? String(longitude) : "",
    country,
    formattedAddress,
    placeId: data?.place_id || details?.place_id || "",
  };
};

export const getGooglePlaceAddressSelection = (place = {}) => {
  const address = parseUsAddressFromGooglePlace(place);
  const missingFields = [
    ["street address", address.line1],
    ["city", address.city],
    ["state", address.state],
    ["ZIP code", address.zip],
  ].filter(([, value]) => !String(value || "").trim());

  return {
    address,
    shouldCloseSelection: missingFields.length === 0,
    error: missingFields.length
      ? `Select an address that includes a ${missingFields.map(([label]) => label).join(", ")}.`
      : "",
  };
};

export const normalizeAddressStateInput = (value) => String(value || "");

export const buildCoordinatorAddressProfileFields = (address = {}) => ({
  eventCoordinatorAddressLine1: String(address.line1 || "").trim(),
  eventCoordinatorAddressLine2: String(address.line2 || "").trim(),
  eventCoordinatorAddressCity: String(address.city || "").trim(),
  eventCoordinatorAddressState: String(address.state || "").trim().toUpperCase(),
  eventCoordinatorAddressZip: String(address.zip || "").trim(),
  eventCoordinatorFormattedAddress: String(address.formattedAddress || "").trim(),
  eventCoordinatorPlaceId: address.placeId || "",
  eventCoordinatorAddressLatitude: String(address.latitude || "").trim(),
  eventCoordinatorAddressLongitude: String(address.longitude || "").trim(),
  eventCoordinatorAddressCountry: String(address.country || "US").trim() || "US",
});

export const hydrateCoordinatorAddressProfileFields = (user = {}) => ({
  line1: user.eventCoordinatorAddressLine1 || "",
  line2: user.eventCoordinatorAddressLine2 || "",
  city: user.eventCoordinatorAddressCity || "",
  state: user.eventCoordinatorAddressState || "",
  zip: user.eventCoordinatorAddressZip || "",
  formattedAddress: user.eventCoordinatorFormattedAddress || "",
  placeId: user.eventCoordinatorPlaceId || "",
  latitude: user.eventCoordinatorAddressLatitude || "",
  longitude: user.eventCoordinatorAddressLongitude || "",
  country: user.eventCoordinatorAddressCountry || "US",
});

export const getCoordinatorAddressSelectionFromLocation = (location = {}) => {
  const address = {
    line1: location.title || "",
    line2: "",
    city: location.city || "",
    state: location.state || "",
    zip: location.zip || "",
    formattedAddress: location.formattedAddress || location.address || "",
    placeId: location.placeId || "",
    latitude: location.lat != null ? String(location.lat) : "",
    longitude: location.long != null ? String(location.long) : "",
    country: location.country || "US",
  };
  const missingFields = [
    ["street address", address.line1],
    ["city", address.city],
    ["state", address.state],
    ["ZIP code", address.zip],
  ].filter(([, value]) => !String(value || "").trim());

  return {
    address,
    isComplete: missingFields.length === 0,
    error: missingFields.length
      ? `Select an address that includes a ${missingFields.map(([label]) => label).join(", ")}.`
      : "",
  };
};
