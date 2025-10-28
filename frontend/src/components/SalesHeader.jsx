import { useState, useRef, useEffect } from "react";
import { FiBell, FiMenu } from "react-icons/fi";
import { useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import useFetchUser from "../hooks/useFetchUser.js";
import api from "../api.js";

export default function SalesHeader({ toggleSidebar }) {
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const location = useLocation();
  const { logout } = useAuth();
  const { user, fetchUser } = useFetchUser();

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

  const currentTitle = routeTitles[location.pathname] || "Sales Panel";

  useEffect(() => {
    fetchUser();

    const ws = new WebSocket("ws://localhost:8000/ws/notifications");

    ws.onopen = () => console.log("✅ WebSocket connected");

    ws.onmessage = (event) => {
      const newNotif = JSON.parse(event.data);
      console.log("🔔 New WebSocket Notification:", newNotif);
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    ws.onclose = () => console.log("❌ WebSocket disconnected");
    return () => ws.close();
  }, []);

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

  const handleNotificationClick = (taskId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== taskId));
    setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));
  };

  return (
    <header className="flex justify-between items-center bg-white shadow px-4 sm:px-6 py-3 border-b relative">
      {/* ✅ Left: Title + Burger */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden text-gray-700 hover:text-gray-900"
        >
          <FiMenu className="text-2xl" />
        </button>
        <h1 className="text-lg sm:text-xl font-semibold text-gray-800 truncate max-w-[150px] sm:max-w-none">
          {currentTitle}
        </h1>
      </div>

      {/* ✅ Right: Notifications + Profile */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* 🔔 Notification Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative text-gray-600 hover:text-gray-800 transition"
          >
            <FiBell className="text-xl sm:text-2xl" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-semibold">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-lg border z-50 overflow-hidden animate-fade-in">
              <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800 text-sm">
                  Notifications
                </h3>
                {notifications.length > 0 && (
                  <button
                    onClick={() => {
                      setNotifications([]);
                      setUnreadCount(0);
                    }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n.id)}
                      className="p-4 border-b hover:bg-gray-50 cursor-pointer transition"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800 text-sm">
                          {n.title || "New Task Assigned"}
                        </span>
                        <span className="text-xs text-gray-600 mt-0.5">
                          {n.assignedBy
                            ? `Assigned by ${n.assignedBy}`
                            : "You have a new task"}
                        </span>
                        <span className="text-[11px] text-gray-400 mt-1">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500 text-sm">
                    No new notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 👤 Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition"
          >
            <img
              src={user?.profile_picture || "/default-avatar.png"}
              alt="User Avatar"
              className="w-8 h-8 sm:w-9 sm:h-9 object-cover rounded-full"
            />
            <span className="hidden sm:inline text-sm font-medium text-gray-700">
              {user?.first_name} {user?.last_name}
            </span>
          </button>

          {open && (
            <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-lg border z-50">
              <div className="flex flex-col">
                <button className="px-4 py-2 text-sm hover:bg-gray-100 text-left">
                  Invite Your Team
                </button>
                <button className="px-4 py-2 text-sm hover:bg-gray-100 text-left">
                  Manage Account
                </button>
                <div className="border-t my-1"></div>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm text-red-500 hover:bg-red-50 text-left"
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
