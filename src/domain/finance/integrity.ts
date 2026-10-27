// ============================================================
// TRIPKHATA — LEDGER INTEGRITY CHECKS
// ============================================================

import { sumPaise } from './money';
import { calculateBalances, verifyZeroSum } from './balances';
import type { Trip, Member, Expense, Settlement, IntegrityViolation } from '../models/types';

/**
 * Run all ledger integrity checks against a trip's data.
 * Returns a list of violations. An empty list means the ledger is valid.
 */
export function checkLedgerIntegrity(
  _trip: Trip,
  expenses: Expense[],
  settlements: Settlement[],
  members: Member[]
): IntegrityViolation[] {
  const violations: IntegrityViolation[] = [];
  const memberIds = new Set(members.map((m) => m.id));

  // 1. Each expense's allocations must sum exactly to its amount
  for (const expense of expenses) {
    const allocationTotal = sumPaise(expense.allocations.map((a) => a.amountPaise));
    if (allocationTotal !== expense.amountPaise) {
      violations.push({
        code: 'EXPENSE_ALLOCATION_MISMATCH',
        message: `Expense "${expense.title}" (${expense.id}): allocations sum to ${allocationTotal} paise but expense is ${expense.amountPaise} paise.`,
        severity: 'error',
      });
    }

    // 2. Payer must be a known member
    if (!memberIds.has(expense.paidByMemberId)) {
      violations.push({
        code: 'UNKNOWN_PAYER',
        message: `Expense "${expense.title}" references unknown payer ${expense.paidByMemberId}.`,
        severity: 'error',
      });
    }

    // 3. Allocation members must be known
    for (const alloc of expense.allocations) {
      if (!memberIds.has(alloc.memberId)) {
        violations.push({
          code: 'UNKNOWN_ALLOCATION_MEMBER',
          message: `Expense "${expense.title}" allocation references unknown member ${alloc.memberId}.`,
          severity: 'error',
        });
      }
      if (alloc.amountPaise < 0) {
        violations.push({
          code: 'NEGATIVE_ALLOCATION',
          message: `Expense "${expense.title}" has a negative allocation for member ${alloc.memberId}.`,
          severity: 'error',
        });
      }
    }

    // 4. Expense amount must be positive
    if (expense.amountPaise <= 0) {
      violations.push({
        code: 'NON_POSITIVE_EXPENSE',
        message: `Expense "${expense.title}" has a non-positive amount: ${expense.amountPaise}.`,
        severity: 'error',
      });
    }
  }

  // 5. Settlement validations
  for (const settlement of settlements) {
    if (!memberIds.has(settlement.fromMemberId)) {
      violations.push({
        code: 'UNKNOWN_SETTLEMENT_SENDER',
        message: `Settlement ${settlement.id} references unknown sender ${settlement.fromMemberId}.`,
        severity: 'error',
      });
    }
    if (!memberIds.has(settlement.toMemberId)) {
      violations.push({
        code: 'UNKNOWN_SETTLEMENT_RECIPIENT',
        message: `Settlement ${settlement.id} references unknown recipient ${settlement.toMemberId}.`,
        severity: 'error',
      });
    }
    if (settlement.fromMemberId === settlement.toMemberId) {
      violations.push({
        code: 'SELF_SETTLEMENT',
        message: `Settlement ${settlement.id} has the same sender and recipient.`,
        severity: 'error',
      });
    }
    if (settlement.amountPaise <= 0) {
      violations.push({
        code: 'NON_POSITIVE_SETTLEMENT',
        message: `Settlement ${settlement.id} has a non-positive amount: ${settlement.amountPaise}.`,
        severity: 'error',
      });
    }
  }

  // 6. Zero-sum invariant
  if (members.length > 0 && expenses.length > 0) {
    const balances = calculateBalances(expenses, settlements, members);
    const { valid, sumPaise: balanceSum } = verifyZeroSum(balances);
    if (!valid) {
      violations.push({
        code: 'BALANCE_NOT_ZERO_SUM',
        message: `Member balances do not sum to zero. Sum: ${balanceSum} paise. This indicates a data integrity error.`,
        severity: 'error',
      });
    }
  }

  return violations;
}
