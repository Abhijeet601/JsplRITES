import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, LogIn, LogOut, TrendingUp, User, BadgeCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [todayStatus, setTodayStatus] = useState(null);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_attendance: 0,
    present_days: 0,
    absent_days: 0,
    average_hours: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [{ data: todayData }, { data: weeklyData }, { data: allData }] = await Promise.all([
          api.get('/api/user/today-summary'),
          api.get('/api/user/weekly-summary'),
          api.get('/api/user/my-attendance'),
        ]);

        setTodayStatus(todayData?.today_summary || null);
        setWeeklySummary(weeklyData?.weekly_summary || null);

        const records = allData.attendance_records || [];
        const workedRecords = records.filter((r) => typeof r.total_hours === 'number' || typeof r.work_hours === 'number');
        const avgHours = workedRecords.length > 0
          ? workedRecords.reduce((sum, r) => sum + Number(r.total_hours ?? r.work_hours ?? 0), 0) / workedRecords.length
          : 0;

        setStats({
          total_attendance: records.length,
          present_days: records.filter((r) => r.status === 'Present' || r.status === 'Minor Late').length,
          absent_days: records.filter((r) => r.status === 'Full Day Leave').length,
          average_hours: avgHours.toFixed(2),
        });
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const timer = setInterval(fetchDashboardData, 30000);
    const onFocus = () => fetchDashboardData();
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

  const attendanceState = todayStatus?.punch_state === 'checked_out'
    ? 'completed'
    : todayStatus?.punch_state === 'checked_in'
      ? 'check_out'
      : 'check_in';

  const actionCard = {
    check_in: {
      title: 'Ready for Check-In',
      description: 'You have not checked in yet. Tap below to start your working day.',
      buttonLabel: 'Open Check-In',
      icon: LogIn,
      cardClass: 'bg-gradient-to-br from-emerald-500 to-green-600',
      buttonClass: 'bg-white text-emerald-700 hover:bg-emerald-50',
      statusText: 'Not Checked In',
    },
    check_out: {
      title: 'Ready for Check-Out',
      description: 'Your check-in is already recorded. Tap below to complete check-out.',
      buttonLabel: 'Open Check-Out',
      icon: LogOut,
      cardClass: 'bg-gradient-to-br from-red-500 to-rose-600',
      buttonClass: 'bg-white text-red-700 hover:bg-red-50',
      statusText: 'Checked In, Check-Out Pending',
    },
    completed: {
      title: 'Attendance Completed',
      description: 'Today’s check-in and check-out are both done.',
      buttonLabel: 'View Attendance Status',
      icon: BadgeCheck,
      cardClass: 'bg-gradient-to-br from-slate-600 to-slate-700',
      buttonClass: 'bg-white text-slate-700 hover:bg-slate-50',
      statusText: 'Checked In and Checked Out',
    },
  }[attendanceState];

  const ActionIcon = actionCard.icon;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-6xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl shadow-lg p-8 mb-6 text-white"
        >
          <h1 className="text-4xl font-bold mb-2">Welcome, {user.name || user.employee_id}!</h1>
          <p className="text-blue-100 flex items-center gap-2">
            <User size={18} />
            {user.employee_id} | 8-hour attendance policy active
          </p>
        </motion.div>

        {!loading && todayStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-l-4 border-blue-600"
          >
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Today's Status</h2>
            <div className="grid md:grid-cols-6 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Check-in</p>
                <p className="text-lg font-bold text-blue-600">
                  {todayStatus.check_in_time
                    ? new Date(todayStatus.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Check-out</p>
                <p className="text-lg font-bold text-green-600">
                  {todayStatus.check_out_time
                    ? new Date(todayStatus.check_out_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">{todayStatus.live ? 'Live Hours' : 'Hours Worked'}</p>
                <p className="text-lg font-bold text-purple-600">
                  {Number(todayStatus.total_hours || 0).toFixed(2)} hrs
                </p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Deficit</p>
                <p className="text-lg font-bold text-red-600">{Number(todayStatus.deficit_hours || 0).toFixed(2)} hrs</p>
              </div>
              <div className="text-center p-3 bg-teal-50 rounded-lg">
                <p className="text-sm text-gray-600">Extra</p>
                <p className="text-lg font-bold text-teal-600">{Number(todayStatus.extra_hours || 0).toFixed(2)} hrs</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600">Status</p>
                <p className={`text-lg font-bold ${
                  todayStatus.status === 'Present' ? 'text-green-600'
                    : todayStatus.status === 'Full Day Leave' ? 'text-red-600'
                      : 'text-orange-600'
                }`}>
                  {todayStatus.status || '—'}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4 mt-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-gray-600">Weekly Balance</p>
                <p className="text-lg font-bold text-indigo-600">{weeklySummary?.weekly_balance?.toFixed(2) || '0.00'} hrs</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-gray-600">Active Weekly Events</p>
                <p className="text-lg font-bold text-indigo-600">{weeklySummary?.event_count || 0}</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-gray-600">Raw Event Days</p>
                <p className="text-lg font-bold text-amber-600">{weeklySummary?.raw_event_days || 0}</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-gray-600">Leave Deducted</p>
                <p className="text-lg font-bold text-rose-600">{weeklySummary?.cl_deducted?.toFixed(2) || '0.00'} day(s)</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-gray-600">Punch State</p>
                <p className="text-lg font-bold text-cyan-700">
                  {todayStatus.punch_state === 'checked_in' ? 'Checked In' : todayStatus.punch_state === 'checked_out' ? 'Checked Out' : 'Not Started'}
                </p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-gray-600">Policy Target</p>
                <p className="text-lg font-bold text-slate-700">8.00 hrs / day</p>
              </div>
            </div>

            {todayStatus.warning_message && (
              <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm">
                <span className="font-semibold">Policy Note:</span> {todayStatus.warning_message}
              </div>
            )}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-l-4 border-green-600"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-3">8-Hour Policy Instructions</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>1. Allow camera and location permissions in your browser.</li>
            <li>2. Make sure you are at your approved office or base location.</li>
            <li>3. Complete check-in and check-out with clear face verification.</li>
            <li>4. Daily status is calculated from total worked hours only.</li>
            <li>5. Weekly extra hours can compensate deficit hours within the same week.</li>
          </ul>
        </motion.div>

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
                <p className="text-sm text-gray-600">Present / Minor Late</p>
                <p className="text-3xl font-bold text-green-600">{stats.present_days}</p>
              </div>
              <TrendingUp className="text-green-600 opacity-20" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Full Day Leave</p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${actionCard.cardClass} rounded-2xl shadow-lg p-8 text-white relative overflow-hidden group`}
          >
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform duration-300" />
            <ActionIcon size={50} className="opacity-40 mb-4 relative z-10" />
            <p className="text-sm uppercase tracking-[0.2em] text-white/80 relative z-10">Attendance Action</p>
            <h2 className="text-3xl font-bold mb-2 mt-2 relative z-10">{actionCard.title}</h2>
            <p className="text-white/90 mb-3 relative z-10">
              {actionCard.description}
            </p>
            <p className="text-white/80 mb-6 relative z-10">
              Current status: {actionCard.statusText}
            </p>

            <Link
              to="/attendance"
              className={`inline-flex items-center gap-2 font-semibold px-8 py-3 rounded-xl shadow transition relative z-10 ${actionCard.buttonClass}`}
            >
              <ActionIcon size={18} />
              {actionCard.buttonLabel}
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-8 text-white relative overflow-hidden group"
          >
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform duration-300" />
            <TrendingUp size={50} className="opacity-40 mb-4 relative z-10" />
            <h2 className="text-3xl font-bold mb-2 relative z-10">My Attendance History</h2>
            <p className="text-green-100 mb-6 relative z-10">
              Review hours, deficits, weekly compensation, and event history.
            </p>

            <Link
              to="/my-attendance"
              className="inline-block bg-white text-green-600 font-semibold px-8 py-3 rounded-xl shadow hover:bg-green-50 transition relative z-10"
            >
              View History
            </Link>
          </motion.div>
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 border border-red-300 text-red-600 px-8 py-3 rounded-xl hover:bg-red-50 transition font-semibold"
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
