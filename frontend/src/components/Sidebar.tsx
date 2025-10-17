import React, { useState } from 'react';
import { Calendar, Plus, Clock, Settings, HelpCircle, ChevronLeft, ChevronRight, FlaskConical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { NavigationPage, NavItem } from '../types';

interface SidebarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  collapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, collapsed }) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  const navItems = [
    {
      page: 'NewTest' as NavigationPage,
      label: 'New Test',
      description: 'AI Analysis',
      icon: FlaskConical,
      gradient: 'from-cyan-400 to-blue-500'
    },
    {
      page: 'Dashboard' as NavigationPage,
      label: 'Dashboard',
      description: 'Overview & Stats',
      icon: Calendar,
      gradient: 'from-purple-400 to-pink-500'
    },
    {
      page: 'History' as NavigationPage,
      label: 'History',
      description: 'Past Analyses',
      icon: Clock,
      gradient: 'from-green-400 to-emerald-500'
    },
    {
      page: 'Settings' as NavigationPage,
      label: 'Settings',
      description: 'Configuration',
      icon: Settings,
      gradient: 'from-orange-400 to-red-500'
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-6 flex-1 flex flex-col">
        {/* Logo Section */}
        <motion.div 
          className="flex items-center mb-8"
          whileHover={{ scale: 1.02 }}
        >
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
            <FlaskConical className="w-6 h-6 text-white" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  QualityAI
                </h1>
                <p className="text-xs text-gray-600">Smart Testing System</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Navigation Items */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;
            
            return (
              <motion.button
                key={item.page}
                onClick={() => onNavigate(item.page)}
                className={`w-full flex items-center p-4 rounded-xl transition-all relative group ${
                  isActive 
                    ? 'bg-white/10 shadow-lg' 
                    : 'hover:bg-white/5'
                }`}
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-20 rounded-xl`}
                  />
                )}
                
                {/* Glow Effect on Hover */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-10 rounded-xl blur-sm`}
                  whileHover={{ opacity: 0.1 }}
                />
                
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center mr-4 relative z-10 shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex-1 text-left relative z-10"
                    >
                      <div className="font-medium text-gray-900">{item.label}</div>
                      <div className="text-xs text-gray-600">{item.description}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Active Dot */}
                {!isCollapsed && isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 bg-cyan-400 rounded-full relative z-10"
                  />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Spacer to push Help to bottom */}
        <div className="flex-1"></div>
        
        {/* Help Section */}
        <div className="mt-auto pt-6 border-t border-gray-200">
          <motion.button 
            onClick={() => onNavigate('Help')}
            className={`w-full flex items-center p-4 text-gray-700 hover:text-gray-900 hover:bg-white/50 rounded-xl transition-all ${
              currentPage === 'Help' ? 'bg-white/50 text-gray-900' : ''
            } ${isCollapsed ? "justify-center" : ""}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center mr-4 shadow-lg">
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex-1 text-left"
                >
                  <div className="font-medium">Help & Docs</div>
                  <div className="text-xs text-gray-600">Documentation</div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

      </div>
    </aside>
  );
};

export default Sidebar;
