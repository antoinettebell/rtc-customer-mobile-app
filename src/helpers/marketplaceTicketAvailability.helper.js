export const hasConfiguredTicketBucket = (event = {}, type) =>
  Number(event?.[`${type}_ticket_quantity`] || 0) > 0;
