// ============================================================
// TRIPKHATA — DOMAIN MODELS
// All monetary amounts are stored as INTEGER PAISE (1 INR = 100 paise)
// NEVER use floating-point arithmetic for financial calculations.
// ============================================================

export type ExpenseCategory =
  | 'accommodation'
  | 'food'
  | 'transportation'
  | 'fuel'
  | 'sightseeing'
  | 'shopping'
  | 'activities'
  | 'miscellaneous';

export type SplitMethod = 'equal' | 'custom' | 'percentage';

export type TripStatus = 'active' | 'archived';

export type MemberStatus = 'active' | 'archived';

export type SettlementStatus = 'recorded';

// ─── Trip ────────────────────────────────────────────────────
export interface Trip {
  id: string;
  schemaVersion: number;
  name: string;
  destination: string;
  startDate?: string; // ISO date string YYYY-MM-DD
  endDate?: string;   // ISO date string YYYY-MM-DD
  currency: 'INR';    // Only INR is supported in v1
  creatorMemberId: string;
  status: TripStatus;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

// ─── Member ───────────────────────────────────────────────────
export interface Member {
  id: string;
  tripId: string;
  name: string;
  initials: string;  // Derived from name, max 2 chars
  status: MemberStatus;
  upiId?: string;    // Optional UPI ID (e.g. name@okhdfcbank) for payments
  createdAt: string;
  updatedAt: string;
}

// ─── Allocation ───────────────────────────────────────────────
// The portion of an expense assigned to a specific member.
// amountPaise must be a non-negative integer.
export interface Allocation {
  memberId: string;
  amountPaise: number; // integer paise
}

// ─── Expense ─────────────────────────────────────────────────
export interface Expense {
  id: string;
  tripId: string;
  title: string;
  amountPaise: number; // integer paise — total cost
  category: ExpenseCategory;
  date: string;         // ISO date string YYYY-MM-DD
  paidByMemberId: string;     // Who paid the merchant
  recordedByMemberId: string; // Who entered this into TripKhata
  splitMethod: SplitMethod;
  allocations: Allocation[]; // sum(allocations.amountPaise) === amountPaise
  description?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Settlement ───────────────────────────────────────────────
// A recorded repayment between two trip members.
// fromMemberId pays toMemberId.
export interface Settlement {
  id: string;
  tripId: string;
  fromMemberId: string;   // The payer (the one who owes money)
  toMemberId: string;     // The recipient (the one who is owed money)
  amountPaise: number;    // integer paise — always positive
  date: string;           // ISO date string
  note?: string;
  recordedByMemberId: string;
  status: SettlementStatus;
  createdAt: string;
  updatedAt?: string;
}

// ─── Computed types (not stored) ─────────────────────────────

/** Computed balance for a single member */
export interface MemberBalance {
  memberId: string;
  memberName: string;
  totalPaidPaise: number;           // sum of expenses paid
  totalAllocatedPaise: number;      // sum of expense allocations
  settlementsReceivedPaise: number; // sum of settlements received
  settlementsPaidPaise: number;     // sum of settlements paid
  netBalancePaise: number;
  // Positive = should receive money
  // Negative = owes money
  // Zero = settled
}

/** A recommended transfer to settle outstanding balances */
export interface RecommendedTransfer {
  fromMemberId: string;
  fromMemberName: string;
  toMemberId: string;
  toMemberName: string;
  amountPaise: number;
}

/** An integrity violation in the trip ledger */
export interface IntegrityViolation {
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

// ─── Export format ────────────────────────────────────────────
export interface TripExport {
  exportVersion: number;  // Increment when format changes
  exportedAt: string;
  trip: Trip;
  members: Member[];
  expenses: Expense[];
  settlements: Settlement[];
}
