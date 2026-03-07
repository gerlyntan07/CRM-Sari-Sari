import React, { useState, useRef, useEffect } from "react";
import { FiUser, FiLogOut, FiSettings, FiHelpCircle, FiBell } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import useFetchUser from "../hooks/useFetchUser";

export default function TechnicalSupportHeader() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const { user, logout } = useFetchUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex justify-between items-center">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-gray-900">Technical Support</h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiBell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">System Notifications</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                <div className="p-3 border-b border-gray-100 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <div className="h-2 w-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Critical System Update</p>
                      <p className="text-xs text-gray-500">Database maintenance scheduled for tonight</p>
                      <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 border-b border-gray-100 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <div className="h-2 w-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">New Feature Release</p>
                      <p className="text-xs text-gray-500">Enhanced reporting tools are now available</p>
                      <p className="text-xs text-gray-400 mt-1">5 hours ago</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">System Performance</p>
                      <p className="text-xs text-gray-500">All systems operating normally</p>
                      <p className="text-xs text-gray-400 mt-1">1 day ago</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-3 border-t border-gray-200">
                <Link
                  to="/technical-support/system-alerts"
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  onClick={() => setNotificationsOpen(false)}
                >
                  View all system alerts →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
          >
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
              {user?.first_name ? user.first_name.charAt(0).toUpperCase() : <FiUser />}
            </div>
            <span className="hidden md:block">
              {user?.first_name || "Technical Support"}
            </span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
              <div className="px-4 py-2 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-900">
                  {user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : "Technical Support"}
                </p>
                <p className="text-xs text-gray-500">{user?.email || ""}</p>
                <p className="text-xs text-blue-600 font-medium">Technical Support</p>
              </div>

              <Link
                to="/technical-support/manage-account"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                onClick={() => setDropdownOpen(false)}
              >
                <FiUser className="h-4 w-4" />
                <span>Profile</span>
              </Link>

              <Link
                to="/technical-support/settings"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                onClick={() => setDropdownOpen(false)}
              >
                <FiSettings className="h-4 w-4" />
                <span>Settings</span>
              </Link>

              <div className="border-t border-gray-100"></div>

              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center space-x-2"
              >
                <FiLogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}