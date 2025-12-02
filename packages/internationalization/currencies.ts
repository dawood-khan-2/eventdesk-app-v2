/**
 * Currency configurations based on ISO 4217 standard
 * https://en.wikipedia.org/wiki/ISO_4217
 */

export type CurrencyConfig = {
  code: string;
  name: string;
  symbol: string;
  decimal: string;
  separator: string;
  precision: number;
  useVedic?: boolean;
};

export const currencies: Record<string, CurrencyConfig> = {
  // Americas
  USD: {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    decimal: ".",
    separator: ",",
    precision: 2,
  },
  CAD: {
    code: "CAD",
    name: "Canadian Dollar",
    symbol: "CA$",
    decimal: ".",
    separator: ",",
    precision: 2,
  },
  MXN: {
    code: "MXN",
    name: "Mexican Peso",
    symbol: "MX$",
    decimal: ".",
    separator: ",",
    precision: 2,
  },
  BRL: {
    code: "BRL",
    name: "Brazilian Real",
    symbol: "R$",
    decimal: ",",
    separator: ".",
    precision: 2,
  },
  ARS: {
    code: "ARS",
    name: "Argentine Peso",
    symbol: "AR$",
    decimal: ",",
    separator: ".",
    precision: 2,
  },

  // Europe
  EUR: {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    decimal: ",",
    separator: ".",
    precision: 2,
  },
  GBP: {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    decimal: ".",
    separator: ",",
    precision: 2,
  },
  CHF: {
    code: "CHF",
    name: "Swiss Franc",
    symbol: "CHF",
    decimal: ".",
    separator: "'",
    precision: 2,
  },
  SEK: {
    code: "SEK",
    name: "Swedish Krona",
    symbol: "kr",
    decimal: ",",
    separator: " ",
    precision: 2,
  },
  NOK: {
    code: "NOK",
    name: "Norwegian Krone",
    symbol: "kr",
    decimal: ",",
    separator: " ",
    precision: 2,
  },
  DKK: {
    code: "DKK",
    name: "Danish Krone",
    symbol: "kr",
    decimal: ",",
    separator: ".",
    precision: 2,
  },
  PLN: {
    code: "PLN",
    name: "Polish Zloty",
    symbol: "zł",
    decimal: ",",
    separator: " ",
    precision: 2,
  },
  CZK: {
    code: "CZK",
    name: "Czech Koruna",
    symbol: "Kč",
    decimal: ",",
    separator: " ",
    precision: 2,
  },
  RUB: {
    code: "RUB",
    name: "Russian Ruble",
    symbol: "₽",
    decimal: ",",
    separator: " ",
    precision: 2,
  },

  // Asia Pacific
  JPY: {
    code: "JPY",
    name: "Japanese Yen",
    symbol: "¥",
    decimal: ".",
    separator: ",",
    precision: 0,
  },
  CNY: {
    code: "CNY",
    name: "Chinese Yuan",
    symbol: "¥",
    decimal: ".",
    separator: ",",
    precision: 2,
  },
  INR: {
    code: "INR",
    name: "Indian Rupee",
    symbol: "₹",
    decimal: ".",
    separator: ",",
    precision: 2,
    useVedic: true,
  },
  AUD: {
    code: "AUD",
    name: "Australian Dollar",
    symbol: "A$",
    decimal: ".",
    separator: ",",
    precision: 2,
  },
  NZD: {
    code: "NZD",
    name: "New Zealand Dollar",
    symbol: "NZ$",
    decimal: ".",
    separator: ",",
    precision: 2,
  },
  SGD: {
    code: "SGD",
    name: "Singapore Dollar",
    symbol: "S$",
    decimal: ".",
    separator: ",",
    precision: 2,
  },
  HKD: {
    code: "HKD",
    name: "Hong Kong Dollar",
    symbol: "HK$",
    decimal: ".",
    separator: ",",
    precision: 2,
  },
  KRW: {
    code: "KRW",
    name: "South Korean Won",
    symbol: "₩",
    decimal: ".",
    separator: ",",
    precision: 0,
  },
  THB: {
    code: "THB",
    name: "Thai Baht",
    symbol: "฿",
    decimal: ".",
    separator: ",",
    precision: 2,
  },
  MYR: {
    code: "MYR",
    name: "Malaysian Ringgit",
    symbol: "RM",
    decimal: ".",
    separator: ",",
    precision: 2,
  },
  IDR: {
    code: "IDR",
    name: "Indonesian Rupiah",
    symbol: "Rp",
    decimal: ",",
    separator: ".",
    precision: 0,
  },
  PHP: {
    code: "PHP",
    name: "Philippine Peso",
    symbol: "₱",
    decimal: ".",
    separator: ",",
    precision: 2,
  },
  VND: {
    code: "VND",
    name: "Vietnamese Dong",
    symbol: "₫",
    decimal: ",",
    separator: ".",
    precision: 0,
  },
  PKR: {
    code: "PKR",
    name: "Pakistani Rupee",
    symbol: "₨",
    decimal: ".",
    separator: ",",
    precision: 2,
  },
  BDT: {
    code: "BDT",
    name: "Bangladeshi Taka",
    symbol: "৳",
    decimal: ".",
    separator: ",",
    precision: 2,
  },

  // Middle East & Africa
  AED: {
    code: "AED",
    name: "UAE Dirham",
    symbol: "د.إ",
    decimal: ".",
    separator: ",",
    precision: 2,
  },
  SAR: {
    code: "SAR",
    name: "Saudi Riyal",
    symbol: "﷼",
    decimal: ".",
    separator: ",",
    precision: 2,
  },
  ILS: {
    code: "ILS",
    name: "Israeli Shekel",
    symbol: "₪",
    decimal: ".",
    separator: ",",
    precision: 2,
  },
  TRY: {
    code: "TRY",
    name: "Turkish Lira",
    symbol: "₺",
    decimal: ",",
    separator: ".",
    precision: 2,
  },
  ZAR: {
    code: "ZAR",
    name: "South African Rand",
    symbol: "R",
    decimal: ".",
    separator: ",",
    precision: 2,
  },
  EGP: {
    code: "EGP",
    name: "Egyptian Pound",
    symbol: "E£",
    decimal: ".",
    separator: ",",
    precision: 2,
  },
  NGN: {
    code: "NGN",
    name: "Nigerian Naira",
    symbol: "₦",
    decimal: ".",
    separator: ",",
    precision: 2,
  },
  KES: {
    code: "KES",
    name: "Kenyan Shilling",
    symbol: "KSh",
    decimal: ".",
    separator: ",",
    precision: 2,
  },
} as const;

export const currencyCodes = Object.keys(currencies) as Array<
  keyof typeof currencies
>;

export const getCurrencyConfig = (code: string): CurrencyConfig => {
  return currencies[code] || currencies.USD;
};

export const formatCurrencyList = () => {
  return Object.values(currencies).map((currency) => ({
    value: currency.code,
    label: `${currency.name} (${currency.symbol})`,
  }));
};
