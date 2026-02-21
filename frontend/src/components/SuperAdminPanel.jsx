import { useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { FiHome, FiLogOut } from "react-icons/fi";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function SuperAdminPanel() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = `Super Admin | Sari-Sari CRM`;
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error logging out");
    }
  };

  const activeLink =
    "flex items-center gap-3 px-3 py-2 rounded-lg bg-white text-[#1e293b] font-semibold shadow-sm";
  const normalLink =
    "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-[#334155] hover:text-white transition";

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-[#1e293b] text-white flex flex-col shadow-lg">
        {/* Logo */}
        <div className="px-4 py-3 bg-[#ef4444] leading-none">
          <p className="text-white font-bold text-lg m-0 p-0">
            Admin Panel
          </p>
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
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition"
          >
            <FiLogOut className="text-lg" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">System Administrator</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
