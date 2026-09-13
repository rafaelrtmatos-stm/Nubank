/**
 * Bank Agency and Account Number Generator
 * Supports manual customization and realistic random generation for Nubank / Brazilian accounts.
 */

export const COMMON_AGENCIES = ['0001', '0101', '0256', '0818', '1420', '3412', '4580', '1234'];

/**
 * Generates a realistic random checking account number with check digit.
 * Format: XXXXXXXX-X (e.g. 79827260-9 or 93991375-4)
 */
export function generateRandomAccountNumber(): string {
  const baseNumber = Math.floor(10000000 + Math.random() * 90000000);
  const checkDigit = Math.floor(Math.random() * 10);
  return `${baseNumber}-${checkDigit}`;
}

/**
 * Generates a bank agency code.
 * @param preferStandardNubank if true, uses standard Nubank agency '0001'
 */
export function generateRandomAgency(preferStandardNubank = true): string {
  if (preferStandardNubank) {
    return '0001';
  }
  const randomIndex = Math.floor(Math.random() * COMMON_AGENCIES.length);
  return COMMON_AGENCIES[randomIndex];
}

/**
 * Generates both agency and checking account number.
 */
export function generateRandomBankAccount(preferStandardNubank = true): {
  agency: string;
  accountNumber: string;
} {
  return {
    agency: generateRandomAgency(preferStandardNubank),
    accountNumber: generateRandomAccountNumber(),
  };
}
