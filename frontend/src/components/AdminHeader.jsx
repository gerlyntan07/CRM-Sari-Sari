// frontend/src/components/AdminHeader.jsx
import { useState, useRef, useEffect } from "react";
import { FiBell, FiMenu } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import useAuth from '../hooks/useAuth.js';
import useFetchUser from "../hooks/useFetchUser.js";
import api from "../api.js"; // Ensure this import exists for marking notifications read

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

  const currentTitle = routeTitles[location.pathname] || "Admin Panel";

  // Listen for profile update events
  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchUser();
    };
    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
    };
  }, [fetchUser]);

  // --- WebSocket Automatic Environment Detection ---
  useEffect(() => {
    if (!user?.id) return;

    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = isLocalhost ? "localhost:8000" : window.location.host;

    const wsUrl = `${protocol}//${host}/ws/notifications?user_id=${user.id}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => console.log("Admin WS Connected");
    ws.onmessage = (event) => {
      const incoming = JSON.parse(event.data);
      // You can add your normalizeNotif logic here if needed
      setNotifications((prev) => [incoming, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };
    ws.onclose = () => console.log("Admin WS Disconnected");
    
    return () => ws.close();
  }, [user?.id]);

  // Close dropdowns when clicking outside
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
    <header className="flex justify-between items-center bg-white shadow px-4 sm:px-6 py-3 border-b relative">
      {/* Left Side - Hamburger & Title */}
      <div className="flex items-center gap-3">
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

          {/* Notification Dropdown (Optional: Same style as SalesHeader) */}
          {notifOpen && (
             <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-lg border z-50 overflow-hidden animate-fade-in">
                <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
                  <button onClick={() => {setNotifications([]); setUnreadCount(0);}} className="text-xs text-blue-600 hover:underline">Clear</button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((n, i) => (
                      <div key={i} className="p-3 border-b text-sm hover:bg-gray-50 cursor-pointer">
                        {n.title || n.message || "New Update"}
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
                <img
                  src={user?.profile_picture || "https://via.placeholder.com/80"}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover"
                />
                 <div>
                <h2 className="text-gray-800 font-semibold text-sm">
                  {user?.first_name} {user?.middle_name} {user?.last_name}
                </h2>
                  <p className="text-[11px] text-gray-600 font-light w-full truncate">
                    Admin
               </p>
              </div>
              </div>

              <div className="mt-6 space-y-1 px-4 text-left">
                <button 
                  onClick={() => { navigate("/admin/users"); setOpen(false); }}
                  className="block w-full text-sm text-gray-700 hover:bg-gray-50 py-1 rounded text-left"
                >
                  Invite Your Team
                </button>

                <button 
                  onClick={() => { navigate("/admin/manage-account"); setOpen(false); }}
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