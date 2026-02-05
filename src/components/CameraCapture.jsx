import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, CameraOff, Aperture, AlertTriangle } from 'lucide-react';

const CameraCapture = ({ onCapture, buttonText = 'Capture Image' }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      setStream(mediaStream);
      setIsStreaming(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
      console.error('Camera access error:', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsStreaming(false);
    }
  }, [stream]);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = useCallback(() => {
    if (!stream) return;
    chunksRef.current = [];
    try {
      const options = { mimeType: 'video/webm;codecs=vp9' };
      const mr = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || 'video/webm' });
        if (onCapture) onCapture(blob);
        chunksRef.current = [];
        setIsRecording(false);
      };

      mr.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Recording start error:', err);
      setError('Recording is not supported in this browser');
    }
  }, [stream, onCapture]);

  const stopRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') {
      mr.stop();
      mediaRecorderRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      {/* CONTROLS */}
      <div className="mb-4 flex flex-wrap gap-3">
        {!isStreaming ? (
          <button
            onClick={startCamera}
            className="flex items-center gap-2
              bg-gradient-to-r from-blue-600 to-green-600
              hover:from-blue-700 hover:to-green-700
              text-white font-semibold px-5 py-2 rounded-xl shadow"
          >
            <Camera size={18} />
            Start Camera
          </button>
        ) : (
          <>
            <button
              onClick={captureImage}
              className="flex items-center gap-2
                bg-green-600 hover:bg-green-700
                text-white font-semibold px-5 py-2 rounded-xl shadow"
            >
              <Aperture size={18} />
              {buttonText}
            </button>

            <button
              onClick={stopCamera}
              className="flex items-center gap-2
                border border-red-300 text-red-600
                hover:bg-red-50
                font-semibold px-5 py-2 rounded-xl"
            >
              <CameraOff size={18} />
              Stop Camera
            </button>
          </>
        )}
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-4 flex items-center gap-2
          bg-red-50 border border-red-300
          text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* VIDEO */}
      <div className="relative w-full overflow-hidden rounded-xl border border-gray-300 bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-auto ${isStreaming ? 'block' : 'hidden'}`}
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {!isStreaming && (
        <p className="text-sm text-gray-500 mt-3">
          Click <b>Start Camera</b> to begin face capture
        </p>
      )}
    </motion.div>
  );
};

export default CameraCapture;
