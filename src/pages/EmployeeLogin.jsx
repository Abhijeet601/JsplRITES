import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Eye, EyeOff, Lock, LogIn, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

const REQUIRED_WORK_MINUTES = 8 * 60;

const SHIFT_OPTIONS = [
  { label: 'Shift A', value: 'A' },
  { label: 'Shift B', value: 'B' },
  { label: 'Shift C', value: 'C' },
  { label: 'General', value: 'general' },
  { label: 'Other Roster', value: 'other' },
];

const EmployeeLogin = () => {
  const [formData, setFormData] = useState({
    employee_id: '',
    password: '',
    shift_type: 'general',
    custom_shift: 'other',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const savedId = localStorage.getItem('employeeId');
    const savedShiftType = localStorage.getItem('employeeShiftType');
    const savedShiftLabel = localStorage.getItem('employeeShiftLabel');
    const savedRememberMe = localStorage.getItem('employeeRememberMe') === 'true';

    if (savedRememberMe && savedId) {
      setFormData((prev) => ({
        ...prev,
        employee_id: savedId,
        shift_type: savedShiftType || 'general',
        custom_shift: savedShiftType === 'other' ? (savedShiftLabel || '') : prev.custom_shift,
      }));
      setRememberMe(true);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: '' });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.employee_id.trim()) errors.employee_id = 'Employee ID is required';
    if (!formData.password) errors.password = 'Password is required';
    if (formData.shift_type === 'other' && !formData.custom_shift.trim()) errors.custom_shift = 'Roster label is required';
    return errors;
  };

  const getSelectedShift = () => (formData.shift_type === 'other' ? formData.custom_shift.trim() : formData.shift_type);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        employee_id: formData.employee_id,
        password: formData.password,
        shift: getSelectedShift(),
      };

      const response = await api.post('/api/login', payload);

      if (rememberMe) {
        localStorage.setItem('employeeId', formData.employee_id);
        localStorage.setItem('employeeShiftType', formData.shift_type);
        localStorage.setItem('employeeShiftLabel', getSelectedShift());
        localStorage.setItem('employeeRememberMe', 'true');
      } else {
        localStorage.removeItem('employeeId');
        localStorage.removeItem('employeeShiftType');
        localStorage.removeItem('employeeShiftLabel');
        localStorage.removeItem('employeeRememberMe');
      }

      login({
        employee_id: formData.employee_id,
        name: response.data.user_name,
        role: 'employee',
        shift: getSelectedShift(),
        shift_type: formData.shift_type,
        shift_time: getSelectedShift(),
        required_work_minutes: REQUIRED_WORK_MINUTES,
      }, response.data.access_token);

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const showOther = formData.shift_type === 'other';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-blue-100">
          <div className="flex flex-col items-center mb-8">
            <motion.img
              src="/rites-logo.jpeg"
              alt="Company Logo"
              className="w-40 h-20 rounded-2xl shadow-lg mb-4"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <h2 className="text-2xl font-semibold text-gray-700 mb-1">Employee Login</h2>
            <p className="text-gray-600 text-center">Access your attendance dashboard</p>
            <p className="mt-2 text-xs text-gray-500">
              Daily requirement: <span className="font-semibold">8.00 hours</span> (480 minutes)
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleInputChange}
                  disabled={loading}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                    validationErrors.employee_id ? 'border-red-400' : 'border-gray-300'
                  }`}
                  placeholder="Enter employee ID"
                />
              </div>
              {validationErrors.employee_id && <p className="text-red-500 text-xs mt-1">{validationErrors.employee_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={loading}
                  className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                    validationErrors.password ? 'border-red-400' : 'border-gray-300'
                  }`}
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {validationErrors.password && <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shift / Roster</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  name="shift_type"
                  value={formData.shift_type}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white transition"
                >
                  {SHIFT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {showOther && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Roster Label</label>
                  <input
                    type="text"
                    name="custom_shift"
                    value={formData.custom_shift}
                    onChange={handleInputChange}
                    disabled={loading}
                    placeholder="Enter roster or plant shift label"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                      validationErrors.custom_shift ? 'border-red-400' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.custom_shift && <p className="text-red-500 text-xs mt-1">{validationErrors.custom_shift}</p>}
                </motion.div>
              )}

              <p className="mt-2 text-xs text-gray-500">
                Attendance is evaluated only from total worked hours. Shift selection is for roster tagging and reporting.
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-600">Remember my details</label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Logging in...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <LogIn className="mr-2" size={20} />
                  Login
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center space-y-2">
            <Link to="/register" className="block text-blue-600 hover:text-blue-800 transition">
              Don't have an account? Register
            </Link>
            <Link to="/admin-login" className="block text-gray-500 hover:text-gray-800 transition">
              Admin Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EmployeeLogin;
