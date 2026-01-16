import React, { useState, useEffect } from "react";
import { FiSave, FiBriefcase, FiAlertCircle } from "react-icons/fi";
import api from "../api"; // Use your custom axios instance
import useFetchUser from "../hooks/useFetchUser";

export default function AdminCompanyDetails() {
  const { user, mutate } = useFetchUser();
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Sync internal state when user data is fetched or changed
  useEffect(() => {
    if (user?.company?.company_name) {
      setCompanyName(user.company.company_name);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // 1. Send update via your custom API instance
      // Note: your api instance already includes /api, so the path is /company/update-name
      await api.put("/company/update-name", {
        company_name: companyName,
      });

      // 2. Refresh the global user data (updates Sidebar instantly)
      if (mutate) {
        await mutate();
      }

      setMessage({ type: "success", text: "Company name updated successfully!" });
    } catch (error) {
      console.error("Update error:", error);
      // Capture detail from FastAPI error response
      const errorDetail = error.response?.data?.detail || "Failed to update company details.";
      setMessage({ type: "error", text: errorDetail });
    } finally {
      setLoading(false);
    }
  };

  // Optional: Role-based view check (Only CEO/ADMIN can edit)
  const canEdit = ["CEO", "ADMIN"].includes(user?.role?.toUpperCase());

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-[#fbbf24] px-6 py-4">
        <h2 className="text-gray-900 font-bold text-xl flex items-center gap-2">
          <FiBriefcase /> Company Details
        </h2>
        <p className="text-gray-700 text-sm">Manage your organization's global identity</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {!canEdit && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-lg text-sm border border-amber-200">
            <FiAlertCircle />
            <span>You only have view-access. Changes can only be made by an Admin or CEO.</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Company Name
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            disabled={!canEdit || loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fbbf24] focus:border-transparent outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
            placeholder="Enter company name"
            required
          />
        </div>

        {/* Status Message */}
        {message.text && (
          <div className={`p-3 rounded-lg text-sm border transition-all ${
            message.type === "success" 
              ? "bg-green-50 text-green-700 border-green-200" 
              : "bg-red-50 text-red-700 border-red-200"
          }`}>
            {message.text}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end pt-4 border-t border-gray-100">
          {canEdit && (
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-[#1e293b] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#334155] disabled:opacity-50 transition shadow-md active:scale-95"
            >
              <FiSave />
              {loading ? "Updating..." : "Save Changes"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}