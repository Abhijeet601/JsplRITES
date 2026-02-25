import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, CameraOff, Aperture, AlertTriangle } from 'lucide-react';

const CameraCapture = ({ onCapture, buttonText = 'Capture Image' }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const startCamera = useCallback(async () => {
    setIsStarting(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 960, height: 720, facingMode: 'user' },
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
    } finally {
      setIsStarting(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsStreaming(false);
    }
  }, [stream]);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob && onCapture) {
          onCapture(blob);
        }
      },
      'image/jpeg',
      0.85
    );
  }, [onCapture]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {!isStreaming ? (
          <button
            onClick={startCamera}
            disabled={isStarting}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isStarting ? (
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Camera size={18} />
            )}
            {isStarting ? 'Starting Camera...' : 'Start Camera'}
          </button>
        ) : (
          <>
            <button
              onClick={captureImage}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow"
            >
              <Aperture size={18} />
              {buttonText}
            </button>

            <button
              onClick={stopCamera}
              className="flex items-center gap-2 border border-red-300 text-red-600 hover:bg-red-50 font-semibold px-4 py-2.5 rounded-xl"
            >
              <CameraOff size={18} />
              Stop Camera
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <div className="relative w-full overflow-hidden rounded-2xl border border-slate-300 bg-slate-900">
        {isStreaming && (
          <div className="absolute top-2 left-2 rounded-md bg-slate-900/75 text-[11px] text-white px-2 py-1 z-10">
            Keep face centered in frame
          </div>
        )}

        <video ref={videoRef} autoPlay playsInline muted className={`w-full h-auto ${isStreaming ? 'block' : 'hidden'}`} />
        <canvas ref={canvasRef} className="hidden" />

        {!isStreaming && (
          <div className="aspect-video flex items-center justify-center text-slate-300 text-sm px-4 text-center">
            Camera preview will appear here after you click Start Camera.
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CameraCapture;
