import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, Play, Pause, Smartphone } from 'lucide-react';

interface LiveDetectionModalProps {
  onClose: () => void;
  useIPWebcam?: boolean;
  webcamUrl?: string;
}

const LiveDetectionModal: React.FC<LiveDetectionModalProps> = ({ 
  onClose,
  useIPWebcam = false,
  webcamUrl = 'http://100.111.108.142:8080'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ipWebcamImgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [objectCount, setObjectCount] = useState<number>(0);
  const [fps, setFps] = useState<number>(0);

  // Initialize camera based on mode
  useEffect(() => {
    if (useIPWebcam) {
      startIPWebcam();
    } else {
      startLaptopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [useIPWebcam]);


  // Preview loop - shows live feed only when NOT detecting
  useEffect(() => {
    if (!displayCanvasRef.current) return;
    if (isLoading || error) return;
    if (isDetecting) return; // Don't run preview when detecting

    let animationId: number;

    const previewLoop = () => {
      if (!displayCanvasRef.current) return;
      
      const displayCanvas = displayCanvasRef.current;
      const displayContext = displayCanvas.getContext('2d');
      
      if (!displayContext) return;

      if (useIPWebcam) {
        // Show IP Webcam feed
        if (ipWebcamImgRef.current && ipWebcamImgRef.current.complete) {
          displayCanvas.width = ipWebcamImgRef.current.naturalWidth;
          displayCanvas.height = ipWebcamImgRef.current.naturalHeight;
          displayContext.drawImage(ipWebcamImgRef.current, 0, 0);
        }
      } else {
        // Show laptop camera feed
        if (videoRef.current && videoRef.current.readyState >= 2) {
          displayCanvas.width = videoRef.current.videoWidth;
          displayCanvas.height = videoRef.current.videoHeight;
          displayContext.drawImage(videoRef.current, 0, 0);
        }
      }

      animationId = requestAnimationFrame(previewLoop);
    };

    previewLoop();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [useIPWebcam, isLoading, error, isDetecting]);

  // Live detection loop
  useEffect(() => {
    if (!isDetecting) return;

    const DETECTION_INTERVAL = 200; // 5 FPS
    let intervalId: number;
    let lastTime = Date.now();
    let frameCount = 0;

    const detectLoop = async () => {
      try {
        let frameData: string;

        if (useIPWebcam) {
          // IP Webcam mode
          if (!ipWebcamImgRef.current || !canvasRef.current) return;
          
          const img = ipWebcamImgRef.current;
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          
          if (!context || !img.complete) return;

          // Set canvas size to match image
          if (canvas.width !== img.naturalWidth) {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
          }

          // Draw current frame
          context.drawImage(img, 0, 0);
          frameData = canvas.toDataURL('image/jpeg', 0.8);
        } else {
          // Laptop camera mode
          if (!videoRef.current || !canvasRef.current) return;
          
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          
          if (!context) return;

          // Set canvas sizes
          if (canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          // Draw current frame
          context.drawImage(video, 0, 0);
          frameData = canvas.toDataURL('image/jpeg', 0.8);
        }

        // Send for detection with boxes
        const response = await fetch('http://localhost:5001/api/detect/live-count', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            frame: frameData,
            include_boxes: true 
          })
        });

        if (response.ok) {
          const data = await response.json();
          setObjectCount(data.count || 0);

          // Display annotated frame with boxes
          if (data.annotated_frame && displayCanvasRef.current) {
            const displayContext = displayCanvasRef.current.getContext('2d');
            if (displayContext) {
              const annotatedImg = new Image();
              annotatedImg.onload = () => {
                if (displayCanvasRef.current) {
                  displayCanvasRef.current.width = annotatedImg.naturalWidth;
                  displayCanvasRef.current.height = annotatedImg.naturalHeight;
                }
                displayContext.drawImage(annotatedImg, 0, 0);
              };
              annotatedImg.src = data.annotated_frame;
            }
          }

          // Calculate FPS
          frameCount++;
          const currentTime = Date.now();
          if (currentTime - lastTime >= 1000) {
            setFps(frameCount);
            frameCount = 0;
            lastTime = currentTime;
          }

          setError(null);
        }
      } catch (err) {
        console.error('Detection error:', err);
        if (useIPWebcam) {
          setError('Connection lost. Check if IP Webcam is running.');
        }
      }
    };

    // Start detection loop
    intervalId = setInterval(detectLoop, DETECTION_INTERVAL);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isDetecting, useIPWebcam, webcamUrl]);

  const startIPWebcam = () => {
    setIsLoading(true);
    setError(null);
    // Wait for video to actually load before starting detection
    // The onLoadedMetadata handler will set isLoading to false
  };

  const startLaptopCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try with environment camera (back camera)
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
            .catch(() => {
              setError('Failed to start video playback.');
              setIsLoading(false);
            });
        };
      }
    } catch (err: any) {
      setError(`Camera access denied: ${err.message || 'Please allow camera permissions.'}`);
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    setIsDetecting(false);
    
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      setStream(null);
    }
    
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
        <div className={`flex items-center justify-between p-4 border-b dark:border-slate-700 ${
          useIPWebcam 
            ? 'bg-gradient-to-r from-green-600 to-emerald-600'
            : 'bg-gradient-to-r from-blue-600 to-purple-600'
        } text-white`}>
          <div className="flex items-center space-x-3">
            {useIPWebcam ? (
              <Smartphone className="w-6 h-6" />
            ) : (
              <Camera className="w-6 h-6" />
            )}
            <div>
              <h3 className="text-lg font-semibold">
                {useIPWebcam ? 'IP Webcam Live Detection' : 'Live Object Detection'}
              </h3>
              <p className="text-xs text-blue-100">
                {useIPWebcam 
                  ? 'Real-time detection via smartphone camera'
                  : 'Real-time counting with bounding boxes'}
              </p>
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
          {isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                <p className="text-lg">
                  {useIPWebcam ? 'Connecting to IP Webcam...' : 'Starting camera...'}
                </p>
                <p className="text-sm text-gray-300 mt-2">
                  {useIPWebcam ? webcamUrl : 'Please allow camera access'}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
              <div className="text-center text-white p-4 max-w-md">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8" />
                </div>
                <p className="text-lg font-semibold mb-2">Connection Error</p>
                <p className="mb-4 text-gray-300">{error}</p>
                {useIPWebcam && (
                  <div className="text-xs text-gray-400 bg-black/50 p-3 rounded">
                    <p className="mb-2">Make sure:</p>
                    <ul className="text-left space-y-1">
                      <li>• IP Webcam app is running on phone</li>
                      <li>• Server is started in the app</li>
                      <li>• Both devices on same WiFi</li>
                      <li>• URL is correct: {webcamUrl}</li>
                    </ul>
                  </div>
                )}
                <button
                  onClick={() => {
                    setError(null);
                    setIsDetecting(true);
                  }}
                  className="mt-4 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors">
                  Retry Connection
                </button>
              </div>
            </div>
          )}

          {/* Hidden video element for laptop camera */}
          {!useIPWebcam && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="hidden"
            />
          )}

          {/* IP Webcam MJPEG stream as img */}
          {useIPWebcam && (
            <img
              ref={ipWebcamImgRef}
              src={`${webcamUrl}/video`}
              alt="IP Webcam Stream"
              className="hidden"
              onLoad={() => {
                console.log('IP Webcam stream loaded');
                setIsLoading(false);
                setError(null);
                setIsDetecting(true); // Auto-start detection
              }}
              onError={(e) => {
                console.error('IP Webcam stream error:', e);
                setError('Cannot connect to IP Webcam. Make sure the app is running.');
                setIsLoading(false);
              }}
            />
          )}

          {/* Hidden canvas for frame capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Display canvas with annotations */}
          <canvas
            ref={displayCanvasRef}
            className="w-full h-full object-contain"
          />

          {/* Live indicator */}
          {isDetecting && !error && (
            <div className="absolute top-4 right-4 flex items-center space-x-2 bg-green-500 px-3 py-1.5 rounded-full shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-xs font-bold text-white">LIVE</span>
            </div>
          )}

          {/* Camera source badge */}
          <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${useIPWebcam ? 'bg-green-400' : 'bg-blue-400'}`} />
              <span className="text-xs text-white font-medium">
                {useIPWebcam ? 'IP Webcam' : 'Laptop Camera'}
              </span>
            </div>
          </div>

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
              <p className="text-xs mt-1">
                {useIPWebcam 
                  ? '✓ Using smartphone camera at ~5 FPS' 
                  : '✓ Using laptop camera at ~5 FPS'}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={toggleDetection}
                disabled={!!error}
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
