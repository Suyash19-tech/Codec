import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Onboarding from './components/Onboarding'
import Login from './components/Login'
import Signup from './components/Signup'
import Dashboard from './components/Dashboard'
import AdminDashboard from './components/AdminDashboard'
import PublicProfileView from './components/PublicProfileView'
import DebugInfo from './components/DebugInfo'

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <DebugInfo />
      <div className="min-h-screen relative">
        {/* Fixed background with mesh gradient */}
        <div className="fixed inset-0 bg-[#050505]">
          <div className="absolute inset-0 opacity-40">
            <div className="absolute top-0 left-0 w-96 h-96 bg-[#1a1a2e] rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 right-0 w-125 h-125 bg-[#16213e] rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-1/3 w-100 h-100 bg-[#1a1a2e] rounded-full blur-3xl"></div>
          </div>
        </div>

        {/* Content layer */}
        <div className="relative z-10">
          <Routes>
            {/* Default route - redirect to Onboarding */}
            <Route path="/" element={<Navigate to="/onboarding" replace />} />

            {/* Onboarding route */}
            <Route path="/onboarding" element={<Onboarding />} />

            {/* Login route */}
            <Route path="/login" element={<Login />} />

            {/* Signup route */}
            <Route path="/signup" element={<Signup />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard userRole={user?.role} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile/:userId"
              element={
                <ProtectedRoute>
                  <PublicProfileView />
                </ProtectedRoute>
              }
            />

            {/* Catch all route - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
