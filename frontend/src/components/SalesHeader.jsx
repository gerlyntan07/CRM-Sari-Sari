// frontend/src/components/SalesHeader.jsx
import { useState, useRef, useEffect } from "react";
import { FiBell, FiMenu } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import useFetchUser from "../hooks/useFetchUser.js";
import api from "../api.js";
import { getWebSocketUrl } from "../utils/getWebSocketUrl.js";

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
    "/sales/overview": "Dashboard",
    // "/sales/hub": "Sales Hub",
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

  // Load user once
  useEffect(() => {
    fetchUser();
    
    // Listen for profile updates from manage account page
    const handleProfileUpdate = () => {
      fetchUser();
    };
    
    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Helpers ---
  const deriveTypeFromLog = (log) => {
    const action = String(log.action || log.type || "").toLowerCase();
    const text = String(log.title || log.description || "").toLowerCase();

    const isCreate = action.includes("create");
    const isUpdate = action.includes("update");

    if (text.includes("task")) return "task_assignment";
    if (text.includes("territory")) return "territory_assignment";

    if (text.includes("lead")) return isCreate ? "lead_assignment" : isUpdate ? "lead_update" : "lead_update";
    if (text.includes("contact")) return isCreate ? "contact_assignment" : isUpdate ? "contact_update" : "contact_update";
    if (text.includes("deal")) return isCreate ? "deal_assignment" : isUpdate ? "deal_update" : "deal_update";
    if (text.includes("account")) return isCreate ? "account_assignment" : isUpdate ? "account_update" : "account_update";

    return "info";
  };

  const normalizeNotif = (raw) => {
    const n = { ...raw };
    n.read = Boolean(n.read);

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
        n.title = n.title || `New Task Assigned: ${n.taskTitle || "Task"}`;
        break;
      case "contact_assignment":
        n.title = n.title || `New contact assigned: ${n.contactName || n.contact || "Contact"}`;
        break;
      case "contact_update":
        n.title = n.title || `Contact updated: ${n.contactName || n.contact || "Contact"}`;
        break;
      case "deal_assignment":
        n.title = n.title || `New deal assigned: ${n.dealName || n.name || "Deal"}`;
        break;
      case "deal_update":
        n.title = n.title || `Deal updated: ${n.dealName || n.name || "Deal"}`;
        break;
      case "account_assignment":
        n.title = n.title || `New account assigned: ${n.accountName || n.name || "Account"}`;
        break;
      case "account_update":
        n.title = n.title || `Account updated: ${n.accountName || n.name || "Account"}`;
        break;
      default:
        n.title = n.title || "New Notification";
    }
    return n;
  };

  const performNavigation = (notif) => {
    switch (notif.type) {
      case "task_assignment":
        navigate(`/sales/tasks/${notif.taskId || notif.task_id || ""}`);
        break;
      case "lead_assignment":
      case "lead_update":
        navigate(`/sales/leads/${notif.leadId || notif.lead_id || ""}`);
        break;
      case "contact_assignment":
      case "contact_update":
        navigate(`/sales/contacts/${notif.contactId || notif.contact_id || ""}`);
        break;
      case "deal_assignment":
      case "deal_update":
        navigate(`/sales/deals/${notif.dealId || notif.deal_id || ""}`);
        break;
      case "account_assignment":
      case "account_update":
        navigate(`/sales/accounts/${notif.accountId || notif.account_id || ""}`);
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

  // ✅ UPDATED: Use centralized WebSocket URL utility
  useEffect(() => {
    if (!user?.id) return;

    const wsUrl = getWebSocketUrl(user.id);
    console.log("🔌 Connecting to WebSocket:", wsUrl);
    const ws = new WebSocket(wsUrl);

    let reconnectTimeout;
    const reconnect = () => {
      reconnectTimeout = setTimeout(() => {
        console.log("🔄 Attempting WebSocket reconnection...");
      }, 3000);
    };

    ws.onopen = () => {
      console.log("✅ Sales WS Connected to:", wsUrl);
      clearTimeout(reconnectTimeout);
    };

    ws.onmessage = (event) => {
      try {
        const incoming = JSON.parse(event.data);
        console.log("📨 Notification received:", incoming);
        const newNotif = normalizeNotif(incoming);
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((prev) => prev + 1);
      } catch (error) {
        console.error("Error parsing notification:", error);
      }
    };

    ws.onclose = () => {
      console.log("🔌 Sales WS Disconnected");
      reconnect();
    };

    ws.onerror = (error) => {
      console.error("❌ Sales WS Error:", error);
    };

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Fetch history notifications
  useEffect(() => {
    const fetchInitialNotifications = async () => {
      try {
        const res = await api.get("/logs/read-all");
        const mappedLogs = (res.data || []).map((log) =>
          normalizeNotif({
            id: log.id,
            type: log.notif_type || log.notification_type || log.type || deriveTypeFromLog(log),
            title: log.title || log.description,
            assignedBy: log.assignedBy || log.name,
            createdAt: log.createdAt || log.timestamp,
            read: log.is_read ?? log.read ?? false,
            leadId: log.leadId || log.lead_id,
            taskId: log.taskId || log.task_id,
            contactId: log.contactId || log.contact_id,
            dealId: log.dealId || log.deal_id,
            accountId: log.accountId || log.account_id,
          })
        );
        setNotifications(mappedLogs);
        setUnreadCount(mappedLogs.filter((n) => !n.read).length);
      } catch (err) {
        console.error("Failed to load history notifications", err);
      }
    };
    if (user?.id) fetchInitialNotifications();
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

      <div className="flex items-center space-x-3 sm:space-x-4">
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
                                : n.type === "lead_assignment" ||
                                  n.type === "lead_update"
                                ? "bg-green-100 text-green-700"
                                : n.type === "contact_assignment" ||
                                  n.type === "contact_update"
                                ? "bg-amber-100 text-amber-700"
                                : n.type === "deal_assignment" ||
                                  n.type === "deal_update"
                                ? "bg-indigo-100 text-indigo-700"
                                : n.type === "account_assignment" ||
                                  n.type === "account_update"
                                ? "bg-cyan-100 text-cyan-700"
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
                            : n.type === "deal_assignment"
                            ? "Deal"
                            : n.type === "deal_update"
                            ? "Deal Update"
                            : n.type === "account_assignment"
                            ? "Account"
                            : n.type === "account_update"
                            ? "Account Update"
                            : n.type === "territory_assignment"
                            ? "Territory"
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
                    Sales
               </p>
              </div>
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