import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import UploadArea from './components/UploadArea';
import FeatureSelector from './components/FeatureSelector';
import ResultCard from './components/ResultCard';
import CameraModal from './components/CameraModal';
import LoginModal from './components/LoginModal';
import EditProfileModal from './components/EditProfileModal';
import Dashboard from './components/Dashboard';
import LiveDetectionModal from './components/LiveDetectionModal';
import Toast from './components/Toast';
import type { ToastMessage } from './components/Toast';
import { getCurrentUser, logout as apiLogout, analyzeImage, getHistory, deleteHistoryItem } from './utils/api';
import type { NavigationPage, ServiceType, InputMethod, AnalysisResponse, User, HistoryItem } from './types';

function App() {
  // Application state
  const [currentPage, setCurrentPage] = useState<NavigationPage>('NewTest');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [inputMethod, setInputMethod] = useState<InputMethod>('Upload');
  const [selectedServices, setSelectedServices] = useState<ServiceType[]>(['OCR', 'ProductCount', 'Freshness', 'BrandRecognition']);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResponse | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showLiveDetectionModal, setShowLiveDetectionModal] = useState(false);
  const [useIPWebcamForCamera, setUseIPWebcamForCamera] = useState(false);
  const [useIPWebcamForLiveDetection, setUseIPWebcamForLiveDetection] = useState(false);
  const [ipWebcamUrl, setIpWebcamUrl] = useState(() => {
    const saved = localStorage.getItem('ipWebcamUrl');
    return saved || 'http://100.111.108.142:8080';
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Toast helper function
  const showToast = (type: 'success' | 'error' | 'info', message: string, duration?: number) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message, duration }]);
  };

  // Save IP Webcam URL to localStorage
  const handleSaveIpWebcamUrl = () => {
    localStorage.setItem('ipWebcamUrl', ipWebcamUrl);
    showToast('success', 'IP Webcam URL saved successfully!');
  };

  // Handle dark mode toggle
  const handleDarkModeToggle = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    localStorage.setItem('darkMode', JSON.stringify(newValue));
    showToast('success', `${newValue ? 'Dark' : 'Light'} mode enabled`);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Check authentication status on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setCurrentUser(user);
          setIsLoggedIn(true);
          // Load user's history
          loadUserHistory();
        } else {
          setShowLoginModal(true);
        }
      } catch (error) {
        console.error('Failed to check auth status:', error);
        setShowLoginModal(true);
      }
    };

    checkAuthStatus();
  }, []);

  // Event listeners for Header dropdown actions
  useEffect(() => {
    const handleEditProfile = () => {
      setShowEditProfileModal(true);
    };

    const handleLogoutEvent = () => {
      handleLogout();
    };

    window.addEventListener('editProfile', handleEditProfile);
    window.addEventListener('logout', handleLogoutEvent);

    return () => {
      window.removeEventListener('editProfile', handleEditProfile);
      window.removeEventListener('logout', handleLogoutEvent);
    };
  }, []);

  // Load user history
  const loadUserHistory = async () => {
    try {
      const historyData = await getHistory();
      
      // Convert to HistoryItem format
      const historyItems: HistoryItem[] = historyData
        .filter(item => item.id !== undefined)
        .map(item => ({
          ...item,
          id: item.id!,
          userId: currentUser?.id || '',
          imageName: item.imageName || 'Analysis Result',
          savedToHistory: true
        }));
      
      setHistory(historyItems);
    } catch (error) {
      console.error('Failed to load history:', error);
      // If authentication error, redirect to login
      if (error instanceof Error && error.message.includes('401')) {
        setIsLoggedIn(false);
        setCurrentUser(null);
        setShowLoginModal(true);
      }
    }
  };

  // Handlers
  const handleNavigation = (page: NavigationPage) => {
    setCurrentPage(page);
    
    // Load history when navigating to History page
    if (page === 'History') {
      loadUserHistory();
    }
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    setCapturedImage(null);
  };

  const handleOpenCamera = () => {
    if (inputMethod === 'LiveDetection') {
      setShowLiveDetectionModal(true);
    } else {
      setShowCameraModal(true);
    }
  };

  const handleCameraCapture = (imageData: string) => {
    setCapturedImage(imageData);
    setSelectedFile(null);
    setShowCameraModal(false);
  };

  const handleServiceToggle = (service: ServiceType) => {
    setSelectedServices(prev => {
      if (prev.includes(service)) {
        return prev.filter(s => s !== service);
      } else {
        return [...prev, service];
      }
    });
  };

  const handleAnalyze = async () => {
    if (selectedServices.length === 0) {
      showToast('error', 'Please select at least one service');
      return;
    }
    
    if (!selectedFile && !capturedImage) {
      showToast('error', 'Please select an image to analyze');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const response = await analyzeImage(
        selectedFile,
        capturedImage,
        selectedServices,
        () => {}
      );
      
      setAnalysisResults(response);
      showToast('success', 'Analysis completed successfully!');
      
      // Reload history after successful analysis (results are already saved by backend)
      loadUserHistory();
    } catch (error: any) {
      console.error('Analysis error:', error);
      showToast('error', `Analysis failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };
  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setCurrentUser(null);
      setIsLoggedIn(false);
      setHistory([]);
      setAnalysisResults(null);
      setSelectedFile(null);
      setCapturedImage(null);
      setCurrentPage('NewTest');
    }
  };

  // Authentication handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setShowLoginModal(false);
    // Load user's history after login
    loadUserHistory();
  };

  const handleEditProfile = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setShowEditProfileModal(false);
    // Force re-render by creating new object
    setCurrentUser({...updatedUser});
  };


  const handleDeleteHistoryItem = async (historyId: number, index: number) => {
    if (!confirm('Are you sure you want to delete this analysis? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteHistoryItem(historyId);
      setHistory(prev => prev.filter((_, i) => i !== index));
      showToast('success', 'Analysis deleted successfully!');
    } catch (error: any) {
      console.error('Failed to delete history item:', error);
      showToast('error', `Failed to delete analysis: ${error.message}`);
    }
  };

  const handleViewDetails = (item: HistoryItem) => {
    setSelectedHistoryItem(item);
    setShowDetailsModal(true);
  };

  const handleResultAction = (service: ServiceType, action: string) => {
    switch (action) {
      case 'copy':
        // Copy text to clipboard (for OCR)
        if (analysisResults?.results.ocr?.text) {
          navigator.clipboard.writeText(analysisResults.results.ocr.text);
          showToast('success', 'Text copied to clipboard!');
        }
        break;
      case 'export':
        // Export result as JSON
        const dataStr = JSON.stringify(analysisResults, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `analysis-${service}-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
        break;
    }
  };

  // Check if analysis can be started
  const canAnalyze = selectedServices.length > 0 && 
                     (selectedFile || capturedImage) &&
                     !isAnalyzing;

  // Show login screen if not authenticated
  if (!isLoggedIn || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-white overflow-hidden relative">
        {/* Animated Background */}
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(120, 200, 255, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 60% 20%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(255, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 60%, rgba(120, 200, 255, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 40% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 20% 40%, rgba(120, 200, 255, 0.3) 0%, transparent 50%)",
            ],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 50 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute bg-white/20 rounded-full blur-sm"
              style={{
                width: Math.random() * 4 + 1,
                height: Math.random() * 4 + 1,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                x: [0, Math.random() * 50 - 25, 0],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 20 + 10,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Glass Overlay */}
        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" />
        
        <div className="relative z-10 flex h-screen items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              className="flex items-center justify-center w-24 h-24 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-2xl mx-auto mb-8 shadow-2xl"
              whileHover={{ scale: 1.1, rotate: 5 }}
              animate={{ 
                boxShadow: [
                  "0 0 20px rgba(6, 182, 212, 0.3)",
                  "0 0 40px rgba(147, 51, 234, 0.4)", 
                  "0 0 20px rgba(6, 182, 212, 0.3)"
                ]
              }}
              transition={{ 
                boxShadow: { duration: 2, repeat: Infinity },
                scale: { duration: 0.2 },
                rotate: { duration: 0.2 }
              }}
            >
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4"
            >
              QualityAI
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-gray-300 text-xl mb-12 max-w-md mx-auto"
            >
              Smart Quality Test System
              <br />
              <span className="text-sm text-gray-400">Please sign in to access the AI analysis platform</span>
            </motion.p>
            
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              onClick={() => setShowLoginModal(true)}
              className="relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-semibold text-white shadow-2xl transition-all duration-300 group overflow-hidden"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Button glow effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-300"
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
              <span className="relative z-10">Enter Platform</span>
            </motion.button>
          </motion.div>
        </div>
        
        {/* Login Modal */}
        <AnimatePresence>
          {showLoginModal && (
            <LoginModal
              onLogin={handleLogin}
              onClose={() => setShowLoginModal(false)}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Render different page content
  const renderPageContent = () => {
    switch (currentPage) {
      case 'NewTest':
        return (
          <div className="space-y-6">
            {/* Control Panel */}
            <div className="space-y-6">
              <UploadArea
                onFile={handleFileSelect}
                onOpenCamera={handleOpenCamera}
                selectedFile={selectedFile}
                inputMethod={inputMethod}
                onInputMethodChange={setInputMethod}
                capturedImage={capturedImage}
                isUploading={isAnalyzing}
                useIPWebcamForCamera={useIPWebcamForCamera}
                onToggleIPWebcamForCamera={() => setUseIPWebcamForCamera(!useIPWebcamForCamera)}
                useIPWebcamForLiveDetection={useIPWebcamForLiveDetection}
                onToggleIPWebcamForLiveDetection={() => setUseIPWebcamForLiveDetection(!useIPWebcamForLiveDetection)}
                ipWebcamUrl={ipWebcamUrl}
                onIpWebcamUrlChange={setIpWebcamUrl}
                onSaveIpWebcamUrl={handleSaveIpWebcamUrl}
              />
              
              <FeatureSelector
                selectedServices={selectedServices}
                onToggle={handleServiceToggle}
                disabled={isAnalyzing}
              />
              
              {/* Action buttons */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-3">
                  <button
                    className={`btn-primary ${!canAnalyze ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={handleAnalyze}
                    disabled={!canAnalyze}>
                    {isAnalyzing ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Analyzing...</span>
                      </div>
                    ) : (
                      <span>Analyze Image</span>
                    )}
                  </button>
                  
                  {canAnalyze && (
                    <button className="btn-secondary" onClick={handleAnalyze}>
                      Analyze & Save
                    </button>
                  )}
                </div>
                
                {selectedServices.length > 0 && (
                  <div className="text-sm text-gray-600 dark:text-slate-400">
                    <span>Est. time: ~</span>
                    <span className="font-medium">
                      {selectedServices.length * 3}s
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Results Section */}
            {analysisResults && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Analysis Results</h2>
                  <div className="flex items-center space-x-2">
                    <button className="btn-secondary text-sm">
                      Download Report
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {selectedServices.map((service) => (
                    <ResultCard
                      key={service}
                      service={service}
                      status="Success"
                      result={analysisResults.results}
                      onAction={(action) => handleResultAction(service, action)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'Dashboard':
        return (
          <Dashboard 
            userName={currentUser.name}
            history={history}
            onNavigate={handleNavigation}
            showToast={showToast}
          />
        );

      case 'History':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Analysis History</h2>
              <div className="text-sm text-gray-500 dark:text-slate-400">
                {history.length} {history.length === 1 ? 'analysis' : 'analyses'}
              </div>
            </div>
            
            {history.length === 0 ? (
              <div className="card">
                <p className="text-gray-500 dark:text-slate-400 text-center py-8">No analysis history available yet.</p>
                <p className="text-gray-400 dark:text-slate-500 text-center text-sm">
                  Complete an analysis and save it to see it here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item, index) => (
                  <div key={item.jobId} className="card">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-slate-100">{item.imageName}</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                          {new Date(item.metadata.processedAt).toLocaleString()}
                        </p>
                      </div>
                      <span className="status-badge-success">{item.status}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {item.results.ocr && (
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                          <div className="font-medium text-blue-900 dark:text-blue-200">OCR</div>
                          <div className="text-blue-600 dark:text-blue-400">Text Extracted</div>
                        </div>
                      )}
                      {item.results.productCount && (
                        <div className="text-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                          <div className="font-medium text-green-900 dark:text-green-200">Count</div>
                          <div className="text-green-600 dark:text-green-400">{item.results.productCount.total} Objects Detected</div>
                        </div>
                      )}
                      {item.results.freshness && (
                        <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                          <div className="font-medium text-orange-900 dark:text-orange-200">Freshness</div>
                          <div className="text-orange-600 dark:text-orange-400">Score: {item.results.freshness.score}</div>
                        </div>
                      )}
                      {item.results.brand && (
                        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                          <div className="font-medium text-purple-900 dark:text-purple-200">Brand</div>
                          <div className="text-purple-600 dark:text-purple-400">Recognized</div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                      <div className="text-xs text-gray-500 dark:text-slate-500">
                        Job ID: {item.jobId}
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          className="btn-secondary text-xs py-1 px-2"
                          onClick={() => handleViewDetails(item)}>
                          View Details
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-700 text-xs px-2"
                          onClick={() => handleDeleteHistoryItem(item.id, index)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'Settings':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Settings</h2>
            
            {/* User Profile */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-4">User Profile</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xl font-semibold text-blue-600">
                      {currentUser.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-slate-100">{currentUser.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{currentUser.email}</p>
                  </div>
                  <button 
                    className="btn-secondary text-sm"
                    onClick={() => setShowEditProfileModal(true)}>
                    Edit Profile
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Member Since
                    </label>
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      {new Date(currentUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Last Login
                    </label>
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      {currentUser.lastLogin ? new Date(currentUser.lastLogin).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Application Settings */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-4">Application Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-slate-100">Dark Mode</h4>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Toggle between light and dark theme</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={darkMode}
                      onChange={handleDarkModeToggle}
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-slate-100">Default Services</h4>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Services to select by default for new analyses</p>
                  </div>
                  <button className="btn-secondary text-sm">
                    Configure
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-slate-100">API Endpoint</h4>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Backend server URL for analysis requests</p>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-slate-400 font-mono">
                    http://localhost:5000
                  </span>
                </div>
              </div>
            </div>
            
            {/* Analytics */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-4">Your Analytics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">{history.length}</div>
                  <div className="text-sm text-gray-500 dark:text-slate-400">Total Analyses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {history.filter(h => h.status === 'Success').length}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-slate-400">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {history.length > 0 ? Math.round((history.filter(h => h.status === 'Success').length / history.length) * 100) : 0}%
                  </div>
                  <div className="text-sm text-gray-500 dark:text-slate-400">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {history.filter(h => h.results.ocr).length}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-slate-400">OCR Uses</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'Help':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Smart Quality Test System</h1>
                <p className="text-gray-600 dark:text-slate-400">Help & Documentation</p>
              </div>
            </div>

            {/* Product Overview */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">About the Product</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 dark:text-slate-300 mb-4">
                  The Smart Quality Test System is an AI-powered platform designed to analyze product quality through advanced computer vision and machine learning techniques. 
                  It provides comprehensive analysis capabilities including text recognition, product counting, freshness assessment, and brand verification.
                </p>
                <p className="text-gray-700 dark:text-slate-300">
                  This system is built for businesses and quality control professionals who need fast, accurate, and automated product analysis to ensure quality standards and improve operational efficiency.
                </p>
              </div>
            </div>

            {/* Getting Started */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">Getting Started</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-slate-100">Create an Account</h3>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Sign up with your email and password to access the platform.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-slate-100">Upload or Capture Images</h3>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Use the camera feature or upload product images for analysis.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-slate-100">Select Analysis Services</h3>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Choose which analysis services you want to run on your image.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">4</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-slate-100">Review Results</h3>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Analyze the results and save them to your history for future reference.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Available Services */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">Available Services</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-slate-100">OCR (Text Recognition)</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-slate-400">Extracts text from product labels, packaging, and documents. Useful for reading product names, expiry dates, ingredients, and other textual information.</p>
                </div>

                <div className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-slate-100">Product Count</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-slate-400">Automatically counts the number of products in an image. Perfect for inventory management and quality control processes.</p>
                </div>

                <div className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                      </svg>
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-slate-100">Freshness Detection</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-slate-400">Analyzes product freshness and quality condition. Provides freshness scores and identifies potential quality issues in perishable goods.</p>
                </div>

                <div className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-slate-100">Brand Recognition</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-slate-400">Identifies and verifies product brands and logos. Helps detect counterfeit products and ensures brand authenticity.</p>
                </div>
              </div>
            </div>

            {/* How to Use */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">How to Use Each Feature</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-slate-100 mb-2">📸 Image Input</h3>
                  <ul className="text-sm text-gray-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                    <li><strong>Camera:</strong> Click "Open Camera" to take a live photo. Ensure good lighting and hold the camera steady.</li>
                    <li><strong>Upload:</strong> Drag and drop files or click to browse. Supports JPG, PNG, and other common image formats.</li>
                    <li><strong>Tips:</strong> Use high-resolution images for better accuracy. Ensure products are clearly visible and well-lit.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 dark:text-slate-100 mb-2">⚙️ Service Selection</h3>
                  <ul className="text-sm text-gray-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                    <li>Select one or multiple services based on your analysis needs</li>
                    <li>Each service runs independently and provides specific insights</li>
                    <li>Processing time increases with the number of selected services</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 dark:text-slate-100 mb-2">📊 Results & Actions</h3>
                  <ul className="text-sm text-gray-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                    <li><strong>Copy:</strong> Copy OCR text results to clipboard</li>
                    <li><strong>Save:</strong> Save analysis results to your personal history</li>
                    <li><strong>Export:</strong> Download results as JSON for external use</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Best Practices */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">Best Practices</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-slate-100 mb-2 text-green-600">✅ Do</h3>
                  <ul className="text-sm text-gray-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                    <li>Use well-lit, clear images</li>
                    <li>Ensure products fill most of the frame</li>
                    <li>Use stable camera positioning</li>
                    <li>Clean product surfaces for better text recognition</li>
                    <li>Take multiple angles for complex products</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-slate-100 mb-2 text-red-600">❌ Avoid</h3>
                  <ul className="text-sm text-gray-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                    <li>Blurry or low-resolution images</li>
                    <li>Poor lighting or shadows</li>
                    <li>Cluttered backgrounds</li>
                    <li>Partial product views</li>
                    <li>Reflective surfaces that cause glare</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">Support & Contact</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-slate-100 mb-2">System Information</h3>
                  <div className="text-sm text-gray-600 dark:text-slate-400 space-y-1">
                    <p><strong>Version:</strong> v1.0.0</p>
                    <p><strong>Backend:</strong> Flask + Python</p>
                    <p><strong>Frontend:</strong> React + TypeScript</p>
                    <p><strong>Database:</strong> SQLite</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-slate-100 mb-2">Troubleshooting</h3>
                  <div className="text-sm text-gray-600 dark:text-slate-400 space-y-1">
                    <p><strong>Login Issues:</strong> Clear browser cache and try again</p>
                    <p><strong>Upload Problems:</strong> Check file size and format</p>
                    <p><strong>Slow Processing:</strong> Reduce image size or try fewer services</p>
                    <p><strong>Camera Not Working:</strong> Allow camera permissions in browser</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigation}
        collapsed={sidebarCollapsed}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          key={currentUser?.avatar || 'no-avatar'}
          currentPage={currentPage}
          onToggleSidebar={handleToggleSidebar}
          currentUser={currentUser}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 dark:bg-slate-900">
          {renderPageContent()}
        </main>
      </div>

      {/* Camera Modal */}
      <AnimatePresence>
        {showCameraModal && (
          <CameraModal
            onCapture={handleCameraCapture}
            onClose={() => setShowCameraModal(false)}
            useIPWebcam={useIPWebcamForCamera}
            webcamUrl={ipWebcamUrl}
          />
        )}
      </AnimatePresence>

      {/* Live Detection Modal */}
      <AnimatePresence>
        {showLiveDetectionModal && (
          <LiveDetectionModal
            onClose={() => setShowLiveDetectionModal(false)}
            useIPWebcam={useIPWebcamForLiveDetection}
            webcamUrl={ipWebcamUrl}
          />
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfileModal && currentUser && (
          <EditProfileModal
            user={currentUser}
            onSave={handleEditProfile}
            onClose={() => setShowEditProfileModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedHistoryItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Analysis Details</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedHistoryItem.imageName} • {new Date(selectedHistoryItem.metadata.processedAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Only show services that have results */}
                {selectedHistoryItem.results.ocr && (
                  <div className="card">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </div>
                      <h3 className="font-medium text-gray-900">OCR (Text Recognition)</h3>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                      <p className="whitespace-pre-wrap">{selectedHistoryItem.results.ocr.text || 'No text detected'}</p>
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <button 
                        className="btn-secondary text-xs"
                      onClick={() => {
                        if (selectedHistoryItem.results.ocr?.text) {
                          navigator.clipboard.writeText(selectedHistoryItem.results.ocr.text);
                          showToast('success', 'Text copied to clipboard!');
                        }
                      }}>
                        Copy Text
                      </button>
                    </div>
                  </div>
                )}

                {selectedHistoryItem.results.productCount && (
                  <div className="card">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                      </div>
                      <h3 className="font-medium text-gray-900">Product Count</h3>
                    </div>
                    <div className="text-center py-4">
                      <div className="text-3xl font-bold text-green-600">
                        {selectedHistoryItem.results.productCount.total}
                      </div>
                      <div className="text-sm text-gray-500">Products Detected</div>
                    </div>
                    {selectedHistoryItem.results.productCount.detections && selectedHistoryItem.results.productCount.detections.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Detections:</h4>
                        <div className="space-y-1">
                          {selectedHistoryItem.results.productCount.detections.map((detection, idx) => (
                            <div key={idx} className="text-xs bg-gray-50 rounded p-2">
                              <span className="font-medium">{detection.label}</span>
                              <span className="text-gray-500 ml-2">
                                ({Math.round(detection.confidence * 100)}% confidence)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedHistoryItem.results.freshness && (
                  <div className="card">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                        </svg>
                      </div>
                      <h3 className="font-medium text-gray-900">Freshness Detection</h3>
                    </div>
                    <div className="text-center py-4">
                      <div className="text-3xl font-bold text-orange-600">
                        {selectedHistoryItem.results.freshness.score}
                      </div>
                      <div className="text-sm text-gray-500">Freshness Score</div>
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedHistoryItem.results.freshness.label === 'Fresh' ? 'bg-green-100 text-green-800' :
                          selectedHistoryItem.results.freshness.label === 'Not Fresh' ? 'bg-red-100 text-red-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {selectedHistoryItem.results.freshness.label}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedHistoryItem.results.brand && (
                  <div className="card">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="font-medium text-gray-900">Brand Recognition</h3>
                    </div>
                    {selectedHistoryItem.results.brand.matches && selectedHistoryItem.results.brand.matches.length > 0 ? (
                      <div className="space-y-2">
                        {selectedHistoryItem.results.brand.matches.map((match, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">{match.brand}</span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                match.isCounterfeit ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {match.isCounterfeit ? 'Counterfeit' : 'Authentic'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              Confidence: {Math.round(match.confidence * 100)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No brands detected
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Job ID: {selectedHistoryItem.jobId}</p>
                    <p className="text-sm text-gray-500">Status: {selectedHistoryItem.status}</p>
                  </div>
                  <button 
                    className="btn-secondary text-sm"
                    onClick={() => {
                      const dataStr = JSON.stringify(selectedHistoryItem, null, 2);
                      const dataBlob = new Blob([dataStr], {type: 'application/json'});
                      const url = URL.createObjectURL(dataBlob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `analysis-${selectedHistoryItem.jobId}.json`;
                      link.click();
                      URL.revokeObjectURL(url);
                    }}>
                    Export Data
                  </button>
                </div>
              </div>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
