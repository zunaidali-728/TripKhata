import { useState, useEffect, Suspense } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from './context/AppContext'
import { lazyWithRetry } from './utils/navigation'
import SplashPage from './pages/SplashPage'
import WelcomePage from './pages/WelcomePage'
import TripListPage from './pages/TripListPage'
import DashboardPage from './pages/DashboardPage'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import Toast from './components/ui/Toast'

// Code-split secondary routes to keep the initial load bundle lean
const ExpenseListPage = lazyWithRetry(() => import('./pages/ExpenseListPage'))
const AddExpensePage = lazyWithRetry(() => import('./pages/AddExpensePage'))
const MembersPage = lazyWithRetry(() => import('./pages/MembersPage'))
const BalancesPage = lazyWithRetry(() => import('./pages/BalancesPage'))
const SettlementsPage = lazyWithRetry(() => import('./pages/SettlementsPage'))
const TripSettingsPage = lazyWithRetry(() => import('./pages/TripSettingsPage'))
const AboutPage = lazyWithRetry(() => import('./pages/AboutPage'))

function RouteLoadingFallback() {
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
  const { trips, activeTrip, theme, error, clearError } = useApp()
  const [showSplash, setShowSplash] = useState(() => location.pathname === '/' || location.pathname === '/splash')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const isAuthRoute =
    location.pathname === '/' ||
    location.pathname === '/splash' ||
    location.pathname === '/welcome' ||
    location.pathname === '/trips'

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

      {isAuthRoute || !activeTrip ? (
        // No sidebar for welcome/trip list
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            <Route path="/" element={<TripListPage />} />
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/trips" element={<TripListPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<TripListPage />} />
          </Routes>
        </Suspense>
      ) : (
        // Sidebar layout for app
        <div className="app-layout">
          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/60 md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
          )}

          <Sidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          <div className="main-content">
            <TopBar onMenuClick={() => setSidebarOpen(true)} />
            <main style={{ flex: 1 }}>
              <Suspense fallback={<RouteLoadingFallback />}>
                <Routes>
                  <Route path="/trip/:tripId/dashboard" element={<DashboardPage />} />
                  <Route path="/trip/:tripId/expenses" element={<ExpenseListPage />} />
                  <Route path="/trip/:tripId/expenses/add" element={<AddExpensePage />} />
                  <Route path="/trip/:tripId/expenses/:expenseId/edit" element={<AddExpensePage />} />
                  <Route path="/trip/:tripId/members" element={<MembersPage />} />
                  <Route path="/trip/:tripId/balances" element={<BalancesPage />} />
                  <Route path="/trip/:tripId/settlements" element={<SettlementsPage />} />
                  <Route path="/trip/:tripId/settings" element={<TripSettingsPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="*" element={<DashboardPage />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
          </div>
        </div>
      )}
    </div>
  )
}

function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        padding: '16px 24px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.78rem',
      }}
    >
      © {new Date().getFullYear()} Md Zunaid Ali. All rights reserved. · TripKhata
    </footer>
  )
}
