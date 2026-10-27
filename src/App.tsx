import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from './context/AppContext'
import SplashPage from './pages/SplashPage'
import WelcomePage from './pages/WelcomePage'
import TripListPage from './pages/TripListPage'
import DashboardPage from './pages/DashboardPage'
import ExpenseListPage from './pages/ExpenseListPage'
import AddExpensePage from './pages/AddExpensePage'
import MembersPage from './pages/MembersPage'
import BalancesPage from './pages/BalancesPage'
import SettlementsPage from './pages/SettlementsPage'
import TripSettingsPage from './pages/TripSettingsPage'
import AboutPage from './pages/AboutPage'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import Toast from './components/ui/Toast'
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
        <Routes>
          <Route path="/" element={<TripListPage />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/trips" element={<TripListPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<TripListPage />} />
        </Routes>
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
