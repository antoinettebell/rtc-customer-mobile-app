export const getRequiredComboSelectionCount = (configuredCount, choiceCount) => {
  if (!choiceCount) return 0;
  const numericCount = Number(configuredCount);
  if (!Number.isFinite(numericCount) || numericCount <= 0) return choiceCount;
  return Math.min(numericCount, choiceCount);
};

const getComboItemId = (item) =>
  item?.comboMenuItemId ||
  item?.menuItemId ||
  item?.menuItem?._id ||
  (typeof item?.menuItem === "string" ? item.menuItem : null) ||
  item?.itemId?._id ||
  (typeof item?.itemId === "string" ? item.itemId : null) ||
  item?._id ||
  null;

export const hasMissingConfiguredComboChildren = (
  configuredItems,
  selectedItems,
  configuredLimit
) => {
  const includedChoices = (Array.isArray(configuredItems) ? configuredItems : [])
    .filter((item) => !item?.isAddOn);
  const includedIds = new Set(
    includedChoices.map(getComboItemId).filter(Boolean).map(String)
  );
  const includedSelections = (Array.isArray(selectedItems) ? selectedItems : [])
    .filter((item) => includedIds.has(String(getComboItemId(item))));
  const requiredCount = getRequiredComboSelectionCount(
    configuredLimit,
    includedChoices.length
  );
  return includedSelections.length !== requiredCount;
};
