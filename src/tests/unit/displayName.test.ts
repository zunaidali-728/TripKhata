import { describe, it, expect } from 'vitest';
import { calculateBalances, calculateTotalTripSpending, verifyZeroSum } from '@/domain/finance/balances';
import { validateImport } from '@/services/ExportImportService';
import type { Member, Expense, Settlement, TripExport } from '@/domain/models/types';

// Helper matching logic replicated from AddExpensePage
function matchDisplayNameToMember(displayName: string, members: Member[]): Member | null {
  const clean = displayName.trim().toLowerCase();
  if (!clean) return null;
  const matches = members.filter((m) => m.name.trim().toLowerCase() === clean);
  return matches.length === 1 ? matches[0] : null;
}

function resolveNewExpenseRecordedBy(
  displayName: string,
  paidByMemberId: string,
  members: Member[],
  isManualOverride: boolean,
  manuallySelectedId?: string
): string {
  if (isManualOverride && manuallySelectedId) {
    return manuallySelectedId;
  }
  const matched = matchDisplayNameToMember(displayName, members);
  if (matched) {
    return matched.id;
  }
  return paidByMemberId || members[0]?.id || '';
}

function resolveEditExpenseRecordedBy(
  existingExpense: { recordedByMemberId?: string; paidByMemberId: string },
  isManualOverride: boolean,
  manuallySelectedId?: string
): string {
  if (isManualOverride && manuallySelectedId) {
    return manuallySelectedId;
  }
  return existingExpense.recordedByMemberId || existingExpense.paidByMemberId;
}

