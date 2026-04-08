import { NavLink } from "react-router-dom";
import { FiHome, FiLogOut, FiSettings, FiChevronDown, FiUsers, FiUserPlus, FiRefreshCw, FiVolume2, FiHelpCircle, FiShield, FiActivity, FiSliders } from "react-icons/fi";
import { useState } from "react";
import { toast } from "react-toastify";
import useAuth from '../hooks/useAuth.js';

const activeLink =
  "flex items-center gap-3 px-3 py-2 rounded-lg bg-white text-[#1e293b] font-semibold shadow-sm";
const normalLink =
  "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-[#334155] hover:text-white transition";

export default function SuperAdminSidebar() {
  const [userMgmtOpen, setUserMgmtOpen] = useState(false);
  const { logout } = useAuth();

  const handleFutureFeature = (featureName) => {
    toast.info(`${featureName} is currently unavailable. This feature is under development and will be available soon.`);
  };

  return (
    <div className="w-64 min-h-screen bg-[#1e293b] text-white flex flex-col shadow-lg">
      {/* Logo */}
      <div className="px-4 py-3 bg-[#ef4444] leading-none">
        <p className="text-white font-bold text-lg m-0 p-0">Admin Panel</p>
        <p className="text-xs text-red-100 font-medium m-0 p-0">System Management</p>
      </div>


      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`nav::-webkit-scrollbar { display: none; }`}</style>
        <NavLink
          to="/super-admin/dashboard"
          className={({ isActive }) => (isActive ? activeLink : normalLink)}
        >
          <FiHome className="text-lg" />
          <span>Tenants Dashboard</span>
        </NavLink>



        {/* Impersonate User */}
        <div
          onClick={() => handleFutureFeature('Impersonate User')}
          className={normalLink + " cursor-pointer"}
        >
          <FiUserPlus className="text-lg" />
          <span>Impersonate User</span>
        </div>

        {/* Export/Import Data */}
        <div
          onClick={() => handleFutureFeature('Export/Import Data')}
          className={normalLink + " cursor-pointer"}
        >
          <FiRefreshCw className="text-lg" />
          <span>Export/Import Data</span>
        </div>

        {/* Announcements */}
        <NavLink
          to="/super-admin/announcements"
          className={({ isActive }) => (isActive ? activeLink : normalLink)}
        >
          <FiVolume2 className="text-lg" />
          <span>Announcements</span>
        </NavLink>

        {/* Support & Issues */}
        {/**
        <div
          onClick={() => handleFutureFeature('Support & Issues')}
          className={normalLink + " cursor-pointer"}
        >
          <FiHelpCircle className="text-lg" />
          <span>Support & Issues</span>
        </div>
        */}

        {/* Security */}
        {/**
        <div
          onClick={() => handleFutureFeature('Security')}
          className={normalLink + " cursor-pointer"}
        >
          <FiShield className="text-lg" />
          <span>Security</span>
        </div>
        */}

        {/* System Health */}
        {/**
        <div
          onClick={() => handleFutureFeature('System Health')}
          className={normalLink + " cursor-pointer"}
        >
          <FiActivity className="text-lg" />
          <span>System Health</span>
        </div>
        */}

        {/* Configuration */}
        {/**
        <div
          onClick={() => handleFutureFeature('Configuration')}
          className={normalLink + " cursor-pointer"}
        >
          <FiSliders className="text-lg" />
          <span>Configuration</span>
        </div>
        */}

        {/* User Management Dropdown (at the end) */}
        <div>
          <button
            className="w-full px-3 py-2 flex justify-between items-center text-sm font-medium text-gray-300 hover:bg-[#334155] rounded-lg transition"
            onClick={() => setUserMgmtOpen(!userMgmtOpen)}
          >
            <span className="flex items-center gap-2">
              <FiSettings className="text-lg" />
              User Management
            </span>
            <FiChevronDown
              className={`transition-transform ${userMgmtOpen ? "rotate-180" : ""}`}
            />
          </button>

          {userMgmtOpen && (
            <div className="ml-6 mt-2 space-y-1">
              <NavLink
                to="/super-admin/users"
                className={({ isActive }) =>
                  isActive ? activeLink : normalLink
                }
              >
                <FiUsers className="text-lg" />
                <span>Manage Users</span>
              </NavLink>
            </div>
          )}
        </div>
      </nav>

      {/* Logout Button pinned to bottom */}
      <div className="mt-auto p-4 border-t border-gray-700">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition"
        >
          <FiLogOut className="text-lg" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
