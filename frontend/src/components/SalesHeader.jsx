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

  // Fetch history notifications on component mount and when user changes
  useEffect(() => {
    const fetchInitialNotifications = async () => {
      try {
        const res = await api.get("/logs/notifications");
        console.log("📋 Fetched notifications from DB:", res.data);
        const mappedLogs = (res.data || []).map((log) => {
          // Extract entity ID from various possible sources
          const entityId = log.entity_id || log.new_data?.id;
          const entityType = (log.entity_type || "").toLowerCase();
          
          return normalizeNotif({
            id: log.id,
            type: log.notif_type || log.notification_type || log.type || deriveTypeFromLog(log),
            title: log.title || log.description,
            assignedBy: log.assignedBy || log.name,
            createdAt: log.createdAt || log.timestamp,
            read: log.is_read ?? log.read ?? false,
            // Use entity_id based on entity_type
            leadId: entityType === "lead" ? entityId : (log.leadId || log.lead_id),
            taskId: entityType === "task" ? entityId : (log.taskId || log.task_id),
            contactId: entityType === "contact" ? entityId : (log.contactId || log.contact_id),
            dealId: entityType === "deal" ? entityId : (log.dealId || log.deal_id),
            accountId: entityType === "account" ? entityId : (log.accountId || log.account_id),
          });
        });
        setNotifications(mappedLogs);
        setUnreadCount(mappedLogs.filter((n) => !n.read).length);
      } catch (err) {
        console.error("Failed to load history notifications", err);
      }
    };
    if (user?.id) fetchInitialNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // --- Helpers ---
  const deriveTypeFromLog = (log) => {
    const action = String(log.action || log.type || "").toUpperCase();
    
    // Map database action types directly to notification types
    const actionMap = {
      "TASK_ASSIGNMENT": "task_assignment",
      "LEAD_ASSIGNMENT": "lead_assignment",
      "LEAD_UPDATE": "lead_update",
      "CONTACT_ASSIGNMENT": "contact_assignment",
      "CONTACT_UPDATE": "contact_update",
      "DEAL_ASSIGNMENT": "deal_assignment",
      "DEAL_UPDATE": "deal_update",
      "ACCOUNT_ASSIGNMENT": "account_assignment",
      "ACCOUNT_UPDATE": "account_update",
      "TERRITORY_ASSIGNMENT": "territory_assignment",
      // Add CREATE and UPDATE actions
      "CREATE": "create",
      "UPDATE": "update",
      "DELETE": "delete",
    };
    
    if (actionMap[action]) {
      return actionMap[action];
    }
    
    // Fallback: try to derive from description text or entity_type
    const text = String(log.title || log.description || "").toLowerCase();
    const entityType = String(log.entity_type || "").toLowerCase();
    const isUpdate = action.includes("UPDATE");
    const isCreate = action.includes("CREATE");
    const isDelete = action.includes("DELETE");

    if (text.includes("task") || entityType === "task") return isUpdate ? "task_update" : "task_assignment";
    if (text.includes("territory") || entityType === "territory") return "territory_assignment";
    if (text.includes("lead") || entityType === "lead") return isUpdate ? "lead_update" : isCreate ? "lead_assignment" : "lead_update";
    if (text.includes("contact") || entityType === "contact") return isUpdate ? "contact_update" : isCreate ? "contact_assignment" : "contact_update";
    if (text.includes("deal") || entityType === "deal") return isUpdate ? "deal_update" : isCreate ? "deal_assignment" : "deal_update";
    if (text.includes("account") || entityType === "account") return isUpdate ? "account_update" : isCreate ? "account_assignment" : "account_update";
    if (text.includes("quote") || entityType === "quote") return "quote";
    if (text.includes("meeting") || entityType === "meeting") return "meeting";
    if (text.includes("call") || entityType === "call") return "call";

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
      case "task_update":
        n.title = n.title || `Task: ${n.taskTitle || "Task"}`;
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
      case "quote":
        n.title = n.title || `Quote activity`;
        break;
      case "meeting":
        n.title = n.title || `Meeting activity`;
        break;
      case "call":
        n.title = n.title || `Call activity`;
        break;
      case "create":
      case "update":
      case "delete":
      case "info":
      default:
        // Keep the original title/description from the log
        n.title = n.title || "Activity";
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
                    onClick={async () => {
                      try {
                        await api.patch(`/logs/mark-all-read`);
                        setNotifications((prev) =>
                          prev.map((n) => ({ ...n, read: true }))
                        );
                        setUnreadCount(0);
                      } catch (err) {
                        console.error("Failed to mark all notifications as read", err);
                      }
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
                              n.type === "task_assignment" || n.type === "task_update"
                                ? "bg-purple-100 text-purple-700"
                                : n.type === "lead_assignment" || n.type === "lead_update"
                                ? "bg-green-100 text-green-700"
                                : n.type === "contact_assignment" || n.type === "contact_update"
                                ? "bg-amber-100 text-amber-700"
                                : n.type === "deal_assignment" || n.type === "deal_update"
                                ? "bg-indigo-100 text-indigo-700"
                                : n.type === "account_assignment" || n.type === "account_update"
                                ? "bg-cyan-100 text-cyan-700"
                                : n.type === "territory_assignment"
                                ? "bg-blue-100 text-blue-700"
                                : n.type === "quote"
                                ? "bg-pink-100 text-pink-700"
                                : n.type === "meeting"
                                ? "bg-teal-100 text-teal-700"
                                : n.type === "call"
                                ? "bg-red-100 text-red-700"
                                : n.type === "create"
                                ? "bg-emerald-100 text-emerald-700"
                                : n.type === "update"
                                ? "bg-yellow-100 text-yellow-700"
                                : n.type === "delete"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                        >
                          {n.type === "task_assignment" || n.type === "task_update"
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
                            : n.type === "quote"
                            ? "Quote"
                            : n.type === "meeting"
                            ? "Meeting"
                            : n.type === "call"
                            ? "Call"
                            : n.type === "create"
                            ? "Created"
                            : n.type === "update"
                            ? "Updated"
                            : n.type === "delete"
                            ? "Deleted"
                            : "Activity"}
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