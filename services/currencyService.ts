
interface CurrencyConfig {
  code: string;
  rate: number; // Simplified conversion rate relative to USD
  symbol: string;
}

const CURRENCY_MAP: Record<string, CurrencyConfig> = {
  'default': { code: 'USD', rate: 1, symbol: '$' },
  'en-GB': { code: 'GBP', rate: 0.85, symbol: '£' },
  'en-AU': { code: 'AUD', rate: 1.5, symbol: 'A$' },
  'en-CA': { code: 'CAD', rate: 1.35, symbol: 'C$' },
  'ja-JP': { code: 'JPY', rate: 150, symbol: '¥' },
  'de-DE': { code: 'EUR', rate: 0.92, symbol: '€' },
  'fr-FR': { code: 'EUR', rate: 0.92, symbol: '€' },
  'it-IT': { code: 'EUR', rate: 0.92, symbol: '€' },
  'es-ES': { code: 'EUR', rate: 0.92, symbol: '€' },
  'zh-CN': { code: 'CNY', rate: 7.2, symbol: '¥' },
  'in-IN': { code: 'INR', rate: 83, symbol: '₹' },
  'pt-BR': { code: 'BRL', rate: 5, symbol: 'R$' },
};

/**
 * Gets the most appropriate currency config based on browser locale
 */
export const getLocalCurrencyConfig = (): CurrencyConfig => {
  const locale = navigator.language;
  return CURRENCY_MAP[locale] || 
         CURRENCY_MAP[Object.keys(CURRENCY_MAP).find(key => locale.startsWith(key.split('-')[0])) || 'default'] || 
         CURRENCY_MAP['default'];
};

/**
 * Adjusts a USD price to a regional "Tier" price.
 * Gamers expect prices like .49 or .99 rather than raw conversions.
 */
const getPsychologicalPrice = (raw: number, code: string): number => {
  if (code === 'JPY') return Math.round(raw / 10) * 10; // Japanese Yen doesn't use decimals
  
  const floor = Math.floor(raw);
  // Return either X.49 or X.99 depending on which is closer
  return floor + (raw - floor < 0.5 ? 0.49 : 0.99);
};

/**
 * Formats a USD base price into a localized string
 */
export const formatLocalPrice = (usdPrice: number): string => {
  const config = getLocalCurrencyConfig();
  const regionalPrice = getPsychologicalPrice(usdPrice * config.rate, config.code);
  
  return new Intl.NumberFormat(navigator.language, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: config.code === 'JPY' ? 0 : 2
  }).format(regionalPrice);
};
