import React, { useState, useEffect, useRef } from "react";
import { FiSave, FiBriefcase, FiAlertCircle, FiDollarSign, FiCalendar, FiPercent, FiImage, FiUpload, FiMapPin, FiDownload } from "react-icons/fi";
import api from "../api";
import useFetchUser from "../hooks/useFetchUser";

export default function AdminCompanyDetails() {
  const { user, mutate } = useFetchUser();
  const fileInputRef = useRef(null);

  // Form States
  const [companyName, setCompanyName] = useState("");
  const [currency, setCurrency] = useState("₱");
  const [quotaPeriod, setQuotaPeriod] = useState("January");
  const [taxRate, setTaxRate] = useState(0);
  const [companyLogo, setCompanyLogo] = useState(null); // Current logo from DB
  const [newLogo, setNewLogo] = useState(null); // New uploaded logo (base64)
  const [address, setAddress] = useState("");

  // UI States
  const [loading, setLoading] = useState(false);
  const [downloadingBackup, setDownloadingBackup] = useState(false);
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
      if (user.company.quota_period) setQuotaPeriod(user.company.quota_period);
      if (user.company.tax_rate !== undefined) setTaxRate(user.company.tax_rate);
      if (user.company.company_logo) setCompanyLogo(user.company.company_logo);
      if (user.company.address) setAddress(user.company.address);
    }
  }, [user]);

  // Handle logo file selection
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please select an image file" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image size should be less than 2MB" });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewLogo(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Remove logo
  const handleRemoveLogo = () => {
    setNewLogo("");
    setCompanyLogo(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Build payload
      const payload = {
        company_name: companyName,
        currency: currency,
        quota_period: quotaPeriod,
        tax_rate: parseFloat(taxRate),
        address: address,
      };

      // Include logo if changed (newLogo is non-null means user made a change)
      // "" = remove logo, base64 string = new logo
      if (newLogo !== null) {
        payload.company_logo = newLogo; // Send "" to remove, or base64 to set new
      }

      await api.put("/company/update-name", payload);

      // Refresh global user data
      if (mutate) {
        await mutate();
      }

      // Reset newLogo state after successful save
      setNewLogo(null);

      setMessage({ type: "success", text: "Company settings updated successfully!" });
    } catch (error) {
      console.error("Update error:", error);
      const errorDetail = error.response?.data?.detail || "Failed to update settings.";
      setMessage({ type: "error", text: errorDetail });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBackup = async () => {
    setDownloadingBackup(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await api.get("/admin/backup/csv", {
        responseType: "blob",
      });

      // Try to use the filename from Content-Disposition if present
      const contentDisposition = res.headers?.["content-disposition"] || "";
      const match = /filename="?([^";]+)"?/i.exec(contentDisposition);
      const filename = match?.[1] || "crm-backup.zip";

      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Backup download error:", error);
      const errorDetail =
        error?.response?.data?.detail ||
        "Failed to download backup. Please try again.";
      setMessage({ type: "error", text: errorDetail });
    } finally {
      setDownloadingBackup(false);
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
            <span>You only have view-access. Changes can only be made by an Admin.</span>
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
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <FiMapPin className="text-gray-500" /> Company Address
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={!canEdit || loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fbbf24] focus:border-transparent outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed resize-none"
            placeholder="Enter company address"
            rows={3}
          />
        </div>

        {/* 2. Company Logo */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <FiImage className="text-gray-500" /> Company Logo
          </label>
          <div className="flex items-center gap-4">
            {/* Logo Preview */}
            <div className="flex-shrink-0">
              {(newLogo || companyLogo) ? (
                <img
                  src={newLogo || companyLogo}
                  alt="Company Logo"
                  className="w-16 h-16 object-contain border border-gray-200 rounded-lg bg-gray-50"
                />
              ) : (
                <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  <FiImage className="text-gray-400 text-xl" />
                </div>
              )}
            </div>

            {/* Upload Controls */}
            {canEdit && (
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                  id="company-logo-upload"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  <FiUpload className="text-gray-500" />
                  {(newLogo || companyLogo) ? "Change Logo" : "Upload Logo"}
                </button>
                {(newLogo || companyLogo) && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    disabled={loading}
                    className="text-xs text-red-600 hover:text-red-700 transition"
                  >
                    Remove Logo
                  </button>
                )}
                <p className="text-xs text-gray-500">Max 2MB, PNG or JPG</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 2. Fiscal Year Start */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
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
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          {/* 3. Tax Rate */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <FiPercent className="text-gray-500" /> Default Tax Rate
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                disabled={!canEdit || loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fbbf24] focus:border-transparent outline-none transition disabled:bg-gray-50"
                placeholder="0.00"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-8 pointer-events-none text-gray-400 font-medium">
                %
              </div>
            </div>
          </div>
        </div>

        {/* 4. Currency Selection */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <FiDollarSign className="text-gray-500" /> Currency
          </label>
          <div className="flex gap-3 max-w-xs">
            <label
              className={`flex-1 flex items-center justify-center gap-1 p-2 border rounded-lg cursor-pointer transition-all ${currency === "₱"
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
              className={`flex-1 flex items-center justify-center gap-1 p-2 border rounded-lg cursor-pointer transition-all ${currency === "$"
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

        {/* Status Message */}
        {message.text && (
          <div className={`p-3 rounded-lg text-sm border transition-all ${message.type === "success"
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-700 border-red-200"
            }`}>
            {message.text}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end pt-4 border-t border-gray-100">
          {canEdit && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleDownloadBackup}
                disabled={loading || downloadingBackup}
                className="flex items-center gap-2 border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition active:scale-95"
              >
                <FiDownload />
                {downloadingBackup ? "Preparing..." : "Download Backup (CSV)"}
              </button>

              <button
                type="submit"
                disabled={loading || downloadingBackup}
                className="flex items-center gap-2 bg-[#1e293b] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#334155] disabled:opacity-50 transition shadow-md active:scale-95"
              >
                <FiSave />
                {loading ? "Updating..." : "Save Settings"}
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}