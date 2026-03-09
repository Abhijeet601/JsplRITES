import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate
} from 'react-router-dom';
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
import PlantLogin from './pages/plant/PlantLogin';
import PlantEmployeeDashboard from './pages/plant/PlantEmployeeDashboard';
import PlantAdminDashboard from './pages/plant/PlantAdminDashboard';
import { PlantAuthProvider } from './plant/PlantAuthContext';
import PlantProtectedRoute from './plant/PlantProtectedRoute';

function PathNormalizer() {
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    const normalizedPath = location.pathname.replace(/\/{2,}/g, '/');
    if (normalizedPath !== location.pathname) {
      navigate(
        {
          pathname: normalizedPath,
          search: location.search,
          hash: location.hash
        },
        { replace: true }
      );
    }
  }, [location.pathname, location.search, location.hash, navigate]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <PathNormalizer />
        <div className="App flex flex-col min-h-screen">
          <div className="flex-grow">
            <Routes>
            {/* Public Routes */}
            <Route path="/register" element={<EmployeeRegistration />} />
            <Route path="/login" element={<EmployeeLogin />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/" element={<EmployeeLogin />} />
            <Route
              path="/plant-login"
              element={
                <PlantAuthProvider>
                  <PlantLogin />
                </PlantAuthProvider>
              }
            />
            <Route
              path="/plant-employee"
              element={
                <PlantAuthProvider>
                  <PlantProtectedRoute roles={['employee']}>
                    <PlantEmployeeDashboard />
                  </PlantProtectedRoute>
                </PlantAuthProvider>
              }
            />
            <Route
              path="/plant-admin"
              element={
                <PlantAuthProvider>
                  <PlantProtectedRoute roles={['plant_admin', 'super_admin']}>
                    <PlantAdminDashboard />
                  </PlantProtectedRoute>
                </PlantAuthProvider>
              }
            />

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
