// frontend/src/components/SalesHeader.jsx
import { useState, useRef, useEffect } from "react";
import { FiBell, FiMenu } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
    "/sales/tasks": "Tasks",
  };

  const currentTitle = routeTitles[location.pathname] || "Sales Panel";

  // Load user
  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Helpers ---
  const normalizeNotif = (raw) => {
    const n = { ...raw };

    // Ensure consistent boolean
    n.read = Boolean(n.read);

    // Normalize type + title
    switch (n.type) {
      case "territory_assignment":
        n.title = n.title || `You have been assigned to ${n.territoryName || "a territory"}`;
        break;

      case "lead_assigned":
        n.type = "lead_assignment";
        n.title = n.title || `New lead assigned: ${n.leadName || n.company || "Lead"}`;
        break;

      case "lead_assignment":
        n.title = n.title || `New lead assigned: ${n.leadName || n.company || "Lead"}`;
        break;

      case "lead_update":
        n.title = n.title || `Lead updated: ${n.leadName || n.company || "Lead"}`;
        break;

      case "task_assignment":
        // if backend sends title already, keep it; else build
        n.title = n.title || `New Task Assigned: ${n.taskTitle || "Task"}`;
        break;

      // ✅ CONTACT NOTIFS
      case "contact_assignment":
        n.title = n.title || `New contact assigned: ${n.contactName || "Contact"}`;
        break;

      case "contact_update":
        n.title = n.title || `Contact updated: ${n.contactName || "Contact"}`;
        break;

      default:
        n.title = n.title || "New Notification";
    }

    return n;
  };

  const performNavigation = (notif) => {
    switch (notif.type) {
      case "task_assignment":
        navigate(`/sales/hub/${notif.taskId || notif.task_id || ""}`);
        break;

      case "lead_assignment":
      case "lead_update":
        navigate(`/sales/leads/${notif.leadId || notif.lead_id || ""}`);
        break;

      // ✅ CONTACT ROUTES
      case "contact_assignment":
      case "contact_update":
        navigate(`/sales/contacts/${notif.contactId || notif.contact_id || ""}`);
        break;

      default:
        navigate("/sales/overview");
    }
  };

  const handleNotificationClick = async (notif) => {
    if (notif.read) {
      performNavigation(notif);
      return;
    }

    try {
      await api.patch(`/logs/mark-read/${notif.id}`);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));

      performNavigation(notif);
    } catch (err) {
      console.error("Failed to mark notification as read", err);
      performNavigation(notif);
    }
  };

  // WebSocket listener
  useEffect(() => {
    if (!user) return;

    // ✅ NOTE: Use wss:// in production
    const ws = new WebSocket(
      `ws://localhost:8000/ws/notifications?user_id=${user.id}`
    );

    ws.onopen = () => console.log("WS Connected");

    ws.onmessage = (event) => {
      const incoming = JSON.parse(event.data);
      const newNotif = normalizeNotif(incoming);

      console.log("🔔 New Notification:", newNotif);

      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    ws.onclose = () => console.log("WS Disconnected");
    ws.onerror = (e) => console.error("WS Error", e);

    return () => ws.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch history notifications (from DB logs)
  useEffect(() => {
    const fetchInitialNotifications = async () => {
      try {
        const res = await api.get("/logs/read-all");
        console.log("🔍 Raw Logs from DB:", res.data);

        // Expect logs to already include:
        // id, type, description/title, name/assignedBy, timestamp/createdAt, is_read/read, leadId/contactId/taskId etc
        const mappedLogs = (res.data || []).map((log) =>
          normalizeNotif({
            id: log.id,
            type: log.type || "info",
            title: log.title || log.description,
            assignedBy: log.assignedBy || log.name,
            createdAt: log.createdAt || log.timestamp,
            read: log.is_read ?? log.read ?? false,

            // allow routing if your backend stores these in logs
            leadId: log.leadId || log.lead_id,
            taskId: log.taskId || log.task_id,
            contactId: log.contactId || log.contact_id,
          })
        );

        setNotifications(mappedLogs);
        setUnreadCount(mappedLogs.filter((n) => !n.read).length);
      } catch (err) {
        console.error("Failed to load history notifications", err);
      }
    };

    if (user) fetchInitialNotifications();
  }, [user]);

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
      {/* Left: Title + Burger */}
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

      {/* Right: Notifications + Profile */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Notifications */}
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
                  notifications.map((n, idx) => (
                    <div
                      key={n.id ?? idx}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition ${
                        n.read ? "bg-gray-50" : "bg-white"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span
                          className={`text-[10px] px-2 py-1 rounded-full font-semibold uppercase
                            ${
                              n.type === "task_assignment"
                                ? "bg-purple-100 text-purple-700"
                                : n.type === "lead_assignment" || n.type === "lead_update"
                                ? "bg-green-100 text-green-700"
                                : n.type === "contact_assignment" || n.type === "contact_update"
                                ? "bg-amber-100 text-amber-700"
                                : n.type === "territory_assignment"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                        >
                          {n.type === "task_assignment"
                            ? "Task"
                            : n.type === "lead_assignment"
                            ? "Lead"
                            : n.type === "lead_update"
                            ? "Lead Update"
                            : n.type === "contact_assignment"
                            ? "Contact"
                            : n.type === "contact_update"
                            ? "Contact Update"
                            : "Info"}
                        </span>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                        )}
                      </div>

                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800 text-sm">
                          {n.title}
                        </span>
                        <span className="text-xs text-gray-600 mt-0.5">
                          {n.assignedBy ? `Assigned by ${n.assignedBy}` : "System"}
                        </span>
                        <span className="text-[11px] text-gray-400 mt-1">
                          {n.createdAt
                            ? new Date(n.createdAt).toLocaleString()
                            : ""}
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
            <span className="text-sm font-medium text-gray-700">
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
                <h2 className="text-gray-800 font-semibold text-sm">
                  {user?.first_name} {user?.middle_name} {user?.last_name}
                </h2>
              </div>

              <div className="mt-4 space-y-1 px-4 text-left">
                <button
                  className="block w-full text-sm text-gray-700 hover:bg-gray-50 py-2 rounded text-left"
                  onClick={() => {
                    navigate("/sales/manage-account");
                    setOpen(false);
                  }}
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
