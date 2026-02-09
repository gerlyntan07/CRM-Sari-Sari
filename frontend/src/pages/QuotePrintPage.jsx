import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import api from "../api.js";
import useFetchUser from "../hooks/useFetchUser.js";

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatMoney = (value, currencySymbol = "") => {
  const n = toNumber(value);
  return `${currencySymbol}${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const toDateInputValue = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const formatLongDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
};

const formatQuoteId = (quoteId) => {
  if (!quoteId) return "";
  const parts = String(quoteId).split("-");
  // Q26-1-00006 -> Q26-00006
  if (parts.length === 3) return `${parts[0]}-${parts[2]}`;
  return String(quoteId);
};

const buildDefaultDraft = (quote, user, companyInfo) => {
  const today = new Date();

  const contactName = quote?.contact
    ? `${quote.contact.first_name || ""} ${quote.contact.last_name || ""}`.trim()
    : "";

  const validityDays = quote?.validity_days ? String(quote.validity_days) : "";

  return {
    issuedDate:
      toDateInputValue(quote?.presented_date) || toDateInputValue(today),
    subject: "Price Quotation",
    forName: quote?.account?.name || "",
    attn: contactName,
    intro: "We are pleased to submit our proposal as follows:",
    notes: quote?.notes || "",
    terms: {
      validity: validityDays
        ? `${validityDays} days from the date of quotation.`
        : "",
      payment: "",
      deliveryPeriod: "",
      deliveryPoint: "",
    },
    preparedBy: user
      ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
      : "",
    approvedBy: companyInfo?.ceo_name || "Admin",
  };
};

export default function QuotePrintPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { quoteId } = useParams();

  const { user } = useFetchUser();
  const currencySymbol = user?.company?.currency || "₱";

  const storageKey = useMemo(() => `quote-print:${quoteId || ""}`, [quoteId]);

  const [quote, setQuote] = useState(() => {
    const incoming = location.state?.quote;
    if (incoming && String(incoming.id) === String(quoteId)) return incoming;
    return null;
  });

  const [companyInfo, setCompanyInfo] = useState(
    () => location.state?.companyInfo || null,
  );

  const [loading, setLoading] = useState(false);

  const [draft, setDraft] = useState(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!quoteId) return;

    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);

        const needsCompany = !companyInfo;
        const companyRes = needsCompany
          ? await api.get("/company/invoice-info")
          : null;

        if (!mounted) return;
        if (companyRes?.data) setCompanyInfo(companyRes.data);

        // If quote not provided via navigation state, best-effort fetch it.
        // Backend doesn't currently expose /quotes/get/{id}, so fall back to fetch-all.
        if (!quote) {
          const listRes = await api.get("/quotes/admin/fetch-all");
          const list = Array.isArray(listRes?.data) ? listRes.data : [];
          const found = list.find((q) => String(q.id) === String(quoteId));
          if (found) setQuote(found);
        }
      } catch (err) {
        const msg =
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to load quotation.";
        toast.error(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteId]);

  useEffect(() => {
    if (!quote) return;

    setDraft((prev) => {
      if (prev) return prev;

      try {
        const raw = sessionStorage.getItem(storageKey);
        if (raw) return JSON.parse(raw);
      } catch {
        // ignore
      }

      const next = buildDefaultDraft(quote, user, companyInfo);
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore
      }

      return next;
    });
  }, [quote, user, companyInfo, storageKey]);

  const persistDraft = (next) => {
    setDraft(next);
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const items = Array.isArray(quote?.items) ? quote.items : [];
  const discountAmount = toNumber(quote?.discount_amount);
  const taxRate = toNumber(quote?.tax_rate);

  if (!draft) {
    return (
      <div className="p-6">
        <div className="text-gray-700">{loading ? "Loading..." : ""}</div>
      </div>
    );
  }

  const preparedByDisplay =
    draft.preparedBy ||
    (user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "");

  const approvedByDisplay = draft.approvedBy || companyInfo?.ceo_name || "CEO";

  return (
    <div className="min-h-screen bg-gray-50 quote-print-root">
      <style>{`
        @page { size: A4; margin: 5mm; }
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; }
          .no-print { display: none !important; }
          .print-surface { box-shadow: none !important; border: none !important; }
          body { background: white !important; }
          .quote-print-root { background: white !important; }

          /* Remove screen gutters/max-width so print is tight */
          .quote-print-page { max-width: none !important; margin: 0 !important; padding: 0 !important; }

          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

          /* Keep the quote meta proportions while printing (left 2 cols + fixed quotation col) */
          .quote-meta-grid { grid-template-columns: 1fr 1fr 240px !important; padding: 0px; }
        }
      `}</style>

      <div className="no-print sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
            onClick={() => navigate(-1)}
          >
            Back
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
              onClick={() => {
                if (!quote) return;
                const next = buildDefaultDraft(quote, user, companyInfo);
                persistDraft(next);
              }}
              disabled={!quote}
            >
              Reset fields
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm disabled:opacity-70"
              onClick={() => window.print()}
              disabled={!quote || loading}
            >
              Print
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 quote-print-page">
        <div className="no-print bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={draft.issuedDate || ""}
                onChange={(e) =>
                  persistDraft({ ...draft, issuedDate: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={draft.subject || ""}
                onChange={(e) =>
                  persistDraft({ ...draft, subject: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">For</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={draft.forName || ""}
                onChange={(e) =>
                  persistDraft({ ...draft, forName: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Attn</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={draft.attn || ""}
                onChange={(e) =>
                  persistDraft({ ...draft, attn: e.target.value })
                }
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">Intro</label>
              <textarea
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm min-h-[70px]"
                value={draft.intro || ""}
                onChange={(e) =>
                  persistDraft({ ...draft, intro: e.target.value })
                }
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">Notes</label>
              <textarea
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm min-h-[70px]"
                value={draft.notes || ""}
                onChange={(e) =>
                  persistDraft({ ...draft, notes: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Terms: Validity
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={draft.terms?.validity || ""}
                onChange={(e) =>
                  persistDraft({
                    ...draft,
                    terms: { ...draft.terms, validity: e.target.value },
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Terms: Payment
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={draft.terms?.payment || ""}
                onChange={(e) =>
                  persistDraft({
                    ...draft,
                    terms: { ...draft.terms, payment: e.target.value },
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Terms: Delivery Period
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={draft.terms?.deliveryPeriod || ""}
                onChange={(e) =>
                  persistDraft({
                    ...draft,
                    terms: { ...draft.terms, deliveryPeriod: e.target.value },
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Terms: Delivery Point
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={draft.terms?.deliveryPoint || ""}
                onChange={(e) =>
                  persistDraft({
                    ...draft,
                    terms: { ...draft.terms, deliveryPoint: e.target.value },
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Approved by
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={draft.approvedBy || ""}
                onChange={(e) =>
                  persistDraft({ ...draft, approvedBy: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <div className="print-surface bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 border-b border-gray-300 pb-3">
            <div className="min-w-0 w-4/5">
              <div className="text-xl font-bold text-gray-900 uppercase">
                {companyInfo?.company_name || ""}
              </div>
              {companyInfo?.company_number ? (
                <div className="text-sm text-gray-700">
                  {companyInfo.company_number}
                </div>
              ) : null}
              {companyInfo?.ceo_email ? (
                <div className="text-sm text-gray-700">
                  Email: {companyInfo.ceo_email}
                </div>
              ) : null}
              {companyInfo?.company_website ? (
                <div className="text-sm text-gray-700">
                  Web: {companyInfo.company_website}
                </div>
              ) : null}
            </div>

            <div className="flex items-start gap-3 w-1/6">
              {companyInfo?.company_logo ? (
                <img
                  src={companyInfo.company_logo}
                  alt="Company logo"
                  className="w-full h-auto object-contain"
                />
              ) : null}
            </div>
          </div>

          {/* Meta */}
          <div className="mt-4">
            <div className="quote-meta-grid grid grid-cols-3 text-sm border border-gray-300">
              <div className="flex gap-2 p-2 border border-gray-300 col-span-2">
                <div className="w-16 font-semibold">For:</div>
                <div className="min-w-0 break-words">{draft.forName || ""}</div>
              </div>

              <div className="quote-meta-quote justify-center text-center p-1 border-b border-t border-r border-gray-300">
                <div className="text-xl font-bold text-gray-900">QUOTATION</div>
              </div>

              <div className="flex gap-2 p-2 border border-gray-300 col-span-2">
                <div className="w-16 font-semibold">Attn:</div>
                <div className="min-w-0 break-words">{draft.attn || ""}</div>
              </div>

              <div className="quote-meta-quote justify-center text-center p-2 border-t border-r border-gray-300">
                <div className="text-sm text-gray-700">
                  No.{" "}
                  <span className="font-semibold">
                    {formatQuoteId(quote?.quote_id || quote?.id)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 p-2 border border-gray-300 col-span-2">
                <div className="w-16 font-semibold">Subject:</div>
                <div className="min-w-0 break-words">{draft.subject || ""}</div>
              </div>

              <div className="quote-meta-quote md:justify-center border-r border-b border-gray-300 text-center p-2">
                <div className="text-sm text-gray-700">
                  {formatLongDate(draft.issuedDate)}
                </div>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-900 whitespace-pre-wrap">
              {draft.intro || ""}
            </div>
          </div>

          {/* Items table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm border border-gray-400 border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 px-2 py-2 w-14">
                    Item
                  </th>
                  <th className="border border-gray-400 px-2 py-2 text-left">
                    Description
                  </th>
                  <th className="border border-gray-400 px-2 py-2 w-20">Qty</th>
                  <th className="border border-gray-400 px-2 py-2 w-20">
                    Unit
                  </th>
                  <th className="border border-gray-400 px-2 py-2 w-28">
                    Unit Price
                  </th>
                  <th className="border border-gray-400 px-2 py-2 w-28">
                    Total Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="border border-gray-400 px-2 py-4 text-center text-gray-600"
                    >
                      No line items.
                    </td>
                  </tr>
                ) : (
                  items.map((it, idx) => {
                    const nameLine = it?.name ? String(it.name).trim() : "";
                    const descriptionLine = it?.description
                      ? String(it.description).trim()
                      : "";
                    const variant = it?.variant
                      ? String(it.variant).trim()
                      : "";
                    const sku = it?.sku ? String(it.sku).trim() : "";

                    const variantSkuLine =
                      variant && sku
                        ? `${variant} (${sku})`
                        : sku
                          ? `(${sku})`
                          : variant;

                    const descParts = [
                      nameLine,
                      descriptionLine,
                      variantSkuLine,
                    ]
                      .map((v) => (v ? String(v).trim() : ""))
                      .filter(Boolean);

                    const description = descParts.join("\n");

                    return (
                      <tr key={it?.id ?? idx}>
                        <td className="border border-gray-400 px-2 py-2 text-center">
                          {idx + 1}
                        </td>
                        <td className="border border-gray-400 px-2 py-2 whitespace-pre-wrap">
                          {description}
                        </td>
                        <td className="border border-gray-400 px-2 py-2 text-center">
                          {toNumber(it?.quantity) || ""}
                        </td>
                        <td className="border border-gray-400 px-2 py-2 text-center">
                          {it?.unit || ""}
                        </td>
                        <td className="border border-gray-400 px-2 py-2 text-right">
                          {formatMoney(it?.unit_price, currencySymbol)}
                        </td>
                        <td className="border border-gray-400 px-2 py-2 text-right">
                          {formatMoney(it?.line_total, currencySymbol)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="mt-4 flex justify-end">
            <table className="text-sm border border-gray-400 border-collapse min-w-[280px]">
              <tbody>
                <tr>
                  <td className="border border-gray-400 px-3 py-2 font-semibold">
                    SUB TOTAL
                  </td>
                  <td className="border border-gray-400 px-3 py-2 text-right">
                    {formatMoney(quote?.subtotal, currencySymbol)}
                  </td>
                </tr>

                {discountAmount > 0 ? (
                  <tr>
                    <td className="border border-gray-400 px-3 py-2 font-semibold">
                      Less: Discount
                    </td>
                    <td className="border border-gray-400 px-3 py-2 text-right">
                      {formatMoney(quote?.discount_amount, currencySymbol)}
                    </td>
                  </tr>
                ) : null}

                <tr>
                  <td className="border border-gray-400 px-3 py-2 font-semibold">
                    Tax {taxRate.toFixed(0)}%
                  </td>
                  <td className="border border-gray-400 px-3 py-2 text-right">
                    {formatMoney(quote?.tax_amount, currencySymbol)}
                  </td>
                </tr>

                <tr>
                  <td className="border border-gray-400 px-3 py-2 font-bold">
                    TOTAL
                  </td>
                  <td className="border border-gray-400 px-3 py-2 text-right font-bold">
                    {formatMoney(quote?.total_amount, currencySymbol)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Terms & Notes */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm font-bold text-gray-900 mb-2">
                TERMS &amp; CONDITIONS:
              </div>
              <div className="text-sm">
                <div className="flex gap-2">
                  <div className="w-28 font-semibold">Validity</div>
                  <div className="flex-1">: {draft.terms?.validity || ""}</div>
                </div>
                <div className="flex gap-2">
                  <div className="w-28 font-semibold">Payment</div>
                  <div className="flex-1">: {draft.terms?.payment || ""}</div>
                </div>
                <div className="flex gap-2">
                  <div className="w-28 font-semibold">Delivery Period</div>
                  <div className="flex-1">
                    : {draft.terms?.deliveryPeriod || ""}
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-28 font-semibold">Delivery Point</div>
                  <div className="flex-1">
                    : {draft.terms?.deliveryPoint || ""}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-bold text-gray-900 mb-2">NOTE:</div>
              <div className="text-sm whitespace-pre-wrap text-gray-900">
                {draft.notes || ""}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 grid grid-cols-2 gap-10 text-sm">
            <div>
              <div className="text-gray-700">Prepared by:</div>
              <div className="mt-8 border-b border-gray-400" />
              <div className="mt-2 font-semibold">{preparedByDisplay}</div>
            </div>
            <div>
              <div className="text-gray-700">Approved by:</div>
              <div className="mt-8 border-b border-gray-400" />
              <div className="mt-2 font-semibold">{approvedByDisplay}</div>
            </div>
          </div>

          <div className="mt-6 text-xs text-gray-500">
            Generated from Sari-Sari CRM quotation.
          </div>
        </div>
      </div>
    </div>
  );
}
