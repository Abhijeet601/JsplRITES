import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Camera, CheckCircle, AlertTriangle, RefreshCw, Info, Shield, ShieldOff } from 'lucide-react';
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
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

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
          maximumAge: 300000
        });
      });

      const loc = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setLocation(loc);
      setLocationAttempts(0);
      setLocationPermissionStatus('granted');
    } catch (err) {
      setLocationError('Unable to retrieve your location. Please enable location services and allow permission.');
      setLocationPermissionStatus('denied');
      setLocationAttempts(prev => prev + 1);
    }
  }, []);

  // ================= CAMERA =================
  const requestCameraPermission = useCallback(async () => {
    setCameraPermissionStatus('requesting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop()); // stop immediately
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

        {/* PERMISSIONS SECTION */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Shield className="text-blue-600" size={24} />
            Permissions Required
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {/* Location Permission */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    locationPermissionStatus === 'granted' ? 'bg-green-100' :
                    locationPermissionStatus === 'denied' ? 'bg-red-100' :
                    locationPermissionStatus === 'requesting' ? 'bg-yellow-100' :
                    'bg-gray-200'
                  }`}>
                    {locationPermissionStatus === 'granted' ? (
                      <Shield className="text-green-600" size={24} />
                    ) : locationPermissionStatus === 'denied' ? (
                      <ShieldOff className="text-red-600" size={24} />
                    ) : locationPermissionStatus === 'requesting' ? (
                      <MapPin className="text-yellow-600 animate-pulse" size={24} />
                    ) : (
                      <MapPin className="text-gray-600" size={24} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Location Permission</h3>
                    <p className={`text-sm ${
                      locationPermissionStatus === 'granted' ? 'text-green-600' :
                      locationPermissionStatus === 'denied' ? 'text-red-600' :
                      locationPermissionStatus === 'requesting' ? 'text-yellow-600' :
                      'text-gray-500'
                    }`}>
                      {locationPermissionStatus === 'granted' ? 'Granted' :
                       locationPermissionStatus === 'denied' ? 'Denied' :
                       locationPermissionStatus === 'requesting' ? 'Requesting...' :
                       'Not Granted'}
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={requestLocationPermission}
                disabled={locationPermissionStatus === 'requesting' || locationPermissionStatus === 'granted'}
                className={`w-full py-2.5 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
                  locationPermissionStatus === 'granted' 
                    ? 'bg-green-100 text-green-700 border border-green-300 cursor-default'
                    : locationPermissionStatus === 'denied'
                    ? 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200'
                    : locationPermissionStatus === 'requesting'
                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-300 cursor-wait'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                }`}
              >
                {locationPermissionStatus === 'granted' ? (
                  <>
                    <CheckCircle size={18} />
                    Location Enabled
                  </>
                ) : locationPermissionStatus === 'requesting' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-700" />
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

            {/* Camera Permission */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    cameraPermissionStatus === 'granted' ? 'bg-green-100' :
                    cameraPermissionStatus === 'denied' ? 'bg-red-100' :
                    cameraPermissionStatus === 'requesting' ? 'bg-yellow-100' :
                    'bg-gray-200'
                  }`}>
                    {cameraPermissionStatus === 'granted' ? (
                      <Shield className="text-green-600" size={24} />
                    ) : cameraPermissionStatus === 'denied' ? (
                      <ShieldOff className="text-red-600" size={24} />
                    ) : cameraPermissionStatus === 'requesting' ? (
                      <Camera className="text-yellow-600 animate-pulse" size={24} />
                    ) : (
                      <Camera className="text-gray-600" size={24} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Camera Permission</h3>
                    <p className={`text-sm ${
                      cameraPermissionStatus === 'granted' ? 'text-green-600' :
                      cameraPermissionStatus === 'denied' ? 'text-red-600' :
                      cameraPermissionStatus === 'requesting' ? 'text-yellow-600' :
                      'text-gray-500'
                    }`}>
                      {cameraPermissionStatus === 'granted' ? 'Granted' :
                       cameraPermissionStatus === 'denied' ? 'Denied' :
                       cameraPermissionStatus === 'requesting' ? 'Requesting...' :
                       'Not Granted'}
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={requestCameraPermission}
                disabled={cameraPermissionStatus === 'requesting' || cameraPermissionStatus === 'granted'}
                className={`w-full py-2.5 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
                  cameraPermissionStatus === 'granted' 
                    ? 'bg-green-100 text-green-700 border border-green-300 cursor-default'
                    : cameraPermissionStatus === 'denied'
                    ? 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200'
                    : cameraPermissionStatus === 'requesting'
                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-300 cursor-wait'
                    : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md'
                }`}
              >
                {cameraPermissionStatus === 'granted' ? (
                  <>
                    <CheckCircle size={18} />
                    Camera Enabled
                  </>
                ) : cameraPermissionStatus === 'requesting' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-700" />
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
