// ============================================================
// TRIPKHATA — INDEXEDDB PERSISTENCE (Primary Storage)
//
// IndexedDB is used for ALL trip data (trips, members, expenses,
// allocations, settlements). localStorage is used ONLY for
// lightweight application preferences (theme, display name).
//
// Schema version: 1
// Migration: run checkAndMigrate() on app start.
// ============================================================

import { openDB, type IDBPDatabase } from 'idb';
import type { Trip, Member, Expense, Settlement } from '../../domain/models/types';
import type {
  ITripRepository,
  IMemberRepository,
  IExpenseRepository,
  ISettlementRepository,
} from '../interfaces';

const DB_NAME = 'tripkhata-db';
const DB_VERSION = 1;

// ─── Object Store Names ───────────────────────────────────────
const STORES = {
  TRIPS: 'trips',
  MEMBERS: 'members',
  EXPENSES: 'expenses',
  SETTLEMENTS: 'settlements',
} as const;

// ─── Database Initialisation ─────────────────────────────────
let dbPromise: Promise<IDBPDatabase> | null = null;

export function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // Version 1: initial schema
        if (oldVersion < 1) {
          // Trips store
          const tripStore = db.createObjectStore(STORES.TRIPS, { keyPath: 'id' });
          tripStore.createIndex('status', 'status');

          // Members store
          const memberStore = db.createObjectStore(STORES.MEMBERS, { keyPath: 'id' });
          memberStore.createIndex('tripId', 'tripId');

          // Expenses store
          const expenseStore = db.createObjectStore(STORES.EXPENSES, { keyPath: 'id' });
          expenseStore.createIndex('tripId', 'tripId');
          expenseStore.createIndex('date', 'date');

          // Settlements store
          const settlementStore = db.createObjectStore(STORES.SETTLEMENTS, { keyPath: 'id' });
          settlementStore.createIndex('tripId', 'tripId');
        }
        // Future schema versions: add cases here (oldVersion < 2, etc.)
      },
      blocked() {
        console.warn('TripKhata: Database upgrade blocked. Close other tabs and reload.');
      },
      blocking() {
        console.warn('TripKhata: A newer database version is waiting. Reloading...');
        window.location.reload();
      },
    });
  }
  return dbPromise;
}

// ─── Trip Repository ─────────────────────────────────────────
export class LocalTripRepository implements ITripRepository {
  async getAllTrips(): Promise<Trip[]> {
    const db = await getDB();
    return db.getAll(STORES.TRIPS);
  }

  async getTripById(id: string): Promise<Trip | null> {
    const db = await getDB();
    return (await db.get(STORES.TRIPS, id)) ?? null;
  }

  async saveTrip(trip: Trip): Promise<void> {
    const db = await getDB();
    await db.put(STORES.TRIPS, trip);
  }

  async updateTrip(trip: Trip): Promise<void> {
    const db = await getDB();
    await db.put(STORES.TRIPS, { ...trip, updatedAt: new Date().toISOString() });
  }

  async deleteTrip(id: string): Promise<void> {
    const db = await getDB();
    await db.delete(STORES.TRIPS, id);
  }
}

// ─── Member Repository ────────────────────────────────────────
export class LocalMemberRepository implements IMemberRepository {
  async getMembersByTripId(tripId: string): Promise<Member[]> {
    const db = await getDB();
    return db.getAllFromIndex(STORES.MEMBERS, 'tripId', tripId);
  }

  async getMemberById(id: string): Promise<Member | null> {
    const db = await getDB();
    return (await db.get(STORES.MEMBERS, id)) ?? null;
  }

  async saveMember(member: Member): Promise<void> {
    const db = await getDB();
    await db.put(STORES.MEMBERS, member);
  }

  async updateMember(member: Member): Promise<void> {
    const db = await getDB();
    await db.put(STORES.MEMBERS, { ...member, updatedAt: new Date().toISOString() });
  }

  async deleteMembersByTripId(tripId: string): Promise<void> {
    const db = await getDB();
    const members = await db.getAllFromIndex(STORES.MEMBERS, 'tripId', tripId);
    const tx = db.transaction(STORES.MEMBERS, 'readwrite');
    await Promise.all([
      ...members.map((m) => tx.store.delete(m.id)),
      tx.done,
    ]);
  }
}

// ─── Expense Repository ───────────────────────────────────────
export class LocalExpenseRepository implements IExpenseRepository {
  async getExpensesByTripId(tripId: string): Promise<Expense[]> {
    const db = await getDB();
    return db.getAllFromIndex(STORES.EXPENSES, 'tripId', tripId);
  }

  async getExpenseById(id: string): Promise<Expense | null> {
    const db = await getDB();
    return (await db.get(STORES.EXPENSES, id)) ?? null;
  }

  async saveExpense(expense: Expense): Promise<void> {
    const db = await getDB();
    await db.put(STORES.EXPENSES, expense);
  }

  async updateExpense(expense: Expense): Promise<void> {
    const db = await getDB();
    await db.put(STORES.EXPENSES, { ...expense, updatedAt: new Date().toISOString() });
  }

