// ============================================================
// TRIPKHATA — FINANCIAL ENGINE UNIT TESTS
//
// These tests verify the correctness of all financial calculations.
// All amounts use integer paise. 1 INR = 100 paise.
//
// SIGN CONVENTION:
//   Positive balance → member should RECEIVE money
//   Negative balance → member OWES money
//   Zero balance     → member is settled
// ============================================================

import { describe, it, expect } from 'vitest';
import { splitEqual, splitCustom, splitPercentage } from '@/domain/finance/splitter';
import {
  calculateBalances,
  calculateTotalTripSpending,
  verifyZeroSum,
  recommendSettlements,
} from '@/domain/finance/balances';
import { formatPaiseAsINR, parseINRtoPaise, sumPaise } from '@/domain/finance/money';
import { checkLedgerIntegrity } from '@/domain/finance/integrity';
import type { Expense, Settlement, Member, Trip } from '@/domain/models/types';

// ─── Helpers ─────────────────────────────────────────────────

function makeMember(id: string, name: string): Member {
  return {
    id,
    tripId: 'trip-1',
    name,
    initials: name.slice(0, 2).toUpperCase(),
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };
}

function makeExpense(
  id: string,
  amountPaise: number,
  paidBy: string,
  allocations: { memberId: string; amountPaise: number }[]
): Expense {
  return {
    id,
    tripId: 'trip-1',
    title: `Expense ${id}`,
    amountPaise,
    category: 'miscellaneous',
    date: '2025-01-01',
    paidByMemberId: paidBy,
    recordedByMemberId: paidBy,
    splitMethod: 'equal',
    allocations,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };
}

function makeSettlement(
  id: string,
  from: string,
  to: string,
  amountPaise: number
): Settlement {
  return {
    id,
    tripId: 'trip-1',
    fromMemberId: from,
    toMemberId: to,
    amountPaise,
    date: '2025-01-02',
    recordedByMemberId: from,
    status: 'recorded',
    createdAt: '2025-01-02T00:00:00Z',
  };
}

// ─── Money Module Tests ───────────────────────────────────────

describe('money.ts', () => {
  it('formats paise to INR correctly', () => {
    expect(formatPaiseAsINR(10000)).toBe('₹100.00');
    expect(formatPaiseAsINR(123456)).toBe('₹1,234.56');
    expect(formatPaiseAsINR(0)).toBe('₹0.00');
    expect(formatPaiseAsINR(-75000)).toBe('−₹750.00');
    expect(formatPaiseAsINR(300000)).toBe('₹3,000.00');
  });

  it('parses INR string to paise', () => {
    expect(parseINRtoPaise('100.50')).toBe(10050);
    expect(parseINRtoPaise('1234.56')).toBe(123456);
    expect(parseINRtoPaise(100)).toBe(10000);
    expect(parseINRtoPaise('1,234.56')).toBe(123456);
  });

  it('throws on invalid INR values', () => {
    expect(() => parseINRtoPaise('abc')).toThrow();
    expect(() => parseINRtoPaise(-10)).toThrow();
  });

  it('sums paise correctly', () => {
    expect(sumPaise([10000, 20000, 30000])).toBe(60000);
    expect(sumPaise([])).toBe(0);
  });
});

// ─── Splitter Tests ───────────────────────────────────────────

describe('splitter.ts — equal splitting', () => {
  it('TEST A: splits ₹3,000 equally among 4 members', () => {
    const result = splitEqual(300000, ['rahul', 'aman', 'priya', 'neha']);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.allocations).toHaveLength(4);
    expect(result.allocations.every((a) => a.amountPaise === 75000)).toBe(true);
    expect(sumPaise(result.allocations.map((a) => a.amountPaise))).toBe(300000);
  });

  it('TEST D: splits ₹100 (10000 paise) equally among 3 — uneven remainder', () => {
    const result = splitEqual(10000, ['a', 'b', 'c']);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const amounts = result.allocations.map((a) => a.amountPaise);
    // First member gets the extra paise
    expect(amounts[0]).toBe(3334); // ₹33.34
    expect(amounts[1]).toBe(3333); // ₹33.33
    expect(amounts[2]).toBe(3333); // ₹33.33
    expect(sumPaise(amounts)).toBe(10000); // Total must be ₹100.00
  });

  it('handles single participant', () => {
    const result = splitEqual(50000, ['solo']);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.allocations[0].amountPaise).toBe(50000);
  });

  it('rejects zero total', () => {
    const result = splitEqual(0, ['a', 'b']);
    expect(result.ok).toBe(false);
  });

  it('rejects empty member list', () => {
    const result = splitEqual(10000, []);
    expect(result.ok).toBe(false);
  });
});

