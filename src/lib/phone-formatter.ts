/**
 * Format phone number as (XXX) XXX-XXXX
 * @param value - Raw phone number input
 * @returns Formatted phone number string
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, "");
  
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
 * Strip formatting from phone number (get raw digits)
 * @param value - Formatted phone number
 * @returns Raw digits only
 */
export function stripPhoneNumber(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Validate phone number (must be 10 digits)
 * @param value - Phone number to validate
 * @returns True if valid
 */
export function isValidPhoneNumber(value: string): boolean {
  const digits = stripPhoneNumber(value);
  return digits.length === 10;
}
