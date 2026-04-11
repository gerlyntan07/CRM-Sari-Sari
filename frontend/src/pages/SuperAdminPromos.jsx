import React, { useEffect, useMemo, useState } from "react";
import {
  FiChevronDown,
  FiChevronUp,
  FiCopy,
  FiEdit2,
  FiInfo,
  FiPlus,
  FiRefreshCw,
  FiTag,
  FiToggleLeft,
  FiToggleRight,
  FiTrash2,
} from "react-icons/fi";
import { toast } from "react-toastify";
import api from "../api";

const PURPOSE_OPTIONS = [
  { value: "CUSTOM", label: "Custom" },
  { value: "TRIAL_EXTENSION", label: "Increased Free Trial" },
  { value: "SUBSCRIPTION_EXTENSION", label: "Subscription Extension" },
  { value: "PRICE_DISCOUNT_PERCENT", label: "Price Discount (%)" },
  { value: "PRICE_DISCOUNT_FIXED", label: "Price Discount (Fixed)" },
];

const TARGET_SCOPE_OPTIONS = [
  { value: "company", label: "Organization" },
  { value: "user", label: "User" },
  { value: "both", label: "User + Organization" },
];

const defaultForm = {
  name: "",
  description: "",
  purpose: "TRIAL_EXTENSION",
  target_scope: "company",
  is_public: true,
  allow_company_subscription_effects_for_user_scope: false,
  code_length: 8,
  manual_code: "",
  extend_days: 7,
  discount_percent: "",
  discount_amount: "",
  max_total_redemptions: "",
  max_redemptions_per_company: 1,
  max_redemptions_per_user: 1,
  expires_at: "",
  is_active: true,
};

