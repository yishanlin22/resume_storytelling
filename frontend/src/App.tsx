import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { isLoggedIn } from './api/client'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import ResumePage from './pages/ResumePage'
import ExperiencesPage from './pages/ExperiencesPage'
import BQPage from './pages/BQPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  return isLoggedIn() ? <>{children}</> : <Navigate to="/" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
        <Route path="/resume/:id" element={<RequireAuth><ResumePage /></RequireAuth>} />
        <Route path="/experiences" element={<RequireAuth><ExperiencesPage /></RequireAuth>} />
        <Route path="/bq" element={<RequireAuth><BQPage /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  )
}
