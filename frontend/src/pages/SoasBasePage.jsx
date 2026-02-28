import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiEdit2, FiFileText, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { toast } from "react-toastify";

import api from "../api";
import useFetchUser from "../hooks/useFetchUser";
import QuoteItemsEditor from "../components/QuoteItemsEditor";

const EMPTY_FORM = {
  account_id: "",
  purchase_order_number: "",
  quote_number: "",
  soa_date: "",
  terms_of_payment: "",
  due_date: "",
  full_payment: true,
  status: "Draft",
  prepared_by: "",
  approved_by: "",
  received_by: "",
  tax_rate: 0,
  notes: "",
  items: [],
};

export default function SoasBasePage({ basePath }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useFetchUser();

  const currencySymbol = user?.company?.currency || "₱";
  const defaultTaxRate = Number(user?.company?.tax_rate ?? 0);

  const [loading, setLoading] = useState(false);
  const [soas, setSoas] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editingSoa, setEditingSoa] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM, tax_rate: defaultTaxRate });

  const [totals, setTotals] = useState({
    subtotal: 0,
    tax_amount: 0,
    total_amount: 0,
  });

  const isLocked = Boolean(editingSoa?.id) && (editingSoa?.status || "Draft") !== "Draft";
  const canChangeStatus = Boolean(editingSoa?.id) && (editingSoa?.status || "Draft") === "Presented";
  const fieldsDisabled = loading || isLocked;

  const rolePrefix = useMemo(() => {
    // basePath already like "/admin" | "/sales" | ...
    return basePath || "/admin";
  }, [basePath]);

  const fetchAccounts = async () => {
    const res = await api.get("/accounts/admin/fetch-all");
    setAccounts(Array.isArray(res.data) ? res.data : []);
  };

  const fetchSoas = async () => {
    const res = await api.get("/soas/admin/fetch-all");
    setSoas(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        setLoading(true);
        await Promise.all([fetchAccounts(), fetchSoas()]);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load SOAs");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // Support navigation from account quick actions
  useEffect(() => {
    const state = location.state;
    if (state?.openSoaForm) {
      setShowForm(true);
      setEditingSoa(null);
      setFormData((prev) => ({
        ...prev,
        ...EMPTY_FORM,
        tax_rate: defaultTaxRate,
        account_id: state?.initialSoaData?.account_id ? String(state.initialSoaData.account_id) : "",
      }));

      // Clear state to avoid re-trigger on back/forward
      navigate(`${rolePrefix}/soas`, { replace: true, state: {} });
    }
  }, [location.state, navigate, rolePrefix, defaultTaxRate]);

  const accountLabel = (accountId) => {
    const found = accounts.find((a) => String(a.id) === String(accountId));
    return found?.name || "--";
  };

  const openCreate = () => {
    setShowForm(true);
    setEditingSoa(null);
    setFormData({ ...EMPTY_FORM, tax_rate: defaultTaxRate });
    setTotals({ subtotal: 0, tax_amount: 0, total_amount: 0 });
  };

  const openEdit = (soa) => {
    setShowForm(true);
    setEditingSoa(soa);
    setFormData({
      ...EMPTY_FORM,
      ...soa,
      account_id: soa?.account_id ? String(soa.account_id) : "",
      soa_date: soa?.soa_date || "",
      due_date: soa?.due_date || "",
      items: Array.isArray(soa?.items) ? soa.items : [],
      tax_rate: Number(soa?.tax_rate ?? defaultTaxRate),
      full_payment: soa?.full_payment ?? true,
    });

    setTotals({
      subtotal: Number(soa?.subtotal ?? 0),
      tax_amount: Number(soa?.tax_amount ?? 0),
      total_amount: Number(soa?.total_amount ?? 0),
    });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingSoa(null);
    setFormData({ ...EMPTY_FORM, tax_rate: defaultTaxRate });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Presented/Paid are locked documents: only allow status transition via the status endpoint.
    if (editingSoa?.id && isLocked) {
      if (!canChangeStatus) {
        toast.error("This SOA is locked and cannot be edited");
        return;
      }

      try {
        setLoading(true);
        await api.patch(`/soas/admin/${editingSoa.id}/status`, null, {
          params: { status_value: formData.status },
        });
        toast.success("SOA status updated");
        await fetchSoas();
        closeForm();
      } catch (err) {
        console.error(err);
        toast.error(err?.response?.data?.detail || "Failed to update SOA status");
      } finally {
        setLoading(false);
      }

      return;
    }

    if (!formData.account_id) {
      toast.error("Account is required");
      return;
    }

    const payload = {
      account_id: Number(formData.account_id),
      purchase_order_number: formData.purchase_order_number || null,
      quote_number: formData.quote_number || null,
      soa_date: formData.soa_date || null,
      terms_of_payment: formData.terms_of_payment || null,
      due_date: formData.due_date || null,
      full_payment: Boolean(formData.full_payment),
      status: formData.status || "Draft",
      prepared_by: formData.prepared_by || null,
      approved_by: formData.approved_by || null,
      received_by: formData.received_by || null,
      tax_rate: Number(formData.tax_rate ?? 0),
      notes: formData.notes || null,
      items: Array.isArray(formData.items) ? formData.items : [],
      subtotal: Number(totals.subtotal ?? 0),
      tax_amount: Number(totals.tax_amount ?? 0),
      total_amount: Number(totals.total_amount ?? 0),
      currency: currencySymbol === "$" ? "USD" : "PHP",
    };

    try {
      setLoading(true);

      if (editingSoa?.id) {
        await api.put(`/soas/admin/${editingSoa.id}`, payload);
        toast.success("SOA updated");
      } else {
        await api.post(`/soas/admin`, {
          ...payload,
          created_by_id: user?.id,
        });
        toast.success("SOA created");
      }

      await fetchSoas();
      closeForm();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Failed to save SOA");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (soa) => {
    if (!soa?.id) return;

    const ok = window.confirm("Delete this SOA? This cannot be undone.");
    if (!ok) return;

    try {
      setLoading(true);
      await api.delete(`/soas/admin/${soa.id}`);
      toast.success("SOA deleted");
      await fetchSoas();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Failed to delete SOA");
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount) => {
    const num = Number(amount ?? 0);
    return `${currencySymbol}${num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="p-4 lg:p-8 font-inter">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-1">Statements of Account</h1>
          <p className="text-gray-600 text-sm">Billing / collection statements for products and services.</p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          <FiPlus /> New SOA
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FiFileText className="text-blue-600" />
              {editingSoa ? `Edit SOA ${editingSoa.soa_id || ""}` : "Create SOA"}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="p-2 rounded-md hover:bg-gray-50 text-gray-600"
              aria-label="Close"
            >
              <FiX />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">Client (Account)</label>
                <select
                  value={formData.account_id}
                  onChange={(e) => setFormData((p) => ({ ...p, account_id: e.target.value }))}
                  disabled={fieldsDisabled}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  required
                >
                  <option value="">Select account...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">Purchase Order Number</label>
                <input
                  type="text"
                  value={formData.purchase_order_number}
                  onChange={(e) => setFormData((p) => ({ ...p, purchase_order_number: e.target.value }))}
                  disabled={fieldsDisabled}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">SOA Date</label>
                <input
                  type="date"
                  value={formData.soa_date || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, soa_date: e.target.value }))}
                  disabled={fieldsDisabled}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">Quote Number</label>
                <input
                  type="text"
                  value={formData.quote_number}
                  onChange={(e) => setFormData((p) => ({ ...p, quote_number: e.target.value }))}
                  disabled={fieldsDisabled}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">Terms of Payment</label>
                <input
                  type="text"
                  value={formData.terms_of_payment}
                  onChange={(e) => setFormData((p) => ({ ...p, terms_of_payment: e.target.value }))}
                  disabled={fieldsDisabled}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="e.g. Net 30"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">Due Date</label>
                <input
                  type="date"
                  value={formData.due_date || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, due_date: e.target.value }))}
                  disabled={fieldsDisabled}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                  disabled={loading || (editingSoa?.status || "Draft") === "Paid"}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="Draft">Draft</option>
                  <option value="Presented">Presented</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

              <div className="flex items-center gap-2 mt-7">
                <input
                  id="full_payment"
                  type="checkbox"
                  checked={Boolean(formData.full_payment)}
                  onChange={(e) => setFormData((p) => ({ ...p, full_payment: e.target.checked }))}
                  disabled={fieldsDisabled}
                  className="h-4 w-4"
                />
                <label htmlFor="full_payment" className="text-sm text-gray-700">
                  Full Payment
                </label>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData((p) => ({ ...p, tax_rate: e.target.value }))}
                  disabled={fieldsDisabled}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">Prepared By</label>
                <input
                  type="text"
                  value={formData.prepared_by}
                  onChange={(e) => setFormData((p) => ({ ...p, prepared_by: e.target.value }))}
                  disabled={fieldsDisabled}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">Approved By</label>
                <input
                  type="text"
                  value={formData.approved_by}
                  onChange={(e) => setFormData((p) => ({ ...p, approved_by: e.target.value }))}
                  disabled={fieldsDisabled}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">Received By</label>
                <input
                  type="text"
                  value={formData.received_by}
                  onChange={(e) => setFormData((p) => ({ ...p, received_by: e.target.value }))}
                  disabled={fieldsDisabled}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-gray-700 font-medium mb-2 text-sm">Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                  disabled={fieldsDisabled}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />
              </div>
            </div>

            <div>
              <QuoteItemsEditor
                items={formData.items}
                onChange={(items) => setFormData((p) => ({ ...p, items }))}
                currencySymbol={currencySymbol}
                readOnly={fieldsDisabled}
                taxRate={formData.tax_rate}
                discountType={null}
                discountValue={0}
                onTotalsChange={(t) => setTotals(t)}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-200 pt-4">
              <div className="text-sm text-gray-700">
                <span className="mr-4">Subtotal: <span className="font-medium">{formatMoney(totals.subtotal)}</span></span>
                <span className="mr-4">Tax: <span className="font-medium">{formatMoney(totals.tax_amount)}</span></span>
                <span>Total: <span className="font-semibold">{formatMoney(totals.total_amount)}</span></span>
              </div>

              <button
                type="submit"
                disabled={loading || (isLocked && !canChangeStatus)}
                className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-2 rounded-md font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? "Saving..." : isLocked ? "Update Status" : "Save SOA"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">All SOAs</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="text-left px-6 py-3 font-medium">SOA #</th>
                <th className="text-left px-6 py-3 font-medium">Client</th>
                <th className="text-left px-6 py-3 font-medium">Status</th>
                <th className="text-left px-6 py-3 font-medium">Due Date</th>
                <th className="text-right px-6 py-3 font-medium">Total</th>
                <th className="text-right px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {soas.map((soa) => (
                <tr key={soa.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-3 text-blue-700 font-medium">{soa.soa_id || `SOA-${soa.id}`}</td>
                  <td className="px-6 py-3">{soa?.account?.name || accountLabel(soa.account_id)}</td>
                  <td className="px-6 py-3">{soa.status || "Draft"}</td>
                  <td className="px-6 py-3">{soa.due_date || "--"}</td>
                  <td className="px-6 py-3 text-right">{formatMoney(soa.total_amount)}</td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(soa)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-md hover:bg-white"
                      >
                        <FiEdit2 /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(soa)}
                        disabled={loading || (soa.status || "Draft") !== "Draft"}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-md hover:bg-white text-red-600"
                      >
                        <FiTrash2 /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && soas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    No SOAs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
