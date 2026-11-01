const fs = require("fs");
const path = require("path");

const envPath = path.resolve(__dirname, "..", ".env");

const envKeys = [
  "API_URL",
  "API_PREFIX",
  "APP_ENV",
  "GOOGLE_MAP_API_KEY",
  "APPLE_PAY_MERCHANT_ID",
  "PAYMENT_COUNTRY_CODE",
  "PAYMENT_CURRENCY_CODE",
  "GOOGLE_PAY_ENVIRONMENT",
  "GOOGLE_PAY_GATEWAY",
  "GOOGLE_PAY_MERCHANT_ID",
  "CYBERSOURCE_MERCHANT_ID",
];

const lines = envKeys
  .filter((key) => process.env[key] !== undefined)
  .map((key) => `${key}=${process.env[key]}`);

if (!lines.some((line) => line.startsWith("API_URL="))) {
  throw new Error("API_URL is required for EAS builds.");
}

if (!lines.some((line) => line.startsWith("API_PREFIX="))) {
  lines.push("API_PREFIX=/api/v1");
}

fs.writeFileSync(envPath, `${lines.join("\n")}\n`);
console.log(`Wrote ${lines.length} EAS environment values to .env`);
console.log(`API_URL=${process.env.API_URL}`);
