import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiUser,
  FiUserPlus,
  FiBriefcase,
  FiFileText,
  FiMail,
  FiTrendingUp,
  FiTarget,
  FiChevronDown,
  FiCheckSquare,
  FiCalendar,
  FiPhoneCall,
  FiClipboard,
  FiSettings,
  FiShield,
} from "react-icons/fi";
import { MdOutlineSwitchAccount } from "react-icons/md";

import { BiCoinStack } from "react-icons/bi";
import { LuMapPin } from "react-icons/lu";
import { HiOutlineOfficeBuilding } from "react-icons/hi";
import { toast } from "react-toastify";
import AdminHeader from "./AdminHeader";
import useFetchUser from "../hooks/useFetchUser";

export default function AdminPanel() {
  const [salesOpen, setSalesOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [accountingOpen, setAccountingOpen] = useState(false);
  const [userMgmtOpen, setUserMgmtOpen] = useState(false);
  const [marketingOpen, setMarketingOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile sidebar
  const location = useLocation();
  const { user } = useFetchUser();

  useEffect(() => {
    user && console.log("Fetched user:", user);
  }, [user]);

  useEffect(() => {
    document.title = `Admin Panel | Forekas`;
  }, []);

  const salesRoutes = [
    "/admin/accounts",
    "/admin/contacts",
    "/admin/leads",
    "/admin/deals",
    "/admin/quotes",
    "/admin/soas",
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
    "flex items-center gap-3 px-3 py-2 rounded-lg bg-white text-tertiary font-semibold shadow-sm";
  const normalLink =
    "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-secondary hover:text-white transition";

  return (
    <div className="flex h-screen bg-paper-white overflow-hidden">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-tertiary text-white flex flex-col shadow-lg transform transition-transform duration-300 z-50
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="px-4 py-3 bg-accent leading-none">
          <p className="text-gray-900 font-bold text-lg m-0 p-0"> Forekas CRM{" "}
            <span className="text-[12px] text-gray-700 font-medium align-bottom">
              v2
            </span>
          </p>
          {user && user.company && (
            <p
              className="text-[12px] text-gray-600 font-medium w-full truncate"
              title={user.company.company_name}
            >
              {user.company.slug || user.company.company_name}
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
              className="w-full px-3 py-2 flex justify-between items-center text-sm font-medium text-gray-300 hover:bg-secondary rounded-lg transition"
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
                  <HiOutlineOfficeBuilding /> Accounts
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
              className="w-full px-3 py-2 flex justify-between items-center text-sm font-medium text-gray-300 hover:bg-secondary rounded-lg transition"
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
                  to="/admin/calendar"
                  className={({ isActive }) =>
                    isActive ? activeLink : normalLink
                  }
                >
                  <FiCalendar /> Calendar
                </NavLink>
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

          {/* Accounting Dropdown */}
          <div>
            <button
              className="w-full px-3 py-2 flex justify-between items-center text-sm font-medium text-gray-300 hover:bg-secondary rounded-lg transition"
              onClick={() => setAccountingOpen(!accountingOpen)}
            >
              <span className="flex items-center gap-2">
                <BiCoinStack className="text-lg" />
                Accounting
              </span>
              <FiChevronDown
                className={`transition-transform ${accountingOpen ? "rotate-180" : ""
                  }`}
              />
            </button>

            {accountingOpen && (
              <div className="ml-6 mt-2 space-y-1">
                <NavLink
                  to="/admin/soas"
                  className={({ isActive }) =>
                    isActive ? activeLink : normalLink
                  }
                  title="Statement of Account"
                >
                  <MdOutlineSwitchAccount /> SOA
                </NavLink>                
              </div>
            )}
          </div>

           {/* Marketing Dropdown */}
          <div>
            <button
              className="w-full px-3 py-2 flex justify-between items-center text-sm font-medium text-gray-300 hover:bg-secondary rounded-lg transition"
              onClick={() => setMarketingOpen(!marketingOpen)}
            >
              <span className="flex items-center gap-2">
                <FiTrendingUp className="text-lg" />
                Marketing
              </span>
              <FiChevronDown
                className={`transition-transform ${marketingOpen ? "rotate-180" : ""
                  }`}
              />
            </button>

            {marketingOpen && (
              <div className="ml-6 mt-2 space-y-1">
                <NavLink
                  to="#"
                  className={() => normalLink}
                  onClick={e => {
                    e.preventDefault();
                    toast.info("This feature is coming soon!");
                  }}
                  style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
                >
                  <FiMail /> Email Templates
                </NavLink>
              </div>
            )}
          </div>

          {/* User Management Dropdown */}
          <div>
            <button
              className="w-full px-3 py-2 flex justify-between items-center text-sm font-medium text-gray-300 hover:bg-secondary rounded-lg transition"
              onClick={() => setUserMgmtOpen(!userMgmtOpen)}
            >
              <span className="flex items-center gap-2">
                <FiSettings className="text-lg" />
                Settings
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
                  <FiUser />Your Profile
                </NavLink>
                <NavLink
                  to="/admin/company-details"
                  className={({ isActive }) => (isActive ? activeLink : normalLink)}
                >
                  <FiShield />Organization
                </NavLink>
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 text-xs text-gray-400 border-t border-gray-700">
          © {new Date().getFullYear()} Forekas CRM
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
          style={{ backgroundColor: "var(--color-paper-white)" }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}