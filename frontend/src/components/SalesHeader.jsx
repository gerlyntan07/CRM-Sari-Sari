import { useState, useRef, useEffect } from "react";
import { FiBell, FiMenu } from "react-icons/fi"; // ✅ Added FiMenu
import { useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import useFetchUser from "../hooks/useFetchUser.js";

export default function SalesHeader({ toggleSidebar }) { // ✅ Accept prop for sidebar toggle
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const { logout } = useAuth();
  const { user, fetchUser } = useFetchUser();

  // Map routes to titles (for SalesPanel)
  const routeTitles = {
    "/sales/overview": "Overview",
    "/sales/hub": "Sales Hub",
    "/sales/accounts": "Accounts",
    "/sales/contacts": "Contacts",
    "/sales/leads": "Leads",
    "/sales/deals": "Deals",
    "/sales/quotes": "Quotes",
    "/sales/targets": "Targets",
    "/sales/reports": "Reports",
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Get current page title
  const currentTitle = routeTitles[location.pathname] || "Sales Panel";

  // Close dropdown when clicking outside
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
      {/* ✅ Left Side - Burger + Page Title */}
      <div className="flex items-center gap-3">
        {/* Mobile Burger Menu */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden text-gray-700 hover:text-gray-900"
        >
          <FiMenu className="text-2xl" />
        </button>

        {/* Page Title */}
        <h1 className="text-lg sm:text-xl font-semibold text-gray-800 truncate max-w-[150px] sm:max-w-none">
          {currentTitle}
        </h1>
      </div>

      {/* ✅ Right Side */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Notification Icon */}
        <button className="relative text-gray-600 hover:text-gray-800">
          <FiBell className="text-xl sm:text-2xl" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
            3
          </span>
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
          >
            <img
              src={user?.profile_picture || "/default-avatar.png"}
              alt="User Avatar"
              className="w-8 h-8 sm:w-9 sm:h-9 object-cover rounded-full"
            />
            {/* Hide name on mobile to save space */}
            <span className="hidden sm:inline text-sm font-medium text-gray-700">
              {user?.first_name} {user?.last_name}
            </span>
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-100 shadow-lg rounded border z-50">
              <div className="flex flex-col">
                <button className="px-4 py-2 text-sm hover:bg-gray-200 text-left">
                  Invite Your Team
                </button>
                <button className="px-4 py-2 text-sm hover:bg-gray-200 text-left">
                  Manage Account
                </button>
                <div className="border-t my-1"></div>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm bg-red-500 text-white rounded mx-2 my-2 hover:bg-red-600"
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