describe('Display Name Matching & Recorded By Semantics', () => {
  const members: Member[] = [
    {
      id: 'm1',
      tripId: 'trip-1',
      name: 'Zunaid',
      initials: 'ZU',
      status: 'active',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'm2',
      tripId: 'trip-1',
      name: 'Aman',
      initials: 'AM',
      status: 'active',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'm3',
      tripId: 'trip-1',
      name: 'Rahul',
      initials: 'RA',
      status: 'active',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
  ];

  it('matches display name case-insensitively and with whitespace trimmed', () => {
    expect(matchDisplayNameToMember('zunaid', members)?.id).toBe('m1');
    expect(matchDisplayNameToMember('  ZUNAID  ', members)?.id).toBe('m1');
    expect(matchDisplayNameToMember('Aman', members)?.id).toBe('m2');
  });

  it('returns null when display name is empty, whitespace, or does not match', () => {
    expect(matchDisplayNameToMember('', members)).toBeNull();
    expect(matchDisplayNameToMember('   ', members)).toBeNull();
    expect(matchDisplayNameToMember('Bob', members)).toBeNull();
  });

  it('returns null if there are ambiguous duplicate member names', () => {
    const duplicateMembers: Member[] = [
      ...members,
      {
        id: 'm4',
        tripId: 'trip-1',
        name: 'Zunaid',
        initials: 'ZU',
        status: 'active',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    ];
    // Ambiguous: two members named 'Zunaid'
    expect(matchDisplayNameToMember('Zunaid', duplicateMembers)).toBeNull();
  });

  it('pre-fills recordedBy for new expenses from display name preference', () => {
    const recorder = resolveNewExpenseRecordedBy('Zunaid', 'm2', members, false);
    expect(recorder).toBe('m1');
  });

  it('falls back to paidByMemberId when display name is not configured or not matched', () => {
    const recorderUnmatched = resolveNewExpenseRecordedBy('Unknown', 'm3', members, false);
    expect(recorderUnmatched).toBe('m3');

    const recorderEmpty = resolveNewExpenseRecordedBy('', 'm2', members, false);
    expect(recorderEmpty).toBe('m2');
  });

  it('preserves manual user selection over display name pre-fill', () => {
    const recorder = resolveNewExpenseRecordedBy('Zunaid', 'm2', members, true, 'm3');
    expect(recorder).toBe('m3');
  });

  it('preserves existing expense recordedBy when editing even if display name differs', () => {
    const existing = { recordedByMemberId: 'm3', paidByMemberId: 'm2' };
    const recorder = resolveEditExpenseRecordedBy(existing, false);
    expect(recorder).toBe('m3');
  });
});

describe('Financial Invariant & Settlement Behavior', () => {
  const aman: Member = {
    id: 'm-aman',
    tripId: 'trip-1',
    name: 'Aman',
    initials: 'AM',
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };
  const rahul: Member = {
    id: 'm-rahul',
    tripId: 'trip-1',
    name: 'Rahul',
    initials: 'RA',
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  it('Aman owes Rahul ₹1,000, Aman settles ₹400 -> Aman owes ₹600 and Rahul receives ₹600 without changing trip spending', () => {
    // Rahul pays ₹1,000 (100,000 paise) allocated entirely to Aman
    const expense: Expense = {
      id: 'exp-1',
      tripId: 'trip-1',
      title: 'Trek Gear for Aman',
      amountPaise: 100000,
      category: 'activities',
      date: '2026-10-28',
      paidByMemberId: rahul.id,
      recordedByMemberId: aman.id,
      splitMethod: 'custom',
      allocations: [{ memberId: aman.id, amountPaise: 100000 }],
      createdAt: '2026-10-28T10:00:00Z',
      updatedAt: '2026-10-28T10:00:00Z',
    };

    // Before settlement
    const beforeBalances = calculateBalances([expense], [], [aman, rahul]);
    expect(beforeBalances.get(aman.id)?.netBalancePaise).toBe(-100000); // Aman owes ₹1,000
    expect(beforeBalances.get(rahul.id)?.netBalancePaise).toBe(100000); // Rahul should receive ₹1,000
    expect(verifyZeroSum(beforeBalances).valid).toBe(true);
    expect(calculateTotalTripSpending([expense])).toBe(100000);

    // Aman settles ₹400 (40,000 paise) with Rahul
    const settlement: Settlement = {
      id: 'settle-1',
      tripId: 'trip-1',
      fromMemberId: aman.id,
      toMemberId: rahul.id,
      amountPaise: 40000,
      date: '2026-10-28',
      recordedByMemberId: rahul.id,
      status: 'recorded',
      createdAt: '2026-10-28T11:00:00Z',
    };

    // After settlement
    const afterBalances = calculateBalances([expense], [settlement], [aman, rahul]);
    expect(afterBalances.get(aman.id)?.netBalancePaise).toBe(-60000); // Aman owes ₹600 (-60,000 paise)
    expect(afterBalances.get(rahul.id)?.netBalancePaise).toBe(60000);  // Rahul should receive ₹600 (+60,000 paise)
    expect(verifyZeroSum(afterBalances).valid).toBe(true);

    // Settlements MUST NOT increase trip spending
    expect(calculateTotalTripSpending([expense])).toBe(100000);
  });

  it('changing recordedBy on an expense never changes financial net balances', () => {
    const expenseA: Expense = {
      id: 'exp-1',
      tripId: 'trip-1',
      title: 'Lunch',
      amountPaise: 200000,
      category: 'food',
      date: '2026-10-28',
      paidByMemberId: rahul.id,
      recordedByMemberId: rahul.id,
      splitMethod: 'equal',
      allocations: [
        { memberId: rahul.id, amountPaise: 100000 },
        { memberId: aman.id, amountPaise: 100000 },
      ],
      createdAt: '2026-10-28T10:00:00Z',
      updatedAt: '2026-10-28T10:00:00Z',
    };

    const expenseB: Expense = {
      ...expenseA,
      recordedByMemberId: aman.id, // recorder changed from Rahul to Aman
    };

    const balancesA = calculateBalances([expenseA], [], [aman, rahul]);
    const balancesB = calculateBalances([expenseB], [], [aman, rahul]);

    expect(balancesA.get(aman.id)?.netBalancePaise).toBe(balancesB.get(aman.id)?.netBalancePaise);
    expect(balancesA.get(rahul.id)?.netBalancePaise).toBe(balancesB.get(rahul.id)?.netBalancePaise);
  });
});

describe('Import Validation Security & Integrity', () => {
  const validPayload: TripExport = {
    exportVersion: 1,
    exportedAt: '2026-10-28T10:00:00Z',
    trip: {
      id: 'trip-1',
      schemaVersion: 1,
      name: 'Himalayan Ridge',
      destination: 'Sikkim',
      currency: 'INR',
      creatorMemberId: 'm1',
      status: 'active',
      createdAt: '2026-10-28T10:00:00Z',
      updatedAt: '2026-10-28T10:00:00Z',
    },
    members: [
      {
        id: 'm1',
        tripId: 'trip-1',
        name: 'Zunaid',
        initials: 'ZU',
        status: 'active',
        createdAt: '2026-10-28T10:00:00Z',
        updatedAt: '2026-10-28T10:00:00Z',
      },
    ],
    expenses: [
      {
        id: 'e1',
        tripId: 'trip-1',
        title: 'Snacks',
        amountPaise: 50000,
        category: 'food',
        date: '2026-10-28',
        paidByMemberId: 'm1',
        recordedByMemberId: 'm1',
        splitMethod: 'equal',
        allocations: [{ memberId: 'm1', amountPaise: 50000 }],
        createdAt: '2026-10-28T10:00:00Z',
        updatedAt: '2026-10-28T10:00:00Z',
      },
    ],
    settlements: [],
  };

  it('accepts valid trip backup payload', () => {
    const result = validateImport(validPayload);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('rejects backup if allocation sum does not equal expense amountPaise', () => {
    const tampered = JSON.parse(JSON.stringify(validPayload));
    tampered.expenses[0].allocations[0].amountPaise = 40000; // mismatch with 50000
    const result = validateImport(tampered);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('Allocations sum'))).toBe(true);
  });

  it('rejects backup with invalid or non-integer amounts', () => {
    const tampered = JSON.parse(JSON.stringify(validPayload));
    tampered.expenses[0].amountPaise = 500.50; // non-integer floating point
    const result = validateImport(tampered);
    expect(result.valid).toBe(false);
  });

  it('rejects backup with unknown member references', () => {
    const tampered = JSON.parse(JSON.stringify(validPayload));
    tampered.expenses[0].paidByMemberId = 'ghost-member-id';
    const result = validateImport(tampered);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('Unknown payer member'))).toBe(true);
  });
});
