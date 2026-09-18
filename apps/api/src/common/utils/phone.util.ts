import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';

/**
 * Normalizes a phone number string to E.164 format.
 * Returns null if the number is invalid.
 */
export function normalizePhone(
  phone: string,
  defaultCountry?: CountryCode,
): string | null {
  try {
    if (!phone) return null;
    const parsed = parsePhoneNumber(phone, defaultCountry ?? 'US');
    if (!parsed || !parsed.isValid()) return null;
    return parsed.format('E.164');
  } catch {
    return null;
  }
}

/**
 * Validates whether a phone number string is a valid E.164 or parseable phone number.
 */
export function isValidPhone(phone: string, defaultCountry?: CountryCode): boolean {
  try {
    if (!phone) return false;
    return isValidPhoneNumber(phone, defaultCountry ?? 'US');
  } catch {
    return false;
  }
}

/**
 * Formats a phone number for display (e.g. "+1 415-555-2671").
 */
export function formatPhoneDisplay(phone: string): string {
  try {
    const parsed = parsePhoneNumber(phone);
    return parsed ? parsed.formatInternational() : phone;
  } catch {
    return phone;
  }
}
