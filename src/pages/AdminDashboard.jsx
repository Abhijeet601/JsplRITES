import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Users,
  Calendar,
  Clock,
  LogOut,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  CheckCircle,
  AlertCircle,
  XCircle,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Toast from '../components/Toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

const toLocalDateInputValue = (dateObj = new Date()) => {
  const tzOffsetMs = dateObj.getTimezoneOffset() * 60000;
  return new Date(dateObj.getTime() - tzOffsetMs).toISOString().split('T')[0];
};

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [pendingAttendance, setPendingAttendance] = useState([]);
  const [attendanceReport, setAttendanceReport] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    mobile_number: '',
    base_location_lat: '',
    base_location_lon: '',
    base_location_name: ''
  });
  const [resetPasswordEmployee, setResetPasswordEmployee] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const [adminProfile, setAdminProfile] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    mobile_number: ''
  });

  const [filters, setFilters] = useState({
    employee_id: '',
    shift: '',
    start_date: toLocalDateInputValue(),
    end_date: toLocalDateInputValue()
  });
  const [attendancePage, setAttendancePage] = useState(1);
  const [attendancePageSize, setAttendancePageSize] = useState(200);
  const [attendanceTotalRecords, setAttendanceTotalRecords] = useState(0);

  // Monthly report states
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [downloading, setDownloading] = useState(false);

  // Daily report state
  const [dailyReportDate, setDailyReportDate] = useState(
    toLocalDateInputValue()
  );
  const [downloadingDaily, setDownloadingDaily] = useState(false);
  const selectedMonthLabel = MONTH_OPTIONS.find((m) => m.value === reportMonth)?.label || 'Selected Month';

  const showToast = (msg, type = 'info') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast({ message: '', type: 'info' }), 4000);
  };

  // Fetch data based on active tab
  useEffect(() => {
    if (activeTab === 'registrations') fetchPendingRegistrations();
    if (activeTab === 'attendance') {
      fetchAttendanceReport(1);
      fetchPendingAttendance();
    }
    if (activeTab === 'employees') fetchEmployees();
    if (activeTab === 'reports') fetchAttendanceReport(1);
    if (activeTab === 'dashboard') {
      fetchTodayAttendance();
      fetchPendingAttendance();
      fetchEmployees();
      fetchPendingRegistrations();
    }
    if (activeTab === 'monthly-report') { /* no fetch needed */ }
    if (activeTab === 'settings') fetchAdminProfile();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'attendance' && activeTab !== 'dashboard') return undefined;
    const timer = setInterval(() => {
      if (activeTab === 'dashboard') {
        fetchTodayAttendance();
        fetchPendingAttendance();
      } else if (activeTab === 'attendance') {
        fetchAttendanceReport(attendancePage);
        fetchPendingAttendance();
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [activeTab, attendancePage, attendancePageSize, filters]);

  const fetchPendingRegistrations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/pending-registrations');
      setPendingRegistrations(res.data.pending_users);
    } catch {
      setError('Failed to fetch pending registrations');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/pending-attendance');
      setPendingAttendance(res.data.pending_attendance);
    } catch {
      setError('Failed to fetch pending attendance');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceReport = async (page = attendancePage, overrides = {}) => {
    setLoading(true);
    try {
      const params = {};
      const effectiveFilters = overrides.filters ? { ...filters, ...overrides.filters } : filters;
      const effectivePageSize = overrides.pageSize ?? attendancePageSize;
      const normalizedFilters = { ...effectiveFilters };
      if (normalizedFilters.start_date && !normalizedFilters.end_date) {
        normalizedFilters.end_date = normalizedFilters.start_date;
      }
      if (normalizedFilters.end_date && !normalizedFilters.start_date) {
        normalizedFilters.start_date = normalizedFilters.end_date;
      }

      Object.entries(normalizedFilters).forEach(([k, v]) => v && (params[k] = v));
      params.page = page;
      params.page_size = effectivePageSize;

      const res = await api.get('/api/admin/attendance-report', { params });
      setAttendanceReport(res.data.attendance_data || []);
      setAttendanceTotalRecords(res.data.total_records || 0);
      setAttendancePage(res.data.page || page);
    } catch {
      setError('Failed to fetch attendance report');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAttendance = async () => {
    setLoading(true);
    try {
      const today = toLocalDateInputValue();
      setFilters(prev => ({ ...prev, start_date: today, end_date: today }));
      setAttendancePage(1);
      const res = await api.get('/api/admin/attendance-report', {
        params: { start_date: today, end_date: today, page: 1, page_size: attendancePageSize }
      });
      setAttendanceReport(res.data.attendance_data || []);
      setAttendanceTotalRecords(res.data.total_records || 0);
    } catch {
      setError('Failed to fetch today attendance');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/employees');
      setEmployees(res.data.employees || []);
    } catch {
      setError('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const updateEmployee = async (employeeId, updatedData) => {
    try {
      await api.put(`/api/admin/employees/${employeeId}`, updatedData);
      fetchEmployees();
      setEditingEmployee(null);
      setEditForm({
        name: '',
        email: '',
        mobile_number: '',
        base_location_lat: '',
        base_location_lon: '',
        base_location_name: ''
      });
    } catch {
      setError('Failed to update employee');
    }
  };

  const startEditing = (employee) => {
    setEditingEmployee(employee.id);
    setEditForm({
      name: employee.name,
      email: employee.email,
      mobile_number: employee.mobile_number,
      base_location_lat: employee.base_location_lat,
      base_location_lon: employee.base_location_lon,
      base_location_name: employee.base_location_name
    });
  };

  const cancelEditing = () => {
    setEditingEmployee(null);
    setEditForm({
      name: '',
      email: '',
      mobile_number: '',
      base_location_lat: '',
      base_location_lon: '',
      base_location_name: ''
    });
  };

  const approveRegistration = async (id, baseLocation) => {
    await api.post('/api/admin/approve-user', {
      user_id: id,
      base_location_lat: baseLocation.lat,
      base_location_lon: baseLocation.lon,
      base_location_name: baseLocation.name
    });
    fetchPendingRegistrations();
  };

  const handleAttendanceAction = async (id, status) => {
    try {
      await api.post('/api/admin/approve-attendance', {
        attendance_id: id,
        admin_status: status
      });
      fetchPendingAttendance();
      fetchAttendanceReport(attendancePage);
      showToast(`Attendance ${status} successfully`, 'success');
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to update attendance status');
      showToast('Failed to update attendance status', 'error');
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Employee ID','Name','Check-in Date','Check-in Time',
      'Check-out Time','Work Hours','Shift','System Status','Admin Status'
    ];

    const rows = attendanceReport.map(r => [
      r.employee_id,
      r.name,
      r.check_in_time ? new Date(r.check_in_time).toLocaleDateString() : 'N/A',
      r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString() : 'N/A',
      r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString() : 'N/A',
      r.work_hours || 'N/A',
      r.shift,
      r.system_status,
      r.admin_status
    ]);

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance_report.csv';
    a.click();
  };

  const fetchAdminProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/profile');
      setAdminProfile(res.data.admin);
      setProfileForm({
        name: res.data.admin.name,
        email: res.data.admin.email,
        mobile_number: res.data.admin.mobile_number
      });
    } catch {
      setError('Failed to fetch admin profile');
    } finally {
      setLoading(false);
    }
  };

  const downloadMonthlyReport = async () => {
    setDownloading(true);
    try {
      const res = await api.get('/api/admin/monthly-pa-late-report', {
        params: { year: reportYear, month: reportMonth },
        responseType: 'blob'
      });

      // Try to extract filename from content-disposition
      const disposition = res.headers['content-disposition'] || res.headers['Content-Disposition'];
      let filename = `monthly_attendance_${reportYear}_${String(reportMonth).padStart(2, '0')}.xlsx`;
      if (disposition) {
        const match = /filename\*=UTF-8''(.+)$/.exec(disposition) || /filename="?([^";]+)"?/.exec(disposition);
        if (match && match[1]) filename = decodeURIComponent(match[1]);
      }

      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('Monthly report downloaded successfully', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to download monthly report', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const downloadDailyReport = async () => {
    setDownloadingDaily(true);
    try {
      const res = await api.get('/api/admin/daily-attendance-report', {
        params: { date: dailyReportDate },
        responseType: 'blob'
      });

      const disposition = res.headers['content-disposition'] || res.headers['Content-Disposition'];
      let filename = `daily_attendance_${dailyReportDate}.xlsx`;
      if (disposition) {
        const match = /filename\*=UTF-8''(.+)$/.exec(disposition) || /filename="?([^";]+)"?/.exec(disposition);
        if (match && match[1]) filename = decodeURIComponent(match[1]);
      }

      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('Daily report downloaded successfully', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to download daily report', 'error');
    } finally {
      setDownloadingDaily(false);
    }
  };

  const changePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('New passwords do not match');
      return;
    }
    try {
      await api.post('/api/admin/change-password', passwordForm);
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setError('');
      alert('Password changed successfully');
    } catch {
      setError('Failed to change password');
    }
  };

  const updateProfile = async () => {
    try {
      await api.put('/api/admin/profile', profileForm);
      fetchAdminProfile();
      setError('');
      alert('Profile updated successfully');
    } catch {
      setError('Failed to update profile');
    }
  };

  const resetPassword = async () => {
    if (!newPassword.trim()) {
      setError('Password cannot be empty');
      return;
    }
    try {
      await api.post('/api/admin/reset-password', {
        user_id: resetPasswordEmployee.id,
        new_password: newPassword
      });
      setResetPasswordEmployee(null);
      setNewPassword('');
      setError('');
      alert('Password reset successfully');
    } catch {
      setError('Failed to reset password');
    }
  };

  const stats = {
    totalEmployees: new Set(attendanceReport.map(r => r.employee_id)).size,
    todayAttendance: attendanceReport.filter(r =>
      r.check_in_time &&
      new Date(r.check_in_time).toDateString() === new Date().toDateString()
    ).length,
    totalRecords: attendanceReport.length
  };

  // Helper functions for charts and alerts
  const getAttendanceTrendData = () => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = toLocalDateInputValue(date);
      const dayRecords = attendanceReport.filter(r =>
        r.check_in_time && r.check_in_time.startsWith(dateStr)
      );
      const present = dayRecords.filter(r => r.admin_status === 'approved').length;
      const late = dayRecords.filter(r => {
        if (!r.check_in_time) return false;
        const checkInTime = new Date(r.check_in_time);
        const shiftStart = r.shift === 'A' ? 9 : r.shift === 'B' ? 14 : r.shift === 'C' ? 22 : 9;
        return checkInTime.getHours() >= shiftStart + 1; // Late if more than 1 hour after shift start
      }).length;
      last7Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        present,
        late
      });
    }
    return last7Days;
  };

  const getShiftDistributionData = () => {
    const shifts = {};
    attendanceReport.forEach(r => {
      shifts[r.shift] = (shifts[r.shift] || 0) + 1;
    });
    return Object.entries(shifts).map(([shift, count]) => ({
      name: shift.toUpperCase(),
      value: count
    }));
  };

  const getLateAttendanceAlerts = () => {
    return attendanceReport
      .filter(r => {
        if (!r.check_in_time || r.admin_status !== 'approved') return false;
        const checkInTime = new Date(r.check_in_time);
        const shiftStart = r.shift === 'A' ? 9 : r.shift === 'B' ? 14 : r.shift === 'C' ? 22 : 9;
        const lateMinutes = Math.floor((checkInTime.getTime() - new Date(checkInTime).setHours(shiftStart, 0, 0, 0)) / (1000 * 60));
        return lateMinutes > 15; // Late if more than 15 minutes
      })
      .map(r => {
        const checkInTime = new Date(r.check_in_time);
        const shiftStart = r.shift === 'A' ? 9 : r.shift === 'B' ? 14 : r.shift === 'C' ? 22 : 9;
        const lateMinutes = Math.floor((checkInTime.getTime() - new Date(checkInTime).setHours(shiftStart, 0, 0, 0)) / (1000 * 60));
        return {
          ...r,
          lateMinutes
        };
      })
      .slice(0, 10); // Show top 10 late attendances
  };

  const getLateTodayCount = () => {
    const today = toLocalDateInputValue();
    return attendanceReport.filter((r) => {
      if (!r.check_in_time || r.admin_status !== 'approved') return false;
      if (!r.check_in_time.startsWith(today)) return false;
      const checkInTime = new Date(r.check_in_time);
      const shiftStart = r.shift === 'A' ? 9 : r.shift === 'B' ? 14 : r.shift === 'C' ? 22 : 9;
      const lateMinutes = Math.floor(
        (checkInTime.getTime() - new Date(checkInTime).setHours(shiftStart, 0, 0, 0)) / (1000 * 60)
      );
      return lateMinutes > 15;
    }).length;
  };

  if (!user) return null;

  const handleSidebarChange = (key) => {
    if (key === 'logout') {
      logout();
      navigate('/admin-login');
    } else {
      setActiveTab(key);
      if (window.innerWidth < 768) setSidebarOpen(false);
    }
  };

  const setToCurrentMonth = () => {
    const now = new Date();
    setReportYear(now.getFullYear());
    setReportMonth(now.getMonth() + 1);
  };

  const setToPreviousMonth = () => {
    const now = new Date();
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    setReportYear(previousMonthDate.getFullYear());
    setReportMonth(previousMonthDate.getMonth() + 1);
  };

  // StatCard Component
  const StatCard = ({ icon: Icon, label, value, color, trend }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className={`bg-gradient-to-br ${color} rounded-2xl shadow-lg p-6 text-white relative overflow-hidden group cursor-pointer`}
    >
      <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium opacity-90">{label}</p>
          <Icon className="opacity-50 group-hover:opacity-100 transition" size={24} />
        </div>
        <p className="text-4xl font-bold">{value}</p>
        {trend && <p className="text-xs mt-2 opacity-75">{trend}</p>}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:block fixed left-0 top-[72px] w-64 h-[calc(100vh-72px)] z-40">
          <Sidebar 
            active={activeTab}
            onChange={handleSidebarChange}
          />
        </div>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              className="md:hidden fixed left-0 top-[72px] w-64 h-[calc(100vh-72px)] z-40"
            >
              <Sidebar 
                active={activeTab}
                onChange={handleSidebarChange}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="md:hidden fixed inset-0 top-[72px] bg-black/50 z-30"
          />
        )}

        {/* Main Content */}
        <div className={`flex-1 md:ml-64 transition-all duration-300 w-full`}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 sm:p-4 md:p-6"
          >
            {/* Mobile Sidebar Toggle */}
            <div className="md:hidden mb-4 sm:mb-6 flex items-center justify-between">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">Admin</h1>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 bg-blue-600 text-white rounded-lg shadow hover:shadow-md transition"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>

            {/* Dashboard Home */}
            {activeTab === 'dashboard' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="mb-8">
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome, {user.name}</h1>
                  <p className="text-gray-600">Here's what's happening in your attendance system today.</p>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-6 mb-6 sm:mb-8">
                  <StatCard 
                    icon={Users}
                    label="Total Employees"
                    value={employees.length}
                    color="from-blue-500 to-blue-600"
                  />
                  <StatCard
                    icon={CheckCircle}
                    label="Present Today"
                    value={attendanceReport.filter(r =>
                      r.check_in_time && new Date(r.check_in_time).toDateString() === new Date().toDateString()
                    ).length}
                    color="from-green-500 to-green-600"
                  />
                  <StatCard
                    icon={AlertCircle}
                    label="Late Today"
                    value={getLateTodayCount()}
                    color="from-orange-500 to-orange-600"
                  />
                  <StatCard
                    icon={XCircle}
                    label="Pending Approvals"
                    value={pendingAttendance.length}
                    color="from-red-500 to-red-600"
                  />
                </div>

                {/* Daily Report Download */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-6 shadow-md mb-8"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    Quick Daily Report
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">Download attendance report for any specific date</p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-end w-full">
                    <div className="flex-1">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Select Date
                      </label>
                      <input
                        type="date"
                        value={dailyReportDate}
                        onChange={(e) => setDailyReportDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs sm:text-sm"
                      />
                    </div>
                    <button
                      onClick={downloadDailyReport}
                      disabled={downloadingDaily}
                      className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold px-3 sm:px-6 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 disabled:cursor-not-allowed text-xs sm:text-sm whitespace-nowrap"
                    >
                      <Download className={`w-3 h-3 sm:w-4 sm:h-4 ${downloadingDaily ? 'animate-spin' : ''}`} />
                      <span>{downloadingDaily ? 'Downloading...' : 'Download'}</span>
                    </button>
                  </div>
                </motion.div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 cursor-pointer"
                    onClick={() => setActiveTab('registrations')}
                  >
                    <Users className="text-blue-600 mb-3" size={32} />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Pending Registrations</h3>
                    <p className="text-gray-600 text-sm mb-4">Review and approve new employee registrations</p>
                    <div className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium">
                      {pendingRegistrations.length} pending
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 cursor-pointer"
                    onClick={() => setActiveTab('attendance')}
                  >
                    <Calendar className="text-green-600 mb-3" size={32} />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Attendance Approvals</h3>
                    <p className="text-gray-600 text-sm mb-4">Approve pending attendance records</p>
                    <div className="inline-block px-4 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium">
                      {pendingAttendance.length} pending
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

        {/* ================= MONTHLY REPORT ================= */}
        {activeTab === 'monthly-report' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl overflow-hidden shadow-xl mb-6 border border-blue-100 bg-white"
          >
            <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 text-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Reports</p>
                  <h3 className="text-2xl font-bold">Monthly Attendance Report</h3>
                  <p className="text-blue-100 text-sm mt-2">
                    Download PA/Late summary in Excel for any month and year.
                  </p>
                </div>
                <div className="bg-white/15 rounded-xl px-4 py-2 text-sm">
                  Selected: <span className="font-semibold">{selectedMonthLabel} {reportYear}</span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-5">
                <button
                  type="button"
                  onClick={setToCurrentMonth}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={setToPreviousMonth}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                >
                  Last Month
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Year</label>
                  <input
                    type="number"
                    min="2000"
                    max="2099"
                    value={reportYear}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (Number.isNaN(value)) return;
                      setReportYear(Math.min(2099, Math.max(2000, value)));
                    }}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    aria-label="Year"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Month</label>
                  <select
                    value={reportMonth}
                    onChange={(e) => setReportMonth(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    aria-label="Month"
                  >
                    {MONTH_OPTIONS.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={downloadMonthlyReport}
                  disabled={downloading}
                  className="h-[46px] bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl px-4 font-semibold flex items-center justify-center gap-2 transition disabled:cursor-not-allowed"
                >
                  <Download size={18} className={downloading ? 'animate-spin' : ''} />
                  {downloading ? 'Downloading...' : 'Download Report'}
                </button>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700">
                File name: <span className="font-semibold">monthly_attendance_{reportYear}_{String(reportMonth).padStart(2, '0')}.xlsx</span>
              </div>
            </div>
          </motion.div>
        )}
        {/* STATS */}
        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
              <p className="text-blue-100 text-sm">Total Employees</p>
              <p className="text-4xl font-bold">{stats.totalEmployees}</p>
              <Users className="opacity-40 absolute right-6 top-6" size={40} />
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
              <p className="text-green-100 text-sm">Today's Attendance</p>
              <p className="text-4xl font-bold">{stats.todayAttendance}</p>
              <Calendar className="opacity-40 absolute right-6 top-6" size={40} />
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
              <p className="text-purple-100 text-sm">Total Records</p>
              <p className="text-4xl font-bold">{stats.totalRecords}</p>
              <Clock className="opacity-40 absolute right-6 top-6" size={40} />
            </div>
          </div>
        )}

        {loading && <p className="text-center">Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {/* ================= REGISTRATIONS ================= */}
        {activeTab === 'registrations' && (
          <div className="grid gap-3 sm:gap-4 md:gap-6">
            {pendingRegistrations.map(reg => (
              <motion.div
                key={reg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow p-4 sm:p-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p><b>Name:</b> {reg.name}</p>
                    <p><b>Employee ID:</b> {reg.employee_id}</p>
                    <p><b>Email:</b> {reg.email}</p>
                    <p><b>Mobile:</b> {reg.mobile_number}</p>
                  </div>

                  <div className="space-y-2">
                    <input
                      placeholder="Location Name"
                      className="w-full border rounded-lg p-2 text-sm"
                      onChange={e => reg.baseLocationName = e.target.value}
                    />
                    <input
                      placeholder="Latitude"
                      type="number"
                      step="any"
                      className="w-full border rounded-lg p-2 text-sm"
                      onChange={e => reg.baseLocationLat = e.target.value}
                    />
                    <input
                      placeholder="Longitude"
                      type="number"
                      step="any"
                      className="w-full border rounded-lg p-2 text-sm"
                      onChange={e => reg.baseLocationLon = e.target.value}
                    />
                    <button
                      onClick={() => approveRegistration(reg.id, {
                        lat: reg.baseLocationLat,
                        lon: reg.baseLocationLon,
                        name: reg.baseLocationName
                      })}
                      className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-sm font-medium"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ================= ATTENDANCE ================= */}
        {activeTab === 'attendance' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Attendance Filters */}
            <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                <input
                  className="border p-2 rounded text-sm"
                  placeholder="Employee ID"
                  value={filters.employee_id}
                  onChange={e => setFilters({ ...filters, employee_id: e.target.value })}
                />
                <select
                  className="border p-2 rounded text-sm"
                  value={filters.shift}
                  onChange={e => setFilters({ ...filters, shift: e.target.value })}
                >
                  <option value="">All Shifts</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="general">General</option>
                  <option value="01:00-09:30">01:00-09:30</option>
                  <option value="06:00-14:30">06:00-14:30</option>
                  <option value="08:00-16:30">08:00-16:30</option>
                  <option value="09:00-17:30">09:00-17:30</option>
                  <option value="10:00-18:00">10:00-18:00</option>
                  <option value="10:00-18:30">10:00-18:30</option>
                  <option value="14:00-22:30">14:00-22:30</option>
                  <option value="17:00-01:30">17:00-01:30</option>
                  <option value="21:00-05:30">21:00-05:30</option>
                  <option value="22:00-06:30">22:00-06:30</option>
                </select>
                <input
                  type="date"
                  className="border p-2 rounded text-sm"
                  value={filters.start_date}
                  onChange={e => setFilters({ ...filters, start_date: e.target.value })}
                />
                <input
                  type="date"
                  className="border p-2 rounded text-sm"
                  value={filters.end_date}
                  onChange={e => setFilters({ ...filters, end_date: e.target.value })}
                />
                <button
                  onClick={() => fetchAttendanceReport(1)}
                  className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium whitespace-nowrap"
                >
                  Apply Filter
                </button>
                <button
                  onClick={() => {
                    const today = toLocalDateInputValue();
                    const nextFilters = { ...filters, start_date: today, end_date: today };
                    setFilters(nextFilters);
                    fetchAttendanceReport(1, { filters: nextFilters });
                  }}
                  className="bg-green-600 text-white px-3 py-2 rounded text-sm font-medium whitespace-nowrap"
                >
                  Today
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                <span>Total records: {attendanceTotalRecords}</span>
                <div className="flex items-center gap-2">
                  <label htmlFor="page-size">Rows:</label>
                  <select
                    id="page-size"
                    className="border p-1 rounded"
                    value={attendancePageSize}
                    onChange={(e) => {
                      const size = Number(e.target.value);
                      setAttendancePageSize(size);
                      setAttendancePage(1);
                      fetchAttendanceReport(1, { pageSize: size });
                    }}
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={500}>500</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Attendance Records Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-x-auto -mx-3 sm:-mx-4 md:mx-0 md:rounded-2xl">
              <table className="w-full min-w-max text-sm sm:text-base">
                <thead className="bg-gradient-to-r from-blue-600 to-green-600 text-white sticky top-0">
                  <tr>
                    <th className="p-2 sm:p-4 text-left whitespace-nowrap">Emp ID</th>
                    <th className="p-2 sm:p-4 text-left whitespace-nowrap">Name</th>
                    <th className="p-2 sm:p-4 text-left whitespace-nowrap">Check-in</th>
                    <th className="p-2 sm:p-4 text-left whitespace-nowrap">Check-out</th>
                    <th className="p-2 sm:p-4 text-left whitespace-nowrap">Hours</th>
                    <th className="p-2 sm:p-4 text-left whitespace-nowrap">Shift</th>
                    <th className="p-2 sm:p-4 text-left whitespace-nowrap">System</th>
                    <th className="p-2 sm:p-4 text-left whitespace-nowrap">Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-gray-500">Loading attendance records...</td>
                    </tr>
                  )}
                  {!loading && attendanceReport.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-gray-500">No attendance records found for selected filters.</td>
                    </tr>
                  )}
                  {!loading && attendanceReport.map(att => (
                    <tr key={att.id} className="border-t hover:bg-gray-50">
                      <td className="p-2 sm:p-4">{att.employee_id}</td>
                      <td className="p-2 sm:p-4">{att.name}</td>
                      <td className="p-2 sm:p-4 text-xs sm:text-sm">{att.check_in_time ? new Date(att.check_in_time).toLocaleString() : 'N/A'}</td>
                      <td className="p-2 sm:p-4 text-xs sm:text-sm">{att.check_out_time ? new Date(att.check_out_time).toLocaleString() : 'Not checked out'}</td>
                      <td className="p-2 sm:p-4">{att.work_hours ?? 'N/A'}</td>
                      <td className="p-2 sm:p-4">{att.shift || 'N/A'}</td>
                      <td className="p-2 sm:p-4">{att.system_status || 'N/A'}</td>
                      <td className="p-2 sm:p-4">{att.admin_status || 'pending'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Attendance Pagination */}
            <div className="flex items-center justify-end gap-2">
              <button
                disabled={attendancePage <= 1 || loading}
                onClick={() => fetchAttendanceReport(attendancePage - 1)}
                className="px-3 py-1 rounded border disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm text-gray-700">Page {attendancePage}</span>
              <button
                disabled={attendancePage * attendancePageSize >= attendanceTotalRecords || loading}
                onClick={() => fetchAttendanceReport(attendancePage + 1)}
                className="px-3 py-1 rounded border disabled:opacity-50"
              >
                Next
              </button>
            </div>

            {/* Pending Attendance Approvals */}
            <div className="bg-white rounded-2xl shadow-lg overflow-x-auto -mx-3 sm:-mx-4 md:mx-0 md:rounded-2xl">
              <table className="w-full min-w-max text-sm sm:text-base">
                <thead className="bg-gradient-to-r from-blue-600 to-green-600 text-white sticky top-0">
                  <tr>
                    <th className="p-2 sm:p-4 text-left whitespace-nowrap">Emp ID</th>
                    <th className="p-2 sm:p-4 text-left whitespace-nowrap">Name</th>
                    <th className="p-2 sm:p-4 text-left whitespace-nowrap">Check-in</th>
                    <th className="p-2 sm:p-4 text-left whitespace-nowrap">Check-out</th>
                    <th className="p-2 sm:p-4 text-left whitespace-nowrap">Status</th>
                    <th className="p-2 sm:p-4 text-left whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && pendingAttendance.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-500">No pending attendance approvals.</td>
                    </tr>
                  )}
                  {pendingAttendance.map(att => (
                    <tr key={att.id} className="border-t hover:bg-gray-50">
                      <td className="p-2 sm:p-4">{att.employee_id}</td>
                      <td className="p-2 sm:p-4">{att.name}</td>
                      <td className="p-2 sm:p-4 text-xs sm:text-sm">{new Date(att.check_in_time).toLocaleString()}</td>
                      <td className="p-2 sm:p-4 text-xs sm:text-sm">{att.check_out_time ? new Date(att.check_out_time).toLocaleString() : 'Not checked out'}</td>
                      <td className="p-2 sm:p-4"><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">{att.system_status}</span></td>
                      <td className="p-2 sm:p-4">
                        <div className="flex gap-1 flex-wrap">
                          <button
                            onClick={() => handleAttendanceAction(att.id, 'approved')}
                            className="bg-green-500 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm hover:bg-green-600 transition-colors whitespace-nowrap"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAttendanceAction(att.id, 'rejected')}
                            className="bg-red-500 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm hover:bg-red-600 transition-colors whitespace-nowrap"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ================= EMPLOYEES ================= */}
        {activeTab === 'employees' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-x-auto">
            <table className="w-full min-w-max text-sm sm:text-base">
              <thead className="bg-gradient-to-r from-blue-600 to-green-600 text-white sticky top-0">
                <tr>
                  <th className="p-2 sm:p-4 text-left whitespace-nowrap">Emp ID</th>
                  <th className="p-2 sm:p-4 text-left whitespace-nowrap">Name</th>
                  <th className="p-2 sm:p-4 text-left whitespace-nowrap">Email</th>
                  <th className="p-2 sm:p-4 text-left whitespace-nowrap">Mobile</th>
                  <th className="p-2 sm:p-4 text-left whitespace-nowrap">Base Location</th>
                  <th className="p-2 sm:p-4 text-left whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id} className="border-t hover:bg-gray-50">
                    <td className="p-2 sm:p-4 text-xs sm:text-sm">{emp.employee_id}</td>
                    <td className="p-2 sm:p-4">
                      {editingEmployee === emp.id ? (
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full border rounded p-1 text-xs sm:text-sm"
                        />
                      ) : (
                        <span className="text-xs sm:text-sm">{emp.name}</span>
                      )}
                    </td>
                    <td className="p-2 sm:p-4">
                      {editingEmployee === emp.id ? (
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full border rounded p-1 text-xs sm:text-sm"
                        />
                      ) : (
                        <span className="text-xs sm:text-sm truncate block">{emp.email}</span>
                      )}
                    </td>
                    <td className="p-2 sm:p-4">
                      {editingEmployee === emp.id ? (
                        <input
                          type="text"
                          value={editForm.mobile_number}
                          onChange={(e) => setEditForm({ ...editForm, mobile_number: e.target.value })}
                          className="w-full border rounded p-1 text-xs sm:text-sm"
                        />
                      ) : (
                        <span className="text-xs sm:text-sm">{emp.mobile_number}</span>
                      )}
                    </td>
                    <td className="p-2 sm:p-4">
                      {editingEmployee === emp.id ? (
                        <div className="space-y-1 flex flex-col">
                          <input
                            type="text"
                            placeholder="Location Name"
                            value={editForm.base_location_name}
                            onChange={(e) => setEditForm({ ...editForm, base_location_name: e.target.value })}
                            className="w-full border rounded p-1 text-xs sm:text-sm"
                          />
                          <input
                            type="number"
                            step="any"
                            placeholder="Lat"
                            value={editForm.base_location_lat}
                            onChange={(e) => setEditForm({ ...editForm, base_location_lat: e.target.value })}
                            className="w-full border rounded p-1 text-xs sm:text-sm"
                          />
                          <input
                            type="number"
                            step="any"
                            placeholder="Lon"
                            value={editForm.base_location_lon}
                            onChange={(e) => setEditForm({ ...editForm, base_location_lon: e.target.value })}
                            className="w-full border rounded p-1 text-xs sm:text-sm"
                          />
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium">{emp.base_location_name}</p>
                          <p className="text-sm text-gray-600">
                            {emp.base_location_lat}, {emp.base_location_lon}
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="p-4 space-x-2">
                      {editingEmployee === emp.id ? (
                        <>
                          <button
                            onClick={() => updateEmployee(emp.id, editForm)}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="bg-gray-500 text-white px-3 py-1 rounded text-sm"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditing(emp)}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setResetPasswordEmployee(emp)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                          >
                            Reset Password
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* RESET PASSWORD MODAL */}
        {resetPasswordEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-lg p-5 w-full max-w-md max-h-screen overflow-y-auto">
              <h3 className="text-xl font-semibold mb-4">Reset Password for {resetPasswordEmployee.name}</h3>
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border rounded-lg p-2 mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={resetPassword}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                >
                  Reset Password
                </button>
                <button
                  onClick={() => { setResetPasswordEmployee(null); setNewPassword(''); }}
                  className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= REPORTS ================= */}
        {activeTab === 'reports' && (
          <>
            {/* QUICK FILTERS */}
            <div className="bg-white p-4 rounded-2xl shadow mb-4">
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => {
                    const today = new Date();
                    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                    const nextFilters = {
                      ...filters,
                      start_date: toLocalDateInputValue(weekAgo),
                      end_date: toLocalDateInputValue(today)
                    };
                    setFilters(nextFilters);
                    fetchAttendanceReport(1, { filters: nextFilters });
                  }}
                  className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg transition"
                >
                  <Calendar size={16} />
                  This Week
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate() + 1);
                    const nextFilters = {
                      ...filters,
                      start_date: toLocalDateInputValue(monthAgo),
                      end_date: toLocalDateInputValue(today)
                    };
                    setFilters(nextFilters);
                    fetchAttendanceReport(1, { filters: nextFilters });
                  }}
                  className="flex items-center gap-2 bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg transition"
                >
                  <TrendingUp size={16} />
                  This Month
                </button>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
                <input className="border p-2 rounded text-sm" placeholder="Employee ID"
                  onChange={e => setFilters({ ...filters, employee_id: e.target.value })} />
                <select className="border p-2 rounded text-sm"
                  onChange={e => setFilters({ ...filters, shift: e.target.value })}>
                  <option value="">All Shifts</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="general">General</option>
                  <option value="01:00-09:30">01:00-09:30</option>
                  <option value="06:00-14:30">06:00-14:30</option>
                  <option value="08:00-16:30">08:00-16:30</option>
                  <option value="09:00-17:30">09:00-17:30</option>
                  <option value="10:00-18:00">10:00-18:00</option>
                  <option value="10:00-18:30">10:00-18:30</option>
                  <option value="14:00-22:30">14:00-22:30</option>
                  <option value="17:00-01:30">17:00-01:30</option>
                  <option value="21:00-05:30">21:00-05:30</option>
                  <option value="22:00-06:30">22:00-06:30</option>
                </select>
                <input type="date" className="border p-2 rounded text-sm"
                  onChange={e => setFilters({ ...filters, start_date: e.target.value })} />
                <input type="date" className="border p-2 rounded text-sm"
                  onChange={e => setFilters({ ...filters, end_date: e.target.value })} />
                <button onClick={fetchAttendanceReport} className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium col-span-1 xs:col-span-2 sm:col-span-1 whitespace-nowrap">
                  Filter
                </button>
              </div>
            </div>

            {/* CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* ATTENDANCE TREND CHART */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="text-blue-600" />
                  Attendance Trend
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getAttendanceTrendData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>

              {/* SHIFT DISTRIBUTION CHART */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="text-purple-600" />
                  Shift Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getShiftDistributionData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getShiftDistributionData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* LATE ATTENDANCE ALERTS */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6 mb-6"
            >
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="text-red-600" />
                Late Attendance Alerts
              </h3>
              <div className="space-y-3">
                {getLateAttendanceAlerts().map((alert, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle size={20} className="text-red-600" />
                      <div>
                        <p className="font-medium text-red-800">{alert.employee_id} - {alert.name}</p>
                        <p className="text-sm text-red-600">Late by {alert.lateMinutes} minutes on {new Date(alert.check_in_time).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className="text-red-600 font-semibold">{alert.shift}</span>
                  </div>
                ))}
                {getLateAttendanceAlerts().length === 0 && (
                  <p className="text-green-600 text-center py-4">No late attendance records found</p>
                )}
              </div>
            </motion.div>
          </>
        )}

        {/* ================= SETTINGS ================= */}
        {activeTab === 'settings' && (
          <div className="grid gap-6">
            {/* PROFILE UPDATE */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow p-6"
            >
              <h3 className="text-xl font-semibold mb-4">Update Profile</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="border rounded-lg p-2"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="border rounded-lg p-2"
                />
                <input
                  type="text"
                  placeholder="Mobile Number"
                  value={profileForm.mobile_number}
                  onChange={(e) => setProfileForm({ ...profileForm, mobile_number: e.target.value })}
                  className="border rounded-lg p-2"
                />
              </div>
              <button
                onClick={updateProfile}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Update Profile
              </button>
            </motion.div>

            {/* CHANGE PASSWORD */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow p-6"
            >
              <h3 className="text-xl font-semibold mb-4">Change Password</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <input
                  type="password"
                  placeholder="Current Password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  className="border rounded-lg p-2"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  className="border rounded-lg p-2"
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  className="border rounded-lg p-2"
                />
              </div>
              <motion.button
                onClick={changePassword}
                className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Change Password
              </motion.button>
            </motion.div>
          </div>
        )}

            {error && <motion.div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</motion.div>}
          </motion.div>
        </div>
      </div>

      {/* Password Reset Modal */}
      <AnimatePresence>
        {resetPasswordEmployee && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md border border-gray-100">
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">Reset Password</h3>
              <p className="text-gray-600 mb-4">for {resetPasswordEmployee.name}</p>
              <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4" />
              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={resetPassword} className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:shadow-lg transition">Reset Password</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setResetPasswordEmployee(null); setNewPassword(''); }} className="flex-1 px-4 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:shadow-lg transition">Cancel</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </div>
  );
};

export default AdminDashboard;
