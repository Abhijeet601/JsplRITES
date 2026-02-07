import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import EmployeeRegistration from './pages/EmployeeRegistration';
import EmployeeLogin from './pages/EmployeeLogin';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import MyAttendance from './pages/MyAttendance';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App flex flex-col min-h-screen">
          <div className="flex-grow">
            <Routes>
            {/* Public Routes */}
            <Route path="/register" element={<EmployeeRegistration />} />
            <Route path="/login" element={<EmployeeLogin />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/" element={<EmployeeLogin />} />

            {/* Protected Employee Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRole="employee">
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute requiredRole="employee">
                  <Attendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-attendance"
              element={
                <ProtectedRoute requiredRole="employee">
                  <MyAttendance />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback: redirect unknown routes */}
            <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>

          {/* Footer */}
          <footer className="bg-gray-800 text-white text-center py-4">
            <p>Developed by Abhijeet Mishra, IT Engineer – CRIO, Bhilai</p>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
