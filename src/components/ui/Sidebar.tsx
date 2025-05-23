import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  Home, Building, Users, FileText, CreditCard, 
  Settings, HelpCircle, ChevronLeft, ChevronRight
} from 'lucide-react';

const menuConfig = {
  admin: [
    { label: 'Dashboard', icon: <Home size={20} />, to: '/admin-dashboard' },
    { label: 'Properties', icon: <Building size={20} />, to: '/properties' },
    { label: 'Tenants', icon: <Users size={20} />, to: '/users' },
    { label: 'Leases', icon: <FileText size={20} />, to: '/rentals' },
    { label: 'Payments', icon: <CreditCard size={20} />, to: '/payments' },
    { label: 'Reports', icon: <FileText size={20} />, to: '/generate-reports' },
    { label: 'Settings', icon: <Settings size={20} />, to: '/settings' },
    { label: 'Help', icon: <HelpCircle size={20} />, to: '/help' },
  ],
  tenant: [
    { label: 'Dashboard', icon: <Home size={20} />, to: '/tenant-dashboard' },
    { label: 'My Lease', icon: <FileText size={20} />, to: '/my-lease' },
    { label: 'Payments', icon: <CreditCard size={20} />, to: '/my-payments' },
    { label: 'Settings', icon: <Settings size={20} />, to: '/settings' },
    { label: 'Help', icon: <HelpCircle size={20} />, to: '/help' },
  ]
};

const SidebarWrapper = ({ role = 'admin' }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const menu = menuConfig[role] || menuConfig.admin;
  const authState = useAuth() as {
    user: { name: string; email: string; role: string } | null;
    userName?: string;
    loading?: boolean;
    signOut?: () => void;
  };

  const { user } = authState || { user: null };
  const userName = authState?.user?.name || 
                   authState?.userName || 
                   localStorage.getItem('userName') || 
                   (user && user.name) || 
                   (user && user.email) || 
                   'User';
  
  // Ensure we have a valid userName
  const displayName = userName;
  
  // Get user initials from name with improved logging
  const getUserInitials = (name: string) => {
    console.log("Sidebar - Getting initials for name:", name);
    if (!name) return "U";
    const nameParts = name.split(" ");
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    const initials = (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
    console.log("Sidebar - Calculated initials:", initials);
    return initials;
  };
  
  // Log the userName being used
  console.log("Sidebar - Using userName:", displayName);
  
  return (
    <div className={`fixed left-0 top-0 h-full ${isCollapsed ? 'w-[80px]' : 'w-[240px]'} bg-white border-r border-gray-200 flex flex-col z-40 transition-all duration-300`}>
      <div className="h-16 flex items-center px-2 border-b">
        <div className="flex items-center justify-between w-full">
          <Link to="/admin-dashboard" className="text-xl font-bold text-[#00b3d7]">
            RentFlow Pro
          </Link>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            {isCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {menu.map((item) => {
            const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
            return (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className={`flex items-center px-2 py-2 rounded-md text-sm font-medium ${
                    isActive 
                      ? 'bg-[#e6f7ff] text-[#00b3d7]' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      
      <div className="border-t p-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-[#00b3d7] flex items-center justify-center text-white font-medium">
            {displayName ? getUserInitials(displayName) : "U"}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-gray-500 truncate">
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidebarWrapper; 
