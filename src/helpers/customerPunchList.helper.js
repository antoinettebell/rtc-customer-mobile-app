import {
  calculateItemTotalWithDiscount,
  normalizeMenuOptions,
} from "./discount.helper.js";

const getEventTimeZone = (event) =>
  event?.event_time_zone ||
  event?.event_timezone ||
  event?.time_zone ||
  event?.timezone ||
  event?.location_time_zone ||
  "America/New_York";

export const getCheckoutPricePresentation = (item) => ({
  basePrice: Number(item?.price) || 0,
  lineTotal: calculateItemTotalWithDiscount({ ...item, quantity: item?.quantity || 1 }),
});

export const getSelectedOptionLabels = (item, type) => {
  const selections = item?.[type === "flavor" ? "selectedFlavors" : "selectedToppings"] || [];
  const configured = normalizeMenuOptions(item, type);
  return selections.map((selection) => {
    const name = typeof selection === "string" ? selection : selection?.name || selection?.label || "";
    const match = configured.find(
      (option) => option.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );
    const cost = match?.hasCost
      ? Number(match.cost) || 0
      : typeof selection === "object"
        ? Number(selection.cost ?? selection.additionalCost ?? selection.price) || 0
        : 0;
    return cost > 0 ? `${name} (+$${cost.toFixed(2)})` : name;
  });
};

export const getDeliveryAddressPayload = (location) => {
  const latitude = Number(location?.lat ?? location?.latitude);
  const longitude = Number(location?.long ?? location?.longitude);
  return {
    deliveryAddress:
      location?.formattedAddress || location?.formatted_address || location?.address || "",
    deliveryLat: Number.isFinite(latitude) ? latitude : null,
    deliveryLong: Number.isFinite(longitude) ? longitude : null,
  };
};

export const getEventEndTimestamp = (event) => {
  const explicitEnd =
    event?.event_end_at || event?.event_end_datetime || event?.end_datetime;
  if (explicitEnd) return Date.parse(explicitEnd);
  const rawDate = event?.event_date;
  if (!rawDate) return Number.NaN;
  const dateParts = String(rawDate).slice(0, 10).split("-").map(Number);
  const timeMatch = String(event?.event_time || "00:00")
    .trim()
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (dateParts.length !== 3 || !timeMatch) return Number.NaN;
  let hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2] || 0);
  const meridiem = timeMatch[3]?.toUpperCase();
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  const desiredUtc = Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2], hour, minute);
  let start = desiredUtc;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: getEventTimeZone(event),
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(desiredUtc));
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const representedUtc = Date.UTC(
      Number(values.year), Number(values.month) - 1, Number(values.day),
      Number(values.hour), Number(values.minute),
    );
    start = desiredUtc + (desiredUtc - representedUtc);
  } catch (_error) {
    start = desiredUtc;
  }
  if (!Number.isFinite(start)) return Number.NaN;
  const durationMinutes = Number(event?.event_duration_total_minutes) ||
    Number(event?.event_duration_hours || 0) * 60 + Number(event?.event_duration_minutes || 0);
  return start + Math.max(0, durationMinutes) * 60 * 1000;
};

export const isEligiblePublicEvent = (item, now = Date.now()) => {
  if (item?.type !== "EVENT") return true;
  const event = item?.raw || item;
  if (event?.event_visibility && event.event_visibility !== "PUBLIC") return false;
  if (event?.status === "CLOSED" && isTicketPurchaseAvailable(event)) return true;
  const end = getEventEndTimestamp(event);
  return !Number.isFinite(end) || end >= now;
};

export const isTicketPurchaseAvailable = (event = {}) => {
  if (!event?.ticket_sales_enabled || event?.ticket_sales_closed_at) return false;
  if (["DRAFT", "CANCELLED"].includes(event?.status)) return false;
  const remainingGa = Math.max(
    0,
    Number(event?.ga_ticket_quantity || 0) -
      Number(event?.ga_tickets_sold || 0) -
      Number(event?.ga_tickets_reserved || 0),
  );
  const remainingVip = event?.vip_section_enabled
    ? Math.max(
      0,
      Number(event?.vip_ticket_quantity || 0) -
        Number(event?.vip_tickets_sold || 0) -
        Number(event?.vip_tickets_reserved || 0),
    )
    : 0;
  return remainingGa + remainingVip > 0;
};

export const reconcileUploadResults = (attachments, results) => ({
  failedAttachments: results
    .map((result, index) => result.status === "rejected" ? attachments[index] : null)
    .filter(Boolean),
  successfulValues: results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value),
});

export const isPdfAttachment = (attachment = {}) => {
  const mimeType = attachment.mime_type || attachment.type || "";
  if (mimeType) return String(mimeType).toLowerCase().includes("pdf");
  const uri = attachment.file_url || attachment.url || attachment.uri || "";
  return String(uri).toLowerCase().includes(".pdf");
};

export const getAttachmentSaveOutcome = ({ status, hasFailures }) => {
  if (!hasFailures) return null;
  return {
    message: status === "DRAFT"
      ? "Draft saved, but some attachments failed. They remain selected so you can retry."
      : "Event saved, but some attachments failed. They remain selected so you can retry.",
    type: "error",
    shouldNavigate: false,
  };
};

export const removeEventImageAt = async ({
  images,
  image,
  index,
  eventId,
  deleteRemote,
}) => {
  if (image?.uploaded && image?.image_id && eventId) {
    await deleteRemote({ eventId, imageId: image.image_id });
  }
  return images.filter((_, imageIndex) => imageIndex !== index);
};
