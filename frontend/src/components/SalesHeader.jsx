import { useState, useRef, useEffect } from "react";
import { FiBell } from "react-icons/fi";
import { useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import useFetchUser from "../hooks/useFetchUser.js";

export default function SalesHeader() {
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

  // Get current page title based on route
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
    <header className="flex justify-between items-center bg-white shadow px-6 py-3 border-b relative">
      {/* Left Side - Page Title */}
      <h1 className="text-lg font-semibold text-gray-800">{currentTitle}</h1>

      {/* Right Side */}
      <div className="flex items-center space-x-4">
        {/* Notification Icon */}
        <button className="relative text-gray-600 hover:text-gray-800">
          <FiBell className="text-xl" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
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
              className="w-8 aspect-square object-cover rounded-full"
            />
            <span className="text-sm font-medium text-gray-700">
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
