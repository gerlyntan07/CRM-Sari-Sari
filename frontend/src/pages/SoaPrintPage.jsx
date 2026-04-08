import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import api from "../api";
import useFetchUser from "../hooks/useFetchUser";

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

const formatDate = (value) => {
  if (!value) return "--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "--";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
};

const formatSoaId = (soaId, fallbackId) => {
  const raw = soaId || (fallbackId ? `SOA-${fallbackId}` : "");
  if (!raw) return "";
  const parts = String(raw).split("-");
  // SOA26-1-00001 -> SOA26-00001
  if (parts.length === 3) return `${parts[0]}-${parts[2]}`;
  return String(raw);
};

const formatQuoteId = (quoteId) => {
  if (!quoteId) return "";
  const parts = String(quoteId).split("-");
  // Q26-1-00001 -> Q26-00001
  if (parts.length === 3) return `${parts[0]}-${parts[2]}`;
  return String(quoteId);
};

export default function SoaPrintPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { soaId } = useParams();
  const { user } = useFetchUser();

  const currencySymbol = user?.company?.currency || "₱";
  const isStarterTier =
    String(user?.subscription_status?.current_plan || "").toLowerCase() === "starter";

  const [soa, setSoa] = useState(() => {
    const incoming = location.state?.soa;
    if (incoming && String(incoming.id) === String(soaId)) return incoming;
    return null;
  });
  const [account, setAccount] = useState(() => location.state?.account || null);
  const [companyInfo, setCompanyInfo] = useState(() => location.state?.companyInfo || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!soaId) return;

    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);

        const [companyRes, soasRes, accountsRes] = await Promise.all([
          api.get("/company/invoice-info").catch(() => null),
          api.get("/soas/admin/fetch-all"),
          api.get("/accounts/admin/fetch-all").catch(() => null),
        ]);

        if (!mounted) return;

        if (companyRes?.data) {
          setCompanyInfo(companyRes.data);
        }

        const list = Array.isArray(soasRes?.data) ? soasRes.data : [];
        const foundSoa = list.find((s) => String(s.id) === String(soaId));

        if (foundSoa) {
          setSoa(foundSoa);
        }

        const accounts = Array.isArray(accountsRes?.data) ? accountsRes.data : [];
        const acctId = foundSoa?.account_id || soa?.account_id;
        if (acctId) {
          const foundAccount = accounts.find((a) => String(a.id) === String(acctId));
          if (foundAccount) setAccount(foundAccount);
        }
      } catch (err) {
        const msg = err?.response?.data?.detail || err?.message || "Failed to load SOA print data.";
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
  }, [soaId]);

  const items = useMemo(() => (Array.isArray(soa?.items) ? soa.items : []), [soa?.items]);
  const soaNo = formatSoaId(soa?.soa_id, soa?.id);
  const quoteNo = formatQuoteId(soa?.quote?.quote_id || soa?.quote_number || "");

  const subtotal = toNumber(soa?.subtotal);
  const taxAmount = toNumber(soa?.tax_amount);
  const totalAmount = toNumber(soa?.total_amount);

  if (!soa) {
    return (
      <div className="p-6">
        <div className="text-gray-700">{loading ? "Loading..." : "SOA not found."}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 soa-print-root">
      <style>{`
        @page { size: A4; margin: 10mm; }
        @media print {
          .no-print { display: none !important; }
          .soa-print-page { margin: 0 !important; padding: 0 !important; max-width: none !important; }
          .soa-sheet { box-shadow: none !important; border: none !important; }
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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
          <button
            type="button"
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm"
            onClick={() => window.print()}
          >
            Print
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 soa-print-page">
        <div className="relative bg-white border border-gray-300 shadow-sm p-6 soa-sheet">
          {isStarterTier && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <div className="text-7xl font-black tracking-[0.35em] text-gray-300 opacity-20 rotate-[-28deg]">
                FOREKAS
              </div>
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <div>
              {companyInfo?.company_logo ? (
                <img src={companyInfo.company_logo} alt="Company logo" className="h-14 object-contain mb-2" />
              ) : null}
              <h1 className="text-lg font-semibold text-gray-900">{companyInfo?.company_name || "Company"}</h1>
              <p className="text-xs text-gray-700">{companyInfo?.address || ""}</p>
              <p className="text-xs text-gray-700">VAT Reg: {companyInfo?.vat_registration_number || "--"}</p>
              <p className="text-xs text-gray-700">TIN: {companyInfo?.tax_id_number || "--"}</p>
            </div>

            <div className="text-right">
              <h2 className="text-2xl font-bold text-red-600 tracking-wide">STATEMENT OF ACCOUNT</h2>
              <p className="text-lg font-semibold text-red-600">NO. {soaNo || "--"}</p>
              <p className="text-xs text-gray-700 mt-2">SOA Date: {formatDate(soa?.soa_date)}</p>
              <p className="text-xs text-gray-700">Due Date: {formatDate(soa?.due_date)}</p>
              <p className="text-xs text-gray-700">Status: {soa?.status || "Draft"}</p>
            </div>
          </div>

          <div className="mt-4 border-t border-gray-400 pt-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <p><span className="font-semibold">Company Name:</span> {account?.name || soa?.account?.name || "--"}</p>
              <p><span className="font-semibold">Customer No:</span> {account?.id || soa?.account_id || "--"}</p>
              <p><span className="font-semibold">Company Address:</span> {account?.billing_address || account?.shipping_address || "--"}</p>
              <p><span className="font-semibold">Quote No:</span> {quoteNo || "--"}</p>
              <p><span className="font-semibold">PO Number:</span> {soa?.purchase_order_number || "--"}</p>
              <p><span className="font-semibold">Terms of Payment:</span> {soa?.terms_of_payment || "--"}</p>
            </div>
          </div>

          <div className="mt-4 border border-gray-500">
            <div className="grid grid-cols-[1fr_220px] bg-blue-200 border-b border-gray-500 text-sm font-semibold">
              <div className="px-3 py-2 border-r border-gray-500">PARTICULARS</div>
              <div className="px-3 py-2 text-right">AMOUNT</div>
            </div>

            <div className="min-h-[330px] bg-blue-100">
              {items.length > 0 ? (
                items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_220px] border-b border-blue-200 text-sm">
                    <div className="px-3 py-2">
                      <div className="font-medium">{item?.name || "Item"}</div>
                      <div className="text-xs text-gray-700">
                        Qty {toNumber(item?.quantity)} {item?.unit || ""}
                        {item?.description ? ` • ${item.description}` : ""}
                      </div>
                    </div>
                    <div className="px-3 py-2 text-right">{formatMoney(item?.line_total, currencySymbol)}</div>
                  </div>
                ))
              ) : (
                <div className="px-3 py-3 text-sm text-gray-700">No line items.</div>
              )}
            </div>

            <div className="grid grid-cols-[1fr_220px] border-t border-gray-500 text-sm">
              <div className="px-3 py-2 text-right font-semibold border-r border-gray-500">CURRENT BALANCE</div>
              <div className="px-3 py-2 text-right">{formatMoney(totalAmount, currencySymbol)}</div>
            </div>
            <div className="grid grid-cols-[1fr_220px] border-t border-gray-500 text-sm font-bold">
              <div className="px-3 py-2 text-right border-r border-gray-500">TOTAL AMOUNT DUE</div>
              <div className="px-3 py-2 text-right">{formatMoney(totalAmount, currencySymbol)}</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4">
            <div className="text-xs text-gray-800 leading-relaxed space-y-2">
              <p>Please make check payable to <strong>{companyInfo?.company_name || "our company"}</strong>.</p>
              <p>
                For collection arrangements, please coordinate with our accounting team.
                Full Payment: <strong>{soa?.full_payment ? "Yes" : "No"}</strong>
              </p>
              {soa?.notes ? <p><strong>Notes:</strong> {soa.notes}</p> : null}
            </div>

            <div className="border border-gray-500 bg-blue-100 p-3 text-sm">
              <p className="font-semibold mb-2">Current Charges Breakdown</p>
              <div className="flex items-center justify-between"><span>Total Sales</span><span>{formatMoney(subtotal, currencySymbol)}</span></div>
              <div className="flex items-center justify-between"><span>VAT Sales</span><span>{formatMoney(taxAmount, currencySymbol)}</span></div>
              <div className="flex items-center justify-between"><span>Total</span><span className="font-semibold">{formatMoney(totalAmount, currencySymbol)}</span></div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-gray-500">Prepared By</p>
              <p className="font-semibold border-b border-gray-400 mt-6">{soa?.prepared_by || "--"}</p>
            </div>
            <div>
              <p className="text-gray-500">Approved By</p>
              <p className="font-semibold border-b border-gray-400 mt-6">{soa?.approved_by || "--"}</p>
            </div>
            <div>
              <p className="text-gray-500">Received By</p>
              <p className="font-semibold border-b border-gray-400 mt-6">{soa?.received_by || "--"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
