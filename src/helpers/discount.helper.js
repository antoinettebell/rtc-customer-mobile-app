export const calculateRewardQty = (quantity, discountRules) => {
  if (!discountRules || discountRules.discount <= 0) return 0;
  
  const { buyQty = 1, getQty = 1, repeatable = true } = discountRules;
  const normalizedQuantity = Number(quantity) || 0;
  const normalizedBuyQty = Math.max(1, Number(buyQty) || 1);
  // Match rule defaults: missing or invalid getQty counts as 1 reward per qualifying set
  const normalizedGetQty = Math.max(1, Number(getQty) || 1);
  
  const eligibleSets = repeatable
    ? Math.floor(normalizedQuantity / normalizedBuyQty)
    : normalizedQuantity >= normalizedBuyQty
      ? 1
      : 0;
      
  return eligibleSets * normalizedGetQty;
};

export const calculateItemTotalWithDiscount = (item) => {
  const { price, quantity, discountType, discountRules } = item;
  let total = price * quantity;

  if (discountRules && discountRules.discount > 0) {
    const { discount: discountVal = 0 } = discountRules;
    const rewardQty = calculateRewardQty(quantity, discountRules);
    
    const rewardTotal = rewardQty * price;
    const discountAmount = rewardTotal * discountVal;

    total = price * quantity + rewardTotal - discountAmount;
  } else if (discountType === "BOGOHO") {
    // Fallback for old BOGOHO logic
    const effectivePrice =
      item.bogoHoPrice != null ? item.bogoHoPrice : price * 1.5;
    total = effectivePrice * quantity;
  }

  return total;
};

export const getRewardItemsDisplay = (item, quantityToUseArg) => {
  const safeItem = item || {};
  const quantityToUse =
    quantityToUseArg ??
    safeItem.quantity ??
    safeItem.qty ??
    0;

  const { discountRules, bogoItems, discountType } = safeItem;
  let rewardItems = [];

  if (discountRules && discountRules.discount > 0) {
    const { discount: discountVal = 0 } = discountRules;
    const rewardQty = calculateRewardQty(quantityToUse, discountRules);

    if (rewardQty > 0) {
      if (bogoItems && bogoItems.length > 0) {
        rewardItems = bogoItems.map((bi) => {
          const biQty = Number(bi.qty);
          const biQtySafe = Number.isFinite(biQty) && biQty > 0 ? biQty : 1;
          // rewardQty = eligibleSets × getQty (from discountRules) — source of truth for totals.
          // Menu items usually have bi.qty = 1 per reward row. Some APIs set bi.qty to the
          // total reward count already; if that equals rewardQty, do not multiply again.
          const displayQty =
            biQtySafe === rewardQty && rewardQty > 0
              ? rewardQty
              : rewardQty * biQtySafe;

          return {
          ...bi,
          displayQty,
          displayName: bi.isSameItem ? safeItem.name : bi.itemId?.name,
          displayImg: bi.isSameItem ? safeItem.imgUrls?.[0] : bi.itemId?.imgUrls?.[0],
          displayDesc: bi.isSameItem ? safeItem.description : bi.itemId?.description,
          displayPrice:
            discountVal === 1
              ? "Free"
              : `$${(
                  (bi.isSameItem ? safeItem.price : bi.itemId?.price || 0) *
                  (1 - discountVal)
                ).toFixed(2)}`,
          };
        });
      } else {
        // Fallback: assume same item if no bogoItems but discountRules exist
        rewardItems = [
          {
            _id: "same-item-reward",
            displayName: safeItem.name,
            displayImg: safeItem.imgUrls?.[0],
            displayDesc: safeItem.description,
            displayQty: rewardQty,
            displayPrice:
              discountVal === 1
                ? "Free"
                : `$${((safeItem.price || 0) * (1 - discountVal)).toFixed(2)}`,
          },
        ];
      }
    }
  } else if (bogoItems && bogoItems.length > 0) {
    // Old BOGO/BOGOHO logic fallback
    rewardItems = bogoItems.map((bi) => ({
      ...bi,
      displayQty: quantityToUse * (bi.qty || 1),
      displayName: bi.itemId?.name || bi.name,
      displayImg: bi.itemId?.imgUrls?.[0] || bi.imgUrls?.[0],
      displayDesc: bi.itemId?.description || bi.description,
      displayPrice: discountType === "BOGO" ? "Free" : "Discounted",
    }));
  }

  return rewardItems;
};
