import React, { lazy } from 'react';

// Robust lazy loader with 1-shot retry for flaky networks / stale chunk caching
export function lazyWithRetry<P extends object>(
  factory: () => Promise<{ default: React.ComponentType<P> }>
): React.LazyExoticComponent<React.ComponentType<P>> {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error) {
      console.warn('Network chunk loading failed, retrying once...', error);
      await new Promise((resolve) => setTimeout(resolve, 800));
      return factory();
    }
  });
}

// Preload helpers to warm cache on intent (hover/focus)
export const preloadRoute = {
  expenses: () => import('../pages/ExpenseListPage'),
  addExpense: () => import('../pages/AddExpensePage'),
  members: () => import('../pages/MembersPage'),
  balances: () => import('../pages/BalancesPage'),
  settlements: () => import('../pages/SettlementsPage'),
  settings: () => import('../pages/TripSettingsPage'),
  about: () => import('../pages/AboutPage'),
};
