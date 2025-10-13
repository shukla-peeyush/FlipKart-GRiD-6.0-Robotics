import React from 'react';
import { Calendar, Plus, Clock, Settings, HelpCircle, ChevronLeft } from 'lucide-react';
import type { NavigationPage, NavItem } from '../types';

interface SidebarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  collapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, collapsed }) => {
  const navItems: NavItem[] = [
    {
      page: 'Dashboard',
      label: 'Dashboard',
      description: 'Overview and stats',
      icon: <Calendar className="w-5 h-5" />
    },
    {
      page: 'NewTest',
      label: 'New Test',
      description: 'Analyze products',
      icon: <Plus className="w-5 h-5" />
    },
    {
      page: 'History',
      label: 'History',
      description: 'Past analyses',
      icon: <Clock className="w-5 h-5" />
    },
    {
      page: 'Settings',
      label: 'Settings',
      description: 'Configuration',
      icon: <Settings className="w-5 h-5" />
    }
  ];

  const sidebarWidth = collapsed ? 'w-16' : 'w-64';

  return (
    <aside className={`${sidebarWidth} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out`}>
      <nav className="flex-1 px-3 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = item.page === currentPage;
          const baseClasses = "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500";
          const activeClasses = isActive ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100";
          
          return (
            <button
              key={item.label}
              onClick={() => onNavigate(item.page)}
              className={`${baseClasses} ${activeClasses} ${collapsed ? "justify-center" : ""} w-full`}
              aria-label={item.label}
              title={collapsed ? item.label : ""}>
              {item.icon}
              {!collapsed && (
                <div className="ml-3 flex-1 text-left">
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              )}
              {!collapsed && isActive && (
                <div className="ml-auto">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Help section */}
      <div className="px-3 py-4 border-t border-gray-200">
        <button 
          onClick={() => onNavigate('Help')}
          className={`flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 ${collapsed ? "justify-center" : ""} ${currentPage === 'Help' ? 'bg-blue-100 text-blue-700' : ''}`}
          aria-label="Help & Documentation"
          title={collapsed ? "Help" : ""}>
          <HelpCircle className="w-5 h-5" />
          {!collapsed && <span className="ml-3">Help & Docs</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <div className="px-3 py-2 border-t border-gray-200">
        <button 
          className={`flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 ${collapsed ? "justify-center" : ""}`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          <ChevronLeft className={`w-5 h-5 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
          {!collapsed && <span className="ml-3">Collapse</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
