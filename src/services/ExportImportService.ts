// ============================================================
// TRIPKHATA — EXPORT / IMPORT SERVICE
// Supports JSON export/import with full validation.
// ============================================================

import { z } from 'zod';
import type { TripExport, Trip, Member, Expense, Settlement } from '../domain/models/types';
import { sumPaise } from '../domain/finance/money';

const EXPORT_VERSION = 1;

// ─── Zod Schemas for Import Validation ───────────────────────

const AllocationSchema = z.object({
  memberId: z.string().min(1),
  amountPaise: z.number().int().nonnegative(),
});

const ExpenseSchema = z.object({
  id: z.string().min(1),
  tripId: z.string().min(1),
  title: z.string().min(1),
  amountPaise: z.number().int().positive(),
  category: z.enum(['accommodation','food','transportation','fuel','sightseeing','shopping','activities','miscellaneous']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paidByMemberId: z.string().min(1),
  recordedByMemberId: z.string().min(1),
  splitMethod: z.enum(['equal','custom','percentage']),
  allocations: z.array(AllocationSchema).min(1),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const MemberSchema = z.object({
  id: z.string().min(1),
  tripId: z.string().min(1),
  name: z.string().min(1),
  initials: z.string().min(1).max(2),
  status: z.enum(['active','archived']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const SettlementSchema = z.object({
  id: z.string().min(1),
  tripId: z.string().min(1),
  fromMemberId: z.string().min(1),
  toMemberId: z.string().min(1),
  amountPaise: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().optional(),
  recordedByMemberId: z.string().min(1),
  status: z.literal('recorded'),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

const TripSchema = z.object({
  id: z.string().min(1),
  schemaVersion: z.number().int().positive(),
  name: z.string().min(1),
  destination: z.string().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  currency: z.literal('INR'),
  creatorMemberId: z.string().min(1),
  status: z.enum(['active','archived']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const TripExportSchema = z.object({
  exportVersion: z.number().int().positive(),
  exportedAt: z.string(),
  trip: TripSchema,
  members: z.array(MemberSchema).min(1),
  expenses: z.array(ExpenseSchema),
  settlements: z.array(SettlementSchema),
});

// ─── Validation Error Type ────────────────────────────────────
export interface ImportValidationError {
  field: string;
  message: string;
}

export interface ImportValidationResult {
  valid: boolean;
  errors: ImportValidationError[];
  data?: TripExport;
}

// ─── Export ───────────────────────────────────────────────────

export function buildExportPayload(
  trip: Trip,
  members: Member[],
  expenses: Expense[],
  settlements: Settlement[]
): TripExport {
  return {
    exportVersion: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    trip,
    members,
    expenses,
    settlements,
  };
}

export function downloadJSON(payload: TripExport, filename: string): void {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function buildExpensesCSV(expenses: Expense[], members: Member[]): string {
  const memberMap = new Map(members.map((m) => [m.id, m.name]));
  const header = 'Title,Amount (₹),Category,Payer,Recorder,Participants,Date\n';
  const rows = expenses.map((e) => {
    const participants = e.allocations
      .map((a) => memberMap.get(a.memberId) ?? a.memberId)
      .join('; ');
    return [
      `"${e.title}"`,
      (e.amountPaise / 100).toFixed(2),
      e.category,
      `"${memberMap.get(e.paidByMemberId) ?? e.paidByMemberId}"`,
      `"${memberMap.get(e.recordedByMemberId) ?? e.recordedByMemberId}"`,
      `"${participants}"`,
      e.date,
    ].join(',');
  });
  return header + rows.join('\n');
}

// ─── Import Validation ────────────────────────────────────────

export function validateImport(raw: unknown): ImportValidationResult {
  const result = TripExportSchema.safeParse(raw);

  if (!result.success) {
    const errors: ImportValidationError[] = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return { valid: false, errors };
  }

  const data = result.data as TripExport;

  // Additional semantic validation
  const errors: ImportValidationError[] = [];
  const memberIds = new Set(data.members.map((m) => m.id));

  // Check all member tripIds match
  for (const member of data.members) {
    if (member.tripId !== data.trip.id) {
      errors.push({ field: `members.${member.id}.tripId`, message: 'Member tripId does not match trip id.' });
    }
  }

  // Check expense integrity
  for (const expense of data.expenses) {
    if (expense.tripId !== data.trip.id) {
      errors.push({ field: `expenses.${expense.id}.tripId`, message: 'Expense tripId does not match trip id.' });
    }
    if (!memberIds.has(expense.paidByMemberId)) {
      errors.push({ field: `expenses.${expense.id}.paidByMemberId`, message: `Unknown payer member: ${expense.paidByMemberId}` });
    }
    const allocationSum = sumPaise(expense.allocations.map((a) => a.amountPaise));
    if (allocationSum !== expense.amountPaise) {
      errors.push({
        field: `expenses.${expense.id}.allocations`,
        message: `Allocations sum to ${allocationSum} paise but expense is ${expense.amountPaise} paise.`,
      });
    }
    for (const alloc of expense.allocations) {
      if (!memberIds.has(alloc.memberId)) {
        errors.push({ field: `expenses.${expense.id}.allocations`, message: `Unknown member in allocation: ${alloc.memberId}` });
      }
    }
  }

  // Check settlement integrity
  for (const settlement of data.settlements) {
    if (settlement.tripId !== data.trip.id) {
      errors.push({ field: `settlements.${settlement.id}.tripId`, message: 'Settlement tripId does not match trip id.' });
    }
    if (!memberIds.has(settlement.fromMemberId)) {
      errors.push({ field: `settlements.${settlement.id}.fromMemberId`, message: `Unknown sender: ${settlement.fromMemberId}` });
    }
    if (!memberIds.has(settlement.toMemberId)) {
      errors.push({ field: `settlements.${settlement.id}.toMemberId`, message: `Unknown recipient: ${settlement.toMemberId}` });
    }
    if (settlement.fromMemberId === settlement.toMemberId) {
      errors.push({ field: `settlements.${settlement.id}`, message: 'Settlement cannot have same sender and recipient.' });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, errors: [], data };
}
