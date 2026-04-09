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

const APPROVAL_LOCATION_OPTIONS = [
  {
    name: 'Jindal Steel,Raigarh',
    lat: 21.933217202276783,
    lon: 83.34181839370518,
  },
];

const toLocalDateInputValue = (dateObj = new Date()) => {
  const tzOffsetMs = dateObj.getTimezoneOffset() * 60000;
  return new Date(dateObj.getTime() - tzOffsetMs).toISOString().split('T')[0];
};

const toDateTimeLocalValue = (value) => {
  if (!value) return '';
  const dateObj = new Date(value);
  const tzOffsetMs = dateObj.getTimezoneOffset() * 60000;
  return new Date(dateObj.getTime() - tzOffsetMs).toISOString().slice(0, 16);
};

const getDefaultReportFilters = () => {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    employee_select: '',
    employee_id: '',
    shift: '',
    start_date: toLocalDateInputValue(monthStart),
    end_date: toLocalDateInputValue(today),
  };
};

const TAB_META = {
  dashboard: {
    eyebrow: 'Command Center',
    title: 'Admin Dashboard',
    description: 'Track approvals, attendance flow, reports and employee management from one place.'
  },
  registrations: {
    eyebrow: 'Approvals',
    title: 'Pending Registrations',
    description: 'Review new employee submissions and assign validated work locations.'
  },
  attendance: {
    eyebrow: 'Monitoring',
    title: 'Attendance Control',
    description: 'Filter records, resolve pending punches and review employee punch history.'
  },
  employees: {
    eyebrow: 'Directory',
    title: 'Employee Management',
    description: 'Update employee profiles, locations and account access details.'
  },
  'monthly-report': {
    eyebrow: 'Exports',
    title: 'Monthly Reports',
    description: 'Generate Excel exports for attendance summaries by month.'
  },
  reports: {
    eyebrow: 'Analytics',
    title: 'Attendance Reports',
    description: 'Inspect attendance trends, policy events, status distribution, and weekly compensation.'
  },
  settings: {
    eyebrow: 'Security',
    title: 'Admin Settings',
    description: 'Maintain profile information and protect access credentials.'
  }
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
  const [deletingEmployeeId, setDeletingEmployeeId] = useState(null);
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
  const [selectedEmployeeReport, setSelectedEmployeeReport] = useState(null);
  const [reportOverview, setReportOverview] = useState({
    totalEmployees: 0,
    presentToday: 0,
    lateToday: 0,
    pendingApprovals: 0,
  });
  const [reportFilters, setReportFilters] = useState(getDefaultReportFilters());
  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSummary, setReportSummary] = useState({
    total_records: 0,
    total_employees: 0,
    today_attendance: {
      present_today: 0,
      late_today: 0,
    },
    selected_employee: null,
    selected_employee_summary: null,
  });
  const [reportPage, setReportPage] = useState(1);
  const [reportPageSize, setReportPageSize] = useState(100);
  const [reportTotalRecords, setReportTotalRecords] = useState(0);

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
  const [editingAttendanceId, setEditingAttendanceId] = useState(null);
  const [attendanceEditForm, setAttendanceEditForm] = useState({
    check_in_time: '',
    check_out_time: '',
    total_hours: '',
    shift: '',
  });

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

  const syncReportOverview = (summary) => {
    if (!summary) return;
    setReportOverview((prev) => ({
      totalEmployees: summary.total_employees || prev.totalEmployees,
      presentToday: summary.today_attendance?.present_today || 0,
      lateToday: summary.today_attendance?.late_today || 0,
      pendingApprovals: prev.pendingApprovals,
    }));
  };

  const normalizeReportFilters = (nextFilters) => {
    const normalized = { ...nextFilters };
    if (normalized.start_date && !normalized.end_date) {
      normalized.end_date = normalized.start_date;
    }
    if (normalized.end_date && !normalized.start_date) {
      normalized.start_date = normalized.end_date;
    }
    if (normalized.employee_select) {
      normalized.employee_id = normalized.employee_select;
    }
    return normalized;
  };

  const getEffectiveReportEmployeeId = (nextFilters) =>
    (nextFilters.employee_select || nextFilters.employee_id || '').trim();

  const getStorageUrl = (path) => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const normalizedPath = String(path).replace(/^\/+/, '');
    return `${api.defaults.baseURL}/${normalizedPath}`;
  };

  const applyApprovalLocation = (registration, locationName) => {
    const selectedLocation = APPROVAL_LOCATION_OPTIONS.find((option) => option.name === locationName);
    registration.baseLocationName = locationName;
    if (selectedLocation) {
      registration.baseLocationLat = selectedLocation.lat;
      registration.baseLocationLon = selectedLocation.lon;
      setPendingRegistrations((prev) => [...prev]);
    }
  };

  // Fetch data based on active tab
  useEffect(() => {
    if (activeTab === 'registrations') fetchPendingRegistrations();
    if (activeTab === 'attendance') {
      fetchAttendanceReport(1);
      fetchPendingAttendance();
    }
    if (activeTab === 'employees') fetchEmployees();
    if (activeTab === 'reports') {
      fetchEmployees();
      fetchPendingAttendance();
      fetchReports(1);
    }
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
    if (activeTab !== 'attendance' && activeTab !== 'dashboard' && activeTab !== 'reports') return undefined;
    const timer = setInterval(() => {
      if (activeTab === 'dashboard') {
        fetchTodayAttendance();
        fetchPendingAttendance();
      } else if (activeTab === 'attendance') {
        fetchAttendanceReport(attendancePage);
        fetchPendingAttendance();
      } else if (activeTab === 'reports') {
        fetchReports(reportPage);
        fetchPendingAttendance();
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [activeTab, attendancePage, attendancePageSize, filters, reportPage, reportPageSize, reportFilters]);

  const fetchPendingRegistrations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/pending-registrations');
      setPendingRegistrations(res.data.pending_users);
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to fetch pending registrations');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/pending-attendance');
      const nextPendingAttendance = res.data.pending_attendance || [];
      setPendingAttendance(nextPendingAttendance);
      setReportOverview((prev) => ({
        ...prev,
        pendingApprovals: nextPendingAttendance.length,
      }));
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to fetch pending attendance');
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
      syncReportOverview(res.data.summary);
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to fetch attendance report');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async (page = reportPage, overrides = {}) => {
    setReportLoading(true);
    setError('');
    try {
      const effectiveFilters = normalizeReportFilters(
        overrides.filters ? { ...reportFilters, ...overrides.filters } : reportFilters
      );
      const effectivePageSize = overrides.pageSize ?? reportPageSize;
      const params = {
        page,
        page_size: effectivePageSize,
      };
      const effectiveEmployeeId = getEffectiveReportEmployeeId(effectiveFilters);
      if (effectiveEmployeeId) params.employee_id = effectiveEmployeeId;
      if (effectiveFilters.shift) params.shift = effectiveFilters.shift;
      if (effectiveFilters.start_date) params.start_date = effectiveFilters.start_date;
      if (effectiveFilters.end_date) params.end_date = effectiveFilters.end_date;

      const res = await api.get('/api/admin/attendance-report', { params });
      setReportData(res.data.attendance_data || []);
      setReportTotalRecords(res.data.total_records || 0);
      setReportPage(res.data.page || page);
      setReportSummary(res.data.summary || {
        total_records: 0,
        total_employees: 0,
        today_attendance: { present_today: 0, late_today: 0 },
        selected_employee: null,
        selected_employee_summary: null,
      });
      setSelectedEmployeeReport(res.data.summary?.selected_employee || null);
      syncReportOverview(res.data.summary);
    } catch (e) {
      const detail = e?.response?.data?.detail || 'Failed to fetch attendance report';
      setError(detail);
      showToast(detail, 'error');
    } finally {
      setReportLoading(false);
    }
  };

  const applyReportFilters = async (nextFilters = {}, options = {}) => {
    const mergedFilters = normalizeReportFilters({ ...reportFilters, ...nextFilters });
    const nextPage = options.page ?? 1;
    const nextPageSize = options.pageSize ?? reportPageSize;
    const effectiveEmployeeId = getEffectiveReportEmployeeId(mergedFilters);

    setReportFilters(mergedFilters);
    setReportPage(nextPage);
    if (options.pageSize) {
      setReportPageSize(nextPageSize);
    }
    if (!effectiveEmployeeId) {
      setSelectedEmployeeReport(null);
      setReportSummary((prev) => ({
        ...prev,
        selected_employee: null,
        selected_employee_summary: null,
      }));
    }

    await fetchReports(nextPage, {
      filters: mergedFilters,
      pageSize: nextPageSize,
    });
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
      syncReportOverview(res.data.summary);
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to fetch today attendance');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/employees');
      const nextEmployees = res.data.employees || [];
      setEmployees(nextEmployees);
      setReportOverview((prev) => ({
        ...prev,
        totalEmployees: nextEmployees.length,
      }));
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const updateEmployee = async (employeeId, updatedData) => {
    try {
      const payload = {
        ...updatedData,
        base_location_lat: updatedData.base_location_lat === '' ? null : Number(updatedData.base_location_lat),
        base_location_lon: updatedData.base_location_lon === '' ? null : Number(updatedData.base_location_lon),
      };
      await api.put(`/api/admin/employees/${employeeId}`, payload);
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
      showToast('Employee profile updated', 'success');
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to update employee');
      showToast('Failed to update employee', 'error');
    }
  };

  const deleteEmployee = async (employee) => {
    const confirmed = window.confirm(`Delete employee ${employee.name} (${employee.employee_id})? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setDeletingEmployeeId(employee.id);
      await api.delete(`/api/admin/employees/${employee.id}`);
      setEmployees((prev) => prev.filter((e) => e.id !== employee.id));
      if (editingEmployee === employee.id) {
        cancelEditing();
      }
      showToast('Employee deleted successfully', 'success');
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to delete employee');
      showToast('Failed to delete employee', 'error');
    } finally {
      setDeletingEmployeeId(null);
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

  const startAttendanceEdit = (attendance) => {
    setEditingAttendanceId(attendance.id);
    setAttendanceEditForm({
      check_in_time: toDateTimeLocalValue(attendance.check_in_time),
      check_out_time: toDateTimeLocalValue(attendance.check_out_time),
      total_hours: attendance.total_hours ?? attendance.work_hours ?? '',
      shift: attendance.shift || 'general',
    });
  };

  const cancelAttendanceEdit = () => {
    setEditingAttendanceId(null);
    setAttendanceEditForm({
      check_in_time: '',
      check_out_time: '',
      total_hours: '',
      shift: '',
    });
  };

  const saveAttendanceEdit = async (attendanceId) => {
    try {
      const payload = {
        check_in_time: attendanceEditForm.check_in_time || null,
        check_out_time: attendanceEditForm.check_out_time || null,
        total_hours: attendanceEditForm.total_hours === '' ? null : Number(attendanceEditForm.total_hours),
        shift: attendanceEditForm.shift || 'general',
      };
      await api.put(`/api/admin/attendance/${attendanceId}`, payload);
      cancelAttendanceEdit();
      fetchPendingAttendance();
      fetchAttendanceReport(attendancePage);
      showToast('Attendance updated successfully', 'success');
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to update attendance');
      showToast('Failed to update attendance', 'error');
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

  const openEmployeeReport = async (employee) => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    setSelectedEmployeeReport(employee);
    setActiveTab('reports');
    await applyReportFilters({
      employee_select: employee.employee_id,
      employee_id: employee.employee_id,
      shift: '',
      start_date: toLocalDateInputValue(monthStart),
      end_date: toLocalDateInputValue(today),
    });
  };

  const closeEmployeeReport = () => {
    setSelectedEmployeeReport(null);
    setReportSummary((prev) => ({
      ...prev,
      selected_employee: null,
      selected_employee_summary: null,
    }));
  };

  // Helper functions for charts and alerts
  const getAttendanceTrendData = () => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = toLocalDateInputValue(date);
      const dayRecords = reportData.filter(r =>
        r.check_in_time && r.check_in_time.startsWith(dateStr)
      );
      const present = dayRecords.filter(r => r.status === 'Present' || r.status === 'Minor Late').length;
      const events = dayRecords.filter(r => Number(r.event_count || 0) > 0).length;
      last7Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        present,
        events
      });
    }
    return last7Days;
  };

  const getShiftDistributionData = () => {
    const shifts = {};
    reportData.forEach(r => {
      const label = r.status || 'Pending';
      shifts[label] = (shifts[label] || 0) + 1;
    });
    return Object.entries(shifts).map(([shift, count]) => ({
      name: shift.toUpperCase(),
      value: count
    }));
  };

  const getLateAttendanceAlerts = () => {
    return reportData
      .filter(r => {
        if (!r.check_in_time) return false;
        return Number(r.event_count || 0) > 0 || Number(r.deficit_hours || 0) > 0;
      })
      .map(r => {
        return {
          ...r,
          deficitHours: Number(r.deficit_hours || 0).toFixed(2)
        };
      })
      .slice(0, 10);
  };

  const getLateTodayCount = () => {
    return reportOverview.lateToday;
  };

  const selectedReportEmployee = reportSummary.selected_employee || selectedEmployeeReport;
  const selectedEmployeeSummary = reportSummary.selected_employee_summary || {
    present_days: 0,
    approved_days: 0,
    pending_or_rejected_days: 0,
    total_worked_hours: 0,
  };
  const reportTotalPages = Math.max(1, Math.ceil(reportTotalRecords / reportPageSize));

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

  const SectionIntro = ({ eyebrow, title, description, badge }) => (
    <div className="relative overflow-hidden rounded-[28px] border border-cyan-100 bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.18),_transparent_34%),linear-gradient(135deg,#ffffff_0%,#f3f9ff_55%,#eef8f7_100%)] p-6 sm:p-8 shadow-lg">
      <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-cyan-200/30 blur-3xl" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">{eyebrow}</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600">{description}</p>
        </div>
        {badge && (
          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-700 shadow-sm">
            {badge}
          </div>
        )}
      </div>
    </div>
  );

  const SurfaceCard = ({ className = '', children }) => (
    <div className={`rounded-3xl border border-slate-200/80 bg-white/90 shadow-lg shadow-slate-200/40 backdrop-blur ${className}`}>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#edf7ff_0%,#f7fafc_32%,#f2f8f7_100%)]">
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

            <div className="mb-6">
              <SectionIntro
                eyebrow={TAB_META[activeTab]?.eyebrow || 'Admin'}
                title={TAB_META[activeTab]?.title || 'Admin Panel'}
                description={TAB_META[activeTab]?.description || 'Manage the application from this workspace.'}
                badge={
                  <>
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Signed in as <span className="font-semibold">{user?.name || user?.employee_id}</span>
                  </>
                }
              />
            </div>

            {/* Dashboard Home */}
            {activeTab === 'dashboard' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="mb-8 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
                  <SurfaceCard className="p-6 sm:p-7">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-sm font-medium text-cyan-700">Today&apos;s operating summary</p>
                        <h2 className="mt-2 text-2xl font-bold text-slate-900">Welcome back, {user.name}</h2>
                        <p className="mt-2 max-w-xl text-sm text-slate-600">
                          Review workforce movement, clear pending items and export daily records from a single dashboard.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="text-slate-500">Pending registrations</p>
                          <p className="mt-1 text-xl font-semibold text-slate-900">{pendingRegistrations.length}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="text-slate-500">Pending attendance</p>
                          <p className="mt-1 text-xl font-semibold text-slate-900">{pendingAttendance.length}</p>
                        </div>
                      </div>
                    </div>
                  </SurfaceCard>

                  <SurfaceCard className="overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-900 via-cyan-900 to-teal-800 p-6 text-white">
                      <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">Quick Daily Report</p>
                      <p className="mt-2 text-lg font-semibold">Download attendance by date</p>
                    </div>
                    <div className="p-6">
                      <label className="mb-2 block text-sm font-medium text-slate-700">Select Date</label>
                      <input
                        type="date"
                        value={dailyReportDate}
                        onChange={(e) => setDailyReportDate(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                      />
                      <button
                        onClick={downloadDailyReport}
                        disabled={downloadingDaily}
                        className="mt-4 w-full rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-200 transition hover:from-cyan-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500"
                      >
                        {downloadingDaily ? 'Downloading...' : 'Download Daily Report'}
                      </button>
                    </div>
                  </SurfaceCard>
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
                    label="Events / Deficits Today"
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

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white/90 rounded-3xl shadow-lg p-6 border border-slate-200 cursor-pointer"
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
                    className="bg-white/90 rounded-3xl shadow-lg p-6 border border-slate-200 cursor-pointer"
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
                    Download the monthly 8-hour policy summary in Excel for any month and year.
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
                    {reg.face_image_path && (
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Registered Face</p>
                        <img
                          src={getStorageUrl(reg.face_image_path)}
                          alt={`${reg.name} face`}
                          className="w-36 h-36 rounded-lg border border-gray-300 object-cover"
                        />
                      </div>
                    )}
                    {reg.document_path && (
                      <a
                        href={getStorageUrl(reg.document_path)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        View Uploaded Document
                      </a>
                    )}
                  </div>

                  <div className="space-y-2">
                    <select
                      className="w-full border rounded-lg p-2 text-sm bg-white"
                      value={reg.baseLocationName || ''}
                      onChange={(e) => applyApprovalLocation(reg, e.target.value)}
                    >
                      <option value="">Select location</option>
                      {APPROVAL_LOCATION_OPTIONS.map((option) => (
                        <option key={option.name} value={option.name}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                    <input
                      placeholder="Latitude"
                      type="number"
                      step="any"
                      value={reg.baseLocationLat || ''}
                      className="w-full border rounded-lg p-2 text-sm"
                      onChange={e => reg.baseLocationLat = e.target.value}
                    />
                    <input
                      placeholder="Longitude"
                      type="number"
                      step="any"
                      value={reg.baseLocationLon || ''}
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
            <SurfaceCard className="p-4 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                <input
                  className="border p-2 rounded text-sm"
                  placeholder="Employee ID"
                  value={filters.employee_id}
                  onChange={e => setFilters({ ...filters, employee_id: e.target.value })}
                />
                <input
                  className="border p-2 rounded text-sm"
                  placeholder="Shift / roster"
                  value={filters.shift}
                  onChange={e => setFilters({ ...filters, shift: e.target.value })}
                />
                <input
                  className="border p-2 rounded text-sm"
                  placeholder="Plant"
                  value={filters.plant || ''}
                  onChange={e => setFilters({ ...filters, plant: e.target.value })}
                />
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
                <button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const res = await api.post('/api/admin/process-weekly-attendance');
                      showToast('Weekly attendance processed successfully', 'success');
                      fetchAttendanceReport(1);
                      console.log('Weekly process result', res.data);
                    } catch (e) {
                      showToast(e?.response?.data?.detail || 'Weekly process failed', 'error');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="bg-indigo-600 text-white px-3 py-2 rounded text-sm font-medium whitespace-nowrap"
                >
                  Process Weekly
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
            </SurfaceCard>

            {/* Attendance Records Table */}
            <SurfaceCard className="overflow-hidden">
            <div className="overflow-x-auto -mx-3 sm:-mx-4 md:mx-0 md:rounded-2xl">
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
                    <th className="p-2 sm:p-4 text-left whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-gray-500">Loading attendance records...</td>
                    </tr>
                  )}
                  {!loading && attendanceReport.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-gray-500">No attendance records found for selected filters.</td>
                    </tr>
                  )}
                  {!loading && attendanceReport.map(att => (
                    <tr key={att.id} className="border-t hover:bg-gray-50">
                      <td className="p-2 sm:p-4">{att.employee_id}</td>
                      <td className="p-2 sm:p-4">{att.name}</td>
                      <td className="p-2 sm:p-4 text-xs sm:text-sm">
                        {editingAttendanceId === att.id ? (
                          <input
                            type="datetime-local"
                            value={attendanceEditForm.check_in_time}
                            onChange={(e) => setAttendanceEditForm({ ...attendanceEditForm, check_in_time: e.target.value })}
                            className="w-full border rounded p-1"
                          />
                        ) : att.check_in_time ? new Date(att.check_in_time).toLocaleString() : 'N/A'}
                      </td>
                      <td className="p-2 sm:p-4 text-xs sm:text-sm">
                        {editingAttendanceId === att.id ? (
                          <input
                            type="datetime-local"
                            value={attendanceEditForm.check_out_time}
                            onChange={(e) => setAttendanceEditForm({ ...attendanceEditForm, check_out_time: e.target.value })}
                            className="w-full border rounded p-1"
                          />
                        ) : att.check_out_time ? new Date(att.check_out_time).toLocaleString() : 'Not checked out'}
                      </td>
                      <td className="p-2 sm:p-4">
                        {editingAttendanceId === att.id ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={attendanceEditForm.total_hours}
                            onChange={(e) => setAttendanceEditForm({ ...attendanceEditForm, total_hours: e.target.value })}
                            className="w-24 border rounded p-1"
                          />
                        ) : Number(att.total_hours ?? att.work_hours ?? 0).toFixed(2)}
                      </td>
                      <td className="p-2 sm:p-4">
                        {editingAttendanceId === att.id ? (
                          <input
                            type="text"
                            value={attendanceEditForm.shift}
                            onChange={(e) => setAttendanceEditForm({ ...attendanceEditForm, shift: e.target.value })}
                            className="w-28 border rounded p-1"
                          />
                        ) : att.shift || 'N/A'}
                      </td>
                      <td className="p-2 sm:p-4">{att.system_status || 'N/A'}</td>
                      <td className="p-2 sm:p-4">{att.admin_status || 'pending'}</td>
                      <td className="p-2 sm:p-4">
                        {editingAttendanceId === att.id ? (
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => saveAttendanceEdit(att.id)}
                              className="bg-green-500 text-white px-3 py-1 rounded text-xs sm:text-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelAttendanceEdit}
                              className="bg-gray-500 text-white px-3 py-1 rounded text-xs sm:text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startAttendanceEdit(att)}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-xs sm:text-sm"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </SurfaceCard>

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
            <SurfaceCard className="overflow-hidden">
            <div className="overflow-x-auto -mx-3 sm:-mx-4 md:mx-0 md:rounded-2xl">
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
            </SurfaceCard>
          </motion.div>
        )}

        {/* ================= EMPLOYEES ================= */}
        {activeTab === 'employees' && (
          <SurfaceCard className="overflow-hidden">
          <div className="overflow-x-auto">
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
                            onClick={() => deleteEmployee(emp)}
                            disabled={deletingEmployeeId === emp.id}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm disabled:opacity-60"
                          >
                            {deletingEmployeeId === emp.id ? 'Deleting...' : 'Delete'}
                          </button>
                          <button
                            onClick={() => setResetPasswordEmployee(emp)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                          >
                            Reset Password
                          </button>
                          <button
                            onClick={() => openEmployeeReport(emp)}
                            className="bg-emerald-600 text-white px-3 py-1 rounded text-sm"
                          >
                            View Report
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </SurfaceCard>
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-600 p-6 text-white shadow-lg">
                <p className="text-sm text-blue-100">Total Employees</p>
                <p className="mt-2 text-4xl font-bold">{reportOverview.totalEmployees}</p>
                <Users className="absolute right-5 top-5 opacity-30" size={36} />
              </div>
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-green-600 p-6 text-white shadow-lg">
                <p className="text-sm text-emerald-100">Present Today</p>
                <p className="mt-2 text-4xl font-bold">{reportOverview.presentToday}</p>
                <Calendar className="absolute right-5 top-5 opacity-30" size={36} />
              </div>
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white shadow-lg">
                <p className="text-sm text-amber-100">Late Today</p>
                <p className="mt-2 text-4xl font-bold">{reportOverview.lateToday}</p>
                <AlertTriangle className="absolute right-5 top-5 opacity-30" size={36} />
              </div>
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 p-6 text-white shadow-lg">
                <p className="text-sm text-violet-100">Pending Approvals</p>
                <p className="mt-2 text-4xl font-bold">{reportOverview.pendingApprovals}</p>
                <Clock className="absolute right-5 top-5 opacity-30" size={36} />
              </div>
            </div>

            <SurfaceCard className="p-4 md:p-6">
              <div className="flex flex-wrap gap-3 mb-4">
                <button
                  onClick={() => {
                    const today = new Date();
                    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                    applyReportFilters({
                      start_date: toLocalDateInputValue(weekAgo),
                      end_date: toLocalDateInputValue(today),
                    });
                  }}
                  className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg transition"
                >
                  <Calendar size={16} />
                  This Week
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                    applyReportFilters({
                      start_date: toLocalDateInputValue(monthStart),
                      end_date: toLocalDateInputValue(today),
                    });
                  }}
                  className="flex items-center gap-2 bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg transition"
                >
                  <TrendingUp size={16} />
                  This Month
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
                <select
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                  value={reportFilters.employee_select}
                  onChange={(e) => {
                    const nextEmployeeId = e.target.value;
                    setSelectedEmployeeReport(
                      employees.find((emp) => emp.employee_id === nextEmployeeId) || null
                    );
                    applyReportFilters({
                      employee_select: nextEmployeeId,
                      employee_id: nextEmployeeId,
                    });
                  }}
                >
                  <option value="">All employees</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.employee_id}>
                      {employee.name} ({employee.employee_id})
                    </option>
                  ))}
                </select>

                <input
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  placeholder="Search Employee ID"
                  value={reportFilters.employee_id}
                  onChange={(e) => setReportFilters((prev) => ({
                    ...prev,
                    employee_id: e.target.value,
                    employee_select: prev.employee_select === e.target.value ? prev.employee_select : '',
                  }))}
                />

                <select
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                  value={reportFilters.shift}
                  onChange={(e) => setReportFilters((prev) => ({ ...prev, shift: e.target.value }))}
                >
                  <option value="">All shifts</option>
                  <option value="general">General</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>

                <input
                  type="date"
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  value={reportFilters.start_date}
                  onChange={(e) => setReportFilters((prev) => ({ ...prev, start_date: e.target.value }))}
                />

                <input
                  type="date"
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  value={reportFilters.end_date}
                  onChange={(e) => setReportFilters((prev) => ({ ...prev, end_date: e.target.value }))}
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => applyReportFilters(reportFilters, { page: 1 })}
                    className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Filter
                  </button>
                  <button
                    onClick={() => {
                      const defaults = getDefaultReportFilters();
                      setSelectedEmployeeReport(null);
                      applyReportFilters(defaults, { page: 1 });
                    }}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-600">
                <div>
                  Showing page <span className="font-semibold text-slate-900">{reportPage}</span> of{' '}
                  <span className="font-semibold text-slate-900">{reportTotalPages}</span> with{' '}
                  <span className="font-semibold text-slate-900">{reportTotalRecords}</span> filtered records.
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="report-page-size">Rows</label>
                  <select
                    id="report-page-size"
                    className="border border-slate-200 rounded-lg px-2 py-1 bg-white"
                    value={reportPageSize}
                    onChange={(e) => {
                      const size = Number(e.target.value);
                      setReportPageSize(size);
                      applyReportFilters(reportFilters, { page: 1, pageSize: size });
                    }}
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={500}>500</option>
                  </select>
                </div>
              </div>
            </SurfaceCard>

            {selectedReportEmployee && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-lg"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-600">Individual Report</p>
                    <h3 className="mt-1 text-2xl font-bold text-slate-900">{selectedReportEmployee.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Employee ID: <span className="font-semibold">{selectedReportEmployee.employee_id}</span>
                      {' '}| Email: <span className="font-semibold">{selectedReportEmployee.email || 'Not available'}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      closeEmployeeReport();
                      applyReportFilters({
                        employee_select: '',
                        employee_id: '',
                      });
                    }}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Clear Selection
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Present Days</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{selectedEmployeeSummary.present_days}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Approved Days</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{selectedEmployeeSummary.approved_days}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Pending / Rejected Days</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{selectedEmployeeSummary.pending_or_rejected_days}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Total Worked Hours</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{Number(selectedEmployeeSummary.total_worked_hours || 0).toFixed(2)}</p>
                  </div>
                </div>

                <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full min-w-max text-sm">
                    <thead className="bg-slate-900 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Check-in</th>
                        <th className="px-4 py-3 text-left">Check-out</th>
                        <th className="px-4 py-3 text-left">Hours</th>
                        <th className="px-4 py-3 text-left">Shift</th>
                        <th className="px-4 py-3 text-left">System Status</th>
                        <th className="px-4 py-3 text-left">Admin Status</th>
                        <th className="px-4 py-3 text-left">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportLoading && (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-slate-500">Loading employee report...</td>
                        </tr>
                      )}
                      {!reportLoading && reportData.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-slate-500">No attendance records found for this employee.</td>
                        </tr>
                      )}
                      {!reportLoading && reportData.map((record) => (
                        <tr key={`employee-report-${record.id}`} className="border-t border-slate-200 hover:bg-slate-50">
                          <td className="px-4 py-3">{record.check_in_time ? new Date(record.check_in_time).toLocaleDateString() : 'N/A'}</td>
                          <td className="px-4 py-3">{record.check_in_time ? new Date(record.check_in_time).toLocaleString() : 'N/A'}</td>
                          <td className="px-4 py-3">{record.check_out_time ? new Date(record.check_out_time).toLocaleString() : 'Not checked out'}</td>
                          <td className="px-4 py-3">{Number(record.total_hours ?? record.work_hours ?? 0).toFixed(2)}</td>
                          <td className="px-4 py-3">{record.shift || 'N/A'}</td>
                          <td className="px-4 py-3">{record.system_status || 'N/A'}</td>
                          <td className="px-4 py-3">{record.admin_status || 'pending'}</td>
                          <td className="px-4 py-3">{record.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-lg p-6 border border-slate-200"
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
                    <Line type="monotone" dataKey="events" stroke="#f59e0b" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-3xl shadow-lg p-6 border border-slate-200"
              >
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="text-purple-600" />
                  Status Distribution
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-lg p-6 border border-slate-200"
            >
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="text-red-600" />
                Policy Alerts
              </h3>
              <div className="space-y-3">
                {getLateAttendanceAlerts().map((alert, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle size={20} className="text-red-600" />
                      <div>
                        <p className="font-medium text-red-800">{alert.employee_id} - {alert.name}</p>
                        <p className="text-sm text-red-600">
                          Deficit {alert.deficitHours} hour(s) on {new Date(alert.check_in_time).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-red-600 font-semibold">{alert.status || 'Flagged'}</span>
                  </div>
                ))}
                {!reportLoading && getLateAttendanceAlerts().length === 0 && (
                  <p className="text-green-600 text-center py-4">No active policy alerts found</p>
                )}
              </div>
            </motion.div>

            {!selectedReportEmployee && (
              <>
                <SurfaceCard className="overflow-hidden">
                  <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
                    <h3 className="text-lg font-semibold text-slate-900">Filtered Attendance Report</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Summary cards stay accurate because totals come from the backend summary, not just the current page.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-max text-sm">
                      <thead className="bg-gradient-to-r from-slate-900 to-slate-700 text-white">
                        <tr>
                          <th className="px-4 py-3 text-left">Emp ID</th>
                          <th className="px-4 py-3 text-left">Name</th>
                          <th className="px-4 py-3 text-left">Date</th>
                          <th className="px-4 py-3 text-left">Check-in</th>
                          <th className="px-4 py-3 text-left">Check-out</th>
                          <th className="px-4 py-3 text-left">Hours</th>
                          <th className="px-4 py-3 text-left">Shift</th>
                          <th className="px-4 py-3 text-left">System Status</th>
                          <th className="px-4 py-3 text-left">Admin Status</th>
                          <th className="px-4 py-3 text-left">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportLoading && (
                          <tr>
                            <td colSpan={10} className="px-4 py-8 text-center text-slate-500">Loading attendance report...</td>
                          </tr>
                        )}
                        {!reportLoading && reportData.length === 0 && (
                          <tr>
                            <td colSpan={10} className="px-4 py-8 text-center text-slate-500">No attendance records found for the selected filters.</td>
                          </tr>
                        )}
                        {!reportLoading && reportData.map((record) => (
                          <tr key={record.id} className="border-t border-slate-200 hover:bg-slate-50">
                            <td className="px-4 py-3">{record.employee_id}</td>
                            <td className="px-4 py-3">{record.name}</td>
                            <td className="px-4 py-3">{record.check_in_time ? new Date(record.check_in_time).toLocaleDateString() : 'N/A'}</td>
                            <td className="px-4 py-3">{record.check_in_time ? new Date(record.check_in_time).toLocaleString() : 'N/A'}</td>
                            <td className="px-4 py-3">{record.check_out_time ? new Date(record.check_out_time).toLocaleString() : 'Not checked out'}</td>
                            <td className="px-4 py-3">{Number(record.total_hours ?? record.work_hours ?? 0).toFixed(2)}</td>
                            <td className="px-4 py-3">{record.shift || 'N/A'}</td>
                            <td className="px-4 py-3">{record.system_status || 'N/A'}</td>
                            <td className="px-4 py-3">{record.admin_status || 'pending'}</td>
                            <td className="px-4 py-3">{record.remarks || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SurfaceCard>

                <div className="flex items-center justify-end gap-2">
                  <button
                    disabled={reportPage <= 1 || reportLoading}
                    onClick={() => fetchReports(reportPage - 1, { filters: reportFilters })}
                    className="px-3 py-1 rounded border disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {reportPage} of {reportTotalPages}
                  </span>
                  <button
                    disabled={reportPage >= reportTotalPages || reportLoading}
                    onClick={() => fetchReports(reportPage + 1, { filters: reportFilters })}
                    className="px-3 py-1 rounded border disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ================= SETTINGS ================= */}
        {activeTab === 'settings' && (
          <div className="grid gap-6">
            {/* PROFILE UPDATE */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow p-6 border border-slate-200"
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
              className="bg-white rounded-3xl shadow p-6 border border-slate-200"
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
