const safeText = (value) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, 500) : null;

const safeCode = (value) =>
  typeof value === "number" || typeof value === "string" ? value : null;

export const logWalletCheckoutDiagnostic = (stage, error) => {
  const diagnostic = {
    stage,
    name: safeText(error?.name),
    domain: safeText(error?.domain || error?.nativeError?.domain),
    code: safeCode(error?.code ?? error?.nativeError?.code),
    message: safeText(error?.message),
  };
  console.warn("[WalletCheckoutDiagnostic]", JSON.stringify(diagnostic));
};

export const completeWalletResponseSafely = (response, result) => {
  try {
    response?.complete?.(result);
  } catch (_) {
    // A native wallet response may already be rejected or settled.
  }
};
