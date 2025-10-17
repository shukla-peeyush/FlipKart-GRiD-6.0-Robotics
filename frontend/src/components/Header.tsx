import React from 'react';
import { Menu, User } from 'lucide-react';
import type { NavigationPage, User as UserType } from '../types';

interface HeaderProps {
  currentPage: NavigationPage;
  onToggleSidebar: () => void;
  currentUser?: UserType | null;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onToggleSidebar, currentUser }) => {
  const pageTitle = {
    Dashboard: 'Dashboard',
    NewTest: 'New Test',
    History: 'History',
    Settings: 'Settings',
    Help: 'Help & Documentation'
  }[currentPage];

  return (
    <header className="bg-gradient-to-r from-white to-blue-50 border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Toggle sidebar">
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Smart Quality Test System</h1>
              <p className="text-sm text-gray-500">{pageTitle}</p>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
          <span>Home</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900">{pageTitle}</span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            v1.0.0
          </span>
          
          <div className="relative group">
            <div className="flex items-center space-x-2 cursor-pointer">
              {currentUser?.avatar ? (
                <img
                  src={`http://localhost:5001${currentUser.avatar}`}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-blue-200"
                />
              ) : (
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200">
                  <span className="text-sm font-semibold text-blue-600">
                    {currentUser?.name.split(' ').map(n => n[0]).join('') || 'U'}
                  </span>
                </div>
              )}
              <span className="hidden sm:block text-sm font-medium text-gray-700">{currentUser?.name || 'User'}</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {/* Dropdown menu */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="py-2">
                <button 
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  onClick={() => window.dispatchEvent(new CustomEvent('editProfile'))}>
                  <User className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
                <button 
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                  onClick={() => window.dispatchEvent(new CustomEvent('logout'))}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
