/**
 * Validation utilities for property and tax record data.
 */

/**
 * Validate a parcel/account identifier.
 * Accepts common formats: numeric, alphanumeric with dashes, etc.
 * @param {string} id
 * @returns {{ valid: boolean, normalized: string }}
 */
export function validateParcelId(id) {
  if (!id || typeof id !== "string") return { valid: false, normalized: "" };
  const normalized = id.trim().toUpperCase().replace(/\s+/g, "-");
  // Accept: digits only, or digits with dashes/letters
  const valid = /^[A-Z0-9][A-Z0-9\-]{2,19}$/.test(normalized) || /^\d{4,12}$/.test(normalized);
  return { valid, normalized };
}

/**
 * Validate a monetary amount string or number.
 * @param {*} amount
 * @returns {{ valid: boolean, value: number, raw: string }}
 */
export function validateAmount(amount) {
  if (amount === null || amount === undefined) return { valid: false, value: 0, raw: "" };
  const raw = String(amount).replace(/[^0-9.\-]/g, "");
  const value = parseFloat(raw);
  return { valid: !isNaN(value) && value >= 0, value, raw: String(amount) };
}

/**
 * Validate a property address string.
 * @param {string} address
 * @returns {{ valid: boolean, normalized: string }}
 */
export function validateAddress(address) {
  if (!address || typeof address !== "string") return { valid: false, normalized: "" };
  const normalized = address.trim();
  return { valid: normalized.length >= 5, normalized };
}

/**
 * Validate a complete property record.
 * @param {object} record
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateRecord(record) {
  const errors = [];
  if (!record || typeof record !== "object") return { valid: false, errors: ["Record is not an object"] };
  if (!record.parcelId) errors.push("Missing parcelId");
  if (!record.ownerName) errors.push("Missing ownerName");
  if (!record.address) errors.push("Missing address");
  if (record.delinquencyYears == null || record.delinquencyYears < 0) errors.push("Invalid delinquencyYears");
  if (record.delinquencyAmount == null || record.delinquencyAmount < 0) errors.push("Invalid delinquencyAmount");
  return { valid: errors.length === 0, errors };
}