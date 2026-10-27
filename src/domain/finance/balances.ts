// ============================================================
// TRIPKHATA — BALANCE CALCULATION ENGINE
//
// SIGN CONVENTION (must be followed everywhere):
//   Positive balance → member should RECEIVE money
//   Negative balance → member OWES money
//   Zero balance     → member is settled
//
// CORRECT FORMULA:
//   Net balance =
//       Total paid for trip expenses
//     − Total allocated expense responsibility
//     + Settlements paid OUT (from this member to others)
//     − Settlements received (from others to this member)
//
// WHY: When Aman (owing member) pays Rahul ₹400:
//   - Aman's balance increases by ₹400 (moving toward 0 from negative)
//   - Rahul's balance decreases by ₹400 (moving toward 0 from positive)
// This correctly reflects partial settlement behavior.
// ============================================================

import { assertInteger } from './money';
import type {
  Expense,
  Settlement,
  Member,
  MemberBalance,
  RecommendedTransfer,
} from '../models/types';

/**
 * Calculate net balances for all members of a trip.
 *
 * @param expenses  - All non-deleted expenses for the trip
 * @param settlements - All recorded settlements for the trip
 * @param members   - All members (including archived) for the trip
 * @returns         - Map from memberId → MemberBalance
 */
export function calculateBalances(
  expenses: Expense[],
  settlements: Settlement[],
  members: Member[]
): Map<string, MemberBalance> {
  const balanceMap = new Map<string, MemberBalance>();

  // Initialise all members with zero balances
  for (const member of members) {
    balanceMap.set(member.id, {
      memberId: member.id,
      memberName: member.name,
      totalPaidPaise: 0,
      totalAllocatedPaise: 0,
      settlementsReceivedPaise: 0,
      settlementsPaidPaise: 0,
      netBalancePaise: 0,
    });
  }

  // 1. Process expenses
  for (const expense of expenses) {
    assertInteger(expense.amountPaise);

    // Credit the payer
    const payerBalance = balanceMap.get(expense.paidByMemberId);
    if (payerBalance) {
      payerBalance.totalPaidPaise += expense.amountPaise;
    }

    // Debit each participant via their allocation
    for (const allocation of expense.allocations) {
      assertInteger(allocation.amountPaise);
      const participantBalance = balanceMap.get(allocation.memberId);
      if (participantBalance) {
        participantBalance.totalAllocatedPaise += allocation.amountPaise;
      }
    }
  }

  // 2. Process settlements
  for (const settlement of settlements) {
    assertInteger(settlement.amountPaise);

    // fromMember paid OUT → their balance increases (moving toward 0 if negative)
    const senderBalance = balanceMap.get(settlement.fromMemberId);
    if (senderBalance) {
      senderBalance.settlementsPaidPaise += settlement.amountPaise;
    }

    // toMember received → their balance decreases (moving toward 0 if positive)
    const recipientBalance = balanceMap.get(settlement.toMemberId);
    if (recipientBalance) {
      recipientBalance.settlementsReceivedPaise += settlement.amountPaise;
    }
  }

  // 3. Compute net balance for each member
  for (const [, balance] of balanceMap) {
    balance.netBalancePaise =
      balance.totalPaidPaise
      - balance.totalAllocatedPaise
      + balance.settlementsPaidPaise
      - balance.settlementsReceivedPaise;
  }

  return balanceMap;
}

/**
 * Calculate the total trip spending.
 * Settlements between members do NOT count as trip spending.
 */
export function calculateTotalTripSpending(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => {
    assertInteger(e.amountPaise);
    return sum + e.amountPaise;
  }, 0);
}

/**
 * Verify that all member balances sum to zero.
 * For a valid single-currency trip ledger this must always hold.
 */
export function verifyZeroSum(balances: Map<string, MemberBalance>): {
  valid: boolean;
  sumPaise: number;
} {
  let total = 0;
  for (const [, b] of balances) {
    total += b.netBalancePaise;
  }
  return { valid: total === 0, sumPaise: total };
}

/**
 * Recommend settlement transfers using greedy creditor-debtor matching.
 * This minimises the number of transfers in most practical cases.
 *
 * Algorithm:
 *   1. Split members into creditors (positive balance) and debtors (negative).
 *   2. Match the largest debtor with the largest creditor.
 *   3. Create a transfer for min(|debtor balance|, creditor balance).
 *   4. Reduce both balances by the transfer amount.
 *   5. Repeat until all balances are zero.
 */
export function recommendSettlements(
  balances: Map<string, MemberBalance>
): RecommendedTransfer[] {
  const transfers: RecommendedTransfer[] = [];

  // Work on mutable copies
  const workingBalances = new Map<string, { memberId: string; memberName: string; paise: number }>();
  for (const [id, b] of balances) {
    if (b.netBalancePaise !== 0) {
      workingBalances.set(id, {
        memberId: id,
        memberName: b.memberName,
        paise: b.netBalancePaise,
      });
    }
  }

  const MAX_ITERATIONS = 10000;
  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    // Find the largest creditor (highest positive balance)
    let creditor: { memberId: string; memberName: string; paise: number } | null = null;
    // Find the largest debtor (most negative balance)
    let debtor: { memberId: string; memberName: string; paise: number } | null = null;

    for (const [, b] of workingBalances) {
      if (b.paise > 0) {
        if (!creditor || b.paise > creditor.paise) creditor = b;
      } else if (b.paise < 0) {
        if (!debtor || b.paise < debtor.paise) debtor = b;
      }
    }

    if (!creditor || !debtor) break; // All settled

    const transferAmount = Math.min(creditor.paise, Math.abs(debtor.paise));

    transfers.push({
      fromMemberId: debtor.memberId,
      fromMemberName: debtor.memberName,
      toMemberId: creditor.memberId,
      toMemberName: creditor.memberName,
      amountPaise: transferAmount,
    });

    creditor.paise -= transferAmount;
    debtor.paise += transferAmount;

    // Remove settled members
    if (creditor.paise === 0) workingBalances.delete(creditor.memberId);
    if (debtor.paise === 0) workingBalances.delete(debtor.memberId);
  }

  return transfers;
}