export default function SuperAdminPromos() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState(null);
  const [deletingPromoId, setDeletingPromoId] = useState(null);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(true);
  const [showNotesPopover, setShowNotesPopover] = useState(false);
  const [qrPreviewPromo, setQrPreviewPromo] = useState(null);
  const [form, setForm] = useState(defaultForm);

  const isEditing = editingPromoId !== null;

  const needsExtendDays = useMemo(
    () => ["TRIAL_EXTENSION", "SUBSCRIPTION_EXTENSION"].includes(form.purpose),
    [form.purpose]
  );

  const needsDiscountPercent = form.purpose === "PRICE_DISCOUNT_PERCENT";
  const needsDiscountAmount = form.purpose === "PRICE_DISCOUNT_FIXED";

  const fetchPromos = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/promos", { params: { include_inactive: true } });
      setPromos(res.data.promos || []);
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed to load promo codes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Promos & Coupons | Forekas";
    fetchPromos();
  }, []);

  const onFormChange = (key, value) => {
    setForm((prev) => {
      if (key === "target_scope") {
        return {
          ...prev,
          [key]: value,
          allow_company_subscription_effects_for_user_scope:
            value === "user" ? prev.allow_company_subscription_effects_for_user_scope : false,
        };
      }
      return { ...prev, [key]: value };
    });
  };

  const toDateTimeLocalInput = (value) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    const timezoneOffsetMs = parsed.getTimezoneOffset() * 60 * 1000;
    return new Date(parsed.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
  };

  const hydrateFormFromPromo = (promo) => ({
    name: promo.name || "",
    description: promo.description || "",
    purpose: promo.purpose || "TRIAL_EXTENSION",
    target_scope: promo.target_scope || "company",
    is_public: promo.is_public !== false,
    allow_company_subscription_effects_for_user_scope: Boolean(
      promo.extra_data?.allow_company_subscription_effects_for_user_scope
    ),
    code_length: Number(promo.code_length) === 6 ? 6 : 8,
    manual_code: promo.manual_code || "",
    extend_days: Number(promo.extend_days || 0),
    discount_percent:
      promo.discount_percent === null || promo.discount_percent === undefined
        ? ""
        : String(promo.discount_percent),
    discount_amount:
      promo.discount_amount === null || promo.discount_amount === undefined
        ? ""
        : String(promo.discount_amount),
    max_total_redemptions:
      promo.max_total_redemptions === null || promo.max_total_redemptions === undefined
        ? ""
        : String(promo.max_total_redemptions),
    max_redemptions_per_company:
      promo.max_redemptions_per_company === null || promo.max_redemptions_per_company === undefined
        ? ""
        : String(promo.max_redemptions_per_company),
    max_redemptions_per_user:
      promo.max_redemptions_per_user === null || promo.max_redemptions_per_user === undefined
        ? ""
        : String(promo.max_redemptions_per_user),
    expires_at: toDateTimeLocalInput(promo.expires_at),
    is_active: promo.is_active !== false,
  });

  const startEditPromo = (promo) => {
    setEditingPromoId(promo.id);
    setForm(hydrateFormFromPromo(promo));
    setIsCreateFormOpen(true);
  };

  const resetForm = () => {
    setForm(defaultForm);
    setEditingPromoId(null);
  };

  const createPromo = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.warn("Promo name is required.");
      return;
    }

    if ((needsDiscountPercent || needsDiscountAmount) && !form.expires_at) {
      toast.warn("Discount promos require an expiry date so the price can revert to regular automatically.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
      purpose: form.purpose,
      target_scope: form.target_scope,
      code_length: Number(form.code_length) === 6 ? 6 : 8,
      manual_code: form.manual_code?.trim() || null,
      extend_days: needsExtendDays ? Number(form.extend_days || 0) : 0,
      discount_percent: needsDiscountPercent ? Number(form.discount_percent || 0) : null,
      discount_amount: needsDiscountAmount ? Number(form.discount_amount || 0) : null,
      max_total_redemptions: form.max_total_redemptions ? Number(form.max_total_redemptions) : null,
      max_redemptions_per_company: form.max_redemptions_per_company ? Number(form.max_redemptions_per_company) : null,
      max_redemptions_per_user: form.max_redemptions_per_user ? Number(form.max_redemptions_per_user) : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      extra_data:
        form.target_scope === "user"
          ? {
              allow_company_subscription_effects_for_user_scope: Boolean(
                form.allow_company_subscription_effects_for_user_scope
              ),
            }
          : null,
      is_public: Boolean(form.is_public),
      is_active: Boolean(form.is_active),
    };

    try {
      setCreating(true);
      if (isEditing) {
        const updatePayload = {
          ...payload,
          new_code: form.manual_code?.trim() ? form.manual_code.trim() : null,
        };
        await api.put(`/admin/promos/${editingPromoId}`, updatePayload);
        toast.success("Promo code updated.");
      } else {
        await api.post("/admin/promos", payload);
        toast.success("Promo code created.");
      }

      resetForm();
      fetchPromos();
    } catch (error) {
      toast.error(
        error?.response?.data?.detail ||
          (isEditing ? "Failed to update promo code." : "Failed to create promo code.")
      );
    } finally {
      setCreating(false);
    }
  };

  const deletePromo = async (promo) => {
    const confirmed = window.confirm(
      `Delete promo ${promo.manual_code}? This also removes its redemption history.`
    );
    if (!confirmed) return;

    try {
      setDeletingPromoId(promo.id);
      await api.delete(`/admin/promos/${promo.id}`);
      toast.success("Promo code deleted.");
      if (editingPromoId === promo.id) {
        resetForm();
      }
      fetchPromos();
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed to delete promo code.");
    } finally {
      setDeletingPromoId(null);
    }
  };

  const togglePromo = async (promoId) => {
    try {
      await api.patch(`/admin/promos/${promoId}/toggle-active`);
      toast.success("Promo status updated.");
      fetchPromos();
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed to update promo status.");
    }
  };

  const copyCode = async (value) => {
    try {
      await navigator.clipboard.writeText(value || "");
      toast.success("Code copied.");
    } catch {
      toast.error("Unable to copy code.");
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 font-inter">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">Promo Management</h1>
          <p className="text-m text-gray-600">
            Create and manage coupon/promo codes for signup and in-account redemption.
          </p>
        </div>
        <button
          onClick={fetchPromos}
          className="inline-flex items-center text-white bg-blue-600 gap-2 px-4 py-2 rounded-md border border-gray-300 hover:bg-blue-700"
        >
          <FiRefreshCw /> Refresh
        </button>
      </div>

      <form onSubmit={createPromo} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FiPlus /> {isEditing ? "Edit Promo" : "Create Promo"}
          </h2>
          <button
            type="button"
            onClick={() => setIsCreateFormOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-sm"
            aria-expanded={isCreateFormOpen}
            aria-label={isCreateFormOpen ? "Collapse create promo form" : "Expand create promo form"}
          >
            {isCreateFormOpen ? <FiChevronUp /> : <FiChevronDown />}
            {isCreateFormOpen ? "Collapse" : "Expand"}
          </button>
        </div>

        {isCreateFormOpen && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-600">Promo Name</label>
            <input
              value={form.name}
              onChange={(e) => onFormChange("name", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="April Trial Boost"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Purpose</label>
            <select
              value={form.purpose}
              onChange={(e) => onFormChange("purpose", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              {PURPOSE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Target</label>
            <select
              value={form.target_scope}
              onChange={(e) => onFormChange("target_scope", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              {TARGET_SCOPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Visibility</label>
            <select
              value={form.is_public ? "public" : "private"}
              onChange={(e) => onFormChange("is_public", e.target.value === "public")}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="public">Public (discoverable in-app)</option>
              <option value="private">Private (redeem by direct code/QR only)</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Code Length</label>
            <select
              value={form.code_length}
              onChange={(e) => onFormChange("code_length", Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value={6}>6 characters</option>
              <option value={8}>8 characters</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Manual Code (optional)</label>
            <input
              value={form.manual_code}
              onChange={(e) => onFormChange("manual_code", e.target.value.toUpperCase())}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="A1B2C3"
              maxLength={8}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Expiry Date (optional)</label>
            <input
              type="datetime-local"
              value={form.expires_at}
              onChange={(e) => onFormChange("expires_at", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          {needsExtendDays && (
            <div>
              <label className="text-sm text-gray-600">Extend Days</label>
              <input
                type="number"
                min={1}
                value={form.extend_days}
                onChange={(e) => onFormChange("extend_days", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          )}

          {needsDiscountPercent && (
            <div>
              <label className="text-sm text-gray-600">Discount Percent</label>
              <input
                type="number"
                min={1}
                max={100}
                value={form.discount_percent}
                onChange={(e) => onFormChange("discount_percent", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          )}

          {needsDiscountAmount && (
            <div>
              <label className="text-sm text-gray-600">Discount Amount</label>
              <input
                type="number"
                min={1}
                value={form.discount_amount}
                onChange={(e) => onFormChange("discount_amount", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          )}

          <div>
            <label className="text-sm text-gray-600">Max Total Redemptions</label>
            <input
              type="number"
              min={1}
              value={form.max_total_redemptions}
              onChange={(e) => onFormChange("max_total_redemptions", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Unlimited when empty"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Max Redemptions / Org</label>
            <input
              type="number"
              min={1}
              value={form.max_redemptions_per_company}
              onChange={(e) => onFormChange("max_redemptions_per_company", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Max Redemptions / User</label>
            <input
              type="number"
              min={1}
              value={form.max_redemptions_per_user}
              onChange={(e) => onFormChange("max_redemptions_per_user", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
            </div>

            <div>
              <label className="text-sm text-gray-600">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => onFormChange("description", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                rows={2}
                placeholder="Optional notes for internal usage"
              />
            </div>

            {form.target_scope === "user" && (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3">
                <div className="flex items-start gap-2">
                  <input
                    id="allow-company-effects-user-scope"
                    type="checkbox"
                    checked={Boolean(form.allow_company_subscription_effects_for_user_scope)}
                    onChange={(e) =>
                      onFormChange(
                        "allow_company_subscription_effects_for_user_scope",
                        e.target.checked
                      )
                    }
                    className="mt-1"
                  />
                  <label htmlFor="allow-company-effects-user-scope" className="text-sm text-gray-700">
                    Explicitly allow this user-targeted promo to change organization-level subscription/trial/price settings.
                  </label>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                id="promo-active"
                type="checkbox"
                checked={Boolean(form.is_active)}
                onChange={(e) => onFormChange("is_active", e.target.checked)}
              />
              <label htmlFor="promo-active" className="text-sm text-gray-700">Active immediately</label>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60"
            >
              <FiTag />
              {creating ? "Saving..." : isEditing ? "Save Changes" : "Create Promo"}
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="ml-2 inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
              >
                Cancel Edit
              </button>
            )}
          </>
        )}
      </form>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="relative flex items-center gap-1">
          <h2 className="text-lg font-semibold text-gray-800">Existing Promo Codes</h2>
          <button
            type="button"
            onClick={() => setShowNotesPopover((prev) => !prev)}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-blue-600 hover:bg-gray-100"
            aria-label="Show promo notes and reminders"
            aria-expanded={showNotesPopover}
          >
            <FiInfo size={15} />
          </button>

          {showNotesPopover && (
            <div className="absolute left-0 top-full z-20 mt-2 w-full max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
              <div className="absolute -top-1 left-10 h-3 w-3 rotate-45 border-l border-t border-gray-200 bg-white" />
              <p className="text-sm font-semibold text-gray-800 mb-2">Promo Notes</p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-gray-700">
                <li>Increased Free Trial works only for companies currently on trial.</li>
                <li>Subscription Extension works only for companies on non-trial tiers.</li>
                <li>Edit is allowed only before the first redemption.</li>
                <li>Delete is allowed only after usage is completed and no active discount is still in effect.</li>
                <li>Private promos are not listed publicly and can still be redeemed via direct code or QR.</li>
                <li>Hover over disabled action buttons to see specific lock reasons.</li>
              </ul>
            </div>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-gray-600">Loading promo codes...</p>
        ) : promos.length === 0 ? (
          <p className="text-sm text-gray-600">No promo codes yet.</p>
        ) : (
          <div className="gap-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {promos.map((promo) => (
              <div key={promo.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex flex-col lg:items-start lg:justify-between gap-3">
                  <div className="space-y-1">
                    {promo.qr_code_url && (
                      <button
                        type="button"
                        onClick={() => setQrPreviewPromo(promo)}
                        className="mt-1 inline-block rounded border border-gray-200 bg-white p-1 hover:border-blue-400"
                        title="View QR"
                      >
                        <img
                          src={promo.qr_code_url}
                          alt={`QR for ${promo.manual_code}`}
                          className="h-24 w-24"
                        />
                      </button>
                    )}
                    <p className="text-sm text-gray-500">{promo.name}</p>
                    <p className="text-xl font-bold text-gray-900 tracking-wider gap-1 flex flex-row">{promo.manual_code}
                        <button
                      onClick={() => copyCode(promo.manual_code)}
                      className="inline-flex items-center justify-center gap-2 p-2 bg-white hover:bg-gray-100 text-sm"
                    >
                      <FiCopy />
                    </button>
                    </p>
                    <p className="text-xs text-gray-500">
                      Purpose: <span className="font-medium text-gray-700">{promo.purpose}</span> | Target: <span className="font-medium text-gray-700">{promo.target_scope}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Visibility: <span className="font-medium text-gray-700">{promo.is_public ? "Public" : "Private"}</span>
                    </p>
                    {promo.target_scope === "user" && (
                      <p className="text-xs text-gray-500">
                        Company-level effects: <span className="font-medium text-gray-700">{promo.extra_data?.allow_company_subscription_effects_for_user_scope ? "Allowed" : "Blocked"}</span>
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Used: <span className="font-medium text-gray-700">{promo.total_redemptions || 0}</span>
                      {promo.max_total_redemptions ? ` / ${promo.max_total_redemptions}` : " (unlimited)"}
                    </p>
                    {promo.expires_at && (
                      <p className="text-xs text-gray-500">
                        Expires: <span className="font-medium text-gray-700">{new Date(promo.expires_at).toLocaleString()}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-row sm:flex-row lg:flex-row gap-2">                    
                    <button
                      onClick={() => togglePromo(promo.id)}
                      className={`inline-flex items-center justify-center gap-1 px-3 py-2 rounded-md ${promo.is_active ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} border border-gray-300 text-xs text-white`}
                    >
                      {promo.is_active ? <FiToggleRight className="text-white" /> : <FiToggleLeft className="text-white" />}
                      {promo.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => startEditPromo(promo)}
                      disabled={!promo.can_edit}
                      title={promo.can_edit ? "Edit promo" : promo.edit_block_reason || "Editing unavailable"}
                      className="inline-flex text-blue-500 items-center justify-center gap-1 px-3 py-2 rounded-md border border-blue-500 hover:bg-gray-100 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiEdit2 /> Edit
                    </button>
                    <button
                      onClick={() => deletePromo(promo)}
                      disabled={!promo.can_delete || deletingPromoId === promo.id}
                      title={promo.can_delete ? "Delete promo" : promo.delete_block_reason || "Deletion unavailable"}
                      className="inline-flex items-center justify-center gap-1 px-3 py-2 hover:bg-rose-50 text-xs border-b text-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiTrash2 /> {deletingPromoId === promo.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>                
              </div>
            ))}
          </div>
        )}
      </div>

      {qrPreviewPromo && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setQrPreviewPromo(null)}
            className="absolute inset-0 bg-black/50"
            aria-label="Close QR preview"
          />
          <div className="relative w-full max-w-sm rounded-xl border border-gray-200 bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-800">Promo QR</h3>
            <p className="text-sm text-gray-600 mt-1">
              Name: <span className="font-semibold text-gray-800">{qrPreviewPromo.name || "-"}</span>
            </p>
            <p className="text-sm text-gray-600">
              Code: <span className="font-semibold tracking-wider text-gray-800">{qrPreviewPromo.manual_code || "-"}</span>
            </p>

            <div className="mt-4 flex justify-center">
              <img
                src={qrPreviewPromo.qr_code_url}
                alt={`QR for ${qrPreviewPromo.manual_code}`}
                className="h-64 w-64 rounded border border-gray-200 bg-white p-2"
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setQrPreviewPromo(null)}
                className="px-4 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
