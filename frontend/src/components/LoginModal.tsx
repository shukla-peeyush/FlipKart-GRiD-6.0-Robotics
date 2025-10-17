import React, { useState } from 'react';
import { X, User, Lock } from 'lucide-react';
import { login, signup } from '../utils/api';
import type { User as UserType } from '../types';

interface LoginModalProps {
  onLogin: (user: UserType) => void;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onLogin, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignupMode, setIsSignupMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isSignupMode) {
        if (!name.trim()) {
          setError('Name is required for signup');
          return;
        }
        const user = await signup(name, email, password);
        onLogin(user);
        onClose();
      } else {
        const user = await login(email, password);
        onLogin(user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || `${isSignupMode ? 'Signup' : 'Login'} failed. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {isSignupMode ? 'Create Account' : 'Sign In'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Mode Toggle */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => {
                setIsSignupMode(false);
                setError('');
              }}
              className={`flex-1 text-center py-2 text-sm font-medium rounded-md transition-colors ${
                !isSignupMode 
                  ? 'bg-white text-gray-900 shadow' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignupMode(true);
                setError('');
              }}
              className={`flex-1 text-center py-2 text-sm font-medium rounded-md transition-colors ${
                isSignupMode 
                  ? 'bg-white text-gray-900 shadow' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignupMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Enter your full name"
                    required={isSignupMode}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder={isSignupMode ? "Choose a password (min 6 chars)" : "Enter your password"}
                  required
                  minLength={isSignupMode ? 6 : undefined}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isSignupMode ? 'Creating Account...' : 'Signing In...'}
                </div>
              ) : (
                isSignupMode ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          {/* Admin Account Info */}
          <div className="mt-6 pt-6 border-t">
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Pre-created admin account: admin@company.com / admin123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
