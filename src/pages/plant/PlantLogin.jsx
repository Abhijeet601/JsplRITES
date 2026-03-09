import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Factory, Lock, User } from 'lucide-react';
import { usePlantAuth } from '../../plant/PlantAuthContext';
import plantApi from '../../plant/plantApi';
import '../../plant/plant.css';

const PlantLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = usePlantAuth();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await plantApi.post('/plant/login', { username, password });
      login(res.data.user, res.data.access_token);
      if (res.data.user.role === 'employee') navigate('/plant-employee');
      else navigate('/plant-admin');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Plant login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="plant-shell p-4 sm:p-8 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="plant-card w-full max-w-md p-6 sm:p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-xl bg-cyan-100 p-3 text-cyan-700">
            <Factory size={24} />
          </div>
          <div>
            <h1 className="plant-title text-2xl font-bold text-slate-800">Plant Login</h1>
            <p className="text-sm text-slate-600">Shift Based Attendance Portal</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-sm text-slate-700">Username / Employee ID</span>
            <div className="mt-1 flex items-center rounded-xl border border-slate-200 bg-white px-3">
              <User size={16} className="text-slate-500" />
              <input
                className="w-full bg-transparent px-2 py-3 outline-none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm text-slate-700">Password</span>
            <div className="mt-1 flex items-center rounded-xl border border-slate-200 bg-white px-3">
              <Lock size={16} className="text-slate-500" />
              <input
                type="password"
                className="w-full bg-transparent px-2 py-3 outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-cyan-600 py-3 text-white font-semibold hover:bg-cyan-700 disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-5 text-sm text-slate-600">
          Existing system login remains unchanged: <Link to="/login" className="text-cyan-700">Open Main Login</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default PlantLogin;
