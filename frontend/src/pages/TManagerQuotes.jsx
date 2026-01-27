import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiSearch,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiFileText,
  FiX,
  FiPhone,
  FiCalendar,
  FiCheckSquare,
} from "react-icons/fi";
import { HiX } from "react-icons/hi";
import { toast } from "react-toastify";
import api from "../api.js";
import PaginationControls from "../components/PaginationControls.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import QuoteItemsEditor from "../components/QuoteItemsEditor.jsx";
import { useNavigate, useLocation } from "react-router-dom";

const ITEMS_PER_PAGE = 10;

const STATUS_OPTIONS = [
  { value: "Draft", label: "Draft" },
  { value: "Presented", label: "Presented" },
  { value: "Accepted", label: "Accepted" },
  { value: "Rejected", label: "Rejected" },
];

const INITIAL_FORM_STATE = {
  deal_id: "",
  account_id: "",
  contact_id: "",
  total_amount: "",
  presented_date: "",
  validity_days: "",
  status: "Draft",
  assigned_to: "",
  notes: "",
  // New pricing fields
  subtotal: 0,
  tax_rate: 0,
  tax_amount: 0,
  discount_type: "",
  discount_value: 0,
  discount_amount: 0,
  currency: "PHP",
  // Line items
  items: [],
};

const normalizeStatus = (status) => {
  if (!status) return "Draft";
  const s = status.toString().trim().toLowerCase();
  const map = {
    draft: "Draft",
    presented: "Presented",
    accepted: "Accepted",
    rejected: "Rejected",
  };
  return map[s] || "Draft";
};

const formatStatusLabel = (status) => {
  if (!status) return "--";
  return status
    .toString()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const getStatusBadgeClass = (status) => {
  const normalized = normalizeStatus(status).toLowerCase();
  switch (normalized) {
    case "draft":
      return "bg-gray-100 text-gray-700";
    case "presented":
      return "bg-yellow-100 text-yellow-700";
    case "accepted":
      return "bg-green-100 text-green-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getDetailBadgeClass = (status) => {
  const normalized = normalizeStatus(status).toLowerCase();
  switch (normalized) {
    case "draft":
      return "bg-gray-600 text-white";
    case "presented":
      return "bg-yellow-600 text-white";
    case "accepted":
      return "bg-green-600 text-white";
    case "rejected":
      return "bg-red-600 text-white";
    default:
      return "bg-gray-600 text-white";
  }
};

const formattedDateTime = (datetime) => {
  if (!datetime) return "";
  return new Date(datetime)
    .toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    })
    .replace(",", "");
};

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
};

const formatDateForInput = (date) => {
  if (!date) return "";
  if (typeof date === "string" && date.match(/^\d{4}-\d{2}-\d{2}$/))
    return date;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return "";
  }
};

const computeExpiryDate = (presented_date, validity_days) => {
  if (!presented_date) return "";
  if (
    validity_days === null ||
    validity_days === undefined ||
    validity_days === ""
  )
    return "";
  const days = Number(validity_days);
  if (Number.isNaN(days)) return "";
  const base = new Date(presented_date);
  if (isNaN(base.getTime())) return "";
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
};

const formatDealId = (dealId) => {
  if (!dealId) return "";
  // Convert D25-1-00001 to D25-00001 (remove middle company ID)
  const parts = String(dealId).split("-");
  if (parts.length === 3) {
    return `${parts[0]}-${parts[2]}`;
  }
  return String(dealId);
};

const formatQuoteId = (quoteId) => {
  if (!quoteId) return "";
  // Convert D25-1-00001 to D25-00001 (remove middle company ID)
  const parts = String(quoteId).split("-");
  if (parts.length === 3) {
    return `${parts[0]}-${parts[2]}`;
  }
  return String(quoteId);
};

// --------- Current user id helpers ----------
const tryExtractUserId = (obj) => {
  if (!obj) return null;

  if (typeof obj === "number") return obj;
  if (typeof obj === "string" && obj.trim() && !Number.isNaN(Number(obj)))
    return Number(obj);

  if (typeof obj === "object") {
    if (obj.id && !Number.isNaN(Number(obj.id))) return Number(obj.id);
    if (obj.user?.id && !Number.isNaN(Number(obj.user.id)))
      return Number(obj.user.id);
    if (obj.data?.id && !Number.isNaN(Number(obj.data.id)))
      return Number(obj.data.id);
    if (obj.profile?.id && !Number.isNaN(Number(obj.profile.id)))
      return Number(obj.profile.id);
  }
  return null;
};

const getUserIdFromLocalStorage = () => {
  const keys = ["user", "currentUser", "userData", "authUser", "profile"];
  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const id = tryExtractUserId(parsed);
      if (id) return id;
    } catch {}
  }
  const fallback = localStorage.getItem("user_id");
  const id2 = tryExtractUserId(fallback);
  if (id2) return id2;
  return null;
};

// --------- Deal → Account/Contact extraction (flexible shape) ----------
const extractDealAccountId = (deal) => {
  if (!deal) return "";
  const candidates = [
    deal.account_id,
    deal.accountId,
    deal.account?.id,
    deal.account?.account_id,
    deal.account?.accountId,
  ];
  const found = candidates.find(
    (v) => v !== null && v !== undefined && String(v).trim() !== ""
  );
  return found ? String(found) : "";
};

const extractDealContactId = (deal) => {
  if (!deal) return "";
  const candidates = [
    deal.contact_id,
    deal.contactId,
    deal.contact?.id,
    deal.primary_contact_id,
    deal.primaryContactId,
    deal.primary_contact?.id,
    deal.primaryContact?.id,
  ];
  const found = candidates.find(
    (v) => v !== null && v !== undefined && String(v).trim() !== ""
  );
  return found ? String(found) : "";
};

