// ============================================================
// TRIPKHATA — APP CONTEXT
// Central state management for trips, members, expenses, settlements.
// All persistence goes through repository layer (not direct IDB calls).
// ============================================================

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { Trip, Member, Expense, Settlement } from '../domain/models/types';
import {
  LocalTripRepository,
  LocalMemberRepository,
  LocalExpenseRepository,
  LocalSettlementRepository,
  Preferences,
  atomicImportTrip,
  atomicDeleteTrip,
} from '../repositories/local/LocalRepositories';
import {
  calculateBalances,
  calculateTotalTripSpending,
  recommendSettlements,
} from '../domain/finance/balances';
import type { MemberBalance, RecommendedTransfer } from '../domain/models/types';
import { generateId, nowISO, deriveInitials } from '../utils/helpers';
import { split } from '../domain/finance/splitter';

// Repository instances (singleton)
const tripRepo = new LocalTripRepository();
const memberRepo = new LocalMemberRepository();
const expenseRepo = new LocalExpenseRepository();
const settlementRepo = new LocalSettlementRepository();

// ─── Context Types ────────────────────────────────────────────
interface AppContextValue {
  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Display name
  displayName: string;
  setDisplayName: (name: string) => void;

  // Trips
  trips: Trip[];
  activeTrip: Trip | null;
  setActiveTripId: (id: string | null) => void;
  createTrip: (data: Omit<Trip, 'id' | 'schemaVersion' | 'createdAt' | 'updatedAt' | 'creatorMemberId'> & { creatorName: string }) => Promise<Trip>;
  updateTrip: (trip: Trip) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  archiveTrip: (id: string) => Promise<void>;
  restoreTrip: (id: string) => Promise<void>;
  importTrip: (trip: Trip, members: Member[], expenses: Expense[], settlements: Settlement[]) => Promise<void>;

  // Members
  members: Member[];
  addMember: (name: string, upiId?: string) => Promise<Member>;
  updateMember: (member: Member) => Promise<void>;
  archiveMember: (id: string) => Promise<void>;
  restoreMember: (id: string) => Promise<void>;

  // Expenses
  expenses: Expense[];
  addExpense: (data: Omit<Expense, 'id' | 'tripId' | 'createdAt' | 'updatedAt'>) => Promise<Expense>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Settlements
  settlements: Settlement[];
  addSettlement: (data: Omit<Settlement, 'id' | 'tripId' | 'createdAt' | 'status'>) => Promise<Settlement>;
  deleteSettlement: (id: string) => Promise<void>;

  // Computed financials
  memberBalances: Map<string, MemberBalance>;
  totalTripSpending: number;
  recommendedTransfers: RecommendedTransfer[];

  // Loading state
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

// ─── Context ─────────────────────────────────────────────────
const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'dark' | 'light'>(Preferences.getTheme);
  const [displayName, setDisplayNameState] = useState(Preferences.getDisplayName);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Apply theme class to html element
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Load all trips on mount
  useEffect(() => {
    setIsLoading(true);
    tripRepo.getAllTrips()
      .then(setTrips)
      .catch((e) => setError(`Failed to load trips: ${e.message}`))
      .finally(() => setIsLoading(false));
  }, []);

  // Load trip data when active trip changes
  useEffect(() => {
    if (!activeTripId) {
      setMembers([]);
      setExpenses([]);
      setSettlements([]);
      return;
    }
    setIsLoading(true);
    Promise.all([
      memberRepo.getMembersByTripId(activeTripId),
      expenseRepo.getExpensesByTripId(activeTripId),
      settlementRepo.getSettlementsByTripId(activeTripId),
    ])
      .then(([m, e, s]) => {
        setMembers(m);
        setExpenses(e);
        setSettlements(s);
      })
      .catch((e) => setError(`Failed to load trip data: ${e.message}`))
      .finally(() => setIsLoading(false));
  }, [activeTripId]);

  // Computed financials (memoized so they recompute ONLY when actual inputs change)
  const memberBalances = useMemo(
    () => calculateBalances(expenses, settlements, members),
    [expenses, settlements, members]
  );

  const totalTripSpending = useMemo(
    () => calculateTotalTripSpending(expenses),
    [expenses]
  );

  const recommendedTransfers = useMemo(
    () => recommendSettlements(memberBalances),
    [memberBalances]
  );

  const activeTrip = useMemo(
    () => trips.find((t) => t.id === activeTripId) ?? null,
    [trips, activeTripId]
  );

