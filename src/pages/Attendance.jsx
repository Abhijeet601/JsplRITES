import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Camera,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Info,
  Shield,
  Clock3,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import CameraCapture from '../components/CameraCapture';
import Navbar from '../components/Navbar';

const Attendance = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [warning, setWarning] = useState('');
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  // Permission status states: 'pending' | 'requesting' | 'granted' | 'denied'
  const [locationPermissionStatus, setLocationPermissionStatus] = useState('pending');
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState('pending');

  const { user } = useAuth();
  const navigate = useNavigate();

  // avoid state updates after unmount
  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!capturedImage) {
      setPreviewUrl('');
      return;
    }

    const url = URL.createObjectURL(capturedImage);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [capturedImage]);

  // ================= LOCATION =================
  const requestLocationPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      setLocationPermissionStatus('denied');
      return;
    }

    setLocationPermissionStatus('requesting');
    setLocationError('');

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        });
      });

      const loc = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setLocation(loc);
      setLocationPermissionStatus('granted');
    } catch (err) {
      setLocationError('Unable to retrieve your location. Please enable location services and allow permission.');
      setLocationPermissionStatus('denied');
    }
  }, []);

  // ================= CAMERA =================
  const requestCameraPermission = useCallback(async () => {
    setCameraPermissionStatus('requesting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setCameraPermissionStatus('granted');
    } catch (err) {
      setCameraPermissionStatus('denied');
    }
  }, []);

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
            setLocationPermissionStatus('granted');
          }
          resolve(loc);
        },
        () => {
          if (isMountedRef.current) {
            setLocationError('Unable to retrieve your location. Please enable location services.');
            setLocationPermissionStatus('denied');
          }
          reject(new Error('Location permission / retrieval failed'));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    });
  }, []);

  const handleImageCapture = useCallback((blob) => {
    setCapturedImage(blob);
    setShowImagePreview(true);
    setCameraPermissionStatus('granted');
  }, []);

  // ================= SUBMIT =================
  const handleSubmit = useCallback(async () => {
    setWarning('');
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
    setWarning('');

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

      setMessage(msgParts.join(' | '));
      if (res?.data?.warning) setWarning(res.data.warning);

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
      if (detail.toLowerCase().includes('warning')) {
        setWarning(detail);
      } else {
        setError(detail);
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [capturedImage, getLocation, navigate, location]);

  if (!user) return null;

  const canSubmit = !loading && !!capturedImage && !!location;

  const steps = [
    { label: 'Location captured', done: Boolean(location) },
    { label: 'Face captured', done: Boolean(capturedImage) },
    { label: 'Ready to submit', done: canSubmit },
  ];

  const statusText = (status) => {
    if (status === 'granted') return 'Granted';
    if (status === 'denied') return 'Denied';
    if (status === 'requesting') return 'Requesting...';
    return 'Not Granted';
  };

  const statusClass = (status) => {
    if (status === 'granted') return 'text-emerald-700 bg-emerald-100 border-emerald-200';
    if (status === 'denied') return 'text-red-700 bg-red-100 border-red-200';
    if (status === 'requesting') return 'text-amber-700 bg-amber-100 border-amber-200';
    return 'text-slate-600 bg-slate-100 border-slate-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-cyan-50 to-emerald-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-cyan-100 bg-white/80 backdrop-blur shadow-xl p-6 sm:p-8 mb-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Mark Attendance</h1>
              <p className="text-sm text-slate-600 mt-1">
                Employee ID: <span className="font-semibold">{user.employee_id}</span> | Shift:{' '}
                <span className="font-semibold">{user.shift}</span>
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-cyan-800 text-sm">
              <Clock3 size={16} />
              Required shift time: <span className="font-semibold">8:30 hours</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mt-6">
            {steps.map((step) => (
              <div
                key={step.label}
                className={`rounded-xl border px-3 py-2 text-sm font-medium flex items-center gap-2 ${
                  step.done
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <CheckCircle size={16} className={step.done ? 'text-emerald-600' : 'text-slate-400'} />
                {step.label}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-3xl border border-slate-200 bg-white shadow-lg p-6 mb-6"
        >
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Shield className="text-cyan-700" size={22} />
            Step 1: Grant Permissions
          </h2>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-100 text-cyan-700">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Location Access</p>
                    <p className="text-xs text-slate-500">Needed to verify your workplace location.</p>
                  </div>
                </div>
                <span className={`text-xs border px-2 py-1 rounded-full ${statusClass(locationPermissionStatus)}`}>
                  {statusText(locationPermissionStatus)}
                </span>
              </div>

              <button
                onClick={requestLocationPermission}
                disabled={locationPermissionStatus === 'requesting' || locationPermissionStatus === 'granted'}
                className={`w-full py-2.5 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${
                  locationPermissionStatus === 'granted'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 cursor-default'
                    : locationPermissionStatus === 'denied'
                    ? 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200'
                    : locationPermissionStatus === 'requesting'
                    ? 'bg-amber-100 text-amber-700 border border-amber-300 cursor-wait'
                    : 'bg-cyan-600 text-white hover:bg-cyan-700 shadow'
                }`}
              >
                {locationPermissionStatus === 'granted' ? (
                  <>
                    <CheckCircle size={18} />
                    Location Enabled
                  </>
                ) : locationPermissionStatus === 'requesting' ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-700" />
                    Requesting...
                  </>
                ) : (
                  <>
                    <MapPin size={18} />
                    Enable Location
                  </>
                )}
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                    <Camera size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Camera Access</p>
                    <p className="text-xs text-slate-500">Needed for live face verification.</p>
                  </div>
                </div>
                <span className={`text-xs border px-2 py-1 rounded-full ${statusClass(cameraPermissionStatus)}`}>
                  {statusText(cameraPermissionStatus)}
                </span>
              </div>

              <button
                onClick={requestCameraPermission}
                disabled={cameraPermissionStatus === 'requesting' || cameraPermissionStatus === 'granted'}
                className={`w-full py-2.5 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${
                  cameraPermissionStatus === 'granted'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 cursor-default'
                    : cameraPermissionStatus === 'denied'
                    ? 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200'
                    : cameraPermissionStatus === 'requesting'
                    ? 'bg-amber-100 text-amber-700 border border-amber-300 cursor-wait'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow'
                }`}
              >
                {cameraPermissionStatus === 'granted' ? (
                  <>
                    <CheckCircle size={18} />
                    Camera Enabled
                  </>
                ) : cameraPermissionStatus === 'requesting' ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-700" />
                    Requesting...
                  </>
                ) : (
                  <>
                    <Camera size={18} />
                    Enable Camera
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-50 border border-emerald-300 text-emerald-700 px-4 py-3 rounded-xl mb-4 flex items-center gap-2"
          >
            <CheckCircle size={18} />
            <span>{message}</span>
          </motion.div>
        )}

        {warning && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded-xl mb-4 flex items-center gap-2"
          >
            <AlertTriangle size={18} />
            <span>{warning}</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-center gap-2"
          >
            <AlertTriangle size={18} />
            <span>{error}</span>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-cyan-50 border border-cyan-300 rounded-xl p-4 mb-6 flex items-start gap-3"
        >
          <Info className="text-cyan-700 mt-1 flex-shrink-0" size={20} />
          <div className="text-sm text-cyan-900">
            <p className="font-semibold mb-1">Before you submit:</p>
            <p>Keep your face centered, ensure lighting is clear, and wait for both location and face capture to complete.</p>
          </div>
        </motion.div>

        <div className="grid xl:grid-cols-5 gap-6 items-start">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="xl:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-800">
              <MapPin className="text-cyan-700" size={22} /> Step 2: Verify Location
            </h2>

            {location ? (
              <div className="text-emerald-700 space-y-3">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle size={18} className="text-emerald-600" />
                  Location captured
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-sm font-mono">
                  <p className="text-slate-700">Latitude: {Number(location.latitude).toFixed(6)}</p>
                  <p className="text-slate-700">Longitude: {Number(location.longitude).toFixed(6)}</p>
                </div>
                <button
                  onClick={() => {
                    getLocation().catch(() => {});
                  }}
                  className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-cyan-300 text-cyan-700 hover:bg-cyan-50"
                >
                  <RefreshCw size={14} />
                  Refresh Location
                </button>
              </div>
            ) : locationError ? (
              <div>
                <div className="text-red-600 mb-3 flex items-center gap-2">
                  <AlertTriangle size={18} />
                  <span className="font-semibold text-sm">{locationError}</span>
                </div>
                <button
                  onClick={() => {
                    getLocation().catch(() => {});
                  }}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition"
                >
                  <RefreshCw size={16} />
                  Retry Location
                </button>
              </div>
            ) : (
              <div className="text-slate-600 text-sm rounded-xl border border-slate-200 bg-slate-50 p-4">
                Enable location permission above, then retry if coordinates do not appear.
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="xl:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-800">
              <Camera className="text-emerald-700" size={22} /> Step 3: Face Verification
            </h2>

            <div className="space-y-4">
              <CameraCapture onCapture={handleImageCapture} buttonText="Capture Face" />

              {capturedImage && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-emerald-700 font-semibold">
                  <CheckCircle size={18} className="text-emerald-600" />
                  Face image captured successfully
                </motion.div>
              )}

              {capturedImage && showImagePreview && previewUrl && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-slate-50 border border-slate-200 p-3 rounded-xl"
                >
                  <p className="text-xs text-slate-600 mb-2">Latest capture preview:</p>
                  <img src={previewUrl} alt="Captured face" className="w-full rounded-lg max-h-56 object-cover" />
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-8"
        >
          <div className="rounded-2xl border border-slate-200 bg-white shadow-lg p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-sm text-slate-600">
              {canSubmit ? (
                <p className="text-emerald-700 font-semibold">All checks complete. You can mark attendance now.</p>
              ) : (
                <p>
                  Complete all three steps to enable submit: permissions, location, and face capture.
                </p>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              className="w-full sm:w-auto bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 text-white font-semibold px-8 py-3 rounded-xl shadow disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Marking Attendance...
                </>
              ) : (
                <>
                  Mark Attendance
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Attendance;
