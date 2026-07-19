const getAddressPart = (components = [], type, field = "long_name") =>
  components.find((component) => component.types?.includes(type))?.[field] || "";

const parseCityStateZipFromFormattedAddress = (formattedAddress = "") => {
  const parts = String(formattedAddress)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const cityStateZip = parts.length >= 2 ? parts[parts.length - 2] : "";
  const stateZip = parts.length >= 1 ? parts[parts.length - 1] : "";
  const cityStateZipMatch = cityStateZip.match(
    /^(.+?)\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i
  );
  const stateZipMatch = stateZip.match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i);

  return {
    city: cityStateZipMatch ? cityStateZipMatch[1].trim() : "",
    state: cityStateZipMatch
      ? cityStateZipMatch[2].toUpperCase()
      : stateZipMatch
      ? stateZipMatch[1].toUpperCase()
      : "",
    zip: cityStateZipMatch
      ? cityStateZipMatch[3]
      : stateZipMatch
      ? stateZipMatch[2]
      : "",
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
  const fallbackParts = parseCityStateZipFromFormattedAddress(formattedAddress);
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

  return {
    line1: street || formattedAddress,
    city,
    state,
    zip,
    latitude: latitude != null ? String(latitude) : "",
    longitude: longitude != null ? String(longitude) : "",
    formattedAddress,
    placeId: data?.place_id || details?.place_id || "",
  };
};
