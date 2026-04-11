import React, { useState, useEffect } from "react";
import currencies from "../../data/currencies.json";
import CurrencyDropdown from "../CurrencyDropdown";
import api from "../../api";
import { toast } from "react-toastify";
import { Briefcase, DollarSign, Settings, Upload, X } from "lucide-react";

// Utility to generate a random 12-digit tenant number (for preview only)
function generateTenantNumber() {
  let num = "";
  for (let i = 0; i < 12; i++) {
    num += Math.floor(Math.random() * 10);
  }
  return num;
}

export default function AddTenantForm({ onClose, onSuccess, editMode = false, initialData = null }) {
  const [formData, setFormData] = useState({
    company_name: "",
    slug: "",
    company_number: "",
    company_website: "",
    address: "",
    currency: "PHP",
    quota_period: "January",
    tax_rate: 0,
    vat_registration_number: "",
    tax_id_number: "",
    is_subscription_active: true,
    calendar_start_day: "Monday",
    backup_reminder: "Daily",
    fiscal_year_start: "January",
    tenant_number: generateTenantNumber(), // Preview only, backend will assign real unique value
  });

  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    if (editMode && initialData) {
      setFormData({ ...initialData });
      // Set logo preview if company_logo exists
      if (initialData.company_logo) {
        setLogoPreview(initialData.company_logo);
      }
    } else if (!editMode) {
      // For add mode, always show a preview tenant number (not sent to backend)
      setFormData((prev) => ({ ...prev, tenant_number: generateTenantNumber() }));
    }
  }, [editMode, initialData]);

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (name === "company_logo") {
      const file = files[0];
      setFormData({ ...formData, company_logo: file });
      // Create preview URL
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setLogoPreview(null);
      }
    } else if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
    } else if (name === "company_name") {
      // Auto-generate slug from the initials of each word in company name
      const initials = value
        .split(/\s+/)
        .filter(Boolean)
        .map(word => (word[0] || "").toUpperCase())
        .join("");
      setFormData({ ...formData, company_name: value, slug: initials });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      
      // Check if logo was removed during edit
      const logoWasRemoved = editMode && initialData?.company_logo && logoPreview === null;

      Object.entries(formData).forEach(([key, value]) => {
        // Do not send tenant_number on create (backend will generate unique one)
        if (!editMode && key === "tenant_number") return;
        // On edit, only send logo if it's a new File (not existing base64 string)
        if (editMode && key === "company_logo" && typeof value === "string") return;
        // Skip logo field (handled separately below)
        if (key === "company_logo") return;
        if (value !== "" && value !== null && value !== undefined) {
          data.append(key, value);
        }
      });

      // Handle logo separately
      if (formData.company_logo instanceof File) {
        data.append("company_logo", formData.company_logo);
      } else if (logoWasRemoved) {
        data.append("delete_logo", "true");
      }

      let response;
      if (editMode && initialData && initialData.id) {
        response = await api.put(`/admin/tenants/${initialData.id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Tenant updated successfully!");
      } else {
        response = await api.post("/admin/tenants", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Tenant added successfully!");
      }
      // After creation, show the real tenant_number from backend if available
      if (response?.data?.tenant_number) {
        setFormData((prev) => ({ ...prev, tenant_number: response.data.tenant_number }));
      }
      onSuccess?.();
      onClose?.();
    } catch (error) {
      toast.error(error.response?.data?.detail || (editMode ? "Failed to update tenant" : "Failed to add tenant"));
    } finally {
      setLoading(false);
    }
  };

  const input =
    "w-full rounded-lg border border-gray-300/50 px-4 py-2.5 text-sm bg-white/50 backdrop-blur-sm hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition duration-200";

  const label = "text-sm font-medium text-gray-700";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">

      {/* MODAL */}
      <div className="bg-white rounded-3xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto" style={{ boxShadow: 'none' }}>

        {/* HEADER */}
        <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {editMode ? 'Edit Tenant' : 'Add New Tenant'}
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              {editMode ? 'Update tenant company information.' : 'Create a new tenant workspace for your platform.'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition hover:bg-gray-100 rounded-full p-1 w-10 h-10 flex items-center justify-center"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* COMPANY CARD */}
          <div className="bg-gradient-to-br from-blue-50/50 to-white border border-gray-100 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <Briefcase size={24} className="text-blue-600" />
              <h3 className="font-bold text-gray-900 text-lg">
                Company Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">


              <div>
                <label className={label}>
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Acme Corp"
                  className={input}
                />
              </div>


              <div>
                <label className={label}>
                  Tenant Number
                </label>
                <input
                  name="tenant_number"
                  value={formData.tenant_number || ""}
                  readOnly
                  placeholder="Auto-generated tenant number"
                  className={input + " bg-gray-100 cursor-not-allowed"}
                  tabIndex={-1}
                />
              </div>

              <div>
                <label className={label}>
                  Company Number <span className="text-red-500">*</span>
                </label>
                <input
                  name="company_number"
                  value={formData.company_number}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 12345678"
                  className={input}
                />
              </div>

              <div>
                <label className={label}>Slug</label>
                <input
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="Auto-generated from company name"
                  className={input}
                />
              </div>

              <div className="md:col-span-2">
                <label className={label}>Website</label>
                <input
                  type="url"
                  name="company_website"
                  value={formData.company_website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className={input}
                />
              </div>

              <div className="md:col-span-2">
                <label className={label}>Address</label>
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Main Street, City, Country"
                  className={input}
                />
              </div>

              {/* LOGO UPLOAD */}
              <div className="md:col-span-2">
                <label className={`${label} mb-3 block`}>
                  Company Logo
                </label>

                {logoPreview ? (
                  <div className="relative w-full">
                    <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50 overflow-hidden" style={{ minHeight: '400px' }}>
                      <img src={logoPreview} alt="Logo Preview" className="max-w-full max-h-96 object-contain" />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLogoPreview(null);
                        setFormData({ ...formData, company_logo: null });
                      }}
                      className="absolute -top-3 -right-3 hover:opacity-80 transition"
                    >
                      <X size={25} className="text-white bg-black rounded-full p-1" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl p-16 cursor-pointer transition duration-200 bg-gray-50/50 hover:bg-blue-50/30">
                    <div className="text-center">
                      <Upload size={40} className="mx-auto mb-3 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">
                        Click to upload logo
                      </span>
                      <span className="text-xs text-gray-400 block mt-1">PNG, JPG up to 5MB</span>
                    </div>
                    <input
                      type="file"
                      name="company_logo"
                      onChange={handleChange}
                      className="hidden"
                      accept="image/*"
                    />
                  </label>
                )}
              </div>

            </div>
          </div>

          {/* FINANCIAL CARD */}
          <div className="bg-gradient-to-br from-emerald-50/50 to-white border border-gray-100 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <DollarSign size={24} className="text-emerald-600" />
              <h3 className="font-bold text-gray-900 text-lg">
                Financial Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div>
                <label className={label}>Currency</label>
                <CurrencyDropdown
                  currencies={currencies}
                  value={formData.currency}
                  onChange={(code) => setFormData({ ...formData, currency: code })}
                  disabled={loading}
                />
              </div>

              <div>
                <label className={label}>Tax Rate (%)</label>
                <input
                  type="number"
                  name="tax_rate"
                  value={formData.tax_rate}
                  onChange={handleChange}
                  placeholder="0"
                  className={input}
                />
              </div>

              <div>
                <label className={label}>Fiscal Year Start</label>
                <select
                  name="fiscal_year_start"
                  value={formData.fiscal_year_start}
                  onChange={handleChange}
                  className={input}
                >
                  <option>January</option>
                  <option>February</option>
                  <option>March</option>
                  <option>April</option>
                  <option>May</option>
                  <option>June</option>
                  <option>July</option>
                  <option>August</option>
                  <option>September</option>
                  <option>October</option>
                  <option>November</option>
                  <option>December</option>
                </select>
              </div>

              <div>
                <label className={label}>
                  VAT Registration
                </label>
                <input
                  name="vat_registration_number"
                  value={formData.vat_registration_number}
                  onChange={handleChange}
                  placeholder="e.g., VAT123456"
                  className={input}
                />
              </div>

            </div>
            <div className="mt-5">
              <label className={label}>Tax ID</label>
              <input
                name="tax_id_number"
                value={formData.tax_id_number}
                onChange={handleChange}
                placeholder="e.g., TIN987654"
                className={input}
              />
            </div>
          </div>

          {/* SETTINGS */}
          <div className="bg-gradient-to-br from-purple-50/50 to-white border border-gray-100 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <Settings size={24} className="text-purple-600" />
              <h3 className="font-bold text-gray-900 text-lg">
                Workspace Settings
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div>
                <label className={label}>
                  Calendar Start Day
                </label>

                <select
                  name="calendar_start_day"
                  value={formData.calendar_start_day}
                  onChange={handleChange}
                  className={input}
                >
                  <option>Monday</option>
                  <option>Sunday</option>
                </select>
              </div>

              <div>
                <label className={label}>
                  Backup Reminder
                </label>

                <select
                  name="backup_reminder"
                  value={formData.backup_reminder}
                  onChange={handleChange}
                  className={input}
                >
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                  <option>Quarterly</option>
                  <option>Yearly</option>
                </select>
              </div>

            </div>
          </div>

          {/* BUTTONS */}

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold border border-blue-600 shadow transition duration-200 disabled:opacity-50"
              disabled={loading}
            >
              {loading
                ? (editMode ? 'Saving...' : 'Adding...')
                : (editMode ? 'Save Changes' : 'Add Tenant')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}