import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UserPlus,
  User,
  Mail,
  Phone,
  Lock,
  Video,
  FileText,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Check,
  X
} from 'lucide-react';
import api from '../api/axios';
import CameraCapture from '../components/CameraCapture';

const PASSWORD_REQUIREMENTS = {
  minLength: { label: 'At least 8 characters', validate: (p) => p.length >= 8 },
  hasUpperCase: { label: 'One uppercase letter', validate: (p) => /[A-Z]/.test(p) },
  hasLowerCase: { label: 'One lowercase letter', validate: (p) => /[a-z]/.test(p) },
  hasNumber: { label: 'One number', validate: (p) => /[0-9]/.test(p) },
};

const EmployeeRegistration = () => {
  const [formData, setFormData] = useState({
    name: '',
    employee_id: '',
    email: '',
    mobile_number: '',
    password: '',
    confirm_password: '',
  });
  const [faceVideo, setFaceVideo] = useState(null);
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const videoInputRef = useRef(null);
  const documentInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear validation error
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: '' });
    }
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone) => {
    return /^[0-9]{10}$/.test(phone.replace(/\D/g, ''));
  };

  const getPasswordStrength = (password) => {
    let strength = 0;
    Object.values(PASSWORD_REQUIREMENTS).forEach(req => {
      if (req.validate(password)) strength++;
    });
    return strength;
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.employee_id.trim()) errors.employee_id = 'Employee ID is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!validateEmail(formData.email)) errors.email = 'Invalid email format';
    
    if (!formData.mobile_number.trim()) errors.mobile_number = 'Mobile number is required';
    else if (!validatePhone(formData.mobile_number)) errors.mobile_number = 'Must be 10 digits';
    
    if (!formData.password) errors.password = 'Password is required';
    else if (getPasswordStrength(formData.password) < 4) errors.password = 'Password does not meet all requirements';
    
    if (!formData.confirm_password) errors.confirm_password = 'Please confirm password';
    else if (formData.password !== formData.confirm_password) errors.confirm_password = 'Passwords do not match';

    return errors;
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) setFaceVideo(file);
  };

  const handleDocumentUpload = (e) => {
    const file = e.target.files[0];
    if (file) setDocument(file);
  };

  const handleVideoCapture = (blob) => {
    const ext = (blob && blob.type && blob.type.includes('webm')) ? 'webm' : (blob && blob.type && blob.type.split('/')[1]) || 'webm';
    const filename = `face_capture.${ext}`;
    setFaceVideo(new File([blob], filename, { type: blob.type || 'video/webm' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setLoading(false);
      return;
    }

    if (!faceVideo) {
      setError('Face video is required');
      setLoading(false);
      return;
    }

    if (!document) {
      setError('Document is required');
      setLoading(false);
      return;
    }

    try {
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('employee_id', formData.employee_id);
      fd.append('email', formData.email);
      fd.append('mobile_number', formData.mobile_number);
      fd.append('password', formData.password);
      fd.append('face_video', faceVideo);
      fd.append('document', document);

      const res = await api.post('/api/register', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setShowSuccessPopup(true);

      // Reset form
      setFormData({
        name: '',
        employee_id: '',
        email: '',
        mobile_number: '',
        password: '',
        confirm_password: '',
      });
      setFaceVideo(null);
      setDocument(null);
      setCurrentStep(1);
      if (videoInputRef.current) videoInputRef.current.value = '';
      if (documentInputRef.current) documentInputRef.current.value = '';

    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-blue-100">

          {/* HEADER */}
          <div className="flex flex-col items-center mb-8">
            <img
              src="/rites-logo.jpeg"
              alt="RITES Logo"
              className="h-16 w-auto mb-4"
            />
            <h1 className="text-3xl font-bold text-gray-800">
              Employee Registration
            </h1>
            <p className="text-gray-600 text-center">
              Create your account with face verification
            </p>
          </div>

          {/* REGISTRATION INSTRUCTIONS */}
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-blue-900 mb-2">
              Registration Instructions
            </h2>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>1. Fill your correct personal details exactly as per office records.</li>
              <li>2. Create a strong password and confirm it before moving ahead.</li>
              <li>3. Record a clear face video in good lighting, looking straight at camera.</li>
              <li>4. Upload your valid supporting document and submit registration.</li>
              <li>5. Wait for admin approval, then login to mark attendance.</li>
            </ul>
          </div>

          {/* PROGRESS STEPS */}
          <div className="mb-8 flex justify-between items-center">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                    step < currentStep
                      ? 'bg-green-500 text-white'
                      : step === currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {step < currentStep ? <Check size={20} /> : step}
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition ${
                      step < currentStep ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* MESSAGES */}
          {message && (
            <div className="mb-4 bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2">
              <CheckCircle size={18} />
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* STEP 1: PERSONAL INFO */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                {/* NAME */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={loading}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${
                        validationErrors.name ? 'border-red-400' : 'border-gray-300'
                      }`}
                      placeholder="Full name"
                    />
                  </div>
                  {validationErrors.name && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
                  )}
                </div>

                {/* EMPLOYEE ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                  <input
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleInputChange}
                    disabled={loading}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${
                      validationErrors.employee_id ? 'border-red-400' : 'border-gray-300'
                    }`}
                    placeholder="Enter employee ID"
                  />
                  {validationErrors.employee_id && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.employee_id}</p>
                  )}
                </div>

                {/* EMAIL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={loading}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${
                        validationErrors.email ? 'border-red-400' : 'border-gray-300'
                      }`}
                      placeholder="name@company.com"
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
                  )}
                </div>

                {/* MOBILE */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      name="mobile_number"
                      value={formData.mobile_number}
                      onChange={handleInputChange}
                      disabled={loading}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${
                        validationErrors.mobile_number ? 'border-red-400' : 'border-gray-300'
                      }`}
                      placeholder="10-digit mobile number"
                      maxLength="10"
                    />
                  </div>
                  {validationErrors.mobile_number && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.mobile_number}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600
                    hover:from-blue-700 hover:to-green-700
                    text-white py-3 rounded-xl font-semibold shadow-lg
                    disabled:opacity-50 transition"
                >
                  Next: Password
                </button>
              </motion.div>
            )}

            {/* STEP 2: PASSWORD */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                {/* PASSWORD */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      disabled={loading}
                      className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${
                        validationErrors.password ? 'border-red-400' : 'border-gray-300'
                      }`}
                      placeholder="Create a strong password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Password Requirements */}
                  <div className="mt-3 space-y-2 p-3 bg-gray-50 rounded-lg">
                    {Object.entries(PASSWORD_REQUIREMENTS).map(([key, req]) => {
                      const isMet = req.validate(formData.password);
                      return (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          {isMet ? (
                            <Check size={16} className="text-green-500" />
                          ) : (
                            <X size={16} className="text-gray-300" />
                          )}
                          <span className={isMet ? 'text-green-600' : 'text-gray-500'}>
                            {req.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {validationErrors.password && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>
                  )}
                </div>

                {/* CONFIRM PASSWORD */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirm_password"
                      value={formData.confirm_password}
                      onChange={handleInputChange}
                      disabled={loading}
                      className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${
                        validationErrors.confirm_password ? 'border-red-400' : 'border-gray-300'
                      }`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {formData.password && formData.confirm_password && formData.password === formData.confirm_password && (
                    <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                      <Check size={14} /> Passwords match
                    </p>
                  )}
                  {validationErrors.confirm_password && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.confirm_password}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold
                      hover:bg-gray-50 transition"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-green-600
                      hover:from-blue-700 hover:to-green-700
                      text-white py-3 rounded-xl font-semibold shadow-lg
                      disabled:opacity-50 transition"
                  >
                    Next: Verification
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: VERIFICATION */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                {/* FACE VIDEO */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Face Image (Required)
                  </label>
                  <CameraCapture onCapture={handleVideoCapture} buttonText="Record Face Video" />
                  <input
                    type="file"
                    ref={videoInputRef}
                    accept="video/*"
                    onChange={handleVideoUpload}
                    disabled={loading}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={loading}
                    className="mt-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                  >
                    Upload Face Image
                  </button>
                  {faceVideo && (
                    <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                      <Check size={16} /> {faceVideo.name}
                    </p>
                  )}
                </div>

                {/* DOCUMENT */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document (Required)
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="file"
                      ref={documentInputRef}
                      onChange={handleDocumentUpload}
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-3 border rounded-lg"
                    />
                  </div>
                  {document && (
                    <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                      <Check size={16} /> {document.name}
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold
                      hover:bg-gray-50 transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-green-600
                      hover:from-blue-700 hover:to-green-700
                      text-white py-3 rounded-xl font-semibold shadow-lg
                      disabled:opacity-50 transition"
                  >
                    {loading ? 'Registering...' : 'Complete Registration'}
                  </button>
                </div>
              </motion.div>
            )}
          </form>

          {/* FOOTER */}
          {currentStep === 1 && (
            <div className="mt-6 pt-6 border-t text-center">
              <Link to="/login" className="text-blue-600 hover:text-blue-800 transition">
                Already have an account? Login
              </Link>
            </div>
          )}

        </div>
      </motion.div>

      {/* SUCCESS POPUP */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl"
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Registration Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              Your account has been created. Please wait for admin approval to start using the system.
            </p>
            <Link
              to="/login"
              onClick={() => setShowSuccessPopup(false)}
              className="inline-block bg-gradient-to-r from-blue-600 to-green-600
                hover:from-blue-700 hover:to-green-700
                text-white px-6 py-2 rounded-lg font-semibold transition"
            >
              Go to Login
            </Link>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default EmployeeRegistration;
