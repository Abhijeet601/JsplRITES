import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, LogOut } from 'lucide-react';
import { usePlantAuth } from '../../plant/PlantAuthContext';
import plantApi from '../../plant/plantApi';
import '../../plant/plant.css';

const PlantAdminDashboard = () => {
  const { user, logout } = usePlantAuth();
  const [dashboard, setDashboard] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [plants, setPlants] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [form, setForm] = useState({ emp_id: '', name: '', group: 'A', shift: 'Shift 1', plant_id: '' });
  const [faceFile, setFaceFile] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const loadAll = async () => {
    const [d, e, p, s] = await Promise.all([
      plantApi.get('/plant/admin/dashboard'),
      plantApi.get('/plant/admin/employees'),
      plantApi.get('/plant/admin/plants'),
      plantApi.get('/plant/admin/shifts'),
    ]);
    setDashboard(d.data);
    setEmployees(e.data.employees || []);
    setPlants(p.data.plants || []);
    setShifts(s.data.shifts || []);
    if (!form.plant_id && (p.data.plants || []).length > 0) {
      setForm((prev) => ({ ...prev, plant_id: String(p.data.plants[0].id) }));
    }
  };

  useEffect(() => {
    loadAll().catch(() => {});
  }, []);

  const addEmployee = async (e) => {
    e.preventDefault();
    if (!faceFile) {
      setErr('Face image is required.');
      return;
    }
    setErr('');
    setMsg('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('face_image', faceFile);
      await plantApi.post('/plant/register-employee', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMsg('Employee added.');
      setForm((prev) => ({ ...prev, emp_id: '', name: '' }));
      setFaceFile(null);
      await loadAll();
    } catch (error) {
      setErr(error?.response?.data?.detail || 'Unable to add employee');
    }
  };

  const exportCsv = async () => {
    const res = await plantApi.get('/plant/admin/reports?export=true', { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `plant_report_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="plant-shell p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="plant-title text-2xl font-bold text-slate-800">Plant Admin Dashboard</h1>
            <p className="text-sm text-slate-600">{user?.name} ({user?.role})</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCsv} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm flex items-center gap-2"><Download size={16} /> Export CSV</button>
            <button onClick={logout} className="rounded-xl bg-slate-800 text-white px-4 py-2 text-sm flex items-center gap-2"><LogOut size={16} /> Logout</button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-4">
          <div className="plant-card p-4"><p className="text-xs text-slate-600">Total Employees</p><p className="text-2xl font-bold">{dashboard?.total_employees || 0}</p></div>
          <div className="plant-card p-4"><p className="text-xs text-slate-600">Present Today</p><p className="text-2xl font-bold">{dashboard?.present_today || 0}</p></div>
          <div className="plant-card p-4"><p className="text-xs text-slate-600">Late Arrivals</p><p className="text-2xl font-bold">{dashboard?.late_arrivals || 0}</p></div>
          <div className="plant-card p-4"><p className="text-xs text-slate-600">Real-time Logs</p><p className="text-2xl font-bold">{dashboard?.realtime_logs?.length || 0}</p></div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="plant-card p-4">
            <h2 className="font-semibold text-slate-800 mb-3">Shift Wise Attendance</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboard?.shift_wise_attendance || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="shift" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="plant-card p-4">
            <h2 className="font-semibold text-slate-800 mb-3">Group Wise (A/B/C)</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dashboard?.group_wise_attendance || []} dataKey="count" nameKey="group" outerRadius={100} fill="#14b8a6" />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 mt-4">
          <div className="plant-card p-4">
            <h2 className="font-semibold text-slate-800 mb-3">Add Employee</h2>
            <form onSubmit={addEmployee} className="grid gap-2">
              <input className="rounded-xl border p-2" placeholder="Employee ID" value={form.emp_id} onChange={(e) => setForm({ ...form, emp_id: e.target.value })} required />
              <input className="rounded-xl border p-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <div className="grid grid-cols-3 gap-2">
                <select className="rounded-xl border p-2" value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })}>
                  <option>A</option><option>B</option><option>C</option>
                </select>
                <select className="rounded-xl border p-2" value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })}>
                  {shifts.map((s) => <option key={s.id}>{s.shift_name}</option>)}
                </select>
                <select className="rounded-xl border p-2" value={form.plant_id} onChange={(e) => setForm({ ...form, plant_id: e.target.value })} required>
                  {plants.map((p) => <option key={p.id} value={p.id}>{p.plant_name}</option>)}
                </select>
              </div>
              <input type="file" accept="image/*" className="rounded-xl border p-2" onChange={(e) => setFaceFile(e.target.files?.[0] || null)} required />
              {msg && <p className="text-sm text-emerald-700">{msg}</p>}
              {err && <p className="text-sm text-red-600">{err}</p>}
              <button className="rounded-xl bg-emerald-600 text-white py-2">Create Employee</button>
            </form>
          </div>

          <div className="plant-card p-4">
            <h2 className="font-semibold text-slate-800 mb-3">Employees</h2>
            <div className="max-h-80 overflow-auto space-y-2">
              {employees.map((e) => (
                <div key={e.emp_id} className="rounded-xl border border-slate-200 p-2 bg-white/80">
                  <div className="text-sm font-medium">{e.name} ({e.emp_id})</div>
                  <div className="text-xs text-slate-600">Group {e.group} | {e.shift} | {e.plant_name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlantAdminDashboard;
