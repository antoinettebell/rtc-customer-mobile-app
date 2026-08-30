const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const calculatePresetTip = (preTipTotal, percentage) =>
  Number(((toNumber(preTipTotal) * toNumber(percentage)) / 100).toFixed(2));

export const selectPresetTip = (preTipTotal, percentage, onTipChange) => {
  const tipAmount = calculatePresetTip(preTipTotal, percentage);
  onTipChange?.(tipAmount);
  return tipAmount;
};

export const calculateFinalTotal = (baseAmount, tipAmount) =>
  toNumber(baseAmount) + toNumber(tipAmount);

export const applyTipAmount = (nextTipAmount, tipAmountRef, setTipAmount) => {
  const normalizedTipAmount = toNumber(nextTipAmount);
  tipAmountRef.current = normalizedTipAmount;
  setTipAmount(normalizedTipAmount);
  return normalizedTipAmount;
};
