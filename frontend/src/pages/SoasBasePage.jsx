import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiEdit2, FiFileText, FiPlus, FiPrinter, FiTrash2, FiX } from "react-icons/fi";
import { toast } from "react-toastify";

import api from "../api";
import useFetchUser from "../hooks/useFetchUser";
import QuoteItemsEditor from "../components/QuoteItemsEditor";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";

const EMPTY_FORM = {
  account_id: "",
  quote_id: "",
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
  const [confirmModalData, setConfirmModalData] = useState(null);
  const [confirmProcessing, setConfirmProcessing] = useState(false);


  const currencySymbol = user?.company?.currency || "₱";
  const isStarterTier =
    String(user?.subscription_status?.current_plan || "").toLowerCase() === "starter";
  const defaultTaxRate = Number(user?.company?.tax_rate ?? 0);
  const defaultPreparedBy = useMemo(() => {
    const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
    if (fullName) return fullName;
    return user?.name || user?.username || user?.email || "";
  }, [user]);

  const [loading, setLoading] = useState(false);
  const [soas, setSoas] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [quotes, setQuotes] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editingSoa, setEditingSoa] = useState(null);
  const [formData, setFormData] = useState({
    ...EMPTY_FORM,
    tax_rate: defaultTaxRate,
    prepared_by: defaultPreparedBy,
  });

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

  const formatQuoteId = useCallback((quoteId) => {
    if (!quoteId) return "";
    // Convert Q26-1-00001 to Q26-00001 (remove middle company ID)
    const parts = String(quoteId).split("-");
    if (parts.length === 3) {
      return `${parts[0]}-${parts[2]}`;
    }
    return String(quoteId);
  }, []);

  const formatSOAId = useCallback((soaId) => {
    if (!soaId) return "";
    // Convert Q26-1-00001 to Q26-00001 (remove middle company ID)
    const parts = String(soaId).split("-");
    if (parts.length === 3) {
      return `${parts[0]}-${parts[2]}`;
    }
    return String(soaId);
  }, []);

  const fetchAccounts = async () => {
    const res = await api.get("/accounts/admin/fetch-all");
    setAccounts(Array.isArray(res.data) ? res.data : []);
  };

  const fetchSoas = async () => {
    const res = await api.get("/soas/admin/fetch-all");
    setSoas(Array.isArray(res.data) ? res.data : []);
  };

  const fetchQuotes = async () => {
    const res = await api.get("/quotes/admin/fetch-all");
    const data = Array.isArray(res.data) ? res.data : [];
    const activeQuotes = data.filter((q) => String(q?.status || "").toLowerCase() !== "inactive");
    setQuotes(activeQuotes);
  };

  useEffect(() => {0
    document.title = "SOA | Forekas";
  }, []);

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        setLoading(true);
        await Promise.all([fetchAccounts(), fetchSoas(), fetchQuotes()]);
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
        prepared_by: defaultPreparedBy,
        account_id: state?.initialSoaData?.account_id ? String(state.initialSoaData.account_id) : "",
        quote_id: state?.initialSoaData?.quote_id ? String(state.initialSoaData.quote_id) : "",
        quote_number: state?.initialSoaData?.quote_number || "",
      }));

      // Clear state to avoid re-trigger on back/forward
      navigate(`${rolePrefix}/soas`, { replace: true, state: {} });
    }
  }, [location.state, navigate, rolePrefix, defaultTaxRate, defaultPreparedBy]);

  const selectedQuote = useMemo(() => {
    if (!formData.quote_id) return null;
    return quotes.find((q) => String(q.id) === String(formData.quote_id)) || null;
  }, [quotes, formData.quote_id]);

  const filteredQuotes = useMemo(() => {
    if (!formData.account_id) return quotes;
    return quotes.filter((q) => String(q.account_id || "") === String(formData.account_id));
  }, [quotes, formData.account_id]);

  const accountLabel = (accountId) => {
    const found = accounts.find((a) => String(a.id) === String(accountId));
    return found?.name || "--";
  };

  const createdByLabel = (soa) => {
    const first = soa?.creator?.first_name || "";
    const last = soa?.creator?.last_name || "";
    const fullName = `${first} ${last}`.trim();

    if (fullName) return fullName;
    if (soa?.creator?.name) return soa.creator.name;
    if (soa?.creator?.username) return soa.creator.username;
    if (soa?.creator?.email) return soa.creator.email;
    if (soa?.created_by) return `User #${soa.created_by}`;
    return "--";
  };

  const mapQuoteItemsToSoaItems = useCallback((items = []) => {
    return items.map((item, idx) => ({
      id: null,
      item_type: item?.item_type || "Product",
      name: item?.name || "",
      description: item?.description || "",
      sku: item?.sku || "",
      variant: item?.variant || "",
      unit: item?.unit || "pcs",
      quantity: Number(item?.quantity ?? 1),
      unit_price: Number(item?.unit_price ?? 0),
      discount_percent: Number(item?.discount_percent ?? 0),
      discount_amount: Number(item?.discount_amount ?? 0),
      line_total: Number(item?.line_total ?? 0),
      sort_order: item?.sort_order ?? idx,
    }));
  }, []);

  useEffect(() => {
    if (!showForm || editingSoa?.id || !formData.quote_id) return;
    if (Array.isArray(formData.items) && formData.items.length > 0) return;

    const q = quotes.find((quote) => String(quote.id) === String(formData.quote_id));
    if (!q) return;

    const presetItems = mapQuoteItemsToSoaItems(Array.isArray(q.items) ? q.items : []);
    setFormData((prev) => ({
      ...prev,
      quote_number: prev.quote_number || formatQuoteId(q.quote_id) || "",
      account_id: prev.account_id || (q.account_id ? String(q.account_id) : ""),
      tax_rate: Number(q.tax_rate ?? prev.tax_rate ?? defaultTaxRate),
      items: presetItems,
    }));
  }, [
    showForm,
    editingSoa?.id,
    formData.quote_id,
    formData.items,
    quotes,
    defaultTaxRate,
    formatQuoteId,
    mapQuoteItemsToSoaItems,
  ]);

  const openCreate = () => {
    setShowForm(true);
    setEditingSoa(null);
    setFormData({ ...EMPTY_FORM, tax_rate: defaultTaxRate, prepared_by: defaultPreparedBy });
    setTotals({ subtotal: 0, tax_amount: 0, total_amount: 0 });
  };

  const openEdit = (soa) => {
    setShowForm(true);
    setEditingSoa(soa);
    setFormData({
      ...EMPTY_FORM,
      ...soa,
      account_id: soa?.account_id ? String(soa.account_id) : "",
      quote_id: soa?.quote_id ? String(soa.quote_id) : "",
      soa_date: soa?.soa_date || "",
      due_date: soa?.due_date || "",
      items: Array.isArray(soa?.items) ? soa.items : [],
      tax_rate: Number(soa?.tax_rate ?? defaultTaxRate),
      full_payment: soa?.full_payment ?? true,
      quote_number: formatQuoteId(soa?.quote_number || soa?.quote?.quote_id || ""),
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
    setFormData({ ...EMPTY_FORM, tax_rate: defaultTaxRate, prepared_by: defaultPreparedBy });
  };

  const handleQuoteChange = (quoteIdValue) => {
    if (!quoteIdValue) {
      setFormData((prev) => ({ ...prev, quote_id: "" }));
      return;
    }

    const q = quotes.find((quote) => String(quote.id) === String(quoteIdValue));
    if (!q) {
      setFormData((prev) => ({ ...prev, quote_id: "" }));
      return;
    }

    const presetItems = mapQuoteItemsToSoaItems(Array.isArray(q.items) ? q.items : []);

    setFormData((prev) => ({
      ...prev,
      quote_id: String(q.id),
      quote_number: formatQuoteId(q.quote_id) || prev.quote_number || "",
      account_id: q.account_id ? String(q.account_id) : prev.account_id,
      tax_rate: Number(q.tax_rate ?? prev.tax_rate ?? defaultTaxRate),
      items: presetItems,
    }));
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
      quote_id: formData.quote_id ? Number(formData.quote_id) : null,
      purchase_order_number: formData.purchase_order_number || null,
      quote_number: (formData.quote_number || selectedQuote?.quote_id || "").trim() || null,
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
    setConfirmModalData({
      open: true,
      title: "Delete SOA",
      message: `Are you sure you want to permanently delete SOA #${formatSOAId(soa.soa_id) || soa.id}? This action cannot be undone.`,
      confirmLabel: "Delete SOA",
      cancelLabel: "Cancel",
      variant: "danger",
      action: {
        type: "delete",
        soaId: soa.id,
      },
    });
  };

  const handlePrint = (soa) => {
    if (!soa?.id) return;

    const account = accounts.find((a) => String(a.id) === String(soa.account_id)) || null;

    navigate(`${rolePrefix}/soas/${encodeURIComponent(soa.id)}/print`, {
      state: {
        soa,
        account,
      },
    });
  };

  const formatMoney = (amount) => {
    const num = Number(amount ?? 0);
    return `${currencySymbol}${num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="p-4 lg:p-8 font-inter relative">
      {confirmModalData && (
        <ConfirmationModal
          open={!!confirmModalData.open}
          title={confirmModalData.title}
          message={confirmModalData.message}
          confirmLabel={confirmModalData.confirmLabel}
          cancelLabel={confirmModalData.cancelLabel}
          variant={confirmModalData.variant}
          loading={confirmProcessing}
          onConfirm={async () => {
            if (confirmModalData?.action?.type === "delete" && confirmModalData?.action?.soaId) {
              setConfirmProcessing(true);
              try {
                await api.delete(`/soas/admin/${confirmModalData.action.soaId}`);
                toast.success("SOA deleted");
                await fetchSoas();
              } catch (err) {
                console.error(err);
                toast.error(err?.response?.data?.detail || "Failed to delete SOA");
              } finally {
                setConfirmProcessing(false);
                setConfirmModalData(null);
              }
            } else {
              setConfirmModalData(null);
            }
          }}
          onCancel={() => {
            if (!confirmProcessing) setConfirmModalData(null);
          }}
        />
      )}
      {loading && <LoadingSpinner message="Loading SOA..." />}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-1">Statement of Account</h1>
          <p className="text-gray-600 text-sm">Billing / collection statements for products and services.</p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
        >
          <FiPlus /> New SOA
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FiFileText className="text-blue-600" />
              {editingSoa ? `Edit SOA ${formatSOAId(editingSoa.soa_id) || ""}` : "Create SOA"}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="p-2 rounded-md hover:bg-gray-50 text-gray-600 cursor-pointer"
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
                  onChange={(e) => {
                    const nextAccountId = e.target.value;
                    const quoteStillMatches = quotes.some(
                      (q) =>
                        String(q.id) === String(formData.quote_id || "") &&
                        String(q.account_id || "") === String(nextAccountId || "")
                    );

                    setFormData((p) => ({
                      ...p,
                      account_id: nextAccountId,
                      quote_id: quoteStillMatches ? p.quote_id : "",
                    }));
                  }}
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
                <label className="block text-gray-700 font-medium mb-2 text-sm">Linked Quote</label>
                <select
                  value={formData.quote_id || ""}
                  onChange={(e) => handleQuoteChange(e.target.value)}
                  disabled={fieldsDisabled}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="">No linked quote</option>
                  {filteredQuotes.map((q) => (
                    <option key={q.id} value={q.id}>
                      {(formatQuoteId(q.quote_id || `Q-${q.id}`) || `Q-${q.id}`) + " • " + (q?.account?.name || accountLabel(q.account_id))}
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
                <label className="block text-gray-700 font-medium mb-2 text-sm">Quote Number / ID</label>
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
                readOnly={fieldsDisabled || isStarterTier}
                taxRate={formData.tax_rate}
                discountType={null}
                discountValue={0}
                onTotalsChange={(t) => setTotals(t)}
              />
              {isStarterTier && (
                <p className="mt-2 text-xs text-amber-700">
                  Starter tier: line items are locked and cannot be edited or deleted.
                </p>
              )}
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
                className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-2 rounded-md font-medium hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
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
                <th className="text-left px-6 py-3 font-medium">Quote</th>
                <th className="text-left px-6 py-3 font-medium">Created By</th>
                <th className="text-left px-6 py-3 font-medium">Status</th>
                <th className="text-left px-6 py-3 font-medium">Due Date</th>
                <th className="text-right px-6 py-3 font-medium">Total</th>
                <th className="text-right px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {soas.map((soa) => (
                <tr key={soa.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-3 text-blue-700 font-medium">{formatSOAId(soa.soa_id) || ""}</td>
                  <td className="px-6 py-3">{soa?.account?.name || accountLabel(soa.account_id)}</td>
                  <td className="px-6 py-3">{formatQuoteId(soa?.quote?.quote_id || soa?.quote_number || "") || "--"}</td>
                  <td className="px-6 py-3">{createdByLabel(soa)}</td>
                  <td className="px-6 py-3">{soa.status || "Draft"}</td>
                  <td className="px-6 py-3">{soa.due_date || "--"}</td>
                  <td className="px-6 py-3 text-right">{formatMoney(soa.total_amount)}</td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => handlePrint(soa)}
                        className="inline-flex items-center rounded-md hover:bg-white cursor-pointer"
                      >
                        <FiPrinter />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(soa)}
                        className="inline-flex items-center rounded-md hover:bg-white cursor-pointer"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(soa)}
                        disabled={loading || (soa.status || "Draft") !== "Draft"}
                        className="inline-flex items-center rounded-md hover:bg-white text-red-600 cursor-pointer"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && soas.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
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
