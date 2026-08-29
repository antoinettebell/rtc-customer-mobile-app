const text = (value) => (typeof value === "string" ? value.trim() : "");

export const normalizeWalletBillingAddress = (billingAddress, payer = {}) => {
  if (!billingAddress || typeof billingAddress !== "object") return undefined;
  const country = text(billingAddress.country || billingAddress.countryCode).toUpperCase();
  const value = {
    address1: text(billingAddress.address1),
    locality: text(billingAddress.locality),
    administrativeArea: text(billingAddress.administrativeArea),
    postalCode: text(billingAddress.postalCode),
    country: /^[A-Z]{2}$/.test(country) ? country : "",
    firstName: text(payer.firstName),
    lastName: text(payer.lastName),
    email: text(payer.email),
    phone: text(payer.phone),
  };
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item));
};

export const assertGooglePayConfiguration = (config) => {
  const environment = text(config?.GOOGLE_PAY_ENVIRONMENT).toUpperCase();
  const gateway = text(config?.GOOGLE_PAY_GATEWAY).toLowerCase();
  const merchantId = text(config?.GOOGLE_PAY_GATEWAY_MERCHANT_ID);
  const allowLiveDebug = text(config?.GOOGLE_PAY_ALLOW_LIVE_DEBUG).toLowerCase() === "true";
  if (!['TEST', 'PRODUCTION'].includes(environment)) {
    throw new Error('Google Pay configuration is missing GOOGLE_PAY_ENVIRONMENT (TEST or PRODUCTION).');
  }
  if (__DEV__ && environment === 'PRODUCTION' && !allowLiveDebug) {
    throw new Error(
      'Google Pay debug builds using PRODUCTION require GOOGLE_PAY_ALLOW_LIVE_DEBUG=true.'
    );
  }
  if (gateway !== 'cybersource') {
    throw new Error('Google Pay configuration must set GOOGLE_PAY_GATEWAY to cybersource.');
  }
  if (!merchantId) {
    throw new Error(`Google Pay ${environment} configuration is missing GOOGLE_PAY_GATEWAY_MERCHANT_ID.`);
  }
  return environment;
};
