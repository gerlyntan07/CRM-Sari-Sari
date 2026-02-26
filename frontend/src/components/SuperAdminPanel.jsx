import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import SuperAdminSidebar from "./SuperAdminSidebar";

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

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <SuperAdminSidebar onLogout={handleLogout} />

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
