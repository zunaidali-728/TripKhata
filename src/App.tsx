import { useState, Suspense } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from './context/AppContext'
import { lazyWithRetry } from './utils/navigation'
import SplashPage from './pages/SplashPage'
import WelcomePage from './pages/WelcomePage'
import TripListPage from './pages/TripListPage'
import DashboardPage from './pages/DashboardPage'
import TripLayout from './components/layout/TripLayout'
import NotFoundPage from './pages/NotFoundPage'
import RouteErrorBoundary from './components/ui/RouteErrorBoundary'
import Toast from './components/ui/Toast'

// Code-split secondary routes to keep initial bundle lightweight
const ExpenseListPage = lazyWithRetry(() => import('./pages/ExpenseListPage'))
const AddExpensePage = lazyWithRetry(() => import('./pages/AddExpensePage'))
const MembersPage = lazyWithRetry(() => import('./pages/MembersPage'))
const BalancesPage = lazyWithRetry(() => import('./pages/BalancesPage'))
const SettlementsPage = lazyWithRetry(() => import('./pages/SettlementsPage'))
const TripSettingsPage = lazyWithRetry(() => import('./pages/TripSettingsPage'))
const AboutPage = lazyWithRetry(() => import('./pages/AboutPage'))

export function RouteLoadingFallback() {
  return (
    <div
      className="page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '45vh',
        gap: 14,
      }}
      role="status"
      aria-label="Loading section"
    >
      <div
        className="skeleton"
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          opacity: 0.85,
        }}
      />
      <div
        className="skeleton"
        style={{
          width: 130,
          height: 12,
          borderRadius: 6,
          opacity: 0.6,
        }}
      />
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const { trips, theme, error, clearError } = useApp()
  const [showSplash, setShowSplash] = useState(
    () => location.pathname === '/' || location.pathname === '/splash'
  )
  const navigate = useNavigate()

  if (showSplash) {
    return (
      <SplashPage
        onContinue={() => {
          setShowSplash(false)
          if (trips.length > 0) {
            navigate('/trips')
          } else {
            navigate('/welcome')
          }
        }}
      />
    )
  }

  return (
    <div className={theme === 'dark' ? '' : 'light'} style={{ minHeight: '100vh' }}>
      {error && (
        <Toast
          message={error}
          type="error"
          onClose={clearError}
        />
      )}

      <RouteErrorBoundary>
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            {/* Entry / General Routes */}
            <Route path="/" element={<Navigate to="/trips" replace />} />
            <Route
              path="/splash"
              element={
                <SplashPage
                  onContinue={() => {
                    setShowSplash(false)
                    if (trips.length > 0) {
                      navigate('/trips')
                    } else {
                      navigate('/welcome')
                    }
                  }}
                />
              }
            />
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/trips" element={<TripListPage />} />
            <Route path="/about" element={<AboutPage />} />

            {/* Trip-Specific Routes (Wrapped with Unified TripLayout) */}
            <Route path="/trip/:tripId" element={<TripLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="expenses" element={<ExpenseListPage />} />
              <Route path="expenses/add" element={<AddExpensePage />} />
              <Route path="expenses/:expenseId/edit" element={<AddExpensePage />} />
              <Route path="members" element={<MembersPage />} />
              <Route path="balances" element={<BalancesPage />} />
              <Route path="settlements" element={<SettlementsPage />} />
              <Route path="settings" element={<TripSettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Global In-App 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </RouteErrorBoundary>
    </div>
  )
}