  // ─── Theme ───────────────────────────────────────────────────
  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      Preferences.setTheme(next);
      return next;
    });
  }, []);

  const setDisplayName = useCallback((name: string) => {
    Preferences.setDisplayName(name);
    setDisplayNameState(name);
  }, []);

  // Helper to touch trip updatedAt in background without triggering callback recreation
  const touchTrip = useCallback(async (tripId: string) => {
    const now = nowISO();
    setTrips((prev) => {
      const existing = prev.find((t) => t.id === tripId);
      if (!existing) return prev;
      const updated = { ...existing, updatedAt: now };
      tripRepo.updateTrip(updated).catch((err) => console.error('Failed to touch trip:', err));
      return prev.map((t) => (t.id === tripId ? updated : t));
    });
  }, []);

  // ─── Trip Operations ─────────────────────────────────────────
  const createTrip = useCallback(async (
    data: Omit<Trip, 'id' | 'schemaVersion' | 'createdAt' | 'updatedAt' | 'creatorMemberId'> & { creatorName: string }
  ): Promise<Trip> => {
    const now = nowISO();
    const tripId = generateId();
    const creatorId = generateId();

    // Create the creator member first
    const creatorMember: Member = {
      id: creatorId,
      tripId,
      name: data.creatorName,
      initials: deriveInitials(data.creatorName),
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    const trip: Trip = {
      id: tripId,
      schemaVersion: 1,
      name: data.name,
      destination: data.destination,
      startDate: data.startDate,
      endDate: data.endDate,
      currency: 'INR',
      creatorMemberId: creatorId,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    await tripRepo.saveTrip(trip);
    await memberRepo.saveMember(creatorMember);

    setTrips((prev) => [...prev, trip]);
    return trip;
  }, []);

  const updateTrip = useCallback(async (trip: Trip) => {
    const updated = { ...trip, updatedAt: nowISO() };
    let rollbackTrips: Trip[] = [];
    setTrips((prev) => {
      rollbackTrips = prev;
      return prev.map((t) => (t.id === trip.id ? updated : t));
    });

    try {
      await tripRepo.updateTrip(updated);
    } catch (err) {
      setTrips(rollbackTrips);
      throw err;
    }
  }, []);

  const deleteTrip = useCallback(async (id: string) => {
    await atomicDeleteTrip(id);
    setTrips((prev) => prev.filter((t) => t.id !== id));
    setActiveTripId((prev) => (prev === id ? null : prev));
  }, []);

  const archiveTrip = useCallback(async (id: string) => {
    const now = nowISO();
    setTrips((prev) => {
      const trip = prev.find((t) => t.id === id);
      if (!trip) return prev;
      const updated = { ...trip, status: 'archived' as const, updatedAt: now };
      tripRepo.updateTrip(updated).catch(console.error);
      return prev.map((t) => (t.id === id ? updated : t));
    });
  }, []);

  const restoreTrip = useCallback(async (id: string) => {
    const now = nowISO();
    setTrips((prev) => {
      const trip = prev.find((t) => t.id === id);
      if (!trip) return prev;
      const updated = { ...trip, status: 'active' as const, updatedAt: now };
      tripRepo.updateTrip(updated).catch(console.error);
      return prev.map((t) => (t.id === id ? updated : t));
    });
  }, []);

  const importTrip = useCallback(async (
    trip: Trip,
    importedMembers: Member[],
    importedExpenses: Expense[],
    importedSettlements: Settlement[]
  ) => {
    await atomicImportTrip(trip, importedMembers, importedExpenses, importedSettlements);
    setTrips((prev) => {
      const existing = prev.find((t) => t.id === trip.id);
      if (existing) return prev.map((t) => (t.id === trip.id ? trip : t));
      return [...prev, trip];
    });
  }, []);

  // ─── Member Operations ────────────────────────────────────────
  const addMember = useCallback(async (name: string, upiId?: string): Promise<Member> => {
    if (!activeTripId) throw new Error('No active trip');
    const now = nowISO();
    const member: Member = {
      id: generateId(),
      tripId: activeTripId,
      name: name.trim(),
      initials: deriveInitials(name),
      status: 'active',
      upiId: upiId ? upiId.trim() : undefined,
      createdAt: now,
      updatedAt: now,
    };
    await memberRepo.saveMember(member);
    setMembers((prev) => [...prev, member]);

    // Update trip's updatedAt in background
    touchTrip(activeTripId);

    return member;
  }, [activeTripId, touchTrip]);

  const updateMember = useCallback(async (member: Member) => {
    const updated = { ...member, updatedAt: nowISO() };
    await memberRepo.updateMember(updated);
    setMembers((prev) => prev.map((m) => (m.id === member.id ? updated : m)));
  }, []);

  const archiveMember = useCallback(async (id: string) => {
    const now = nowISO();
    setMembers((prev) => {
      const member = prev.find((m) => m.id === id);
      if (!member) return prev;
      const updated = { ...member, status: 'archived' as const, updatedAt: now };
      memberRepo.updateMember(updated).catch(console.error);
      return prev.map((m) => (m.id === id ? updated : m));
    });
  }, []);

  const restoreMember = useCallback(async (id: string) => {
    const now = nowISO();
    setMembers((prev) => {
      const member = prev.find((m) => m.id === id);
      if (!member) return prev;
      const updated = { ...member, status: 'active' as const, updatedAt: now };
      memberRepo.updateMember(updated).catch(console.error);
      return prev.map((m) => (m.id === id ? updated : m));
    });
  }, []);

  // ─── Expense Operations ───────────────────────────────────────
  const addExpense = useCallback(async (
    data: Omit<Expense, 'id' | 'tripId' | 'createdAt' | 'updatedAt'>
  ): Promise<Expense> => {
    if (!activeTripId) throw new Error('No active trip');
    const now = nowISO();
    const expense: Expense = {
      ...data,
      id: generateId(),
      tripId: activeTripId,
      createdAt: now,
      updatedAt: now,
    };

    // Validate allocations sum
    const allocSum = expense.allocations.reduce((s, a) => s + a.amountPaise, 0);
    if (allocSum !== expense.amountPaise) {
      throw new Error(`Allocation sum (${allocSum}) does not equal expense amount (${expense.amountPaise}).`);
    }

    await expenseRepo.saveExpense(expense);
    setExpenses((prev) => [...prev, expense]);

    // Update trip's updatedAt in background
    touchTrip(activeTripId);

    return expense;
  }, [activeTripId, touchTrip]);

  const updateExpense = useCallback(async (expense: Expense) => {
    const allocSum = expense.allocations.reduce((s, a) => s + a.amountPaise, 0);
    if (allocSum !== expense.amountPaise) {
      throw new Error(`Allocation sum (${allocSum}) does not equal expense amount (${expense.amountPaise}).`);
    }
    const updated = { ...expense, updatedAt: nowISO() };
    await expenseRepo.updateExpense(updated);
    setExpenses((prev) => prev.map((e) => (e.id === expense.id ? updated : e)));
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    await expenseRepo.deleteExpense(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // ─── Settlement Operations ────────────────────────────────────
  const addSettlement = useCallback(async (
    data: Omit<Settlement, 'id' | 'tripId' | 'createdAt' | 'status'>
  ): Promise<Settlement> => {
    if (!activeTripId) throw new Error('No active trip');
    if (data.fromMemberId === data.toMemberId) {
      throw new Error('Cannot create a settlement with the same sender and recipient.');
    }
    if (data.amountPaise <= 0) {
      throw new Error('Settlement amount must be positive.');
    }
    const now = nowISO();
    const settlement: Settlement = {
      ...data,
      id: generateId(),
      tripId: activeTripId,
      status: 'recorded',
      createdAt: now,
    };
    await settlementRepo.saveSettlement(settlement);
    setSettlements((prev) => [...prev, settlement]);
    return settlement;
  }, [activeTripId]);

  const deleteSettlement = useCallback(async (id: string) => {
    await settlementRepo.deleteSettlement(id);
    setSettlements((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // Export the split function for use in UI components
  void split; // referenced to avoid tree-shake

  const value: AppContextValue = useMemo(
    () => ({
      theme,
      toggleTheme,
      displayName,
      setDisplayName,
      trips,
      activeTrip,
      setActiveTripId,
      createTrip,
      updateTrip,
      deleteTrip,
      archiveTrip,
      restoreTrip,
      importTrip,
      members,
      addMember,
      updateMember,
      archiveMember,
      restoreMember,
      expenses,
      addExpense,
      updateExpense,
      deleteExpense,
      settlements,
      addSettlement,
      deleteSettlement,
      memberBalances,
      totalTripSpending,
      recommendedTransfers,
      isLoading,
      error,
      clearError,
    }),
    [
      theme,
      toggleTheme,
      displayName,
      setDisplayName,
      trips,
      activeTrip,
      setActiveTripId,
      createTrip,
      updateTrip,
      deleteTrip,
      archiveTrip,
      restoreTrip,
      importTrip,
      members,
      addMember,
      updateMember,
      archiveMember,
      restoreMember,
      expenses,
      addExpense,
      updateExpense,
      deleteExpense,
      settlements,
      addSettlement,
      deleteSettlement,
      memberBalances,
      totalTripSpending,
      recommendedTransfers,
      isLoading,
      error,
      clearError,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
