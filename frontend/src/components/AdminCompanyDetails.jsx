import React, { useState, useEffect } from "react";
import { FiSave, FiBriefcase, FiAlertCircle, FiDollarSign, FiCalendar } from "react-icons/fi"; // Added FiCalendar
import api from "../api"; 
import useFetchUser from "../hooks/useFetchUser";

export default function AdminCompanyDetails() {
  const { user, mutate } = useFetchUser();
  
  // Form States
  const [companyName, setCompanyName] = useState("");
  const [currency, setCurrency] = useState("₱");
  const [quotaPeriod, setQuotaPeriod] = useState("January"); // Default start month
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Sync internal state when user data is fetched
  useEffect(() => {
    if (user?.company) {
      if (user.company.company_name) setCompanyName(user.company.company_name);
      if (user.company.currency) setCurrency(user.company.currency);
      // Load Quota Period (ensure exact string match or default to January)
      if (user.company.quota_period) setQuotaPeriod(user.company.quota_period);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Send all details in the payload
      await api.put("/company/update-name", {
        company_name: companyName,
        currency: currency,
        quota_period: quotaPeriod, 
      });

      // Refresh global user data
      if (mutate) {
        await mutate();
      }

      setMessage({ type: "success", text: "Company settings updated successfully!" });
    } catch (error) {
      console.error("Update error:", error);
      const errorDetail = error.response?.data?.detail || "Failed to update settings.";
      setMessage({ type: "error", text: errorDetail });
    } finally {
      setLoading(false);
    }
  };

  const canEdit = ["CEO", "ADMIN"].includes(user?.role?.toUpperCase());

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-[#fbbf24] px-6 py-4">
        <h2 className="text-gray-900 font-bold text-xl flex items-center gap-2">
          <FiBriefcase /> Company Details
        </h2>
        <p className="text-gray-700 text-sm">Manage your organization's identity and fiscal settings</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {!canEdit && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-lg text-sm border border-amber-200">
            <FiAlertCircle />
            <span>You only have view-access. Changes can only be made by an Admin or CEO.</span>
          </div>
        )}

        {/* 1. Company Name */}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 2. Fiscal Year Start (Quota Period) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FiCalendar className="text-gray-500" /> Fiscal Year Start
              </label>
              <div className="relative">
                <select
                    value={quotaPeriod}
                    onChange={(e) => setQuotaPeriod(e.target.value)}
                    disabled={!canEdit || loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fbbf24] focus:border-transparent outline-none appearance-none bg-white disabled:bg-gray-50 cursor-pointer"
                >
                    {months.map((month) => (
                    <option key={month} value={month}>{month}</option>
                    ))}
                </select>
                {/* Custom arrow icon for select */}
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Select the month your sales year begins.
              </p>
            </div>

            {/* 3. Currency Selection */}
            <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FiDollarSign className="text-gray-500" /> Currency
            </label>
            <div className="flex gap-3">
                <label 
                className={`flex-1 flex items-center justify-center gap-1 p-2 border rounded-lg cursor-pointer transition-all ${
                    currency === "₱" 
                    ? "bg-amber-50 border-[#fbbf24] text-amber-900 font-medium ring-1 ring-[#fbbf24]" 
                    : "border-gray-200 hover:bg-gray-50 text-gray-600"
                } ${(!canEdit || loading) ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                <input 
                    type="radio" 
                    name="currency" 
                    value="₱" 
                    checked={currency === "₱"} 
                    onChange={() => setCurrency("₱")}
                    disabled={!canEdit || loading}
                    className="hidden"
                />
                <span className="text-lg font-bold">₱</span> PHP
                </label>

                <label 
                className={`flex-1 flex items-center justify-center gap-1 p-2 border rounded-lg cursor-pointer transition-all ${
                    currency === "$" 
                    ? "bg-amber-50 border-[#fbbf24] text-amber-900 font-medium ring-1 ring-[#fbbf24]" 
                    : "border-gray-200 hover:bg-gray-50 text-gray-600"
                } ${(!canEdit || loading) ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                <input 
                    type="radio" 
                    name="currency" 
                    value="$" 
                    checked={currency === "$"} 
                    onChange={() => setCurrency("$")}
                    disabled={!canEdit || loading}
                    className="hidden"
                />
                <span className="text-lg font-bold">$</span> USD
                </label>
            </div>
            </div>
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
              {loading ? "Updating..." : "Save Settings"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}