describe('splitter.ts — custom splitting', () => {
  it('accepts valid custom allocations summing to total', () => {
    const result = splitCustom(100000, [
      { memberId: 'rahul', amountPaise: 50000 },
      { memberId: 'aman', amountPaise: 30000 },
      { memberId: 'priya', amountPaise: 20000 },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.allocations.find((a) => a.memberId === 'rahul')?.amountPaise).toBe(50000);
    expect(result.allocations.find((a) => a.memberId === 'aman')?.amountPaise).toBe(30000);
    expect(result.allocations.find((a) => a.memberId === 'priya')?.amountPaise).toBe(20000);
  });

  it('rejects allocations that do not sum to total', () => {
    const result = splitCustom(100000, [
      { memberId: 'rahul', amountPaise: 50000 },
      { memberId: 'aman', amountPaise: 30000 },
      // Missing 20000
    ]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('Difference');
  });

  it('rejects negative allocations', () => {
    const result = splitCustom(100000, [
      { memberId: 'rahul', amountPaise: 120000 },
      { memberId: 'aman', amountPaise: -20000 },
    ]);
    expect(result.ok).toBe(false);
  });
});

describe('splitter.ts — percentage splitting', () => {
  it('splits ₹1,000 by 50%, 30%, 20%', () => {
    const result = splitPercentage(100000, [
      { memberId: 'rahul', percentage: 50 },
      { memberId: 'aman', percentage: 30 },
      { memberId: 'priya', percentage: 20 },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.allocations.find((a) => a.memberId === 'rahul')?.amountPaise).toBe(50000);
    expect(result.allocations.find((a) => a.memberId === 'aman')?.amountPaise).toBe(30000);
    expect(result.allocations.find((a) => a.memberId === 'priya')?.amountPaise).toBe(20000);
    expect(sumPaise(result.allocations.map((a) => a.amountPaise))).toBe(100000);
  });

  it('rejects percentages that do not sum to 100%', () => {
    const result = splitPercentage(100000, [
      { memberId: 'rahul', percentage: 50 },
      { memberId: 'aman', percentage: 30 },
      // Missing 20%
    ]);
    expect(result.ok).toBe(false);
  });

  it('handles uneven percentages with correct paise distribution', () => {
    // 33.33% + 33.33% + 33.34% of ₹100
    const result = splitPercentage(10000, [
      { memberId: 'a', percentage: 33.33 },
      { memberId: 'b', percentage: 33.33 },
      { memberId: 'c', percentage: 33.34 },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(sumPaise(result.allocations.map((a) => a.amountPaise))).toBe(10000);
  });
});

// ─── Balance Engine Tests ─────────────────────────────────────

describe('balances.ts — core balance calculation', () => {
  const members = [
    makeMember('rahul', 'Rahul'),
    makeMember('aman', 'Aman'),
    makeMember('priya', 'Priya'),
    makeMember('neha', 'Neha'),
  ];

  it('TEST A: Rahul pays ₹3,000 shared equally among 4', () => {
    // Each participant owes ₹750 (75000 paise)
    const expenses = [
      makeExpense('e1', 300000, 'rahul', [
        { memberId: 'rahul', amountPaise: 75000 },
        { memberId: 'aman', amountPaise: 75000 },
        { memberId: 'priya', amountPaise: 75000 },
        { memberId: 'neha', amountPaise: 75000 },
      ]),
    ];

    const balances = calculateBalances(expenses, [], members);

    expect(balances.get('rahul')?.netBalancePaise).toBe(225000);  // +₹2,250
    expect(balances.get('aman')?.netBalancePaise).toBe(-75000);   // -₹750
    expect(balances.get('priya')?.netBalancePaise).toBe(-75000);  // -₹750
    expect(balances.get('neha')?.netBalancePaise).toBe(-75000);   // -₹750

    const { valid } = verifyZeroSum(balances);
    expect(valid).toBe(true);
  });

  it('TEST B: Multiple payers, equal responsibility', () => {
    // Rahul: ₹900, Aman: ₹600, Priya: ₹300 — all shared equally (₹600 each)
    const threeMembers = [
      makeMember('rahul', 'Rahul'),
      makeMember('aman', 'Aman'),
      makeMember('priya', 'Priya'),
    ];

    const expenses = [
      makeExpense('e1', 90000, 'rahul', [
        { memberId: 'rahul', amountPaise: 30000 },
        { memberId: 'aman', amountPaise: 30000 },
        { memberId: 'priya', amountPaise: 30000 },
      ]),
      makeExpense('e2', 60000, 'aman', [
        { memberId: 'rahul', amountPaise: 20000 },
        { memberId: 'aman', amountPaise: 20000 },
        { memberId: 'priya', amountPaise: 20000 },
      ]),
      makeExpense('e3', 30000, 'priya', [
        { memberId: 'rahul', amountPaise: 10000 },
        { memberId: 'aman', amountPaise: 10000 },
        { memberId: 'priya', amountPaise: 10000 },
      ]),
    ];

    const balances = calculateBalances(expenses, [], threeMembers);

    expect(balances.get('rahul')?.netBalancePaise).toBe(30000);  // +₹300
    expect(balances.get('aman')?.netBalancePaise).toBe(0);        // ₹0
    expect(balances.get('priya')?.netBalancePaise).toBe(-30000); // -₹300

    const { valid } = verifyZeroSum(balances);
    expect(valid).toBe(true);
  });

  it('TEST C: Expense recorded on behalf — payer and participant differ', () => {
    // Rahul pays ₹1,200 for Priya's ticket. Aman records it.
    const threeMembers = [
      makeMember('rahul', 'Rahul'),
      makeMember('aman', 'Aman'),
      makeMember('priya', 'Priya'),
    ];

    const expenses: Expense[] = [{
      id: 'e1',
      tripId: 'trip-1',
      title: "Priya's Ticket",
      amountPaise: 120000,
      category: 'transportation',
      date: '2025-01-01',
      paidByMemberId: 'rahul',
      recordedByMemberId: 'aman', // Aman records, but is NOT involved financially
      splitMethod: 'custom',
      allocations: [{ memberId: 'priya', amountPaise: 120000 }], // Only Priya responsible
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    }];

    const balances = calculateBalances(expenses, [], threeMembers);

    expect(balances.get('rahul')?.netBalancePaise).toBe(120000);  // +₹1,200
    expect(balances.get('priya')?.netBalancePaise).toBe(-120000); // -₹1,200
    expect(balances.get('aman')?.netBalancePaise).toBe(0);         // ₹0 (recorder only)

    const { valid } = verifyZeroSum(balances);
    expect(valid).toBe(true);
  });

  it('partial-group expense only affects participants', () => {
    // 6 members; only 3 share a ₹1,500 activity
    const sixMembers = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) =>
      makeMember(id, id.toUpperCase())
    );

    const expenses = [
      makeExpense('e1', 150000, 'a', [
        { memberId: 'a', amountPaise: 50000 },
        { memberId: 'b', amountPaise: 50000 },
        { memberId: 'c', amountPaise: 50000 },
      ]),
    ];

    const balances = calculateBalances(expenses, [], sixMembers);

    expect(balances.get('a')?.netBalancePaise).toBe(100000); // paid 150k, owes 50k → +100k
    expect(balances.get('b')?.netBalancePaise).toBe(-50000);
    expect(balances.get('c')?.netBalancePaise).toBe(-50000);
    expect(balances.get('d')?.netBalancePaise).toBe(0); // not involved
    expect(balances.get('e')?.netBalancePaise).toBe(0);
    expect(balances.get('f')?.netBalancePaise).toBe(0);

    const { valid } = verifyZeroSum(balances);
    expect(valid).toBe(true);
  });
});

// ─── Settlement Tests (CORRECTED SIGN CONVENTION) ─────────────

describe('balances.ts — settlement sign convention', () => {
  const threeMembers = [
    makeMember('rahul', 'Rahul'),
    makeMember('aman', 'Aman'),
    makeMember('priya', 'Priya'),
  ];

  // Rahul paid ₹1000 for Aman only.
  const correctExpenses = [
    makeExpense('e1', 100000, 'rahul', [
      { memberId: 'aman', amountPaise: 100000 }, // Only Aman is responsible
    ]),
  ];

  it('TEST E: partial settlement — Aman pays ₹400 of ₹1,000 owed to Rahul', () => {
    // Before settlement:
    // Rahul: paid 100000, allocated 0 → net = +100000
    // Aman: paid 0, allocated 100000 → net = -100000

    const beforeBalances = calculateBalances(correctExpenses, [], threeMembers);
    expect(beforeBalances.get('rahul')?.netBalancePaise).toBe(100000);  // +₹1,000
    expect(beforeBalances.get('aman')?.netBalancePaise).toBe(-100000); // -₹1,000

    // Aman records a ₹400 settlement to Rahul
    const settlements = [makeSettlement('s1', 'aman', 'rahul', 40000)];

    const afterBalances = calculateBalances(correctExpenses, settlements, threeMembers);

    // After:
    // Aman: net = -100000 + 40000 (settlementsPaid) = -60000 → still owes ₹600
    // Rahul: net = +100000 - 40000 (settlementsReceived) = +60000 → still to receive ₹600
    expect(afterBalances.get('aman')?.netBalancePaise).toBe(-60000);  // -₹600
    expect(afterBalances.get('rahul')?.netBalancePaise).toBe(60000);   // +₹600

    const { valid } = verifyZeroSum(afterBalances);
    expect(valid).toBe(true);

    // Trip spending must remain unchanged
    expect(calculateTotalTripSpending(correctExpenses)).toBe(100000);
  });

  it('TEST E2 (SPECIFICATION EXAMPLE): Rahul pays ₹1,000 shared equally with Aman, Aman pays ₹200 settlement', () => {
    const twoMembers = [
      makeMember('rahul', 'Rahul'),
      makeMember('aman', 'Aman'),
    ];

    // Rahul pays ₹1,000 for an expense shared equally by Rahul and Aman (₹500 each)
    const expenses = [
      makeExpense('e1', 100000, 'rahul', [
        { memberId: 'rahul', amountPaise: 50000 },
        { memberId: 'aman', amountPaise: 50000 },
      ]),
    ];

    // Initial balances before settlement:
    // Rahul: Total Paid ₹1,000, Allocated ₹500 -> Net +₹500
    // Aman: Total Paid ₹0, Allocated ₹500 -> Net -₹500
    const initialBalances = calculateBalances(expenses, [], twoMembers);
    expect(initialBalances.get('rahul')?.netBalancePaise).toBe(50000);   // +₹500.00
    expect(initialBalances.get('aman')?.netBalancePaise).toBe(-50000);   // -₹500.00
    expect(verifyZeroSum(initialBalances).valid).toBe(true);

    // Aman pays Rahul ₹200 (20,000 paise)
    const settlements = [makeSettlement('s1', 'aman', 'rahul', 20000)];
    const afterBalances = calculateBalances(expenses, settlements, twoMembers);

    // After settlement:
    // Rahul's remaining balance: +₹300
    // Aman's remaining balance: -₹300
    expect(afterBalances.get('rahul')?.netBalancePaise).toBe(30000);   // +₹300.00
    expect(afterBalances.get('aman')?.netBalancePaise).toBe(-30000);  // -₹300.00

    // Sum of all member balances equals zero
    const zeroSumResult = verifyZeroSum(afterBalances);
    expect(zeroSumResult.valid).toBe(true);
    expect(zeroSumResult.sumPaise).toBe(0);

    // Total trip spending remains ₹1,000
    expect(calculateTotalTripSpending(expenses)).toBe(100000);
  });

  it('full settlement clears both balances to zero', () => {
    const settlements = [makeSettlement('s1', 'aman', 'rahul', 100000)];
    const balances = calculateBalances(correctExpenses, settlements, threeMembers);

    expect(balances.get('aman')?.netBalancePaise).toBe(0);
    expect(balances.get('rahul')?.netBalancePaise).toBe(0);

    const { valid } = verifyZeroSum(balances);
    expect(valid).toBe(true);
  });

  it('multiple partial settlements accumulate correctly', () => {
    const settlements = [
      makeSettlement('s1', 'aman', 'rahul', 25000), // ₹250
      makeSettlement('s2', 'aman', 'rahul', 35000), // ₹350
      // Total: ₹600 paid of ₹1,000
    ];
    const balances = calculateBalances(correctExpenses, settlements, threeMembers);

    expect(balances.get('aman')?.netBalancePaise).toBe(-40000);  // still owes ₹400
    expect(balances.get('rahul')?.netBalancePaise).toBe(40000);   // still to receive ₹400

    const { valid } = verifyZeroSum(balances);
    expect(valid).toBe(true);
  });

  it('settlements between different members are independent', () => {
    // Rahul: paid ₹3,000 for 4 equal members
    const fourMembers = [
      makeMember('rahul', 'Rahul'),
      makeMember('aman', 'Aman'),
      makeMember('priya', 'Priya'),
      makeMember('neha', 'Neha'),
    ];

    const expenses = [
      makeExpense('e1', 300000, 'rahul', [
        { memberId: 'rahul', amountPaise: 75000 },
        { memberId: 'aman', amountPaise: 75000 },
        { memberId: 'priya', amountPaise: 75000 },
        { memberId: 'neha', amountPaise: 75000 },
      ]),
    ];

    // Aman settles fully; Priya settles partially
    const settlements = [
      makeSettlement('s1', 'aman', 'rahul', 75000),  // Full
      makeSettlement('s2', 'priya', 'rahul', 30000), // Partial
    ];

    const balances = calculateBalances(expenses, settlements, fourMembers);

    expect(balances.get('rahul')?.netBalancePaise).toBe(120000);   // 225000 - 75000 - 30000
    expect(balances.get('aman')?.netBalancePaise).toBe(0);          // Fully settled
    expect(balances.get('priya')?.netBalancePaise).toBe(-45000);   // Still owes ₹450
    expect(balances.get('neha')?.netBalancePaise).toBe(-75000);    // Untouched

    const { valid } = verifyZeroSum(balances);
    expect(valid).toBe(true);
  });

  it('settlement does not affect trip spending', () => {
    const spending = calculateTotalTripSpending(correctExpenses);
    expect(spending).toBe(100000); // Unchanged regardless of settlements

    const spendingWithNoSettlements = calculateTotalTripSpending(correctExpenses);
    expect(spendingWithNoSettlements).toBe(spending);
  });
});

// ─── Settlement Recommendation Tests ─────────────────────────

describe('recommendSettlements', () => {
  it('TEST A recommendations: Aman, Priya, Neha each pay Rahul ₹750', () => {
    const members = [
      makeMember('rahul', 'Rahul'),
      makeMember('aman', 'Aman'),
      makeMember('priya', 'Priya'),
      makeMember('neha', 'Neha'),
    ];

    const expenses = [
      makeExpense('e1', 300000, 'rahul', [
        { memberId: 'rahul', amountPaise: 75000 },
        { memberId: 'aman', amountPaise: 75000 },
        { memberId: 'priya', amountPaise: 75000 },
        { memberId: 'neha', amountPaise: 75000 },
      ]),
    ];

    const balances = calculateBalances(expenses, [], members);
    const recommendations = recommendSettlements(balances);

    expect(recommendations).toHaveLength(3);
    // Each non-Rahul member should pay Rahul ₹750 (75000 paise)
    for (const rec of recommendations) {
      expect(rec.toMemberId).toBe('rahul');
      expect(rec.amountPaise).toBe(75000);
    }
  });

  it('TEST B recommendation: Priya pays Rahul ₹300', () => {
    const balanceMap = new Map([
      ['rahul', { memberId: 'rahul', memberName: 'Rahul', totalPaidPaise: 0, totalAllocatedPaise: 0, settlementsReceivedPaise: 0, settlementsPaidPaise: 0, netBalancePaise: 30000 }],
      ['aman', { memberId: 'aman', memberName: 'Aman', totalPaidPaise: 0, totalAllocatedPaise: 0, settlementsReceivedPaise: 0, settlementsPaidPaise: 0, netBalancePaise: 0 }],
      ['priya', { memberId: 'priya', memberName: 'Priya', totalPaidPaise: 0, totalAllocatedPaise: 0, settlementsReceivedPaise: 0, settlementsPaidPaise: 0, netBalancePaise: -30000 }],
    ]);

    const recommendations = recommendSettlements(balanceMap);

    expect(recommendations).toHaveLength(1);
    expect(recommendations[0].fromMemberId).toBe('priya');
    expect(recommendations[0].toMemberId).toBe('rahul');
    expect(recommendations[0].amountPaise).toBe(30000);
  });

  it('returns empty list when all balances are zero', () => {
    const members = [makeMember('a', 'A'), makeMember('b', 'B')];
    const balances = calculateBalances([], [], members);
    const recommendations = recommendSettlements(balances);
    expect(recommendations).toHaveLength(0);
  });
});

// ─── Total Trip Spending Tests ────────────────────────────────

describe('calculateTotalTripSpending', () => {
  it('sums all expense amounts', () => {
    const expenses = [
      makeExpense('e1', 100000, 'a', [{ memberId: 'a', amountPaise: 100000 }]),
      makeExpense('e2', 200000, 'b', [{ memberId: 'b', amountPaise: 200000 }]),
    ];
    expect(calculateTotalTripSpending(expenses)).toBe(300000);
  });

  it('returns 0 for no expenses', () => {
    expect(calculateTotalTripSpending([])).toBe(0);
  });
});

// ─── Integrity Checker Tests ──────────────────────────────────

describe('integrity.ts', () => {
  const trip: Trip = {
    id: 'trip-1',
    schemaVersion: 1,
    name: 'Test Trip',
    destination: 'Sikkim',
    currency: 'INR',
    creatorMemberId: 'rahul',
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  const members = [makeMember('rahul', 'Rahul'), makeMember('aman', 'Aman')];

  it('reports no violations for a valid ledger', () => {
    const expenses = [
      makeExpense('e1', 100000, 'rahul', [
        { memberId: 'rahul', amountPaise: 50000 },
        { memberId: 'aman', amountPaise: 50000 },
      ]),
    ];
    const violations = checkLedgerIntegrity(trip, expenses, [], members);
    expect(violations).toHaveLength(0);
  });

  it('detects allocation mismatch', () => {
    const expenses = [
      makeExpense('e1', 100000, 'rahul', [
        { memberId: 'rahul', amountPaise: 40000 }, // Only 80000 total, should be 100000
        { memberId: 'aman', amountPaise: 40000 },
      ]),
    ];
    const violations = checkLedgerIntegrity(trip, expenses, [], members);
    expect(violations.some((v) => v.code === 'EXPENSE_ALLOCATION_MISMATCH')).toBe(true);
  });

  it('detects self-settlement', () => {
    const expenses = [makeExpense('e1', 100000, 'rahul', [{ memberId: 'aman', amountPaise: 100000 }])];
    const settlements = [makeSettlement('s1', 'rahul', 'rahul', 50000)];
    const violations = checkLedgerIntegrity(trip, expenses, settlements, members);
    expect(violations.some((v) => v.code === 'SELF_SETTLEMENT')).toBe(true);
  });

  it('detects unknown payer reference', () => {
    const expenses = [
      makeExpense('e1', 100000, 'ghost-member', [{ memberId: 'aman', amountPaise: 100000 }]),
    ];
    const violations = checkLedgerIntegrity(trip, expenses, [], members);
    expect(violations.some((v) => v.code === 'UNKNOWN_PAYER')).toBe(true);
  });

  it('detects non-positive settlement amount', () => {
    const expenses = [makeExpense('e1', 100000, 'rahul', [{ memberId: 'aman', amountPaise: 100000 }])];
    const badSettlement: Settlement = {
      id: 's1', tripId: 'trip-1',
      fromMemberId: 'aman', toMemberId: 'rahul',
      amountPaise: 0, date: '2025-01-02',
      recordedByMemberId: 'aman', status: 'recorded',
      createdAt: '2025-01-02T00:00:00Z',
    };
    const violations = checkLedgerIntegrity(trip, expenses, [badSettlement], members);
    expect(violations.some((v) => v.code === 'NON_POSITIVE_SETTLEMENT')).toBe(true);
  });
});

// ─── Extended Financial Engine & Benchmark Tests ──────────────

describe('Extended Financial Scenarios & Invariants', () => {
  const members = [
    makeMember('m1', 'Aarav'),
    makeMember('m2', 'Diya'),
    makeMember('m3', 'Kabir'),
    makeMember('m4', 'Meera'),
  ];

  it('correctly handles expenses involving only selected members and members with zero balances', () => {
    // Only Aarav and Diya participate in this expense; Kabir and Meera have 0 balance
    const splitRes = splitEqual(10000, ['m1', 'm2']);
    expect(splitRes.ok).toBe(true);
    if (!splitRes.ok) return;

    const exp = makeExpense('e1', 10000, 'm1', splitRes.allocations);
    const balances = calculateBalances([exp], [], members);

    // Aarav paid 100, allocated 50 -> net +50
    expect(balances.get('m1')?.netBalancePaise).toBe(5000);
    // Diya paid 0, allocated 50 -> net -50
    expect(balances.get('m2')?.netBalancePaise).toBe(-5000);
    // Kabir and Meera did not participate -> net 0
    expect(balances.get('m3')?.netBalancePaise).toBe(0);
    expect(balances.get('m4')?.netBalancePaise).toBe(0);

    const { valid, sumPaise } = verifyZeroSum(balances);
    expect(valid).toBe(true);
    expect(sumPaise).toBe(0);
  });

  it('correctly models editing and deleting expenses', () => {
    // Step 1: Initial expense where Aarav pays ₹300 split equally among Aarav, Diya, Kabir
    const split1 = splitEqual(30000, ['m1', 'm2', 'm3']);
    expect(split1.ok).toBe(true);
    if (!split1.ok) return;

    let expenses = [makeExpense('e1', 30000, 'm1', split1.allocations)];
    let balances = calculateBalances(expenses, [], members);
    expect(balances.get('m1')?.netBalancePaise).toBe(20000);
    expect(balances.get('m2')?.netBalancePaise).toBe(-10000);
    expect(balances.get('m3')?.netBalancePaise).toBe(-10000);

    // Step 2: Edit expense to ₹600 split custom
    const splitEdit = splitCustom(60000, [
      { memberId: 'm1', amountPaise: 20000 },
      { memberId: 'm2', amountPaise: 30000 },
      { memberId: 'm3', amountPaise: 10000 },
    ]);
    expect(splitEdit.ok).toBe(true);
    if (!splitEdit.ok) return;

    expenses = [makeExpense('e1', 60000, 'm1', splitEdit.allocations)];
    balances = calculateBalances(expenses, [], members);
    // Aarav paid 600, allocated 200 -> net +400
    expect(balances.get('m1')?.netBalancePaise).toBe(40000);
    // Diya allocated 300 -> net -300
    expect(balances.get('m2')?.netBalancePaise).toBe(-30000);
    // Kabir allocated 100 -> net -100
    expect(balances.get('m3')?.netBalancePaise).toBe(-10000);
    expect(verifyZeroSum(balances).valid).toBe(true);

    // Step 3: Delete expense -> balances return to all zero
    expenses = [];
    balances = calculateBalances(expenses, [], members);
    expect(balances.get('m1')?.netBalancePaise).toBe(0);
    expect(balances.get('m2')?.netBalancePaise).toBe(0);
    expect(balances.get('m3')?.netBalancePaise).toBe(0);
    expect(verifyZeroSum(balances).valid).toBe(true);
  });

  it('correctly models partial and full settlements between multiple members', () => {
    // Aarav pays ₹600 for Aarav, Diya, Kabir (₹200 each)
    const split1 = splitEqual(60000, ['m1', 'm2', 'm3']);
    const exp1 = makeExpense('e1', 60000, 'm1', split1.ok ? split1.allocations : []);

    // Diya pays ₹300 for Diya, Kabir, Meera (₹100 each)
    const split2 = splitEqual(30000, ['m2', 'm3', 'm4']);
    const exp2 = makeExpense('e2', 30000, 'm2', split2.ok ? split2.allocations : []);

    const expenses = [exp1, exp2];
    let balances = calculateBalances(expenses, [], members);

    // Aarav: paid 600, allocated 200 = +400
    // Diya: paid 300, allocated 200 + 100 = 0
    // Kabir: paid 0, allocated 200 + 100 = -300
    // Meera: paid 0, allocated 100 = -100
    expect(balances.get('m1')?.netBalancePaise).toBe(40000);
    expect(balances.get('m2')?.netBalancePaise).toBe(0);
    expect(balances.get('m3')?.netBalancePaise).toBe(-30000);
    expect(balances.get('m4')?.netBalancePaise).toBe(-10000);
    expect(verifyZeroSum(balances).valid).toBe(true);

    // Partial settlement: Kabir pays Aarav ₹150
    const sett1 = makeSettlement('s1', 'm3', 'm1', 15000);
    balances = calculateBalances(expenses, [sett1], members);
    expect(balances.get('m3')?.netBalancePaise).toBe(-15000); // Kabir now owes only ₹150
    expect(balances.get('m1')?.netBalancePaise).toBe(25000); // Aarav now due ₹250
    expect(verifyZeroSum(balances).valid).toBe(true);

    // Full remaining settlement: Kabir pays ₹150, Meera pays ₹100 to Aarav
    const sett2 = makeSettlement('s2', 'm3', 'm1', 15000);
    const sett3 = makeSettlement('s3', 'm4', 'm1', 10000);
    balances = calculateBalances(expenses, [sett1, sett2, sett3], members);

    for (const [, b] of balances) {
      expect(b.netBalancePaise).toBe(0);
    }
    expect(verifyZeroSum(balances).valid).toBe(true);
    expect(recommendSettlements(balances)).toHaveLength(0);
  });

  it('benchmark: efficiently calculates balances and recommended settlements for 500 expenses and 20 members', () => {
    const numMembers = 20;
    const benchMembers = Array.from({ length: numMembers }, (_, i) =>
      makeMember(`user_${i}`, `User ${i}`)
    );

    const numExpenses = 500;
    const benchExpenses: Expense[] = [];

    for (let i = 0; i < numExpenses; i++) {
      const payerId = `user_${i % numMembers}`;
      // Each expense is split among 5 random members
      const participantIds = [
        `user_${(i + 1) % numMembers}`,
        `user_${(i + 2) % numMembers}`,
        `user_${(i + 3) % numMembers}`,
        `user_${(i + 4) % numMembers}`,
        payerId,
      ];
      const amountPaise = 10000 + (i * 37) % 50000;
      const splitRes = splitEqual(amountPaise, participantIds);
      if (splitRes.ok) {
        benchExpenses.push(makeExpense(`exp_${i}`, amountPaise, payerId, splitRes.allocations));
      }
    }

    const startTime = performance.now();
    const balances = calculateBalances(benchExpenses, [], benchMembers);
    const totalSpending = calculateTotalTripSpending(benchExpenses);
    const recommendations = recommendSettlements(balances);
    const duration = performance.now() - startTime;

    // Verify invariants
    expect(balances.size).toBe(numMembers);
    expect(totalSpending).toBeGreaterThan(0);
    const zeroSum = verifyZeroSum(balances);
    expect(zeroSum.valid).toBe(true);
    expect(zeroSum.sumPaise).toBe(0);
    expect(recommendations.length).toBeGreaterThanOrEqual(0);

    // Financial calculation for 500 expenses should complete in < 20ms in Node/V8
    expect(duration).toBeLessThan(100);
  });
});

