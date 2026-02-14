import { useState, useRef, useEffect } from "react";
import { FiBell, FiMenu } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import useAuth from '../hooks/useAuth.js';
import useFetchUser from "../hooks/useFetchUser.js";

export default function AdminHeader({ toggleSidebar }) {
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { user, fetchUser } = useFetchUser();

  // Map routes to titles
  const routeTitles = {
    "/group-manager/dashboard": "Dashboard",
    "/group-manager/accounts": "Accounts",
    "/group-manager/contacts": "Contacts",
    "/reports": "Reports",
    "/leads": "Leads",
    "/group-manager/Audit": "Audit",
    "/group-manager/targets": "Targets",
    "/group-manager/leads": "Leads",
    "/group-manager/quotes": "Quotes",
    "/group-manager/users": "Users",
    "/group-manager/deals": "Deals",
  };

  const currentTitle = routeTitles[location.pathname] || "Group Manager Panel";

  // Initial user fetch
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

  // WebSocket for Real-time Notifications
  useEffect(() => {
    if (!user?.id) return;

    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = isLocalhost ? "localhost:8000" : window.location.host;

    const wsUrl = `${protocol}//${host}/ws/notifications?user_id=${user.id}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const incoming = JSON.parse(event.data);
      setNotifications((prev) => [incoming, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    return () => ws.close();
  }, [user?.id]);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex justify-between items-center bg-white shadow px-4 sm:px-6 py-3 border-b relative z-50">
      {/* Left Side - Hamburger & Title */}
      <div className="flex items-center gap-3">
        {/* Hamburger Button - Mobile Only */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden text-gray-700 hover:text-gray-900"
        >
          <FiMenu className="text-2xl" />
        </button>

        <h1 className="text-lg font-semibold text-gray-800">{currentTitle}</h1>
      </div>

      {/* Right Side */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative text-gray-600 hover:text-gray-800 transition"
          >
            <FiBell className="text-xl" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-semibold">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-lg border z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
                <button 
                  onClick={() => { setNotifications([]); setUnreadCount(0); }} 
                  className="text-xs text-blue-600 hover:underline"
                >
                  Clear All
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n, i) => (
                    <div key={i} className="p-3 border-b text-sm hover:bg-gray-50 cursor-pointer transition">
                      {n.title || n.message || "New Notification"}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500 text-xs">No notifications</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition"
          >
            <img
              src={user?.profile_picture || "https://via.placeholder.com/40"}
              alt="Profile"
              className="w-8 h-8 object-cover rounded-full border border-gray-200"
            />
            <span className="hidden lg:inline text-sm font-medium text-gray-700">
              {user?.first_name} {user?.last_name}
            </span>
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-64 bg-white shadow-xl rounded-xl border border-gray-200 z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex flex-col items-center text-center space-y-3">
                {/* Profile Picture */}
                <img
                  src={user?.profile_picture || "https://via.placeholder.com/80"}
                  alt="Profile Large"
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
                />

                {/* Name */}
                <div>
                  <h2 className="text-gray-800 font-semibold text-sm">
                    {user?.first_name} {user?.middle_name} {user?.last_name}
                  </h2>
                  <p className="text-[11px] text-gray-600 font-light w-full truncate">
                    Group Manager
                  </p>
                </div>
              </div>

              {/* Menu Options */}
              <div className="mt-6 space-y-1 px-2">
                <button 
                  onClick={() => {
                    navigate("/group-manager/users");
                    setOpen(false);
                  }}
                  className="block w-full text-sm text-gray-700 hover:bg-gray-50 p-2 rounded text-left transition"
                >
                  Invite Your Team
                </button>

                <button 
                  onClick={() => {
                    navigate("/group-manager/manage-account");
                    setOpen(false);
                  }}
                  className="block w-full text-sm text-gray-700 hover:bg-gray-50 p-2 rounded text-left transition"
                >
                  Manage Your Account
                </button>

                <div className="border-t border-gray-100 my-2"></div>

                <button
                  onClick={logout}
                  className="block w-full text-sm text-red-600 hover:bg-red-50 p-2 rounded text-left transition font-medium"
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
