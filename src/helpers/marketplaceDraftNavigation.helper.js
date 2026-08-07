export const getMarketplaceExitMode = ({ submitted = false, hasChanges = false } = {}) => {
  if (submitted) return "EXIT_TO_MY_EVENTS";
  return hasChanges ? "PROMPT_TO_SAVE" : "EXIT";
};
