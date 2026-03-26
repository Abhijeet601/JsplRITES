import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import Navbar from '../components/Navbar';

const normalizeDateFilters = (filters) => {
  const normalized = { ...filters };
  if (normalized.start_date && !normalized.end_date) normalized.end_date = normalized.start_date;
  if (normalized.end_date && !normalized.start_date) normalized.start_date = normalized.end_date;
  return normalized;
};

const badge = (value) => {
  const base = 'px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1';
  switch (value) {
    case 'Present':
      return `${base} bg-green-100 text-green-700`;
    case 'Minor Late':
      return `${base} bg-cyan-100 text-cyan-700`;
    case 'Late':
      return `${base} bg-amber-100 text-amber-700`;
    case 'Half Day':
      return `${base} bg-orange-100 text-orange-700`;
    case 'Full Day Leave':
      return `${base} bg-red-100 text-red-700`;
    case 'approved':
      return `${base} bg-green-100 text-green-700`;
    case 'pending':
      return `${base} bg-yellow-100 text-yellow-700`;
    case 'rejected':
    case 'flagged':
      return `${base} bg-red-100 text-red-700`;
    default:
      return `${base} bg-gray-100 text-gray-700`;
  }
};

const MyAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filters, setFilters] = useState({ start_date: '', end_date: '' });
  const { user } = useAuth();

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const params = {};
        const normalizedFilters = normalizeDateFilters(filters);
        if (normalizedFilters.start_date) params.start_date = normalizedFilters.start_date;
        if (normalizedFilters.end_date) params.end_date = normalizedFilters.end_date;

        const res = await api.get('/api/user/my-attendance', { params });
        setAttendanceRecords(res.data.attendance_records || []);
      } catch (err) {
        setError(err?.response?.data?.detail || 'Failed to fetch attendance records');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [filters]);

  if (!user) return null;

  const filteredRecords = attendanceRecords.filter((record) => {
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus || record.system_status === filterStatus;
    const matchesSearch = !searchTerm
      || record.id?.toString().includes(searchTerm)
      || new Date(record.check_in_time).toLocaleDateString().includes(searchTerm)
      || String(record.status || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: filteredRecords.length,
    activeEvents: filteredRecords.reduce((sum, r) => sum + Number(r.event_count || 0), 0),
    totalDeduction: filteredRecords.reduce((sum, r) => sum + Number(r.cl_deducted || 0), 0).toFixed(2),
    avgHours: filteredRecords.length
      ? (
          filteredRecords.reduce((sum, r) => sum + Number(r.total_hours || r.work_hours || 0), 0) / filteredRecords.length
        ).toFixed(2)
      : '0.00',
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-7xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl shadow-lg p-8 mb-6 text-white"
        >
          <h1 className="text-3xl font-bold mb-2">My Attendance</h1>
          <p className="text-blue-100">Track worked hours, weekly compensation, events, and deductions.</p>
        </motion.div>

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
            <p className="text-sm text-gray-600 mb-1">Active Events</p>
            <p className="text-3xl font-bold text-amber-600">{stats.activeEvents}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Leave Deducted</p>
            <p className="text-3xl font-bold text-red-600">{stats.totalDeduction}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Average Hours</p>
            <p className="text-3xl font-bold text-purple-600">{stats.avgHours}h</p>
          </div>
        </motion.div>

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
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by date, ID, status"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Minor Late">Minor Late</option>
              <option value="Late">Late</option>
              <option value="Half Day">Half Day</option>
              <option value="Full Day Leave">Full Day Leave</option>
            </select>

            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />

            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {loading ? (
            <div className="p-10 text-center text-gray-500 animate-pulse">Loading attendance records...</div>
          ) : error ? (
            <div className="p-10 text-center text-red-600 flex items-center justify-center gap-2">
              <AlertCircle size={18} />
              {error}
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-10 text-center text-gray-500">No attendance records found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {[
                      'Date',
                      'Check-in',
                      'Check-out',
                      'Hours',
                      'Deficit',
                      'Extra',
                      'Weekly Balance',
                      'Status',
                      'Events',
                      'CL Deducted',
                      'System',
                      'Admin',
                      'Policy Note',
                    ].map((header) => (
                      <th key={header} className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-500 font-semibold">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-blue-50 transition">
                      <td className="px-6 py-4 font-medium text-gray-700 whitespace-nowrap">
                        {record.check_in_time ? new Date(record.check_in_time).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.check_in_time
                          ? new Date(record.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.check_out_time
                          ? new Date(record.check_out_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                      <td className="px-6 py-4 font-medium whitespace-nowrap">{Number(record.total_hours || record.work_hours || 0).toFixed(2)}h</td>
                      <td className="px-6 py-4 whitespace-nowrap">{Number(record.deficit_hours || 0).toFixed(2)}h</td>
                      <td className="px-6 py-4 whitespace-nowrap">{Number(record.extra_hours || 0).toFixed(2)}h</td>
                      <td className="px-6 py-4 whitespace-nowrap">{Number(record.weekly_balance || 0).toFixed(2)}h</td>
                      <td className="px-6 py-4"><span className={badge(record.status)}>{record.status || 'Pending'}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap">{Number(record.event_count || 0)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{Number(record.cl_deducted || 0).toFixed(2)}</td>
                      <td className="px-6 py-4"><span className={badge(record.system_status)}>{(record.system_status || 'pending').toUpperCase()}</span></td>
                      <td className="px-6 py-4"><span className={badge(record.admin_status || 'pending')}>{(record.admin_status || 'pending').toUpperCase()}</span></td>
                      <td className="px-6 py-4 text-gray-600">{record.warning_message || '—'}</td>
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
