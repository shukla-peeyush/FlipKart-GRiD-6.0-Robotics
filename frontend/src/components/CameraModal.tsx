import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, RotateCcw } from 'lucide-react';

interface CameraModalProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Use back camera on mobile
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions.');
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to base64 image
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    onCapture(imageData);
    stopCamera();
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            Camera Capture
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Camera View */}
        <div className="relative bg-black">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p>Starting camera...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-white p-4">
                <p className="mb-4">{error}</p>
                <button 
                  onClick={startCamera}
                  className="btn-primary flex items-center mx-auto">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retry
                </button>
              </div>
            </div>
          )}

          {!isLoading && !error && (
            <>
              <video
                ref={videoRef}
                className="w-full h-auto max-h-96 object-cover"
                autoPlay
                playsInline
                muted
              />
              
              {/* Capture overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg opacity-50"></div>
                <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                  Position your image within the frame
                </div>
              </div>
            </>
          )}

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="p-4 flex items-center justify-center space-x-4">
          <button
            onClick={handleClose}
            className="btn-secondary">
            Cancel
          </button>
          
          <button
            onClick={capturePhoto}
            disabled={isLoading || !!error}
            className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
            <Camera className="w-4 h-4 mr-2" />
            Capture Photo
          </button>
        </div>

        {/* Tips */}
        <div className="px-4 pb-4 text-xs text-gray-500">
          <p>• Ensure good lighting for better analysis results</p>
          <p>• Hold camera steady and wait for focus</p>
          <p>• Make sure the entire product is visible in the frame</p>
        </div>
      </div>
    </div>
  );
};

export default CameraModal;
