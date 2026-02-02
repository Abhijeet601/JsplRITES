import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Camera, CheckCircle, AlertTriangle, RefreshCw, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import CameraCapture from '../components/CameraCapture';
import Navbar from '../components/Navbar';

const Attendance = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [locationAttempts, setLocationAttempts] = useState(0);
  const [showImagePreview, setShowImagePreview] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  // avoid state updates after unmount
  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ================= LOCATION =================
  const getLocation = useCallback((setState = true) => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        if (isMountedRef.current) {
          setLocationError('Geolocation is not supported by this browser.');
        }
        reject(new Error('Geolocation not supported'));
        return;
      }

      if (isMountedRef.current) setLocationError('');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          if (setState && isMountedRef.current) {
            setLocation(loc);
            setLocationAttempts(0);
          }
          resolve(loc);
        },
        () => {
          if (isMountedRef.current) {
            setLocationError('Unable to retrieve your location. Please enable location services.');
          }
          reject(new Error('Location permission / retrieval failed'));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    });
  }, []);

  useEffect(() => {
    getLocation().catch(() => {
      if (isMountedRef.current) setLocationAttempts(1);
    });
  }, [getLocation]);

  const handleImageCapture = useCallback((blob) => {
    setCapturedImage(blob);
    setShowImagePreview(true);
  }, []);

  // ================= SUBMIT =================
  const handleSubmit = useCallback(async () => {
    if (!capturedImage) {
      setError('Please capture your face image first');
      return;
    }

    if (!location) {
      setError('Unable to get your location. Please enable location services and try again.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const currentLocation = await getLocation(false);

      const formData = new FormData();
      formData.append('live_image', capturedImage, 'attendance.jpg');
      formData.append('latitude', String(currentLocation.latitude));
      formData.append('longitude', String(currentLocation.longitude));

      const res = await api.post('/api/attendance/mark', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const msgParts = [];
      if (res?.data?.message) msgParts.push(res.data.message);
      if (res?.data?.work_hours) msgParts.push(`Work Hours: ${res.data.work_hours}`);
      if (res?.data?.warning) msgParts.push(`⚠️ ${res.data.warning}`);

      setMessage(msgParts.join(' | '));

      setCapturedImage(null);
      setShowImagePreview(false);

      // refresh visible location
      getLocation().catch(() => {});

      // Navigate to dashboard after successful attendance marking
      window.setTimeout(() => {
        navigate('/dashboard');
      }, 2500);
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Attendance marking failed';
      setError(detail);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [capturedImage, getLocation, navigate, location]);

  if (!user) return null;

  const canSubmit = !loading && !!capturedImage && !!location;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-5xl mx-auto p-6">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <h1 className="text-3xl font-bold text-gray-800">Mark Attendance</h1>
          <p className="text-gray-600">
            Employee ID: {user.employee_id} | Shift: {user.shift}
          </p>
        </motion.div>

        {/* MESSAGE */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-xl mb-4 flex items-center gap-2"
          >
            <CheckCircle size={18} />
            <span>{message}</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-center gap-2"
          >
            <AlertTriangle size={18} />
            <span>{error}</span>
          </motion.div>
        )}

        {/* INFO BOX */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-300 rounded-xl p-4 mb-6 flex items-start gap-3"
        >
          <Info className="text-blue-600 mt-1 flex-shrink-0" size={20} />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Instructions:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Ensure location services are enabled</li>
              <li>Position your face clearly in the camera</li>
              <li>Ensure proper lighting</li>
              <li>Required shift time: <strong>8:30 hours</strong></li>
            </ul>
          </div>
        </motion.div>

        {/* GRID */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* LOCATION CARD */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MapPin className="text-blue-600" size={24} /> Location Verification
            </h2>

            {location ? (
              <div className="text-green-600">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={20} className="text-green-500" />
                  <span className="font-semibold">Location Captured</span>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-sm font-mono">
                  <p className="text-gray-700">Latitude: {Number(location.latitude).toFixed(6)}</p>
                  <p className="text-gray-700">Longitude: {Number(location.longitude).toFixed(6)}</p>
                </div>
              </div>
            ) : locationError ? (
              <div>
                <div className="text-red-600 mb-3 flex items-center gap-2">
                  <AlertTriangle size={20} />
                  <span className="font-semibold">{locationError}</span>
                </div>
                <button
                  onClick={() => {
                    getLocation().catch(() => setLocationAttempts(prev => prev + 1));
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition"
                >
                  <RefreshCw size={16} />
                  Retry Location
                </button>
              </div>
            ) : (
              <div className="text-gray-600 flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                <span>Fetching your location...</span>
              </div>
            )}
          </motion.div>

          {/* FACE VERIFICATION CARD */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Camera className="text-purple-600" size={24} /> Face Verification
            </h2>

            <div className="space-y-4">
              <CameraCapture onCapture={handleImageCapture} buttonText="Capture Face" />
              {capturedImage && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-green-600 font-semibold"
                >
                  <CheckCircle size={20} className="text-green-500" />
                  Face image captured successfully
                </motion.div>
              )}
              {capturedImage && showImagePreview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-gray-100 p-3 rounded-lg"
                >
                  <p className="text-xs text-gray-600 mb-2">Preview:</p>
                  <img 
                    src={URL.createObjectURL(capturedImage)} 
                    alt="Captured face"
                    className="w-full rounded-lg max-h-48 object-cover"
                  />
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        {/* SUBMIT */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 text-center"
        >
          <button
            onClick={handleSubmit}
            disabled={!location || !capturedImage || loading}
            className="bg-gradient-to-r from-blue-600 to-green-600
              hover:from-blue-700 hover:to-green-700
              text-white font-semibold px-12 py-4 rounded-xl shadow-lg hover:shadow-xl
              disabled:opacity-50 disabled:cursor-not-allowed transition text-lg
              flex items-center justify-center gap-2 mx-auto"
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                Marking Attendance...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Mark Attendance
              </>
            )}
          </button>
          
          {!location && (
            <p className="text-red-600 text-sm mt-3">Location is required to mark attendance</p>
          )}
          {!capturedImage && (
            <p className="text-red-600 text-sm mt-3">Face image is required to mark attendance</p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Attendance;
