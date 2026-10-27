// ============================================================
// TRIPKHATA — MONETARY ARITHMETIC
// All values are integer paise. 1 INR = 100 paise.
// NEVER use floating-point as the authoritative representation.
// ============================================================

/**
 * Add two paise amounts safely.
 * Both inputs must be non-negative integers.
 */
export function addPaise(a: number, b: number): number {
  assertInteger(a);
  assertInteger(b);
  return a + b;
}

/**
 * Subtract b from a. Result may be negative.
 */
export function subtractPaise(a: number, b: number): number {
  assertInteger(a);
  assertInteger(b);
  return a - b;
}

/**
 * Convert a decimal INR string or number to integer paise.
 * "1234.56" → 123456
 * "100"     → 10000
 * 100.5     → 10050
 * Throws if the value is not a valid positive monetary amount.
 */
export function parseINRtoPaise(value: string | number): number {
  const str = String(value).trim().replace(/,/g, '');
  const num = parseFloat(str);
  if (isNaN(num) || num < 0) {
    throw new Error(`Invalid INR value: ${value}`);
  }
  // Round to nearest paise to avoid float imprecision
  return Math.round(num * 100);
}

/**
 * Format integer paise as a human-readable INR string.
 * 123456 → "₹1,234.56"
 * 10000  → "₹100.00"
 * -75000 → "−₹750.00"
 */
export function formatPaiseAsINR(paise: number): string {
  assertInteger(paise);
  const negative = paise < 0;
  const abs = Math.abs(paise);
  const rupees = Math.floor(abs / 100);
  const remainder = abs % 100;
  const paiseStr = remainder.toString().padStart(2, '0');

  // Indian number formatting: 1,00,000 style
  const rupeeStr = rupees.toLocaleString('en-IN');

  return `${negative ? '−' : ''}₹${rupeeStr}.${paiseStr}`;
}

/**
 * Format paise as a compact label for cards.
 * 123456  → "₹1,234"
 * 1000000 → "₹10,000"
 */
export function formatPaiseCompact(paise: number): string {
  assertInteger(paise);
  const negative = paise < 0;
  const abs = Math.abs(paise);
  const rupees = Math.floor(abs / 100);
  return `${negative ? '−' : ''}₹${rupees.toLocaleString('en-IN')}`;
}

/**
 * Convert paise to a decimal number for display inputs.
 * 123456 → 1234.56
 */
export function paiseToDecimal(paise: number): number {
  assertInteger(paise);
  return paise / 100;
}

/**
 * Verify that a value is a safe integer.
 */
export function assertInteger(value: number): void {
  if (!Number.isInteger(value)) {
    throw new Error(`Expected integer paise, got: ${value}`);
  }
  if (!Number.isSafeInteger(value)) {
    throw new Error(`Paise value exceeds safe integer range: ${value}`);
  }
}

/**
 * Sum an array of paise values.
 */
export function sumPaise(values: number[]): number {
  return values.reduce((acc, v) => {
    assertInteger(v);
    return acc + v;
  }, 0);
}
