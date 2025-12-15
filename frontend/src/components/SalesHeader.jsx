import { useState, useRef, useEffect, useMemo } from "react";
import { FiBell, FiMenu } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import useFetchUser from "../hooks/useFetchUser.js";
import api from "../api.js";

function getWsOriginFromApiBaseURL() {
  // Example baseURL: "http://localhost:8000/api"
  const base = api?.defaults?.baseURL || "http://localhost:8000/api";

  let url;
  try {
    url = new URL(base);
  } catch {
    // fallback if base is not a valid URL
    url = new URL("http://localhost:8000");
  }

  // ✅ remove trailing "/api" or "/api/"
  url.pathname = url.pathname.replace(/\/api\/?$/, "");

  const wsProtocol = url.protocol === "https:" ? "wss:" : "ws:";
  return `${wsProtocol}//${url.host}`;
}

export default function SalesHeader({ toggleSidebar }) {
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const wsRef = useRef(null);
  const pingRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { user, fetchUser } = useFetchUser();

  const routeTitles = useMemo(
    () => ({
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
    }),
    []
  );

  const currentTitle = routeTitles[location.pathname] || "Sales Panel";

  // Load user
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const wsOrigin = useMemo(() => getWsOriginFromApiBaseURL(), []);

  // WebSocket listener
  useEffect(() => {
    if (!user?.id) return;

    // cleanup previous
    if (pingRef.current) {
      clearInterval(pingRef.current);
      pingRef.current = null;
    }
    if (wsRef.current) {
      try { wsRef.current.close(); } catch {}
      wsRef.current = null;
    }

    const wsUrl = `${wsOrigin}/ws/notifications?user_id=${user.id}`;
    console.log("🔌 Connecting WS:", wsUrl);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ WS Connected");

      // keep alive (your backend waits for receive_text)
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send("ping");
        }
      }, 25000);
    };

    ws.onmessage = (event) => {
      let newNotif;
      try {
        newNotif = JSON.parse(event.data);
      } catch (e) {
        console.error("WS JSON parse error:", e, event.data);
        return;
      }

      newNotif._localId =
        newNotif._localId || `${Date.now()}_${Math.random().toString(16).slice(2)}`;
      newNotif.createdAt = newNotif.createdAt || new Date().toISOString();

      switch (newNotif.type) {
        case "territory_assignment":
          newNotif.title = `You have been assigned to ${newNotif.territoryName || "a territory"}`;
          break;

        case "lead_assigned":
        case "lead_assignment":
          newNotif.type = "lead_assignment";
          newNotif.title = `New lead assigned: ${newNotif.leadName || newNotif.company || "Lead"}`;
          break;

        case "lead_update":
          newNotif.title = `Lead updated: ${newNotif.leadName || newNotif.company || "Lead"}`;
          break;

        case "task_assignment": {
          const taskTitle = newNotif.title || "Task";
          newNotif.title = `New Task Assigned: ${taskTitle}`;
          break;
        }

        default:
          newNotif.title = newNotif.title || "New Notification";
      }

      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    ws.onclose = () => console.log("❌ WS Disconnected");
    ws.onerror = (err) => console.error("❌ WS Error:", err);

    return () => {
      if (pingRef.current) clearInterval(pingRef.current);
      pingRef.current = null;

      try { ws.close(); } catch {}
      wsRef.current = null;
    };
  }, [user?.id, wsOrigin]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (notif) => {
    setNotifications((prev) =>
      prev.map((n) => (n._localId === notif._localId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));
    setNotifOpen(false);

    switch (notif.type) {
      case "task_assignment":
        navigate("/sales/tasks", {
          state: { openTaskModal: true, taskId: notif.taskId || notif.task_id },
        });
        break;

      case "territory_assignment":
        navigate("/sales/overview");
        break;

      case "lead_assignment":
      case "lead_update":
        navigate(`/sales/leads/${notif.leadId || notif.lead_id || ""}`);
        break;

      default:
        navigate("/sales/overview");
    }
  };

  return (
    <header className="flex justify-between items-center bg-white shadow px-4 sm:px-6 py-3 border-b relative">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="lg:hidden text-gray-700 hover:text-gray-900">
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
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-lg border z-50 overflow-hidden">
              <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
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
                      key={n._localId}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition ${
                        n.read ? "bg-gray-50" : "bg-white"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] px-2 py-1 rounded-full font-semibold uppercase bg-purple-100 text-purple-700">
                          {n.type === "task_assignment" ? "Task" : "Info"}
                        </span>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-red-500" />}
                      </div>

                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800 text-sm">{n.title}</span>
                        <span className="text-xs text-gray-600 mt-0.5">
                          {n.assignedBy ? `Assigned by ${n.assignedBy}` : "System"}
                        </span>
                        <span className="text-[11px] text-gray-400 mt-1">
                          {n.createdAt ? new Date(n.createdAt).toLocaleString() : "Just now"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500 text-sm">No new notifications</div>
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
                <button className="block w-full text-sm text-gray-700 hover:bg-gray-50 py-2 rounded text-left">
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
