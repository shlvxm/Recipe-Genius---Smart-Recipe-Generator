
import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (base64Image: string) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please ensure you've granted permission.");
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        onCapture(dataUrl);
      }
    }
  };

  const flipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="absolute top-4 right-4 z-10">
        <button 
          onClick={onClose}
          className="p-3 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-md transition-all"
        >
          <X size={24} />
        </button>
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-4 text-white p-6 text-center">
          <AlertCircle size={48} className="text-red-500" />
          <p className="text-lg font-medium">{error}</p>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-white text-black rounded-lg font-bold"
          >
            Go Back
          </button>
        </div>
      ) : (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            onLoadedMetadata={() => setIsCameraReady(true)}
            className="w-full h-full object-cover"
          />
          
          <div className="absolute bottom-10 left-0 right-0 flex items-center justify-around px-10">
            <button 
              onClick={flipCamera}
              className="p-4 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-md transition-all"
            >
              <RefreshCw size={24} />
            </button>

            <button 
              onClick={handleCapture}
              disabled={!isCameraReady}
              className="group relative p-1 rounded-full bg-white transition-transform active:scale-95 disabled:opacity-50"
            >
              <div className="p-4 rounded-full border-4 border-black bg-white">
                <Camera size={32} className="text-black" />
              </div>
            </button>

            <div className="w-14" /> {/* Spacer to center the capture button */}
          </div>
        </div>
      )}
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