export default function TManagerQuotes() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.title = "Quotes | Sari-Sari CRM";
  }, []);

  const [quotes, setQuotes] = useState([]);
  const [quotesLoading, setQuotesLoading] = useState(false);

  const [deals, setDeals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);

  const [currentUserId, setCurrentUserId] = useState(null);

  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [confirmModalData, setConfirmModalData] = useState(null);
  const [confirmProcessing, setConfirmProcessing] = useState(false);

  const [currentQuoteId, setCurrentQuoteId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Filter by Status");
  const [deletingId, setDeletingId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedStatus, setSelectedStatus] = useState("Draft");
  const [pendingQuoteId, setPendingQuoteId] = useState(null);

  useEffect(() => {
    const state = location.state;
    const quoteIdFromState = state?.quoteID;

    if (quoteIdFromState) {
      setPendingQuoteId(quoteIdFromState);
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }
  }, [location, navigate])

  useEffect(() => {
      if (pendingQuoteId && quotes.length > 0 && !quotesLoading) {
        const foundQuote = quotes.find((quote) => quote.id === pendingQuoteId);
        if (foundQuote) {
          setSelectedQuote(foundQuote); // Open in view mode
        } else {
          toast.error("Quote not found.");
        }
        setPendingQuoteId(null); // Clear pending quote ID
      }
    }, [pendingQuoteId, contacts, quotesLoading]);

  // Resolve current user id
  useEffect(() => {
    let mounted = true;

    const resolveMe = async () => {
      const localId = getUserIdFromLocalStorage();
      if (localId && mounted) {
        setCurrentUserId(localId);
        return;
      }

      try {
        const res = await api.get("/auth/me");
        const id = tryExtractUserId(res?.data);
        if (id && mounted) {
          setCurrentUserId(id);
          return;
        }
      } catch {}

      try {
        const res = await api.get("/users/me");
        const id = tryExtractUserId(res?.data);
        if (id && mounted) {
          setCurrentUserId(id);
          return;
        }
      } catch {}

      if (mounted) setCurrentUserId(null);
    };

    resolveMe();
    return () => {
      mounted = false;
    };
  }, []);

  // Helpers to get display names by id
  const getAccountNameById = useCallback(
    (accountId) => {
      if (!accountId) return "";
      const found = accounts.find((a) => String(a.id) === String(accountId));
      return found?.name || "";
    },
    [accounts]
  );

  const getContactNameById = useCallback(
    (contactId) => {
      if (!contactId) return "";
      const found = contacts.find((c) => String(c.id) === String(contactId));
      if (!found) return "";
      return `${found.first_name} ${found.last_name}`.trim();
    },
    [contacts]
  );

  const getDealLabelById = useCallback(
    (dealId) => {
      if (!dealId) return "--";
      const found = deals.find((d) => String(d.id) === String(dealId));
      return found?.deal_name || found?.name || `Deal #${formatDealId(dealId)}`;
    },
    [deals]
  );

  // Derive account/contact from a deal (and best-effort choose contact if missing)
  const deriveAccountAndContactFromDealId = useCallback(
    (dealId) => {
      const deal = deals.find((d) => String(d.id) === String(dealId));
      const accountId = extractDealAccountId(deal);
      let contactId = extractDealContactId(deal);

      if (!contactId && accountId) {
        const candidates = contacts.filter(
          (c) => String(c.account_id || "") === String(accountId)
        );
        if (candidates.length > 0) {
          const sorted = [...candidates].sort((a, b) => {
            const an = `${a.first_name || ""} ${a.last_name || ""}`
              .trim()
              .toLowerCase();
            const bn = `${b.first_name || ""} ${b.last_name || ""}`
              .trim()
              .toLowerCase();
            return an.localeCompare(bn);
          });
          contactId = String(sorted[0].id);
        }
      }

      if (accountId && contactId) {
        const c = contacts.find((x) => String(x.id) === String(contactId));
        if (c?.account_id && String(c.account_id) !== String(accountId)) {
          contactId = "";
        }
      }

      return { accountId: accountId || "", contactId: contactId || "" };
    },
    [deals, contacts]
  );

  // Display helpers for list/details
  const resolveDealLabel = useCallback(
    (quote) => {
      if (!quote) return "--";
      if (quote.deal?.deal_name) return quote.deal.deal_name;
      if (quote.deal?.name) return quote.deal.name;
      const dealId = quote.deal_id || quote.deal?.id;
      return dealId ? getDealLabelById(dealId) : "--";
    },
    [getDealLabelById]
  );

  const resolveAccountLabel = useCallback(
    (quote) => {
      if (!quote) return "--";
      if (quote.account?.name) return quote.account.name;

      let accountId = quote.account_id || quote.account?.id;

      if (!accountId) {
        const dealId = quote.deal_id || quote.deal?.id;
        if (dealId) {
          const derived = deriveAccountAndContactFromDealId(dealId);
          accountId = derived.accountId;
        }
      }

      return accountId
        ? getAccountNameById(accountId) || `Account #${accountId}`
        : "--";
    },
    [deriveAccountAndContactFromDealId, getAccountNameById]
  );

  const resolveContactLabel = useCallback(
    (quote) => {
      if (!quote) return "--";
      if (quote.contact?.first_name || quote.contact?.last_name) {
        return (
          `${quote.contact?.first_name || ""} ${
            quote.contact?.last_name || ""
          }`.trim() || "--"
        );
      }

      let contactId = quote.contact_id || quote.contact?.id;

      if (!contactId) {
        const dealId = quote.deal_id || quote.deal?.id;
        if (dealId) {
          const derived = deriveAccountAndContactFromDealId(dealId);
          contactId = derived.contactId;
        }
      }

      const name = contactId ? getContactNameById(contactId) : "";
      return name || (contactId ? `Contact #${contactId}` : "--");
    },
    [deriveAccountAndContactFromDealId, getContactNameById]
  );

  const fetchQuotes = useCallback(async (preserveSelectedId = null) => {
    setQuotesLoading(true);
    try {
      const res = await api.get(`/quotes/admin/fetch-all`);
      const data = Array.isArray(res.data) ? res.data : [];
      const sorted = [...data].sort((a, b) => {
        const aDate = a?.created_at || a?.updated_at || 0;
        const bDate = b?.created_at || b?.updated_at || 0;
        return new Date(bDate) - new Date(aDate);
      });
      setQuotes(sorted);

      if (preserveSelectedId) {
        const updatedSelection = sorted.find(
          (q) => q.id === preserveSelectedId
        );
        setSelectedQuote(updatedSelection || null);
      }
    } catch (err) {
      console.error(err);
      setQuotes([]);
      if (err.response?.status === 403) {
        toast.error(
          "Permission denied. Only CEO, Admin, or Group Manager can access this page."
        );
      } else {
        toast.error("Failed to fetch quotes. Please try again later.");
      }
    } finally {
      setQuotesLoading(false);
    }
  }, []);

  const fetchDeals = useCallback(async () => {
    try {
      const res = await api.get(`/deals/admin/fetch-all`);
      setDeals(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403)
        toast.warn("Unable to load deals (permission denied).");
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await api.get(`/accounts/admin/fetch-all`);
      setAccounts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403)
        toast.warn("Unable to load accounts (permission denied).");
    }
  }, []);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await api.get(`/contacts/admin/fetch-all`);
      setContacts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403)
        toast.warn("Unable to load contacts (permission denied).");
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get(`/users/all`);
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403)
        toast.warn("Unable to load users (permission denied).");
    }
  }, []);

  useEffect(() => {
    fetchQuotes();
    fetchDeals();
    fetchAccounts();
    fetchContacts();
    fetchUsers();
  }, [fetchQuotes, fetchDeals, fetchAccounts, fetchContacts, fetchUsers]);

  const filteredQuotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const f = statusFilter.trim();

    return quotes.filter((row) => {
      const dealLabel = resolveDealLabel(row);
      const accountLabel = resolveAccountLabel(row);
      const contactLabel = resolveContactLabel(row);

      const expiry = computeExpiryDate(row.presented_date, row.validity_days);

      const searchFields = [
        row.quote_id,
        dealLabel,
        accountLabel,
        contactLabel,
        row.total_amount?.toString(),
        row.validity_days?.toString(),
        row.presented_date ? formatDate(row.presented_date) : "",
        expiry ? formatDate(expiry) : "",
        row.assigned_user?.first_name,
        row.assigned_user?.last_name,
        row.creator?.first_name,
        row.creator?.last_name,
        row.status,
        row.notes,
        formattedDateTime(row.created_at),
        formattedDateTime(row.updated_at),
      ];

      const matchesSearch =
        q === "" ||
        searchFields.some((field) => {
          if (field === null || field === undefined) return false;
          return field.toString().toLowerCase().includes(q);
        });

      const matchesStatus =
        f === "Filter by Status" || normalizeStatus(row.status) === f;

      return matchesSearch && matchesStatus;
    });
  }, [
    quotes,
    searchQuery,
    statusFilter,
    resolveDealLabel,
    resolveAccountLabel,
    resolveContactLabel,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredQuotes.length / itemsPerPage) || 1
  );

  useEffect(() => setCurrentPage(1), [searchQuery, statusFilter, itemsPerPage]);

  useEffect(() => {
    setCurrentPage((prev) => {
      const maxPage = Math.max(
        1,
        Math.ceil(filteredQuotes.length / itemsPerPage) || 1
      );
      return prev > maxPage ? maxPage : prev;
    });
  }, [filteredQuotes.length, itemsPerPage]);

  const paginatedQuotes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredQuotes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredQuotes, currentPage, itemsPerPage]);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleQuoteClick = (quote) => {
    setSelectedQuote(quote);
    setActiveTab("Overview");
    setSelectedStatus(normalizeStatus(quote?.status) || "Draft");
  };

  const handleBackToList = () => {
    setSelectedQuote(null);
    setActiveTab("Overview");
  };

  const handleQuoteModalBackdropClick = (e) => {
    if (e.target.id === "quoteModalBackdrop" && !confirmProcessing)
      handleBackToList();
  };

  const closeModal = useCallback(() => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentQuoteId(null);
    setFormData(INITIAL_FORM_STATE);
    setIsSubmitting(false);
  }, []);

  const handleBackdropClick = (e) => {
    if (e.target.id === "modalBackdrop" && !isSubmitting && !confirmProcessing)
      closeModal();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "deal_id") {
      const { accountId, contactId } = deriveAccountAndContactFromDealId(value);
      setFormData((prev) => ({
        ...prev,
        deal_id: value,
        account_id: accountId,
        contact_id: contactId,
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenAddModal = () => {
    setFormData(INITIAL_FORM_STATE);
    setIsEditing(false);
    setCurrentQuoteId(null);
    setShowModal(true);
  };

  const handleEditClick = (quote) => {
    if (!quote) return;
    setSelectedQuote(null);

    const dealId = quote.deal?.id
      ? String(quote.deal.id)
      : quote.deal_id
      ? String(quote.deal_id)
      : "";

    const derived = dealId
      ? deriveAccountAndContactFromDealId(dealId)
      : { accountId: "", contactId: "" };

    const accountId = quote.account?.id
      ? String(quote.account.id)
      : quote.account_id
      ? String(quote.account_id)
      : derived.accountId;

    const contactId = quote.contact?.id
      ? String(quote.contact.id)
      : quote.contact_id
      ? String(quote.contact_id)
      : derived.contactId;

    const assignedToId = quote.assigned_user?.id
      ? String(quote.assigned_user.id)
      : quote.assigned_to
      ? String(quote.assigned_to)
      : "";

    setFormData({
      deal_id: dealId,
      account_id: accountId || "",
      contact_id: contactId || "",
      total_amount: quote.total_amount?.toString() || "",
      presented_date: formatDateForInput(quote.presented_date),
      validity_days:
        quote.validity_days !== null && quote.validity_days !== undefined
          ? String(quote.validity_days)
          : "",
      status: normalizeStatus(quote.status) || "Draft",
      assigned_to: assignedToId,
      notes: quote.notes || "",
    });

    setIsEditing(true);
    setCurrentQuoteId(quote.id);
    setShowModal(true);
  };

  const handleDelete = (quote) => {
    if (!quote) return;
    const quoteName = quote.quote_id || "this quote";
    setConfirmModalData({
      title: "Delete Quote",
      message: (
        <span>
          Are you sure you want to permanently delete{" "}
          <span className="font-semibold">{quoteName}</span>? This action cannot
          be undone.
        </span>
      ),
      confirmLabel: "Delete Quote",
      cancelLabel: "Cancel",
      variant: "danger",
      action: { type: "delete", targetId: quote.id, name: quoteName },
    });
  };

  const [isSubmitted, setIsSubmitted] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);  

    if (!currentUserId) {
      toast.error("Unable to determine current user. Please log in again.");
      return;
    }

    if (!formData.deal_id) {
      toast.error("Deal is required.");
      return;
    }

     const assignedTo = formData.assigned_to;
          if (!assignedTo) {
            toast.error("Assigned To is required.");
            return;
          }

    // if (!formData.total_amount || Number(formData.total_amount) <= 0) {
    //   toast.error("Total amount must be greater than 0.");
    //   return;
    // } 

    // if (formData.validity_days !== "" && Number(formData.validity_days) < 0) {
    //   toast.error("Validity days must be 0 or higher.");
    //   return;
    // }

    const derived = deriveAccountAndContactFromDealId(formData.deal_id);

    const basePayload = {
      deal_id: Number(formData.deal_id),
      account_id: derived.accountId ? Number(derived.accountId) : null,
      contact_id: derived.contactId ? Number(derived.contactId) : null,
      total_amount: Number(formData.total_amount),
      presented_date: formData.presented_date || null,
      validity_days:
        formData.validity_days === "" ? null : Number(formData.validity_days),
      status: formData.status || "Draft",
      assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
      notes: formData.notes?.trim() || null,
    };

    const actionType = isEditing && currentQuoteId ? "update" : "create";
    const dealLabelForConfirm = getDealLabelById(formData.deal_id);

    const payload =
      actionType === "create"
        ? { ...basePayload, created_by_id: Number(currentUserId) }
        : basePayload;

    setConfirmModalData({
      title: actionType === "create" ? "Confirm New Quote" : "Confirm Update",
      message:
        actionType === "create" ? (
          <span>
            Are you sure you want to create a quote for{" "}
            <span className="font-semibold">{dealLabelForConfirm}</span>?
          </span>
        ) : (
          <span>
            Save changes to{" "}
            <span className="font-semibold">{dealLabelForConfirm}</span>?
          </span>
        ),
      confirmLabel: actionType === "create" ? "Create Quote" : "Update Quote",
      cancelLabel: "Cancel",
      variant: "primary",
      action: {
        type: actionType,
        payload,
        targetId: currentQuoteId || null,
        name: dealLabelForConfirm,
      },
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmModalData?.action) {
      setConfirmModalData(null);
      return;
    }

    const { action } = confirmModalData;
    const { type, payload, targetId, name } = action;

    setConfirmProcessing(true);

    try {
      if (type === "create") {
        setIsSubmitting(true);
        await api.post(`/quotes/admin`, payload);
        toast.success(`Quote created successfully.`);
        closeModal();
        await fetchQuotes();
      } else if (type === "update") {
        if (!targetId) throw new Error("Missing quote identifier for update.");
        setIsSubmitting(true);
        await api.put(`/quotes/admin/${targetId}`, payload);
        toast.success(`Quote updated successfully.`);
        closeModal();
        await fetchQuotes();
        if (selectedQuote?.id === targetId) setSelectedQuote(null);
      } else if (type === "delete") {
        if (!targetId)
          throw new Error("Missing quote identifier for deletion.");
        const currentSelectedId = selectedQuote?.id;
        setDeletingId(targetId);

        await api.delete(`/quotes/admin/${targetId}`);
        toast.success(`Quote "${name}" deleted successfully.`);

        await fetchQuotes(
          currentSelectedId && currentSelectedId !== targetId
            ? currentSelectedId
            : null
        );
        if (currentSelectedId === targetId) setSelectedQuote(null);
      }
    } catch (err) {
      console.error(err);
      const defaultMessage =
        type === "create"
          ? "Failed to create quote. Please review the details and try again."
          : type === "update"
          ? "Failed to update quote. Please review the details and try again."
          : "Failed to delete quote. Please try again.";
      toast.error(defaultMessage);

      if (type === "create" || type === "update") setIsSubmitting(false);
      if (type === "delete") setDeletingId(null);
    } finally {
      if (type === "create" || type === "update") setIsSubmitting(false);
      if (type === "delete") setDeletingId(null);
      setConfirmProcessing(false);
      setConfirmModalData(null);
    }
  };

  const handleCancelConfirm = () => {
    if (confirmProcessing) return;
    setConfirmModalData(null);
  };

  // ✅ FIX: status change handler with PATCH-then-fallback-to-PUT
  const buildUpdatePayloadFromQuote = useCallback(
    (quote, overrideStatus) => {
      const dealIdRaw = quote?.deal_id ?? quote?.deal?.id ?? "";
      const deal_id = dealIdRaw ? Number(dealIdRaw) : null;

      const derived = deal_id
        ? deriveAccountAndContactFromDealId(String(deal_id))
        : { accountId: "", contactId: "" };

      const accountIdRaw =
        quote?.account_id ?? quote?.account?.id ?? derived.accountId ?? null;
      const contactIdRaw =
        quote?.contact_id ?? quote?.contact?.id ?? derived.contactId ?? null;

      const totalAmountRaw = quote?.total_amount ?? 0;
      const assignedToRaw =
        quote?.assigned_to ?? quote?.assigned_user?.id ?? null;

      return {
        deal_id,
        account_id:
          accountIdRaw !== null &&
          accountIdRaw !== undefined &&
          String(accountIdRaw).trim() !== ""
            ? Number(accountIdRaw)
            : null,
        contact_id:
          contactIdRaw !== null &&
          contactIdRaw !== undefined &&
          String(contactIdRaw).trim() !== ""
            ? Number(contactIdRaw)
            : null,
        total_amount: Number(totalAmountRaw),
        presented_date: quote?.presented_date || null,
        validity_days:
          quote?.validity_days === "" || quote?.validity_days === undefined
            ? null
            : quote?.validity_days === null
            ? null
            : Number(quote.validity_days),
        status: overrideStatus, // Title Case (same as your working PUT flow)
        assigned_to:
          assignedToRaw !== null &&
          assignedToRaw !== undefined &&
          String(assignedToRaw).trim() !== ""
            ? Number(assignedToRaw)
            : null,
        notes: quote?.notes?.trim() || null,
      };
    },
    [deriveAccountAndContactFromDealId]
  );

  // ✅ requirement: once changed status, close the popup modal (detail view)
  const handleStatusUpdate = useCallback(async () => {
    if (!selectedQuote?.id) return;

    const uiStatus = normalizeStatus(selectedStatus); // "Draft"
    const attempts = [uiStatus, uiStatus.toLowerCase()];

    const patchStatus = async (statusValue) => {
      return api.patch(
        `/quotes/admin/${selectedQuote.id}/status`,
        { status: statusValue },
        { headers: { "Content-Type": "application/json" } }
      );
    };

    try {
      let patched = false;

      for (const statusValue of attempts) {
        try {
          await patchStatus(statusValue);
          patched = true;
          break;
        } catch (e) {
          if (e?.response?.status === 422) continue; // try next format
          throw e;
        }
      }

      if (!patched) {
        // Fallback to full PUT update
        const payload = buildUpdatePayloadFromQuote(selectedQuote, uiStatus);

        if (!payload.deal_id) {
          toast.error(
            "Cannot update status: missing deal_id on selected quote."
          );
          return;
        }
        if (!payload.total_amount || payload.total_amount <= 0) {
          toast.error(
            "Cannot update status: missing/invalid total_amount on selected quote."
          );
          return;
        }

        await api.put(`/quotes/admin/${selectedQuote.id}`, payload);
      }

      toast.success(`Quote status updated to ${uiStatus}`);

      // ✅ CLOSE the detail modal after success
      setSelectedQuote(null);
      setActiveTab("Overview");

      // Refresh list after closing
      await fetchQuotes();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        (err?.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(" ")
          : null) ||
        "Failed to update quote status. Please try again.";
      toast.error(msg);
    }
  }, [selectedQuote, selectedStatus, fetchQuotes, buildUpdatePayloadFromQuote]);

  const statusFilterOptions = [
    { label: "Filter by Status", value: "Filter by Status" },
    ...STATUS_OPTIONS.map((option) => ({
      label: option.label,
      value: option.value,
    })),
  ];

  const deleteActionTargetId =
    confirmModalData?.action?.type === "delete"
      ? confirmModalData.action.targetId
      : null;

  const selectedQuoteDeleteDisabled =
    selectedQuote &&
    (deletingId === selectedQuote.id ||
      deleteActionTargetId === selectedQuote.id);

  const selectedQuoteDeleting =
    selectedQuote && deletingId === selectedQuote.id;

  const detailView = selectedQuote ? (
    <div
      id="quoteModalBackdrop"
      onClick={handleQuoteModalBackdropClick}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[92vh] overflow-y-auto hide-scrollbar animate-scale-in font-inter relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full flex flex-col items-center justify-center rounded-t-xl">
          <div className="bg-tertiary w-full flex items-center justify-between p-3 lg:p-3 rounded-t-xl">
            <h1 className="lg:text-3xl text-xl text-white font-semibold text-center w-full">
              Quotes
            </h1>
            <button
              onClick={handleBackToList}
              className="text-gray-500 hover:text-white transition cursor-pointer"
            >
              <HiX size={25} />
            </button>
          </div>
        </div>

        <div className="p-6 lg:p-4">
                <div className="flex flex-col md:flex-row md:justify-between lg:flex-row lg:items-center lg:justify-between mt-3 gap-2 px-2 md:items-center lg:gap-4 md:mx-7 lg:mx-7">
  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
    <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
                {resolveDealLabel(selectedQuote)}
              </h1>
              <span
                className={`text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full whitespace-nowrap ${getDetailBadgeClass(
                  selectedQuote.status
                )}`}
              >
                {formatStatusLabel(selectedQuote.status)}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
              <button
                className="inline-flex items-center justify-center w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-70 transition text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                onClick={() => handleEditClick(selectedQuote)}
                disabled={
                  confirmProcessing ||
                  (confirmModalData?.action?.type === "update" &&
                    confirmModalData.action.targetId === selectedQuote.id)
                }
              >
                <FiEdit className="mr-2" />
                Edit
              </button>

              <button
                className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 rounded-md text-sm bg-red-500 text-white hover:bg-red-600 transition focus:outline-none focus:ring-2 focus:ring-red-400"
                onClick={() => handleDelete(selectedQuote)}
                disabled={Boolean(selectedQuoteDeleteDisabled)}
              >
                {selectedQuoteDeleting ? (
                  "Deleting..."
                ) : (
                  <>
                    <FiTrash2 className="mr-2" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="border-b border-gray-200 my-5"></div>

          <div className="p-1 lg:p-4">
            <div className="flex w-full bg-[#6A727D] text-white mt-1 overflow-x-auto mb-6">
              {["Overview", "Notes"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 min-w-[90px] px-4 py-2.5 text-xs sm:text-sm font-medium text-center transition-all duration-200 border-b-2
                    ${
                      activeTab === tab
                        ? "bg-paper-white text-[#6A727D] border-white"
                        : "text-white hover:bg-[#5c636d]"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              <div className="lg:col-span-3">
                {activeTab === "Overview" && (
                  <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8 border border-gray-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6 text-sm text-gray-700">
                      <div>
                        <p className="font-semibold">Quote ID:</p>
                        <p>{formatQuoteId(selectedQuote.quote_id) || "N/A"}</p>
                      </div>

                      <div>
                        <p className="font-semibold">Deal:</p>
                        <p>{resolveDealLabel(selectedQuote) || "N/A"}</p>
                      </div>

                      <div>
                        <p className="font-semibold">Account:</p>
                        <p>{resolveAccountLabel(selectedQuote) || "N/A"}</p>
                      </div>

                      <div>
                        <p className="font-semibold">Contact:</p>
                        <p>{resolveContactLabel(selectedQuote) || "N/A"}</p>
                      </div>

                      <div>
                        <p className="font-semibold">Total Amount:</p>
                        <p>
                          {selectedQuote.total_amount
                            ? `₱${Number(
                                selectedQuote.total_amount
                              ).toLocaleString()}`
                            : "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold">Presented Date:</p>
                        <p>
                          {formatDate(selectedQuote.presented_date) || "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold">Validity Days:</p>
                        <p>
                          {selectedQuote.validity_days !== null &&
                          selectedQuote.validity_days !== undefined
                            ? selectedQuote.validity_days
                            : "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold">Expiry Date:</p>
                        <p>
                          {formatDate(
                            computeExpiryDate(
                              selectedQuote.presented_date,
                              selectedQuote.validity_days
                            )
                          ) || "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold">Status:</p>
                        <p>{formatStatusLabel(selectedQuote.status)}</p>
                      </div>

                      <div>
                        <p className="font-semibold">Assigned To:</p>
                        <p>
                          {selectedQuote.assigned_user
                            ? `${selectedQuote.assigned_user.first_name} ${selectedQuote.assigned_user.last_name}`
                            : "Unassigned"}
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold">Created By:</p>
                        <p>
                          {selectedQuote.creator
                            ? `${selectedQuote.creator.first_name} ${selectedQuote.creator.last_name}`
                            : "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold">Created At:</p>
                        <p>
                          {formattedDateTime(selectedQuote.created_at) || "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold">Last Updated:</p>
                        <p>
                          {formattedDateTime(selectedQuote.updated_at) || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "Notes" && (
                  <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-2">Notes:</h3>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedQuote.notes || "No notes available."}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <div className="bg-white border border-gray-100 rounded-lg p-3 sm:p-4 shadow-sm">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm">
                    Quick Actions
                  </h4>

                  <div className="flex flex-col gap-2 w-full">
                    <button
                      onClick={() =>
                        navigate("/group-manager/calls", {
                          state: {
                            openCallModal: true,
                            initialCallData: { relatedType1: "Quotes" },
                          },
                        })
                      }
                      className="flex items-center gap-2 border border-gray-100 rounded-md py-1.5 px-2 sm:px-3 hover:bg-gray-50 transition text-sm"
                    >
                      <FiPhone className="text-gray-600 w-4 h-4" />
                      Schedule Call
                    </button>

                    <button
                      className="flex items-center gap-2 border border-gray-100 rounded-md py-1.5 px-2 sm:px-3 hover:bg-gray-50 transition text-sm"
                      onClick={() =>
                        navigate("/group-manager/meetings", {
                          state: {
                            openMeetingModal: true,
                            initialMeetingData: { relatedType: "Quotes" },
                          },
                        })
                      }
                    >
                      <FiCalendar className="text-gray-600 w-4 h-4" />
                      Book Meeting
                    </button>

                    <button
                      onClick={() =>
                        navigate("/group-manager/tasks", {
                          state: {
                            openTaskModal: true,
                            initialTaskData: { relatedTo: "Quotes" },
                          },
                        })
                      }
                      className="flex items-center gap-2 border border-gray-100 rounded-md py-1.5 px-2 sm:px-3 hover:bg-gray-50 transition text-sm"
                    >
                      <FiCheckSquare className="text-gray-600 w-4 h-4" />
                      Tasks
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-lg p-3 sm:p-4 shadow-sm w-full">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm">
                    Status
                  </h4>

                  <select
                    className="border border-gray-200 rounded-md px-2 sm:px-3 py-1.5 w-full text-sm mb-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={
                      selectedStatus ||
                      normalizeStatus(selectedQuote.status) ||
                      "Draft"
                    }
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleStatusUpdate}
                    disabled={
                      normalizeStatus(selectedStatus) ===
                      normalizeStatus(selectedQuote.status)
                    }
                    className={`w-full py-1.5 rounded-md text-sm transition focus:outline-none focus:ring-2 ${
                      normalizeStatus(selectedStatus) ===
                      normalizeStatus(selectedQuote.status)
                        ? "bg-gray-400 cursor-not-allowed text-white"
                        : "bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-400"
                    }`}
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  const listView = (
    <div className="p-4 sm:p-6 lg:p-8 font-inter relative">
      {quotesLoading && <LoadingSpinner message="Loading quotes..." />}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <h2 className="flex items-center text-xl sm:text-2xl font-semibold text-gray-800">
          <FiFileText className="mr-2 text-blue-600" /> Quotes
        </h2>

        <div className="flex justify-center lg:justify-end w-full sm:w-auto">
          <button
             onClick={() => {
          handleOpenAddModal();  // open the modal
          setIsSubmitted(false); // reset all error borders
        }}
            className="flex items-center bg-black text-white px-3 sm:px-4 py-2 rounded-md hover:bg-gray-800 text-sm sm:text-base mx-auto sm:ml-auto cursor-pointer"
          >
            <FiPlus className="mr-2" /> Add Quote
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex flex-col lg:flex-row items-center justify-between gap-3 w-full">
        <div className="flex items-center border border-gray-300 rounded-lg px-4 h-11 w-full lg:w-3/4 focus-within:ring-2 focus-within:ring-indigo-500 transition">
          <FiSearch size={20} className="text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search quotes"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="focus:outline-none text-base w-full"
          />
        </div>

        <div className="w-full lg:w-1/4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 h-11 text-sm text-gray-600 bg-white w-full focus:ring-2 focus:ring-indigo-500 transition"
          >
            {statusFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border border-gray-200 rounded-lg bg-white shadow-sm text-sm">
          <thead className="bg-gray-100 text-left text-gray-600 text-sm tracking-wide font-semibold">
            <tr>
              <th className="py-3 px-4">Quote ID</th>
              <th className="py-3 px-4">Deal</th>
              <th className="py-3 px-4">Account</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4">Total Amount</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Assigned To</th>
              <th className="py-3 px-4">Expiry Date</th>
            </tr>
          </thead>

          <tbody>
            {quotesLoading ? (
              <tr>
                <td
                  className="py-4 px-4 text-center text-sm text-gray-500"
                  colSpan={8}
                >
                  Loading quotes...
                </td>
              </tr>
            ) : filteredQuotes.length > 0 ? (
              paginatedQuotes.map((quote) => {
                const expiry = computeExpiryDate(
                  quote.presented_date,
                  quote.validity_days
                );
                return (
                  <tr
                    key={quote.id}
                    className="hover:bg-gray-50 text-sm cursor-pointer transition"
                    onClick={() => handleQuoteClick(quote)}
                  >
                    <td className="py-3 px-4 align-top">
                      <div className="font-medium text-blue-600 hover:underline whitespace-nowrap">
                        {formatQuoteId(quote.quote_id) || "--"}
                      </div>
                    </td>

                    <td className="py-3 px-4 align-top">
                      <div className="break-words">
                        {resolveDealLabel(quote) || "--"}
                      </div>
                    </td>

                    <td className="py-3 px-4 align-top">
                      <div className="text-sm text-gray-700 break-words">
                        {resolveAccountLabel(quote) || "--"}
                      </div>
                    </td>

                    <td className="py-3 px-4 align-top">
                      <div className="break-words">
                        {resolveContactLabel(quote) || "--"}
                      </div>
                    </td>

                    <td className="py-3 px-4 align-top">
                      <div className="text-gray-700">
                        {quote.total_amount
                          ? `₱${Number(quote.total_amount).toLocaleString()}`
                          : "--"}
                      </div>
                    </td>

                    <td className="py-3 px-4 align-top">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                          quote.status
                        )}`}
                      >
                        {formatStatusLabel(quote.status)}
                      </span>
                    </td>

                    <td className="py-3 px-4 align-top">
                      <div>
                        {quote.assigned_user
                          ? `${quote.assigned_user.first_name} ${quote.assigned_user.last_name}`
                          : "Unassigned"}
                      </div>
                    </td>

                    <td className="py-3 px-4 align-top">
                      <div className="text-gray-500 text-xs">
                        {formatDate(expiry) || "--"}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  className="py-4 px-4 text-center text-sm text-gray-500"
                  colSpan={8}
                >
                  No quotes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PaginationControls
        className="mt-4"
        totalItems={filteredQuotes.length}
        pageSize={itemsPerPage}
        currentPage={currentPage}
        onPrev={handlePrevPage}
        onNext={handleNextPage}
        onPageSizeChange={setItemsPerPage}
        label="quotes"
      />
    </div>
  );

  const formModal = showModal ? (
    <div
      id="modalBackdrop"
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
    >
      <div
        className="bg-white w-full max-w-full sm:max-w-3xl rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 relative border border-gray-200 overflow-y-auto max-h-[90vh] hide-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <button
         onClick={() => {
                closeModal();          // close the modal
                setIsSubmitted(false); // reset validation errors
              }}
          className="absolute top-4 right-4 text-gray-500 hover:text-black transition disabled:opacity-60"
          disabled={isSubmitting || confirmProcessing}
        >
          <FiX size={22} />
        </button>

        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center justify-center">
          {isEditing ? "Edit Quote" : "Add New Quote"}
        </h2>

        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
          onSubmit={handleSubmit}
        >
          <SearchableSelectField
            label="Deal"
            name="deal_id"
            value={formData.deal_id}
            onChange={(newId) =>
              {const { accountId, contactId } = deriveAccountAndContactFromDealId(newId);
      setFormData((prev) => ({
        ...prev,
        deal_id: newId,
        account_id: accountId,
        contact_id: contactId,
      }));
      return;}
            }
            items={Array.isArray(deals) ? deals : []}
            getLabel={(item) => {
              const name = `${formatDealId(item?.deal_id ?? "")} ${item?.name ?? ""}`.trim();
              return name;
            }}
            placeholder="Search deal..."
            required={true}     
          isSubmitted={isSubmitted}  
            disabled={isSubmitting || deals.length === 0}
            className="md:col-span-2"
          />

          <ReadOnlyField
            label="Account"
            value={
              getAccountNameById(formData.account_id) ||
              (formData.account_id ? `Account #${formData.account_id}` : "")
            }
            disabled
          />

          <ReadOnlyField
            label="Contact"
            value={
              getContactNameById(formData.contact_id) ||
              (formData.contact_id ? `Contact #${formData.contact_id}` : "")
            }
            disabled
          />

          <InputField
            label="Total Amount"
            name="total_amount"
            type="number"
            value={formData.total_amount}
            onChange={handleInputChange}
            placeholder="0.00"
            disabled={isSubmitting}
          />

          <InputField
            label="Presented Date"
            name="presented_date"
            type="date"
            value={formData.presented_date}
            onChange={handleInputChange}
            disabled={isSubmitting}
          />

          <InputField
            label="Validity Days"
            name="validity_days"
            type="number"
            value={formData.validity_days}
            onChange={handleInputChange}
            placeholder="30"
            disabled={isSubmitting}
          />

          <SearchableSelectField
            label="Assigned To"
            value={formData.assigned_to || ""}
            onChange={(newId) =>
              setFormData((prev) => ({ ...prev, assigned_to: newId }))
            }
            items={Array.isArray(users) ? users : []}
            getLabel={(item) => {
              const name = `${item?.first_name ?? ""} ${item?.last_name ?? ""}`.trim();
              if (!name) return item?.email || "";
              return item?.role ? `${name} (${item.role})` : name;
            }}
            placeholder="Search assignee..."
            required={true}           
            isSubmitted={isSubmitted} 
            disabled={isSubmitting}
          />

          <SelectField
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            options={STATUS_OPTIONS}
            required
            disabled={isSubmitting}
            className="md:col-span-2"
          />

          <TextareaField
            label="Notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Additional details..."
            rows={3}
            disabled={isSubmitting}
            className="md:col-span-2"
          />

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 md:col-span-2 mt-4">
            <button
              type="button"
                onClick={() => {
                closeModal();          
                setIsSubmitted(false); 
              }}
              className="w-full sm:w-auto px-4 py-2 text-white bg-red-400 border border-red-300 rounded hover:bg-red-500 transition disabled:opacity-70"
              disabled={isSubmitting || confirmProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 text-white border border-tertiary bg-tertiary rounded hover:bg-secondary transition disabled:opacity-70"
              disabled={isSubmitting || confirmProcessing}
            >
              {isSubmitting
                ? "Saving..."
                : isEditing
                ? "Update Quote"
                : "Save Quote"}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  const confirmationModal = confirmModalData ? (
    <ConfirmationModal
      open
      title={confirmModalData.title}
      message={confirmModalData.message}
      confirmLabel={confirmModalData.confirmLabel}
      cancelLabel={confirmModalData.cancelLabel}
      variant={confirmModalData.variant}
      onConfirm={handleConfirmAction}
      onCancel={handleCancelConfirm}
      loading={confirmProcessing}
    />
  ) : null;

  return (
    <>
      {selectedQuote ? detailView : listView}
      {formModal}
      {confirmationModal}
    </>
  );
}

// ---------- UI Components ----------
function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  disabled = false,
  className = "",
   isSubmitted = false, 
}) {
  const hasError = isSubmitted && !value?.trim();

  return (
    <div className={className}>
      <label className="block text-gray-700 font-medium mb-1 text-sm">
         {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
         className={`w-full rounded-md px-2 py-1.5 text-sm outline-none border focus:ring-2
          ${hasError
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:ring-blue-400"
          }
          ${className}
        `}/>  
    </div>
  );
}

function ReadOnlyField({ label, value, className = "", disabled = true }) {
  return (
    <div className={className}>
      <label className="block text-gray-700 font-medium mb-1 text-sm">
        {label}
      </label>
      <input
        type="text"
        value={value ?? ""}
        disabled={disabled}
        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm outline-none disabled:bg-gray-100"
      />
    </div>
  );
}

function SearchableSelectField({
  label,
  items = [],
  value = "",
  onChange,
  getLabel,
  placeholder = "Search...",
  disabled = false,
  className = "",
  required = false,
  isSubmitted = false,
}) {
    const hasError = isSubmitted && required && !value;

  return (
    <div className={className}>
      <label className="block text-gray-700 font-medium mb-1 text-sm">
         {label} {required && <span className="text-red-500">*</span>}
      </label>
      <SearchableSelect
        items={items}
        value={value ?? ""}
        onChange={onChange}
        getLabel={getLabel}
        placeholder={placeholder}
        disabled={disabled}
        hasError={hasError}
      />
    </div>
  );
}

function SearchableSelect({
  items = [],
  value = "",
  onChange,
  getLabel,
  placeholder = "Search...",
  disabled = false,
  maxRender = 200,
  hasError = false, 
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrapRef = useRef(null);

  const selectedItem = items.find((it) => String(it.id) === String(value));
  const selectedLabel = selectedItem ? getLabel(selectedItem) : "";

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const base = query
      ? items.filter((it) =>
          (getLabel(it) || "").toLowerCase().includes(query)
        )
      : items;

    return base.slice(0, maxRender);
  }, [items, q, getLabel, maxRender]);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  return (
    <div ref={wrapRef} className="relative w-full">
      <input
        disabled={disabled}
        value={open ? q : selectedLabel}
        placeholder={placeholder}
        onFocus={() => !disabled && setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value);
          if (!open) setOpen(true);
        }}
         className={`w-full border rounded-md px-2 py-1.5 text-sm outline-none focus:ring-2
          ${hasError
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:ring-blue-400"
          }`}/>  

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
          <div className="max-h-56 overflow-y-auto hide-scrollbar">
            {filtered.length > 0 ? (
              filtered.map((it) => {
                const id = String(it.id);
                const label = getLabel(it);
                const active = String(value) === id;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      onChange(id);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                      active ? "bg-blue-50" : ""
                    }`}
                  >
                    {label || "--"}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">No results</div>
            )}
          </div>

          {items.length > maxRender && (
            <div className="px-3 py-2 text-[11px] text-gray-400 border-t">
              Showing first {maxRender} results — keep typing to narrow.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  className = "",
}) {
  const stringValue =
    value !== null && value !== undefined ? String(value) : "";
  const hasValidValue = options.some(
    (opt) => String(opt.value) === stringValue
  );
  const displayValue = hasValidValue ? stringValue : "";

  return (
    <div className={className}>
      <label className="block text-gray-700 font-medium mb-1 text-sm">
        {label}
      </label>
      <select
        name={name}
        value={displayValue}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100"
      >
        {options.map((option) => (
          <option
            key={option.value ?? option.label}
            value={String(option.value ?? "")}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextareaField({
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled = false,
  className = "",
}) {
  return (
    <div className={className}>
      <label className="block text-gray-700 font-medium mb-1 text-sm">
        {label}
      </label>
      <textarea
        name={name}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100 resize-none"
      />
    </div>
  );
}

function ConfirmationModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  variant = "primary",
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const confirmClasses =
    variant === "danger"
      ? "bg-red-500 hover:bg-red-600 border border-red-400"
      : "bg-tertiary hover:bg-secondary border border-tertiary";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">
          {message}
        </p>

        <div className="mt-6 flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-2 sm:space-y-0">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition disabled:opacity-70"
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`w-full sm:w-auto px-4 py-2 rounded-md text-white transition disabled:opacity-70 ${confirmClasses}`}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
