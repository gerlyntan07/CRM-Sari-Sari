/**
 * Generates a flag emoji from an ISO-2 country code
 * @param {string} countryCode - ISO-2 country code (e.g., "PH", "US", "GB")
 * @returns {string} Flag emoji for the country
 * 
 * Example:
 * getFlagEmoji("PH") => "🇵🇭"
 * getFlagEmoji("US") => "🇺🇸"
 */
export function getFlagEmoji(countryCode) {
  if (!countryCode) {
    return '';
  }
  
  const code = String(countryCode).trim().toUpperCase();
  
  if (code.length !== 2) {
    console.warn(`Invalid country code: "${countryCode}"`);
    return '';
  }
  
  try {
    const emoji = code
      .split('')
      .map(char => String.fromCodePoint(127397 + char.charCodeAt()))
      .join('');
    return emoji;
  } catch (e) {
    console.error(`Error generating emoji for ${code}:`, e);
    return code;
  }
}

/**
 * Adds flag emoji to currencies based on iso2 field
 * @param {Array} currencies - Array of currency objects with iso2 field
 * @returns {Array} Currencies with generated flag emojis
 */
export function addFlagsTocurrencies(currencies) {
  return currencies.map(currency => ({
    ...currency,
    flag: getFlagEmoji(currency.iso2)
  }));
}
