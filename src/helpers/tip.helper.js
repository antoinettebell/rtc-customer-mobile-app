const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const calculatePresetTip = (preTipTotal, percentage) =>
  Number(((toNumber(preTipTotal) * toNumber(percentage)) / 100).toFixed(2));

export const calculateFinalTotal = (baseAmount, tipAmount) =>
  toNumber(baseAmount) + toNumber(tipAmount);
