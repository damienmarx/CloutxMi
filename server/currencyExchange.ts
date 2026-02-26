/**
 * Currency Exchange System
 * Handles conversion between USD, CAD, and OSRS GP (in Mils)
 * Provides real-time exchange rates and player-friendly conversion display
 */

export type Currency = "USD" | "CAD" | "OSRS_GP";

interface ExchangeRate {
  from: Currency;
  to: Currency;
  rate: number;
  lastUpdated: Date;
}

interface CurrencyConfig {
  minDeposit: number;
  maxDeposit: number;
  minWithdraw: number;
  maxWithdraw: number;
}

// Exchange rates (in real implementation, these would be fetched from an external API)
// These are placeholder rates - update with real market data
const EXCHANGE_RATES: Record<string, number> = {
  "USD_to_CAD": 1.36,
  "CAD_to_USD": 0.735,
  "USD_to_OSRS_GP": 1000000, // 1 USD = 1 Million OSRS GP (configurable)
  "OSRS_GP_to_USD": 0.000001, // 1 OSRS GP = 0.000001 USD
  "CAD_to_OSRS_GP": 735294, // 1 CAD = ~735,294 OSRS GP
  "OSRS_GP_to_CAD": 0.00000136, // 1 OSRS GP = 0.00000136 CAD
};

// Currency configuration limits
const CURRENCY_CONFIG: Record<Currency, CurrencyConfig> = {
  USD: {
    minDeposit: 1,
    maxDeposit: 50000,
    minWithdraw: 1,
    maxWithdraw: 50000,
  },
  CAD: {
    minDeposit: 1.36,
    maxDeposit: 68000,
    minWithdraw: 1.36,
    maxWithdraw: 68000,
  },
  OSRS_GP: {
    minDeposit: 1000000, // 1 Million GP
    maxDeposit: 50000000000, // 50 Billion GP
    minWithdraw: 1000000, // 1 Million GP
    maxWithdraw: 50000000000, // 50 Billion GP
  },
};

/**
 * Convert amount from one currency to another
 * @param amount The amount to convert
 * @param from Source currency
 * @param to Target currency
 * @returns Converted amount
 */
export function convertCurrency(amount: number, from: Currency, to: Currency): number {
  if (from === to) return amount;

  const rateKey = `${from}_to_${to}`;
  const rate = EXCHANGE_RATES[rateKey];

  if (!rate) {
    throw new Error(`Exchange rate not found for ${from} to ${to}`);
  }

  return parseFloat((amount * rate).toFixed(2));
}

/**
 * Format currency for display to players
 * @param amount The amount to format
 * @param currency The currency type
 * @returns Formatted string for display
 */
export function formatCurrency(amount: number, currency: Currency): string {
  switch (currency) {
    case "USD":
      return `$${amount.toFixed(2)} USD`;
    case "CAD":
      return `$${amount.toFixed(2)} CAD`;
    case "OSRS_GP":
      // Format large numbers with commas for readability
      return `${Math.floor(amount).toLocaleString()} GP`;
    default:
      return `${amount}`;
  }
}

/**
 * Get currency symbol
 * @param currency The currency type
 * @returns Currency symbol
 */
export function getCurrencySymbol(currency: Currency): string {
  switch (currency) {
    case "USD":
      return "$";
    case "CAD":
      return "C$";
    case "OSRS_GP":
      return "GP";
    default:
      return "";
  }
}

/**
 * Validate deposit amount
 * @param amount The amount to validate
 * @param currency The currency type
 * @returns Object with validation result and error message if invalid
 */
export function validateDepositAmount(amount: number, currency: Currency): { valid: boolean; error?: string } {
  const config = CURRENCY_CONFIG[currency];

  if (amount < config.minDeposit) {
    return {
      valid: false,
      error: `Minimum deposit is ${formatCurrency(config.minDeposit, currency)}`,
    };
  }

  if (amount > config.maxDeposit) {
    return {
      valid: false,
      error: `Maximum deposit is ${formatCurrency(config.maxDeposit, currency)}`,
    };
  }

  return { valid: true };
}

/**
 * Validate withdrawal amount
 * @param amount The amount to validate
 * @param currency The currency type
 * @returns Object with validation result and error message if invalid
 */
export function validateWithdrawAmount(amount: number, currency: Currency): { valid: boolean; error?: string } {
  const config = CURRENCY_CONFIG[currency];

  if (amount < config.minWithdraw) {
    return {
      valid: false,
      error: `Minimum withdrawal is ${formatCurrency(config.minWithdraw, currency)}`,
    };
  }

  if (amount > config.maxWithdraw) {
    return {
      valid: false,
      error: `Maximum withdrawal is ${formatCurrency(config.maxWithdraw, currency)}`,
    };
  }

  return { valid: true };
}

/**
 * Get exchange rate between two currencies
 * @param from Source currency
 * @param to Target currency
 * @returns Exchange rate
 */
export function getExchangeRate(from: Currency, to: Currency): number {
  if (from === to) return 1;

  const rateKey = `${from}_to_${to}`;
  const rate = EXCHANGE_RATES[rateKey];

  if (!rate) {
    throw new Error(`Exchange rate not found for ${from} to ${to}`);
  }

  return rate;
}

/**
 * Get all supported currencies
 * @returns Array of supported currencies
 */
export function getSupportedCurrencies(): Currency[] {
  return ["USD", "CAD", "OSRS_GP"];
}

/**
 * Get currency configuration
 * @param currency The currency type
 * @returns Currency configuration
 */
export function getCurrencyConfig(currency: Currency): CurrencyConfig {
  return CURRENCY_CONFIG[currency];
}

/**
 * Update exchange rate (for admin use)
 * @param from Source currency
 * @param to Target currency
 * @param rate New exchange rate
 */
export function updateExchangeRate(from: Currency, to: Currency, rate: number): void {
  const rateKey = `${from}_to_${to}`;
  EXCHANGE_RATES[rateKey] = rate;
  
  // Update reverse rate
  const reverseKey = `${to}_from_${from}`;
  EXCHANGE_RATES[reverseKey] = 1 / rate;
}

/**
 * Get all exchange rates
 * @returns Object containing all exchange rates
 */
export function getAllExchangeRates(): Record<string, number> {
  return { ...EXCHANGE_RATES };
}
