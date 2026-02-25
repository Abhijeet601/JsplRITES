import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ListChecks, LogOut, User, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import Navbar from '../components/Navbar';

const toLocalDateInputValue = (dateObj = new Date()) => {
  const tzOffsetMs = dateObj.getTimezoneOffset() * 60000;
  return new Date(dateObj.getTime() - tzOffsetMs).toISOString().split('T')[0];
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [todayStatus, setTodayStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_attendance: 0,
    present_days: 0,
    absent_days: 0,
    average_hours: 0,
  });

  useEffect(() => {
    const fetchTodayStatus = async () => {
      try {
        const today = toLocalDateInputValue();
        const res = await api.get('/api/user/my-attendance', {
          params: { start_date: today, end_date: today }
        });
        if (res.data.attendance_records && res.data.attendance_records.length > 0) {
          const todayRecord = res.data.attendance_records.find(
            r => r.check_in_time && toLocalDateInputValue(new Date(r.check_in_time)) === today
          );
          
          if (todayRecord) {
            setTodayStatus(todayRecord);
          }

          // Calculate stats
          const records = res.data.attendance_records;
          const avgHours = records.length > 0 
            ? (records.reduce((sum, r) => sum + (r.work_hours || 0), 0) / records.length)
            : 0;

          setStats({
            total_attendance: records.length,
            present_days: records.filter(r => r.system_status === 'approved' || r.system_status === 'present').length,
            absent_days: records.filter(r => r.system_status === 'absent').length,
            average_hours: avgHours.toFixed(2),
          });
        }
      } catch (err) {
        console.error('Failed to fetch today status', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayStatus();

    const timer = setInterval(fetchTodayStatus, 30000);
    const onFocus = () => fetchTodayStatus();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-6xl mx-auto p-6">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl shadow-lg p-8 mb-6 text-white"
        >
          <h1 className="text-4xl font-bold mb-2">
            Welcome, {user.name || user.employee_id}!
          </h1>
          <p className="text-blue-100 flex items-center gap-2">
            <User size={18} />
            {user.employee_id} • Shift: {user.shift_time || 'Not Set'}
          </p>
        </motion.div>

        {/* TODAY'S STATUS */}
        {!loading && todayStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-l-4 border-blue-600"
          >
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Today's Status</h2>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Check-in</p>
                <p className="text-lg font-bold text-blue-600">
                  {todayStatus.check_in_time 
                    ? new Date(todayStatus.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                    : '—'
                  }
                </p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Check-out</p>
                <p className="text-lg font-bold text-green-600">
                  {todayStatus.check_out_time
                    ? new Date(todayStatus.check_out_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                    : '—'
                  }
                </p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Hours Worked</p>
                <p className="text-lg font-bold text-purple-600">
                  {todayStatus.work_hours ? todayStatus.work_hours.toFixed(2) : '—'} hrs
                </p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600">Status</p>
                <p className={`text-lg font-bold ${
                  todayStatus.system_status === 'approved' ? 'text-green-600' :
                  todayStatus.system_status === 'absent' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {todayStatus.system_status?.toUpperCase()}
                </p>
              </div>
            </div>
            {todayStatus.warning_message && (
              <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm">
                <span className="font-semibold">Warning:</span> {todayStatus.warning_message}
              </div>
            )}
          </motion.div>
        )}

        {/* STATISTICS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
        >
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Days</p>
                <p className="text-3xl font-bold text-blue-600">{stats.total_attendance}</p>
              </div>
              <Clock className="text-blue-600 opacity-20" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Present Days</p>
                <p className="text-3xl font-bold text-green-600">{stats.present_days}</p>
              </div>
              <TrendingUp className="text-green-600 opacity-20" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Absent Days</p>
                <p className="text-3xl font-bold text-red-600">{stats.absent_days}</p>
              </div>
              <AlertCircle className="text-red-600 opacity-20" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Hours</p>
                <p className="text-3xl font-bold text-purple-600">{stats.average_hours}h</p>
              </div>
              <Clock className="text-purple-600 opacity-20" size={40} />
            </div>
          </div>
        </motion.div>

        {/* ACTION CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* MARK ATTENDANCE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600
              rounded-2xl shadow-lg p-8 text-white relative overflow-hidden group"
          >
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform duration-300" />
            <Clock size={50} className="opacity-40 mb-4 relative z-10" />
            <h2 className="text-3xl font-bold mb-2 relative z-10">
              Mark Attendance
            </h2>
            <p className="text-blue-100 mb-6 relative z-10">
              Capture your face and location to mark attendance
            </p>

            <Link
              to="/attendance"
              className="inline-block bg-white text-blue-600 font-semibold
                px-8 py-3 rounded-xl shadow hover:bg-blue-50 transition relative z-10"
            >
              Go to Attendance
            </Link>
          </motion.div>

          {/* MY ATTENDANCE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-500 to-green-600
              rounded-2xl shadow-lg p-8 text-white relative overflow-hidden group"
          >
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform duration-300" />
            <ListChecks size={50} className="opacity-40 mb-4 relative z-10" />
            <h2 className="text-3xl font-bold mb-2 relative z-10">
              My Attendance History
            </h2>
            <p className="text-green-100 mb-6 relative z-10">
              View and track your attendance records
            </p>

            <Link
              to="/my-attendance"
              className="inline-block bg-white text-green-600 font-semibold
                px-8 py-3 rounded-xl shadow hover:bg-green-50 transition relative z-10"
            >
              View History
            </Link>
          </motion.div>

        </div>

        {/* LOGOUT */}
        <div className="mt-12 text-center">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2
              border border-red-300 text-red-600
              px-8 py-3 rounded-xl hover:bg-red-50 transition font-semibold"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
