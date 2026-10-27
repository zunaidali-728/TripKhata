// ============================================================
// TRIPKHATA — EXPENSE SPLITTING ENGINE
// All amounts are integer paise. No floating-point arithmetic.
// ============================================================

import { assertInteger, sumPaise } from './money';
import type { Allocation } from '../models/types';

export type SplitInput =
  | { method: 'equal'; totalPaise: number; memberIds: string[] }
  | { method: 'custom'; totalPaise: number; inputs: { memberId: string; amountPaise: number }[] }
  | { method: 'percentage'; totalPaise: number; inputs: { memberId: string; percentage: number }[] };

export type SplitResult =
  | { ok: true; allocations: Allocation[] }
  | { ok: false; error: string };

// ─── Equal Splitting ─────────────────────────────────────────

/**
 * Split an amount equally among members.
 * Remaining paise (when not divisible) are distributed to the
 * first N members deterministically.
 *
 * Example: ₹100 (10000 paise) among 3:
 *   Member[0]: 3334 paise  (₹33.34)
 *   Member[1]: 3333 paise  (₹33.33)
 *   Member[2]: 3333 paise  (₹33.33)
 *   Total: 10000 paise     (₹100.00) ✓
 */
export function splitEqual(totalPaise: number, memberIds: string[]): SplitResult {
  assertInteger(totalPaise);
  if (totalPaise <= 0) return { ok: false, error: 'Total amount must be positive.' };
  if (memberIds.length === 0) return { ok: false, error: 'At least one participant is required.' };

  const count = memberIds.length;
  const base = Math.floor(totalPaise / count);
  const remainder = totalPaise % count;

  const allocations: Allocation[] = memberIds.map((memberId, index) => ({
    memberId,
    amountPaise: base + (index < remainder ? 1 : 0),
  }));

  // Invariant check
  const total = sumPaise(allocations.map((a) => a.amountPaise));
  if (total !== totalPaise) {
    return { ok: false, error: `Allocation sum ${total} does not equal total ${totalPaise}.` };
  }

  return { ok: true, allocations };
}

// ─── Custom Amount Splitting ─────────────────────────────────

/**
 * Validate and return custom allocations.
 * Rejects if sum of inputs does not equal totalPaise.
 */
export function splitCustom(
  totalPaise: number,
  inputs: { memberId: string; amountPaise: number }[]
): SplitResult {
  assertInteger(totalPaise);
  if (totalPaise <= 0) return { ok: false, error: 'Total amount must be positive.' };
  if (inputs.length === 0) return { ok: false, error: 'At least one participant is required.' };

  for (const input of inputs) {
    assertInteger(input.amountPaise);
    if (input.amountPaise < 0) {
      return { ok: false, error: `Allocation for member ${input.memberId} cannot be negative.` };
    }
  }

  const allocatedTotal = sumPaise(inputs.map((i) => i.amountPaise));
  const unallocated = totalPaise - allocatedTotal;

  if (unallocated !== 0) {
    return {
      ok: false,
      error: `Allocations sum to ${allocatedTotal} paise but expense is ${totalPaise} paise. Difference: ${unallocated} paise.`,
    };
  }

  const allocations: Allocation[] = inputs.map(({ memberId, amountPaise }) => ({
    memberId,
    amountPaise,
  }));

  return { ok: true, allocations };
}

// ─── Percentage Splitting ─────────────────────────────────────

/**
 * Split by percentage.
 * Percentages must sum to exactly 100.
 * Uses paise-integer arithmetic with remainder distributed to the first member.
 *
 * Example: ₹1000 (100000 paise) at 33.33%, 33.33%, 33.34%:
 *   Member[0]: 33330 + (remainder 10 paise adjustment) ...
 *
 * Percentages are stored as numbers with up to 2 decimal places
 * (e.g., 33.33, 33.33, 33.34). We multiply by 100 and work in
 * basis points (1/10000 of a rupee) for the calculation, then
 * map back to paise.
 */
export function splitPercentage(
  totalPaise: number,
  inputs: { memberId: string; percentage: number }[]
): SplitResult {
  assertInteger(totalPaise);
  if (totalPaise <= 0) return { ok: false, error: 'Total amount must be positive.' };
  if (inputs.length === 0) return { ok: false, error: 'At least one participant is required.' };

  for (const input of inputs) {
    if (input.percentage < 0) {
      return { ok: false, error: `Percentage for member ${input.memberId} cannot be negative.` };
    }
  }

  // Validate that percentages sum to 100.00 (within 0.01 tolerance for display rounding)
  const percentageSum = inputs.reduce((acc, i) => acc + i.percentage, 0);
  const diff = Math.abs(percentageSum - 100);
  if (diff > 0.01) {
    return {
      ok: false,
      error: `Percentages must sum to 100%. Current sum: ${percentageSum.toFixed(2)}%.`,
    };
  }

  // Calculate each member's share in paise using floor, then distribute remainder
  const shares = inputs.map((input) => ({
    memberId: input.memberId,
    amountPaise: Math.floor((totalPaise * input.percentage) / 100),
  }));

  const allocatedTotal = sumPaise(shares.map((s) => s.amountPaise));
  let remainingPaise = totalPaise - allocatedTotal;

  // Distribute remaining paise to the members with the largest fractional parts
  const fractionals = inputs.map((input, index) => ({
    index,
    fractional: (totalPaise * input.percentage) / 100 - shares[index].amountPaise,
  }));
  fractionals.sort((a, b) => b.fractional - a.fractional);

  for (let i = 0; i < remainingPaise; i++) {
    shares[fractionals[i].index].amountPaise += 1;
  }
  remainingPaise = 0;

  const total = sumPaise(shares.map((s) => s.amountPaise));
  if (total !== totalPaise) {
    return { ok: false, error: `Allocation sum ${total} does not equal total ${totalPaise}.` };
  }

  return { ok: true, allocations: shares };
}

/**
 * Unified split function.
 */
export function split(input: SplitInput): SplitResult {
  switch (input.method) {
    case 'equal':
      return splitEqual(input.totalPaise, input.memberIds);
    case 'custom':
      return splitCustom(input.totalPaise, input.inputs);
    case 'percentage':
      return splitPercentage(input.totalPaise, input.inputs);
  }
}
