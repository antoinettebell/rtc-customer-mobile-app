import { getEventEndTimestamp } from "./customerPunchList.helper.js";

export const MY_TICKET_FILTERS = {
  UPCOMING: "UPCOMING",
  PAST: "PAST",
};

export const isPastTicketOrder = (order, now = Date.now()) => {
  const eventEnd = getEventEndTimestamp(order?.event);
  return Number.isFinite(eventEnd) && eventEnd < now;
};

export const filterTicketOrders = (
  orders,
  filter = MY_TICKET_FILTERS.UPCOMING,
  now = Date.now(),
) => {
  const safeOrders = Array.isArray(orders) ? orders : [];
  return safeOrders.filter((order) => {
    const isPast = isPastTicketOrder(order, now);
    return filter === MY_TICKET_FILTERS.PAST ? isPast : !isPast;
  });
};