  async deleteExpense(id: string): Promise<void> {
    const db = await getDB();
    await db.delete(STORES.EXPENSES, id);
  }

  async deleteExpensesByTripId(tripId: string): Promise<void> {
    const db = await getDB();
    const expenses = await db.getAllFromIndex(STORES.EXPENSES, 'tripId', tripId);
    const tx = db.transaction(STORES.EXPENSES, 'readwrite');
    await Promise.all([
      ...expenses.map((e) => tx.store.delete(e.id)),
      tx.done,
    ]);
  }
}

// ─── Settlement Repository ────────────────────────────────────
export class LocalSettlementRepository implements ISettlementRepository {
  async getSettlementsByTripId(tripId: string): Promise<Settlement[]> {
    const db = await getDB();
    return db.getAllFromIndex(STORES.SETTLEMENTS, 'tripId', tripId);
  }

  async getSettlementById(id: string): Promise<Settlement | null> {
    const db = await getDB();
    return (await db.get(STORES.SETTLEMENTS, id)) ?? null;
  }

  async saveSettlement(settlement: Settlement): Promise<void> {
    const db = await getDB();
    await db.put(STORES.SETTLEMENTS, settlement);
  }

  async updateSettlement(settlement: Settlement): Promise<void> {
    const db = await getDB();
    await db.put(STORES.SETTLEMENTS, { ...settlement, updatedAt: new Date().toISOString() });
  }

  async deleteSettlement(id: string): Promise<void> {
    const db = await getDB();
    await db.delete(STORES.SETTLEMENTS, id);
  }

  async deleteSettlementsByTripId(tripId: string): Promise<void> {
    const db = await getDB();
    const settlements = await db.getAllFromIndex(STORES.SETTLEMENTS, 'tripId', tripId);
    const tx = db.transaction(STORES.SETTLEMENTS, 'readwrite');
    await Promise.all([
      ...settlements.map((s) => tx.store.delete(s.id)),
      tx.done,
    ]);
  }
}

// ─── Atomic Multi-Store Batch Operations ──────────────────────

/**
 * Atomically imports a trip, all its members, expenses, and settlements
 * inside a single IndexedDB transaction. If any write fails, the entire transaction
 * is aborted, preventing partially imported trips and leaving existing data untouched.
 */
export async function atomicImportTrip(
  trip: Trip,
  members: Member[],
  expenses: Expense[],
  settlements: Settlement[]
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(
    [STORES.TRIPS, STORES.MEMBERS, STORES.EXPENSES, STORES.SETTLEMENTS],
    'readwrite'
  );

  try {
    await tx.objectStore(STORES.TRIPS).put(trip);

    const memberStore = tx.objectStore(STORES.MEMBERS);
    for (const m of members) {
      await memberStore.put(m);
    }

    const expenseStore = tx.objectStore(STORES.EXPENSES);
    for (const e of expenses) {
      await expenseStore.put(e);
    }

    const settlementStore = tx.objectStore(STORES.SETTLEMENTS);
    for (const s of settlements) {
      await settlementStore.put(s);
    }

    await tx.done;
  } catch (err) {
    try {
      tx.abort();
    } catch {
      // Transaction may have already aborted
    }
    throw new Error(`Failed to import trip atomically: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Atomically deletes a trip and all its associated child records (members,
 * expenses, settlements) inside a single multi-store IndexedDB transaction.
 */
export async function atomicDeleteTrip(tripId: string): Promise<void> {
  const db = await getDB();
  const [members, expenses, settlements] = await Promise.all([
    db.getAllFromIndex(STORES.MEMBERS, 'tripId', tripId),
    db.getAllFromIndex(STORES.EXPENSES, 'tripId', tripId),
    db.getAllFromIndex(STORES.SETTLEMENTS, 'tripId', tripId),
  ]);

  const tx = db.transaction(
    [STORES.TRIPS, STORES.MEMBERS, STORES.EXPENSES, STORES.SETTLEMENTS],
    'readwrite'
  );

  try {
    await tx.objectStore(STORES.TRIPS).delete(tripId);

    const mStore = tx.objectStore(STORES.MEMBERS);
    for (const m of members) await mStore.delete(m.id);

    const eStore = tx.objectStore(STORES.EXPENSES);
    for (const e of expenses) await eStore.delete(e.id);

    const sStore = tx.objectStore(STORES.SETTLEMENTS);
    for (const s of settlements) await sStore.delete(s.id);

    await tx.done;
  } catch (err) {
    try {
      tx.abort();
    } catch {
      // Transaction may have already aborted
    }
    throw new Error(`Failed to delete trip atomically: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ─── Preference storage (localStorage only) ──────────────────
export const Preferences = {
  getTheme(): 'dark' | 'light' {
    return (localStorage.getItem('tripkhata-theme') as 'dark' | 'light') ?? 'dark';
  },
  setTheme(theme: 'dark' | 'light'): void {
    localStorage.setItem('tripkhata-theme', theme);
  },
  getDisplayName(): string {
    return localStorage.getItem('tripkhata-display-name') ?? '';
  },
  setDisplayName(name: string): void {
    localStorage.setItem('tripkhata-display-name', name);
  },
};
