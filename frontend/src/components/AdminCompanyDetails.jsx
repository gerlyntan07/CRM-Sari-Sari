import React, { useState, useEffect, useRef } from "react";
import { FiSave, FiBriefcase, FiAlertCircle, FiDollarSign, FiCalendar, FiPercent, FiImage, FiUpload, FiMapPin, FiDownload } from "react-icons/fi";
import { toast } from "react-toastify";
import api from "../api";
import useFetchUser from "../hooks/useFetchUser";
import currencies from "../data/currencies.json";
import { getFlagEmoji } from "../utils/flagEmoji";
import CurrencyDropdown from "./CurrencyDropdown";

export default function AdminCompanyDetails() {
  const { user, mutate } = useFetchUser();
  const fileInputRef = useRef(null);

  // Form States
  const [companyName, setCompanyName] = useState("");
  const [companySlug, setCompanySlug] = useState("");
  const [currency, setCurrency] = useState("PHP");
  const [quotaPeriod, setQuotaPeriod] = useState("January");
  const [taxRate, setTaxRate] = useState(0);
  const [vatRegistrationNumber, setVatRegistrationNumber] = useState("");
  const [taxIdNumber, setTaxIdNumber] = useState("");
  const [companyLogo, setCompanyLogo] = useState(null); // Current logo from DB
  const [newLogo, setNewLogo] = useState(null); // New uploaded logo (base64)
  const [address, setAddress] = useState("");

  // UI States
  const [loading, setLoading] = useState(false);
  const [downloadingBackup, setDownloadingBackup] = useState(false);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Sync internal state when user data is fetched
  useEffect(() => {
    if (user?.company) {
      if (user.company.company_name) setCompanyName(user.company.company_name);
      if (user.company.slug) setCompanySlug(user.company.slug);
      if (user.company.currency) setCurrency(user.company.currency);
      if (user.company.quota_period) setQuotaPeriod(user.company.quota_period);
      if (user.company.tax_rate !== undefined) setTaxRate(user.company.tax_rate);
      if (user.company.vat_registration_number !== undefined && user.company.vat_registration_number !== null) {
        setVatRegistrationNumber(user.company.vat_registration_number);
      }
      if (user.company.tax_id_number !== undefined && user.company.tax_id_number !== null) {
        setTaxIdNumber(user.company.tax_id_number);
      }
      if (user.company.company_logo) setCompanyLogo(user.company.company_logo);
      if (user.company.address) setAddress(user.company.address);
    }
  }, [user]);

  // Handle logo file selection
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB");
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

    try {
      // Build payload
      const payload = {
        company_name: companyName,
        slug: companySlug,
        currency: currency,
        quota_period: quotaPeriod,
        tax_rate: parseFloat(taxRate),
        vat_registration_number: vatRegistrationNumber,
        tax_id_number: taxIdNumber,
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

      toast.success("Company settings updated successfully!");
    } catch (error) {
      console.error("Update error:", error);
      const errorDetail = error.response?.data?.detail || "Failed to update settings.";
      toast.error(errorDetail);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBackup = async () => {
    setDownloadingBackup(true);

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

      toast.success("Backup downloaded successfully!");
    } catch (error) {
      console.error("Backup download error:", error);
      const errorDetail =
        error?.response?.data?.detail ||
        "Failed to download backup. Please try again.";
      toast.error(errorDetail);
    } finally {
      setDownloadingBackup(false);
    }
  };

  const canEdit = ["CEO", "ADMIN"].includes(user?.role?.toUpperCase());

  return (
    <div className="p-4 lg:p-8 font-inter">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-1">
          Organization Settings
        </h1>
        <p className="text-gray-600 text-sm">
          Manage your organization's information and fiscal settings
        </p>
      </div>

      {!canEdit && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-lg text-sm border border-amber-200 mb-6">
          <FiAlertCircle />
          <span>You only have view-access. Changes can only be made by an Admin.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Organization Settings Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-6">
            <FiBriefcase className="text-blue-600" />
            Company Information
          </h2>

          {/* Two Column Layout - Logo Top (Mobile), Company Info Left, Logo Right (Desktop) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
            {/* Right Column - Company Logo (appears first on mobile, second on desktop) */}
            <div className="lg:col-span-1 order-first lg:order-last">
              <div className="flex flex-col items-center justify-start mb-6 lg:mb-0">
                <label className="block text-gray-700 font-medium mb-3 text-sm text-center w-full">
                  <FiImage className="inline text-blue-600 mr-1" /> Company Logo
                </label>
                <div className="w-40 flex flex-col items-center">
                  <div className="mb-3 w-full flex justify-center">
                    {(newLogo || companyLogo) ? (
                      <img
                        src={newLogo || companyLogo}
                        alt="Company Logo"
                        className="w-40 h-auto object-contain border border-gray-200 rounded-md bg-gray-50"
                      />
                    ) : (
                      <div className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center bg-gray-50">
                        <FiImage className="text-gray-400 text-4xl" />
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  {canEdit && (
                    <div className="w-full flex flex-col items-center gap-2">
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
                        className="flex items-center justify-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition disabled:opacity-50 w-full"
                      >
                        <FiUpload className="text-gray-500" />
                        {(newLogo || companyLogo) ? "Change Logo" : "Upload Logo"}
                      </button>
                      {(newLogo || companyLogo) && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          disabled={loading}
                          className="text-sm text-red-600 hover:text-red-700 transition"
                        >
                          Remove Logo
                        </button>
                      )}
                      <p className="text-xs text-gray-500 text-center">Max 2MB, PNG or JPG</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Left Column - Company Information */}
            <div className="lg:col-span-3 space-y-4">

              {/* Company Name */}
              <div>
                <label className="flex items-center gap-2 text-gray-700 font-medium mb-2 text-sm">
                  <FiBriefcase className="text-blue-600" /> Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={!canEdit || loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                  placeholder="Enter company name"
                  required
                />
              </div>

              {/* Company Slug */}
              <div>
                <label className="flex items-center gap-2 text-gray-700 font-medium mb-2 text-sm">
                  <FiBriefcase className="text-blue-600" /> Company Slug (short name)
                </label>
                <input
                  type="text"
                  value={companySlug}
                  onChange={(e) => setCompanySlug(e.target.value)}
                  disabled={!canEdit || loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                  placeholder="e.g. sari-sari"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Shown in the sidebar header; leave blank to auto-generate.
                </p>
              </div>

              {/* Company Address */}
              <div>
                <label className="flex items-center gap-2 text-gray-700 font-medium mb-2 text-sm">
                  <FiMapPin className="text-blue-600" /> Company Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={!canEdit || loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed resize-none"
                  placeholder="Enter company address"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <hr className="my-8 border-gray-200" />

          {/* Fiscal Settings Section */}
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-6">
            <FiDollarSign className="text-blue-600" />
            Fiscal Settings
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fiscal Year Start */}
              <div>
                <label className="flex items-center gap-2 text-gray-700 font-medium mb-2 text-sm">
                  <FiCalendar className="text-blue-600" /> Fiscal Year Start
                </label>
                <div className="relative">
                  <select
                    value={quotaPeriod}
                    onChange={(e) => setQuotaPeriod(e.target.value)}
                    disabled={!canEdit || loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white disabled:bg-gray-50 cursor-pointer"
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

              {/* Tax Rate */}
              <div>
                <label className="flex items-center gap-2 text-gray-700 font-medium mb-2 text-sm">
                  <FiPercent className="text-blue-600" /> Default Tax Rate
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    disabled={!canEdit || loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-gray-50"
                    placeholder="0.00"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400 font-medium">
                    %
                  </div>
                </div>
              </div>
            </div>

            {/* VAT Registration Number, Tax ID Number, and Currency in one row, equal width */}
            <div className="flex flex-col gap-4 mt-4 md:flex-row">
              <div className="flex-1">
                <label className="block text-gray-700 font-medium mb-2 text-sm">
                  VAT Registration Number
                </label>
                <input
                  type="text"
                  value={vatRegistrationNumber}
                  onChange={(e) => setVatRegistrationNumber(e.target.value)}
                  disabled={!canEdit || loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-gray-50"
                  placeholder="Enter VAT registration number"
                />
              </div>
              <div className="flex-1">
                <label className="block text-gray-700 font-medium mb-2 text-sm">
                  {currency === "PHP" ? "TIN ID Number" : "Tax ID Number"}
                </label>
                <input
                  type="text"
                  value={taxIdNumber}
                  onChange={(e) => setTaxIdNumber(e.target.value)}
                  disabled={!canEdit || loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-gray-50"
                  placeholder={currency === "PHP" ? "Enter TIN ID number" : "Enter tax ID number"}
                />
              </div>
              <div className="flex-1">
                <label className="flex items-center gap-2 text-gray-700 font-medium mb-2 text-sm">
                  <FiDollarSign className="text-blue-600" /> Currency
                </label>
                <CurrencyDropdown
                  currencies={currencies}
                  value={currency}
                  onChange={(code) => setCurrency(code)}
                  disabled={!canEdit || loading}
                  loading={loading}
                />
              </div>
            </div>
            </div>

            {/* Action Buttons */}
            {canEdit && (
              <>
                <hr className="my-8 border-gray-200" />
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  disabled={loading || downloadingBackup}
                  className="flex items-center justify-center gap-2 border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  <FiDownload />
                  Download Backup (CSV)
                </button>

                <button
                  type="submit"
                  disabled={loading || downloadingBackup}
                  className="flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-2 rounded-md font-medium hover:bg-gray-800 disabled:opacity-50 transition"
                >
                  <FiSave />
                  {loading ? "Updating..." : "Save Settings"}
                </button>
              </div>
              </>
            )}
          </div>
      </form>
    </div>
  );
}