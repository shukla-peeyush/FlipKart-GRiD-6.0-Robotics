import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, Play, Pause } from 'lucide-react';

interface LiveDetectionModalProps {
  onClose: () => void;
}

const LiveDetectionModal: React.FC<LiveDetectionModalProps> = ({ onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [objectCount, setObjectCount] = useState<number>(0);
  const [fps, setFps] = useState<number>(0);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Live detection loop at 5 FPS (every 200ms)
  useEffect(() => {
    if (!isDetecting || !stream) return;

    const DETECTION_INTERVAL = 200; // 5 FPS = 200ms
    let intervalId: number;
    let lastTime = Date.now();
    let frameCount = 0;

    const detectLoop = async () => {
      if (!videoRef.current || !canvasRef.current || !displayCanvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const displayCanvas = displayCanvasRef.current;
      const context = canvas.getContext('2d');
      const displayContext = displayCanvas.getContext('2d');

      if (!context || !displayContext) return;

      try {
        // Set canvas sizes
        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          displayCanvas.width = video.videoWidth;
          displayCanvas.height = video.videoHeight;
        }

        // Draw current frame
        context.drawImage(video, 0, 0);

        // Convert to base64
        const frameData = canvas.toDataURL('image/jpeg', 0.8);

        // Send for detection with boxes
        const response = await fetch('http://localhost:5001/api/detect/live-count', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            frame: frameData,
            include_boxes: true 
          })
        });

        if (response.ok) {
          const data = await response.json();
          setObjectCount(data.count || 0);

          // Display annotated frame with boxes
          if (data.annotated_frame) {
            const img = new Image();
            img.onload = () => {
              displayContext.drawImage(img, 0, 0);
            };
            img.src = data.annotated_frame;
          }

          // Calculate FPS
          frameCount++;
          const currentTime = Date.now();
          if (currentTime - lastTime >= 1000) {
            setFps(frameCount);
            frameCount = 0;
            lastTime = currentTime;
          }
        }
      } catch (err) {
        console.error('Detection error:', err);
      }
    };

    // Start detection loop at 2 FPS
    intervalId = setInterval(detectLoop, DETECTION_INTERVAL);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isDetecting, stream]);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First try with environment camera (back camera)
      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'environment'
          }
        });
      } catch (err) {
        // If environment camera fails, try user camera (front camera)
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }
        });
      }

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
            .then(() => {
              setIsLoading(false);
              setIsDetecting(true); // Auto-start detection
            })
            .catch(_ => {
              setError('Failed to start video playback.');
              setIsLoading(false);
            });
        };
      }
    } catch (err: any) {
      setError(`Camera access denied: ${err.message || 'Please allow camera permissions in your browser.'}`);
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    // Stop detection first
    setIsDetecting(false);
    
    // Stop all tracks in the stream
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      setStream(null);
    }
    
    // Clear video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleDetection = () => {
    setIsDetecting(!isDetecting);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-700 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center space-x-3">
            <Camera className="w-6 h-6" />
            <div>
              <h3 className="text-lg font-semibold">Live Object Detection</h3>
              <p className="text-xs text-blue-100">Real-time counting with bounding boxes</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 p-1 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Detection Display */}
        <div className="flex-1 bg-black relative overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-lg">Starting camera...</p>
                <p className="text-sm text-gray-300 mt-2">Please allow camera access</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center text-white p-4 max-w-md">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8" />
                </div>
                <p className="text-lg font-semibold mb-2">Camera Access Error</p>
                <p className="mb-4 text-gray-300">{error}</p>
              </div>
            </div>
          )}

          {/* Hidden video element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="hidden"
          />

          {/* Hidden canvas for frame capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Display canvas with annotations */}
          <canvas
            ref={displayCanvasRef}
            className="w-full h-full object-contain"
          />

          {/* Live indicator */}
          {isDetecting && (
            <div className="absolute top-4 right-4 flex items-center space-x-2 bg-green-500 px-3 py-1.5 rounded-full shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-xs font-bold text-white">LIVE</span>
            </div>
          )}

          {/* Stats overlay */}
          <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-4 text-white">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">{objectCount}</div>
                <div className="text-xs text-gray-300">Objects Detected</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400">{fps}</div>
                <div className="text-xs text-gray-300">FPS</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${isDetecting ? 'text-green-400' : 'text-orange-400'}`}>
                  {isDetecting ? 'ON' : 'OFF'}
                </div>
                <div className="text-xs text-gray-300">Detection</div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 bg-gray-50 dark:bg-slate-700 border-t dark:border-slate-600">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-slate-300">
              <p className="font-medium">✓ Green boxes show detected objects</p>
              <p className="text-xs mt-1">✓ Numbers indicate object IDs</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={toggleDetection}
                disabled={!stream}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDetecting
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}>
                {isDetecting ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Start</span>
                  </>
                )}
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 text-gray-700 dark:text-slate-100 rounded-lg font-medium transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveDetectionModal;
