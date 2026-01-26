import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiUser,
  FiUserPlus,
  FiBriefcase,
  FiFileText,
  FiTarget,
  FiChevronDown,
  FiCheckSquare,
  FiCalendar,
  FiPhoneCall,
  FiClipboard,
  FiSettings,
  FiShield,
  FiFilter, // ✅ 1. Imported Filter icon for Funnel
} from "react-icons/fi";
import { LuMapPin } from "react-icons/lu";
import AdminHeader from "./AdminHeader";
import useFetchUser from "../hooks/useFetchUser";

export default function AdminPanel() {
  const [salesOpen, setSalesOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [userMgmtOpen, setUserMgmtOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile sidebar
  const location = useLocation();
  const { user } = useFetchUser();

  useEffect(() => {
    user && console.log("Fetched user:", user);
  }, [user]);

  useEffect(() => {
    document.title = `Admin Panel | Sari-Sari CRM`;
  }, []);

  const salesRoutes = [
    "/admin/accounts",
    "/admin/contacts",
    "/admin/leads",
    "/admin/deals",
    "/admin/funnel", // ✅ 2. Added funnel route here so sidebar stays open
    "/admin/quotes",
    "/admin/targets",
  ];
  const isSalesActive = salesRoutes.includes(location.pathname);

  // Auto-open Sales dropdown when navigating to a sales route
  useEffect(() => {
    if (isSalesActive) {
      setSalesOpen(true);
    }
  }, [location.pathname]);

  const activeLink =
    "flex items-center gap-3 px-3 py-2 rounded-lg bg-white text-[#1e293b] font-semibold shadow-sm";
  const normalLink =
    "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-[#334155] hover:text-white transition";

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-[#1e293b] text-white flex flex-col shadow-lg transform transition-transform duration-300 z-50
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="px-4 py-3 bg-[#fbbf24] leading-none">
          <p className="text-gray-900 font-bold text-lg m-0 p-0"> Sari-Sari.CRM{" "}
            <span className="text-[12px] text-gray-700 font-medium align-bottom">
              v2
            </span>
          </p>
          {user && user.company && (
            <p className="text-[12px] text-gray-600 font-medium w-full truncate">
              {user.company.company_name}
            </p>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2 hide-scrollbar">
          {/* Dashboard */}
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) => (isActive ? activeLink : normalLink)}
          >
            <FiHome className="text-lg" />
            <span>Dashboard</span>
          </NavLink>

          {/* Sales Dropdown */}
          <div>
            <button
              className="w-full px-3 py-2 flex justify-between items-center text-sm font-medium text-gray-300 hover:bg-[#334155] rounded-lg transition"
              onClick={() => setSalesOpen(!salesOpen)}
            >
              <span className="flex items-center gap-2">
                <FiBriefcase className="text-lg" />
                Sales
              </span>
              <FiChevronDown
                className={`transition-transform ${salesOpen ? "rotate-180" : ""
                  }`}
              />
            </button>

            {salesOpen && (
              <div className="ml-6 mt-2 space-y-1">
                <NavLink
                  to="/admin/accounts"
                  className={({ isActive }) =>
                    isActive ? activeLink : normalLink
                  }
                >
                  <FiUsers /> Accounts
                </NavLink>
                <NavLink
                  to="/admin/contacts"
                  className={({ isActive }) =>
                    isActive ? activeLink : normalLink
                  }
                >
                  <FiUser /> Contacts
                </NavLink>
                <NavLink
                  to="/admin/leads"
                  className={({ isActive }) =>
                    isActive ? activeLink : normalLink
                  }
                >
                  <FiUserPlus /> Leads
                </NavLink>
                <NavLink
                  to="/admin/deals"
                  className={({ isActive }) =>
                    isActive ? activeLink : normalLink
                  }
                >
                  <FiBriefcase /> Deals
                </NavLink>
                
                {/* ✅ 3. NEW FUNNEL LINK ADDED HERE */}
                <NavLink
                  to="/admin/funnel"
                  className={({ isActive }) =>
                    isActive ? activeLink : normalLink
                  }
                >
                  <FiFilter /> Funnel
                </NavLink>

                <NavLink
                  to="/admin/quotes"
                  className={({ isActive }) =>
                    isActive ? activeLink : normalLink
                  }
                >
                  <FiFileText /> Quotes
                </NavLink>
                <NavLink
                  to="/admin/targets"
                  className={({ isActive }) =>
                    isActive ? activeLink : normalLink
                  }
                >
                  <FiTarget /> Targets
                </NavLink>
              </div>
            )}
          </div>

          {/* Activity Dropdown */}
          <div>
            <button
              className="w-full px-3 py-2 flex justify-between items-center text-sm font-medium text-gray-300 hover:bg-[#334155] rounded-lg transition"
              onClick={() => setActivityOpen(!activityOpen)}
            >
              <span className="flex items-center gap-2">
                <FiClipboard className="text-lg" />
                Activity
              </span>
              <FiChevronDown
                className={`transition-transform ${activityOpen ? "rotate-180" : ""
                  }`}
              />
            </button>

            {activityOpen && (
              <div className="ml-6 mt-2 space-y-1">
                <NavLink
                  to="/admin/tasks"
                  className={({ isActive }) =>
                    isActive ? activeLink : normalLink
                  }
                >
                  <FiCheckSquare /> Tasks
                </NavLink>
                <NavLink
                  to="/admin/meetings"
                  className={({ isActive }) =>
                    isActive ? activeLink : normalLink
                  }
                >
                  <FiCalendar /> Meetings
                </NavLink>
                <NavLink
                  to="/admin/calls"
                  className={({ isActive }) =>
                    isActive ? activeLink : normalLink
                  }
                >
                  <FiPhoneCall /> Calls
                </NavLink>
                <NavLink
                  to="/admin/audit"
                  className={({ isActive }) =>
                    isActive ? activeLink : normalLink
                  }
                >
                  <FiClipboard /> Audit
                </NavLink>
              </div>
            )}
          </div>
          {/* Territory */}
          <div>
            <NavLink
              to="/admin/territory"
              className={({ isActive }) => (isActive ? activeLink : normalLink)}
            >
              <span className="flex items-center gap-2">
                <LuMapPin className="text-lg" />
                Territory
              </span>
            </NavLink>
          </div>

          {/* User Management Dropdown */}
          <div>
            <button
              className="w-full px-3 py-2 flex justify-between items-center text-sm font-medium text-gray-300 hover:bg-[#334155] rounded-lg transition"
              onClick={() => setUserMgmtOpen(!userMgmtOpen)}
            >
              <span className="flex items-center gap-2">
                <FiSettings className="text-lg" />
                User Management
              </span>
              <FiChevronDown
                className={`transition-transform ${userMgmtOpen ? "rotate-180" : ""
                  }`}
              />
            </button>

            {userMgmtOpen && (
              <div className="ml-6 mt-2 space-y-1">
                <NavLink
                  to="/admin/users"
                  className={({ isActive }) =>
                    isActive ? activeLink : normalLink
                  }
                >
                  <FiUsers /> Users
                </NavLink>
                <NavLink
                  to="/admin/manage-account"
                  className={({ isActive }) =>
                    isActive ? activeLink : normalLink
                  }
                >
                  <FiUser /> Manage Account
                </NavLink>
                <NavLink
                  to="/admin/company-details"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <FiShield /> Settings
                </NavLink>
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 text-xs text-gray-400 border-t border-gray-700">
          © {new Date().getFullYear()} Sari-Sari CRM
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-64 overflow-hidden">
        <AdminHeader toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main
          className="flex-1 p-6 overflow-auto hide-scrollbar"
          style={{ backgroundColor: "#fffeee" }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}