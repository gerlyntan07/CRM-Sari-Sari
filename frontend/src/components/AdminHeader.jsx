import { useState, useRef, useEffect } from "react";
import { FiBell, FiUser } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import useAuth from '../hooks/useAuth.js';
import useFetchUser from "../hooks/useFetchUser.js";

export default function AdminHeader({ toggleSidebar }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { user, fetchUser } = useFetchUser();

  // Map routes to titles
  const routeTitles = {
    "/admin/dashboard": "Dashboard",
    "/admin/accounts": "Accounts",
    "/admin/contacts": "Contacts",
    "/reports": "Reports",
    "/leads": "Leads",
    "/admin/Audit": "Audit",
    "/admin/targets": "Targets",
    "/admin/leads": "Leads",
    "/admin/quotes": "Quotes",
    "/admin/users": "Users",
    "/admin/deals": "Deals",
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Listen for profile update events to refresh user data
  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchUser();
    };

    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
    };
  }, [fetchUser]);

  const currentTitle = routeTitles[location.pathname] || "Admin Panel";

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex justify-between items-center bg-white shadow px-4 sm:px-6 py-3 border-b relative">
      {/* Left Side - Hamburger & Title */}
      <div className="flex items-center gap-3">
        {/* Hamburger Button - Mobile Only */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden text-gray-700 hover:text-gray-900"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <h1 className="text-lg font-semibold text-gray-800">{currentTitle}</h1>
      </div>

      {/* Right Side */}
      <div className="flex items-center space-x-4">
        {/* Notification */}
        <button className="relative text-gray-600 hover:text-gray-800">
          <FiBell className="text-xl" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
            3
          </span>
        </button>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
          >
            <img
              src={user?.profile_picture || "https://via.placeholder.com/40"}
              alt="Profile"
              className="w-8 aspect-square object-cover rounded-full"
            />
          <span className="hidden lg:inline text-sm font-medium text-gray-700">
              {user?.first_name} {user?.last_name}
            </span>
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-64 bg-white shadow-xl rounded-xl border border-gray-200 z-50 p-4">
              <div className="flex flex-col items-center text-center space-y-3">
                {/* Profile Picture */}
                <img
                  src={user?.profile_picture || "https://via.placeholder.com/80"}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover"
                />

                {/* Name */}
                <h2 className="text-gray-800 font-semibold text-sm">
                  {user?.first_name} {user?.middle_name} {user?.last_name}
                </h2>
              </div>

              {/* Menu Options */}
              <div className="mt-4 space-y-1 px-4 text-left">
                <button 
                onClick={() => {
                    navigate("/admin/users");
                    setOpen(false);
                  }}
                className="block w-full text-sm text-gray-700 hover:bg-gray-50 py-1 rounded text-left">
                  Invite Your Team
                </button>

                <button 
                  onClick={() => {
                    navigate("/admin/manage-account");
                    setOpen(false);
                  }}
                  className="block w-full text-sm text-gray-700 hover:bg-gray-50 py-1 rounded text-left"
                >
                  Manage Your Account
                </button>

                <div className="border-t border-gray-200 my-2"></div>

                <button
                  onClick={logout}
                  className="block w-full text-sm text-red-600 hover:text-red-700 hover:bg-gray-50 py-2 rounded text-left"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
