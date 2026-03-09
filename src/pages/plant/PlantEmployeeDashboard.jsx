import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Clock3, LogOut, MapPin } from 'lucide-react';
import { usePlantAuth } from '../../plant/PlantAuthContext';
import plantApi from '../../plant/plantApi';
import '../../plant/plant.css';

const PlantEmployeeDashboard = () => {
  const { user, logout } = usePlantAuth();
  const [location, setLocation] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const shiftClock = useMemo(() => {
    const now = new Date();
    return now.toLocaleString('en-IN', { hour12: true });
  }, [message]);

  const loadHistory = async () => {
    try {
      const res = await plantApi.get('/plant/get-attendance');
      setHistory(res.data.records || []);
    } catch (err) {
      setHistory([]);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const getLocation = () =>
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          const next = {
            latitude: p.coords.latitude,
            longitude: p.coords.longitude,
            accuracy: p.coords.accuracy,
          };
          setLocation(next);
          resolve(next);
        },
        reject,
        { enableHighAccuracy: true, timeout: 10000 },
      );
    });

  const markAttendance = async () => {
    if (!imageFile) {
      setError('Capture/upload face image first.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const loc = location || (await getLocation());
      const fd = new FormData();
      fd.append('emp_id', user.username);
      fd.append('latitude', String(loc.latitude));
      fd.append('longitude', String(loc.longitude));
      fd.append('accuracy', String(loc.accuracy || 0));
      fd.append('client_ts', new Date().toISOString().slice(0, 19));
      fd.append('live_image', imageFile);

      const res = await plantApi.post('/plant/mark-attendance', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(
        `${res.data.message} | ${res.data.shift} | ${res.data.is_late ? 'Late Arrival' : 'On Time'}`,
      );
      setImageFile(null);
      await loadHistory();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Attendance failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="plant-shell p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="plant-title text-2xl font-bold text-slate-800">Plant Employee Dashboard</h1>
            <p className="text-sm text-slate-600">{user?.name} ({user?.username})</p>
          </div>
          <button onClick={logout} className="rounded-xl bg-slate-800 text-white px-4 py-2 text-sm flex items-center gap-2">
            <LogOut size={16} /> Logout
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="plant-card p-5">
            <h2 className="text-lg font-semibold text-slate-800 mb-3">Check In</h2>
            <div className="space-y-3">
              <label className="block text-sm text-slate-700">
                Face Camera/Image
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2"
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
              </label>
              <button onClick={() => getLocation()} className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-cyan-800 text-sm">
                <MapPin size={14} className="inline mr-1" /> Verify Location
              </button>
              <button
                onClick={markAttendance}
                disabled={loading}
                className="w-full rounded-xl bg-emerald-600 py-3 text-white font-semibold disabled:opacity-60"
              >
                <Camera size={16} className="inline mr-1" />
                {loading ? 'Marking...' : 'Check In'}
              </button>
              <p className="text-xs text-slate-500"><Clock3 size={12} className="inline mr-1" />Current time: {shiftClock}</p>
              {location && <p className="text-xs text-emerald-700">Location ready (accuracy {Math.round(location.accuracy || 0)}m)</p>}
              {message && <p className="text-sm text-emerald-700">{message}</p>}
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="plant-card p-5">
            <h2 className="text-lg font-semibold text-slate-800 mb-3">Attendance History</h2>
            <div className="max-h-[420px] overflow-auto space-y-2">
              {history.length === 0 && <p className="text-sm text-slate-500">No attendance records yet.</p>}
              {history.map((row) => (
                <div key={row.id} className="rounded-xl border border-slate-200 p-3 bg-white/80">
                  <div className="text-sm font-medium text-slate-800">{row.shift} | Group {row.group}</div>
                  <div className="text-xs text-slate-600">{new Date(row.check_in_time).toLocaleString('en-IN')}</div>
                  <div className={`text-xs ${row.is_late ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {row.is_late ? 'Late' : 'On Time'} | Face {row.face_verified ? 'Verified' : 'Failed'}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PlantEmployeeDashboard;
