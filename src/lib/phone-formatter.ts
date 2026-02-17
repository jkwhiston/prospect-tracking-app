/**
 * Strip leading US country code from digit string.
 * If 11 digits starting with '1', removes the leading '1'.
 */
function stripCountryCode(digits: string): string {
  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }
  return digits;
}

/**
 * Format phone number as (XXX) XXX-XXXX
 * Accepts raw 10-digit, 11-digit with leading 1, or +1 prefixed numbers.
 * @param value - Raw phone number input
 * @returns Formatted phone number string
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  let digits = value.replace(/\D/g, "");

  // Strip leading US country code '1' from 11-digit inputs
  digits = stripCountryCode(digits);

  // Limit to 10 digits
  const limitedDigits = digits.slice(0, 10);

  // Format based on length
  if (limitedDigits.length === 0) {
    return "";
  } else if (limitedDigits.length <= 3) {
    return `(${limitedDigits}`;
  } else if (limitedDigits.length <= 6) {
    return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3)}`;
  } else {
    return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;
  }
}

/**
 * Strip formatting from phone number (get raw digits, country code removed)
 * @param value - Formatted phone number
 * @returns Raw 10 digits only
 */
export function stripPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  return stripCountryCode(digits);
}

/**
 * Validate phone number (must be 10 digits, or 11 with leading US country code)
 * @param value - Phone number to validate
 * @returns True if valid
 */
export function isValidPhoneNumber(value: string): boolean {
  const digits = stripPhoneNumber(value);
  return digits.length === 10;
}
