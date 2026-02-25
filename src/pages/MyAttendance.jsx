import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, AlertCircle, Download, Image as ImageIcon, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import Navbar from '../components/Navbar';

const normalizeDateFilters = (filters) => {
  const normalized = { ...filters };
  if (normalized.start_date && !normalized.end_date) normalized.end_date = normalized.start_date;
  if (normalized.end_date && !normalized.start_date) normalized.start_date = normalized.end_date;
  return normalized;
};

const MyAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filters, setFilters] = useState({ start_date: '', end_date: '' });
  const [selectedImages, setSelectedImages] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const { user } = useAuth();

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params = {};
      const normalizedFilters = normalizeDateFilters(filters);
      if (normalizedFilters.start_date) params.start_date = normalizedFilters.start_date;
      if (normalizedFilters.end_date) params.end_date = normalizedFilters.end_date;

      const res = await api.get('/api/user/my-attendance', { params });
      setAttendanceRecords(res.data.attendance_records);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [filters]);

  const getFilteredRecords = () => {
    let filtered = attendanceRecords;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.system_status === filterStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.id?.toString().includes(searchTerm) ||
        new Date(r.check_in_time).toLocaleDateString().includes(searchTerm)
      );
    }

    return filtered;
  };

  const badge = (status) => {
    const base = 'px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1';
    switch (status) {
      case 'approved':
      case 'present':
        return `${base} bg-green-100 text-green-700`;
      case 'pending':
        return `${base} bg-yellow-100 text-yellow-700`;
      case 'rejected':
      case 'flagged':
      case 'absent':
        return `${base} bg-red-100 text-red-700`;
      default:
        return `${base} bg-gray-100 text-gray-700`;
    }
  };

  const filteredRecords = getFilteredRecords();

  const stats = {
    total: filteredRecords.length,
    present: filteredRecords.filter(r => r.system_status === 'approved' || r.system_status === 'present').length,
    pending: filteredRecords.filter(r => r.system_status === 'pending').length,
    absent: filteredRecords.filter(r => r.system_status === 'absent').length,
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-7xl mx-auto p-6">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl shadow-lg p-8 mb-6 text-white"
        >
          <h1 className="text-3xl font-bold mb-2">
            My Attendance
          </h1>
          <p className="text-blue-100">
            View and track your attendance history
          </p>
        </motion.div>

        {/* STATISTICS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
        >
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Records</p>
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Present</p>
            <p className="text-3xl font-bold text-green-600">{stats.present}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Absent</p>
            <p className="text-3xl font-bold text-red-600">{stats.absent}</p>
          </div>
        </motion.div>

        {/* FILTERS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <h2 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
            <Search size={18} />
            Search & Filter
          </h2>

          <div className="grid md:grid-cols-4 gap-4">
            {/* SEARCH */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Search by Date or ID
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-lg border border-gray-300 px-4 py-2
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>

            {/* STATUS FILTER */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
              >
                <option value="all">All</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="absent">Absent</option>
              </select>
            </div>

            {/* START DATE */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="start_date"
                value={filters.start_date}
                onChange={(e) =>
                  setFilters({ ...filters, start_date: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  outline-none transition"
              />
            </div>

            {/* END DATE */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                End Date
              </label>
              <input
                type="date"
                name="end_date"
                value={filters.end_date}
                onChange={(e) =>
                  setFilters({ ...filters, end_date: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  outline-none transition"
              />
            </div>
          </div>
        </motion.div>

        {/* TABLE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {loading ? (
            <div className="p-10 text-center text-gray-500 animate-pulse">
              Loading attendance records...
            </div>
          ) : error ? (
            <div className="p-10 text-center text-red-600 flex items-center justify-center gap-2">
              <AlertCircle size={18} />
              {error}
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              No attendance records found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {[
                      'Date',
                      'Check-in',
                      'Check-out',
                      'Shift',
                      'Hours',
                      'System Status',
                      'Admin Status',
                      'Warning',
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-500 font-semibold"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filteredRecords.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-blue-50 transition"
                    >
                      <td className="px-6 py-4 font-medium text-gray-700 whitespace-nowrap">
                        {r.check_in_time
                          ? new Date(r.check_in_time).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        {r.check_in_time
                          ? new Date(r.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        {r.check_out_time
                          ? new Date(r.check_out_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{r.shift || '—'}</td>
                      <td className="px-6 py-4 font-medium whitespace-nowrap">
                        {r.work_hours ? `${r.work_hours.toFixed(2)}h` : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={badge(r.system_status)}>
                          {r.system_status?.toUpperCase() || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={badge(r.admin_status || 'pending')}>
                          {(r.admin_status || 'pending')?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {r.warning_message ? (
                          <span className="text-yellow-600 font-medium">{r.warning_message}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
};

export default MyAttendance;
