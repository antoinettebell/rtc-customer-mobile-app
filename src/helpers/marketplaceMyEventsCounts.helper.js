export const formatMarketplaceSubmissionCounts = (event = {}) =>
  `${Number(event.bid_count || 0)} bids • ${Number(event.application_count || 0)} applications`;
