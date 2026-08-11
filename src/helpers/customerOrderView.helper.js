const ACTIVE_ORDER_STATUSES = [
  "PLACED",
  "ACCEPTED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "DRIVER_PICKED_UP",
];

const PAST_ORDER_STATUSES = [
  "CANCEL",
  "REJECTED",
  "DELIVERED",
  "COMPLETED",
];

export const getCustomerOrderListParams = ({
  isPast = false,
  page = 1,
  limit = 20,
} = {}) => ({
  page,
  limit,
  orderView: isPast ? "past" : "active",
  orderStatus: (isPast ? PAST_ORDER_STATUSES : ACTIVE_ORDER_STATUSES).join(","),
});
