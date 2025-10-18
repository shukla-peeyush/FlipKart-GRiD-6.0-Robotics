import React, { useState, useRef } from 'react';
import { Upload, Camera, X, Check } from 'lucide-react';
import type { InputMethod } from '../types';

interface UploadAreaProps {
  onFile: (file: File | null) => void;
  onOpenCamera: () => void;
  selectedFile: File | null;
  inputMethod: InputMethod;
  onInputMethodChange: (method: InputMethod) => void;
  capturedImage: string | null;
  isUploading?: boolean;
}

const UploadArea: React.FC<UploadAreaProps> = ({
  onFile,
  onOpenCamera,
  selectedFile,
  inputMethod,
  onInputMethodChange,
  capturedImage,
  isUploading = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        onFile(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFile(files[0]);
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const borderStyle = isDragOver
    ? "border-blue-400 bg-blue-50"
    : isUploading
    ? "border-gray-300 bg-gray-50"
    : "border-gray-300 hover:border-gray-400";

  return (
    <div className="card">
      <div className="space-y-6">
        {/* Input method selector */}
        <div className="flex items-center justify-center space-x-3">
          <button
            onClick={() => onInputMethodChange('Upload')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              inputMethod === 'Upload' 
                ? "bg-blue-100 text-blue-700" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            <div className="flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Upload Image</span>
            </div>
          </button>
          
          <button
            onClick={() => onInputMethodChange('Camera')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              inputMethod === 'Camera' 
                ? "bg-blue-100 text-blue-700" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            <div className="flex items-center space-x-2">
              <Camera className="w-4 h-4" />
              <span>Capture Photo</span>
            </div>
          </button>
          
          <button
            onClick={() => onInputMethodChange('LiveDetection')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              inputMethod === 'LiveDetection' 
                ? "bg-blue-100 text-blue-700" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            <div className="flex items-center space-x-2">
              <Camera className="w-4 h-4" />
              <span>Live Detection</span>
            </div>
          </button>
        </div>

        {inputMethod === 'Upload' ? (
          <div
            className={`rounded-lg border-2 border-dashed p-8 flex flex-col items-center gap-4 cursor-pointer transition-all ${borderStyle}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClickUpload}>
            
            {isUploading ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            ) : (
              <Upload className="w-12 h-12 text-gray-400" />
            )}
            
            <div className="text-center">
              <p className="text-lg font-medium text-gray-700">
                {isUploading ? "Processing..." : "Drop image here or click to upload"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Supports JPG, PNG, WEBP up to 10MB
              </p>
            </div>

            {!isUploading && (
              <div className="flex gap-3">
                <button className="btn-primary" onClick={(e) => { e.stopPropagation(); handleClickUpload(); }}>
                  Choose File
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : inputMethod === 'Camera' ? (
          // Camera capture section
          <div className="text-center space-y-4">
            <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-8 border-2 border-dashed border-gray-300 dark:border-slate-600">
              <Camera className="w-16 h-16 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 dark:text-slate-200 mb-2">
                Camera Ready
              </p>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                Click below to open camera and capture an image
              </p>
              <button 
                type="button"
                className="btn-primary"
                onClick={onOpenCamera}>
                Open Camera
              </button>
            </div>
          </div>
        ) : (
          // Live Detection section
          <div className="text-center space-y-4">
            <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-8 border-2 border-dashed border-green-300 dark:border-green-700">
              <Camera className="w-16 h-16 text-green-500 mx-auto mb-4 animate-pulse" />
              <p className="text-lg font-medium text-gray-700 dark:text-slate-200 mb-2">
                Live Object Detection
              </p>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                Real-time object counting with bounding boxes
              </p>
              <button 
                className="btn-primary bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                onClick={onOpenCamera}>
                Start Live Detection
              </button>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">✨ Live Detection Features:</p>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Real-time object counting</li>
                <li>• Bounding boxes around detected objects</li>
                <li>• Live FPS display</li>
                <li>• Pause/Resume functionality</li>
              </ul>
            </div>
          </div>
        )}

        {/* Selected file preview */}
        {(selectedFile || capturedImage) && (
          <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                  {selectedFile ? selectedFile.name : "Captured Image"}
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {selectedFile 
                    ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                    : "Ready for analysis"
                  }
                </p>
              </div>
              <button 
                className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
                onClick={() => onFile(null)}
                aria-label="Remove file">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadArea;
