// ============================================================
// TRIPKHATA — REPOSITORY INTERFACES
// These interfaces are the contract between application logic
// and the underlying persistence mechanism.
//
// To migrate to cloud storage: implement these interfaces with
// Firestore/Supabase/etc. clients. The financial engine and UI
// require no changes.
// ============================================================

import type { Trip, Member, Expense, Settlement, TripExport } from '../domain/models/types';

// ─── Trip Repository ─────────────────────────────────────────
export interface ITripRepository {
  getAllTrips(): Promise<Trip[]>;
  getTripById(id: string): Promise<Trip | null>;
  saveTrip(trip: Trip): Promise<void>;
  updateTrip(trip: Trip): Promise<void>;
  deleteTrip(id: string): Promise<void>;
}

// ─── Member Repository ────────────────────────────────────────
export interface IMemberRepository {
  getMembersByTripId(tripId: string): Promise<Member[]>;
  getMemberById(id: string): Promise<Member | null>;
  saveMember(member: Member): Promise<void>;
  updateMember(member: Member): Promise<void>;
  deleteMembersByTripId(tripId: string): Promise<void>;
}

// ─── Expense Repository ───────────────────────────────────────
export interface IExpenseRepository {
  getExpensesByTripId(tripId: string): Promise<Expense[]>;
  getExpenseById(id: string): Promise<Expense | null>;
  saveExpense(expense: Expense): Promise<void>;
  updateExpense(expense: Expense): Promise<void>;
  deleteExpense(id: string): Promise<void>;
  deleteExpensesByTripId(tripId: string): Promise<void>;
}

// ─── Settlement Repository ────────────────────────────────────
export interface ISettlementRepository {
  getSettlementsByTripId(tripId: string): Promise<Settlement[]>;
  getSettlementById(id: string): Promise<Settlement | null>;
  saveSettlement(settlement: Settlement): Promise<void>;
  updateSettlement(settlement: Settlement): Promise<void>;
  deleteSettlement(id: string): Promise<void>;
  deleteSettlementsByTripId(tripId: string): Promise<void>;
}

// ─── Export/Import Repository ─────────────────────────────────
export interface IExportImportRepository {
  exportTrip(tripId: string): Promise<TripExport>;
  importTrip(data: TripExport): Promise<{ tripId: string }>;
}
