import { NavLink } from "react-router-dom";
import { FiHome, FiLogOut } from "react-icons/fi";

const activeLink =
  "flex items-center gap-3 px-3 py-2 rounded-lg bg-white text-[#1e293b] font-semibold shadow-sm";
const normalLink =
  "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-[#334155] hover:text-white transition";

export default function SuperAdminSidebar({ onLogout }) {
  return (
    <div className="w-64 bg-[#1e293b] text-white flex flex-col shadow-lg">
      {/* Logo */}
      <div className="px-4 py-3 bg-[#ef4444] leading-none">
        <p className="text-white font-bold text-lg m-0 p-0">Admin Panel</p>
        <p className="text-[12px] text-red-100 font-medium">
          System Management
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        <NavLink
          to="/super-admin/dashboard"
          className={({ isActive }) => (isActive ? activeLink : normalLink)}
        >
          <FiHome className="text-lg" />
          <span>Tenants Dashboard</span>
        </NavLink>

        {/* Add more nav items here */}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition"
        >
          <FiLogOut className="text-lg" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
