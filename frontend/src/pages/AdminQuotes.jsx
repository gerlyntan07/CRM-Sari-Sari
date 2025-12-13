import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiSearch,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiFileText,
  FiX,
  FiPhone,
  FiMail,
  FiCalendar,
  FiCheckSquare
} from "react-icons/fi";
import { HiX } from "react-icons/hi";
import { toast } from "react-toastify";
import api from "../api.js";
import PaginationControls from "../components/PaginationControls.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { useNavigate } from "react-router-dom";


const ITEMS_PER_PAGE = 10;

const STATUS_OPTIONS = [
  { value: "Draft", label: "Draft" },
  { value: "Presented", label: "Presented" },
  { value: "Accepted", label: "Accepted" },
  { value: "Rejected", label: "Rejected" },
];

const INITIAL_FORM_STATE = {
  deal_name: "",
  created_by_id: "",
  contact_id: "",
  amount: "",
  total_amount: "",
  presented_date: "",
  validity_date: "",
  status: "Draft",
  assigned_to: "",
  notes: "",
};

const normalizeStatus = (status) => {
  if (!status) return "Draft";
  const statusStr = status.toString().trim();
  // Map to exact values in STATUS_OPTIONS
  const statusMap = {
    "draft": "Draft",
    "presented": "Presented",
    "accepted": "Accepted",
    "rejected": "Rejected",
  };
  return statusMap[statusStr.toLowerCase()] || statusStr;
};

const formatStatusLabel = (status) => {
  if (!status) return "--";
  return status
    .toString()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
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

export default function AdminQuotes() {
       const navigate = useNavigate();
  
  useEffect(() => {
    document.title = "Quotes | Sari-Sari CRM";
  }, []);

  const [quotes, setQuotes] = useState([]);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);
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
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedStatus, setSelectedStatus] = useState("Draft");

  const fetchQuotes = useCallback(
    async (preserveSelectedId = null) => {
      setQuotesLoading(true);
      try {
        const res = await api.get(`/quotes/admin/fetch-all`);
        const data = Array.isArray(res.data) ? res.data : [];
        const sortedData = [...data].sort((a, b) => {
          const aDate = a?.created_at || a?.updated_at || 0;
          const bDate = b?.created_at || b?.updated_at || 0;
          return new Date(bDate) - new Date(aDate);
        });
        setQuotes(sortedData);

        if (preserveSelectedId) {
          const updatedSelection = sortedData.find(
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
    },
    []
  );

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await api.get(`/accounts/admin/fetch-all`);
      setAccounts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        toast.warn("Unable to load accounts (permission denied).");
      }
    }
  }, []);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await api.get(`/contacts/admin/fetch-all`);
      setContacts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        toast.warn("Unable to load contacts (permission denied).");
      }
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get(`/users/all`);
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        toast.warn("Unable to load users for assignment (permission denied).");
      }
    }
  }, []);

  useEffect(() => {
    fetchQuotes();
    fetchAccounts();
    fetchContacts();
    fetchUsers();
  }, [fetchQuotes, fetchAccounts, fetchContacts, fetchUsers]);

  const filteredQuotes = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const normalizedFilter = statusFilter.trim();

    return quotes.filter((q) => {
      const searchFields = [
        q.quote_id,
        q.deal_name,
        q.account?.name,
        q.contact?.first_name,
        q.contact?.last_name,
        q.total_amount?.toString(),
        q.assigned_user?.first_name,
        q.assigned_user?.last_name,
        q.creator?.first_name,
        q.creator?.last_name,
        q.status,
        q.notes,
        formattedDateTime(q.created_at),
        formattedDateTime(q.updated_at),
      ];

      const matchesSearch =
        normalizedQuery === "" ||
        searchFields.some((field) => {
          if (field === null || field === undefined) return false;
          return field.toString().toLowerCase().includes(normalizedQuery);
        });

      const matchesStatus =
        normalizedFilter === "Filter by Status" ||
        normalizeStatus(q.status) === normalizedFilter;

      return matchesSearch && matchesStatus;
    });
  }, [quotes, searchQuery, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredQuotes.length / ITEMS_PER_PAGE) || 1
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    setCurrentPage((prev) => {
      const maxPage = Math.max(
        1,
        Math.ceil(filteredQuotes.length / ITEMS_PER_PAGE) || 1
      );
      return prev > maxPage ? maxPage : prev;
    });
  }, [filteredQuotes.length]);

  const paginatedQuotes = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredQuotes.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredQuotes, currentPage]);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleQuoteClick = (quote) => {
    setSelectedQuote(quote);
    setActiveTab("Overview");
    setSelectedStatus(quote?.status || "Draft");
  };

  const handleBackToList = () => {
    setSelectedQuote(null);
    setActiveTab("Overview");
  };

  const handleQuoteModalBackdropClick = (e) => {
    if (e.target.id === "quoteModalBackdrop" && !confirmProcessing) {
      handleBackToList();
    }
  };

  const closeModal = useCallback(() => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentQuoteId(null);
    setFormData(INITIAL_FORM_STATE);
    setIsSubmitting(false);
  }, []);

  const handleBackdropClick = (e) => {
    if (
      e.target.id === "modalBackdrop" &&
      !isSubmitting &&
      !confirmProcessing
    ) {
      closeModal();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOpenAddModal = () => {
    setFormData(INITIAL_FORM_STATE);
    setIsEditing(false);
    setCurrentQuoteId(null);
    setShowModal(true);
  };

  const formatDateForInput = (date) => {
    if (!date) return "";
    // If date is already in YYYY-MM-DD format, return it
    if (typeof date === "string" && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return date;
    }
    // Otherwise, convert to YYYY-MM-DD format
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return "";
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch (e) {
      return "";
    }
  };

  const handleEditClick = (quote) => {
    if (!quote) return;
    // Close the quote details modal
    setSelectedQuote(null);
    
    // Get created_by_id - use creator relationship if available, otherwise use created_by field
    let createdById = "";
    if (quote.creator?.id) {
      createdById = String(quote.creator.id);
    } else if (quote.created_by) {
      createdById = String(quote.created_by);
    }
    
    // Get assigned_to - use assigned_user relationship if available, otherwise use assigned_to field
    let assignedToId = "";
    if (quote.assigned_user?.id) {
      assignedToId = String(quote.assigned_user.id);
    } else if (quote.assigned_to) {
      assignedToId = String(quote.assigned_to);
    }
    
    const newFormData = {
      deal_name: quote.deal_name || "",
      created_by_id: createdById,
      contact_id: quote.contact?.id ? String(quote.contact.id) : "",
      amount: quote.amount?.toString() || "",
      total_amount: quote.total_amount?.toString() || "",
      presented_date: formatDateForInput(quote.presented_date),
      validity_date: formatDateForInput(quote.validity_date),
      status: normalizeStatus(quote.status) || "Draft",
      assigned_to: assignedToId,
      notes: quote.notes || "",
    };
    
    // Debug logging
    console.log("Edit Quote - Quote data:", quote);
    console.log("Edit Quote - Form data:", newFormData);
    console.log("Edit Quote - Available users:", users.map(u => ({ id: String(u.id), name: `${u.first_name} ${u.last_name}` })));
    
    setFormData(newFormData);
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
      action: {
        type: "delete",
        targetId: quote.id,
        name: quoteName,
      },
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.deal_name?.trim()) {
      toast.error("Deal name is required.");
      return;
    }

    if (!formData.created_by_id) {
      toast.error("Created by is required.");
      return;
    }

    if (!formData.total_amount || Number(formData.total_amount) <= 0) {
      toast.error("Total amount must be greater than 0.");
      return;
    }

    // Get account_id from contact if contact is selected
    const selectedContact = contacts.find(c => c.id === Number(formData.contact_id));
    const account_id = selectedContact?.account_id || null;

    const payload = {
      deal_name: formData.deal_name.trim(),
      created_by_id: Number(formData.created_by_id),
      contact_id: formData.contact_id ? Number(formData.contact_id) : null,
      account_id: account_id,
      amount: formData.amount ? Number(formData.amount) : null,
      total_amount: Number(formData.total_amount),
      presented_date: formData.presented_date || null,
      validity_date: formData.validity_date || null,
      status: formData.status || "Draft",
      assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
      notes: formData.notes?.trim() || null,
    };

    const actionType = isEditing && currentQuoteId ? "update" : "create";
    const quoteName = formData.deal_name.trim();

    setConfirmModalData({
      title: actionType === "create" ? "Confirm New Quote" : "Confirm Update",
      message:
        actionType === "create" ? (
          <span>
            Are you sure you want to create a quote for{" "}
            <span className="font-semibold">{quoteName}</span>?
          </span>
        ) : (
          <span>
            Save changes to <span className="font-semibold">{quoteName}</span>?
          </span>
        ),
      confirmLabel: actionType === "create" ? "Create Quote" : "Update Quote",
      cancelLabel: "Cancel",
      variant: "primary",
      action: {
        type: actionType,
        payload,
        targetId: currentQuoteId || null,
        name: quoteName,
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
        const createPayload = {
          deal_name: payload.deal_name,
          contact_id: payload.contact_id || null,
          account_id: payload.account_id || null,
          amount: payload.amount || null,
          total_amount: payload.total_amount,
          presented_date: payload.presented_date || null,
          validity_date: payload.validity_date || null,
          status: payload.status || "Draft",
          assigned_to: payload.assigned_to || null,
          created_by_id: payload.created_by_id,
          notes: payload.notes || null,
        };

        await api.post(`/quotes/admin`, createPayload);
        toast.success(`Quote "${name}" created successfully.`);

        const preserveId = selectedQuote?.id || null;
        closeModal();
        await fetchQuotes(preserveId);
      } else if (type === "update") {
        if (!targetId) {
          throw new Error("Missing quote identifier for update.");
        }
        setIsSubmitting(true);

        // Get account_id from contact if contact is selected
        const selectedContact = contacts.find(c => c.id === payload.contact_id);
        const account_id = selectedContact?.account_id || payload.account_id || null;

        const updatePayload = {
          deal_name: payload.deal_name,
          contact_id: payload.contact_id || null,
          account_id: account_id,
          amount: payload.amount || null,
          total_amount: payload.total_amount,
          presented_date: payload.presented_date || null,
          validity_date: payload.validity_date || null,
          status: payload.status || "Draft",
          assigned_to: payload.assigned_to || null,
          notes: payload.notes || null,
        };

        await api.put(`/quotes/admin/${targetId}`, updatePayload);
        toast.success(`Quote "${name}" updated successfully.`);

        const preserveId =
          selectedQuote?.id && selectedQuote.id === targetId
            ? targetId
            : selectedQuote?.id || null;
        closeModal();
        await fetchQuotes(preserveId);
        if (selectedQuote?.id === targetId) {
          setSelectedQuote(null);
        }
      } else if (type === "delete") {
        if (!targetId) {
          throw new Error("Missing quote identifier for deletion.");
        }
        const currentSelectedId = selectedQuote?.id;
        setDeletingId(targetId);

        await api.delete(`/quotes/admin/${targetId}`);
        toast.success(`Quote "${name}" deleted successfully.`);

        const preserveId =
          currentSelectedId && currentSelectedId !== targetId
            ? currentSelectedId
            : null;
        await fetchQuotes(preserveId);

        if (currentSelectedId === targetId) {
          setSelectedQuote(null);
        }
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

      if (type === "create" || type === "update") {
        setIsSubmitting(false);
      }

      if (type === "delete") {
        setDeletingId(null);
      }
    } finally {
      if (type === "create" || type === "update") {
        setIsSubmitting(false);
      }
      if (type === "delete") {
        setDeletingId(null);
      }
      setConfirmProcessing(false);
      setConfirmModalData(null);
    }
  };

  const handleCancelConfirm = () => {
    if (confirmProcessing) return;
    setConfirmModalData(null);
  };

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
          {/* 🔵 ONLY TOP */}
      <div className="w-full flex flex-col items-center justify-center rounded-t-xl">
  <div className="bg-tertiary w-full flex items-center justify-between p-3 lg:p-3 rounded-t-xl">
    <h1 className="lg:text-3xl text-xl text-white font-semibold text-center w-full">
      Quotes
    </h1>

    {/* Close Button */}
    <button
      onClick={handleBackToList}
      className="text-gray-500 hover:text-white transition cursor-pointer"
    >
      <HiX size={25} />
    </button>
  </div>
</div>

        {/* Header */}
        <div className="p-6 lg:p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 mt-3 p-2 sm:gap-4 lg:mx-7">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
              {selectedQuote.deal_name || "Untitled Quote"}
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

        {/* TABS */}
        <div className="p-1 lg:p-4">
        <div className="flex w-full bg-[#6A727D] text-white mt-1 overflow-x-auto mb-6">
          {["Overview", "Notes"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[90px] px-4 py-2.5 text-xs sm:text-sm font-medium text-center transition-all duration-200 border-b-2
        ${activeTab === tab
                  ? "bg-paper-white text-[#6A727D] border-white"
                  : "text-white hover:bg-[#5c636d]"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          <div className="lg:col-span-3">
            {activeTab === "Overview" && (
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8 border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6 text-sm text-gray-700">
                  <div>
                    <p className="font-semibold">Quote ID:</p>
                    <p>{selectedQuote.quote_id || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Deal Name:</p>
                    <p>{selectedQuote.deal_name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Account:</p>
                    <p>{selectedQuote.account?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Contact:</p>
                    <p>
                      {selectedQuote.contact
                        ? `${selectedQuote.contact.first_name} ${selectedQuote.contact.last_name}`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">Total Amount:</p>
                    <p>
                      {selectedQuote.total_amount
                        ? `₱${Number(selectedQuote.total_amount).toLocaleString()}`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">Presented Date:</p>
                    <p>{formatDate(selectedQuote.presented_date) || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Validity Date:</p>
                    <p>{formatDate(selectedQuote.validity_date) || "N/A"}</p>
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
                    <p>{formattedDateTime(selectedQuote.created_at) || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Last Updated:</p>
                    <p>{formattedDateTime(selectedQuote.updated_at) || "N/A"}</p>
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
                     {/* QUICK ACTIONS */}
                     <div className="bg-white border border-gray-100 rounded-lg p-3 sm:p-4 shadow-sm">
                       <h4 className="font-semibold text-gray-800 mb-2 text-sm">
                         Quick Actions
                       </h4>
                   
                       <div className="flex flex-col gap-2 w-full">
                   
                         {/* --- SCHEDULE CALL BUTTON (updated) --- */}
                         <button
                           onClick={() =>
                             navigate("/admin/calls", {
                               state: {
                                 openCallModal: true,      // <-- this triggers your form
                                 initialCallData: {
                                   relatedType1: "Quotes", // <-- your custom default
                                 },
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
                      navigate("/admin/meetings", {
                        state: {
                          openMeetingModal: true,
                          initialMeetingData: {
                            relatedType: "Quotes",
                          },
                        },
                      })
                    }
                  >
                    <FiCalendar className="text-gray-600 w-4 h-4" />
                    Book Meeting
                  </button>

                           <button
                        onClick={() =>
                          navigate("/admin/tasks", {
                            state: {
                              openTaskModal: true,
                              initialTaskData: {
                                relatedTo: "Quotes",
                              },
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

            {/* STATUS */}
            <div className="bg-white border border-gray-100 rounded-lg p-3 sm:p-4 shadow-sm w-full">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">
                Status
              </h4>
              <select
                className="border border-gray-200 rounded-md px-2 sm:px-3 py-1.5 w-full text-sm mb-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={selectedStatus || selectedQuote.status || "Draft"}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                onClick={async () => {
                  try {
                    await api.patch(`/quotes/admin/${selectedQuote.id}/status?status=${encodeURIComponent(selectedStatus)}`);
                    toast.success(`Quote status updated to ${selectedStatus}`);
                    // Close popup and update quotes list in real-time
                    setSelectedQuote(null);
                    await fetchQuotes();
                  } catch (err) {
                    console.error(err);
                    toast.error("Failed to update quote status. Please try again.");
                  }
                }}
                disabled={selectedStatus === selectedQuote.status}
                className={`w-full py-1.5 rounded-md text-sm transition focus:outline-none focus:ring-2 ${
                  selectedStatus === selectedQuote.status
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

        <button
          onClick={handleOpenAddModal}
          className="flex items-center bg-black text-white px-3 sm:px-4 py-2 rounded-md hover:bg-gray-800 text-sm sm:text-base self-end sm:self-auto cursor-pointer"
        >
          <FiPlus className="mr-2" /> Add Quote
        </button>
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
        <table className="w-full min-w-[800px] border border-gray-200 rounded-lg bg-white shadow-sm text-sm">
          <thead className="bg-gray-100 text-left text-gray-600 text-sm tracking-wide font-semibold">
            <tr>
              <th className="py-3 px-4">Quote ID</th>
              <th className="py-3 px-4">Deal Name</th>
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
                return (
                  <tr
                    key={quote.id}
                    className="hover:bg-gray-50 text-sm cursor-pointer transition"
                    onClick={() => handleQuoteClick(quote)}
                  >
                    <td className="py-3 px-4 align-top">
                      <div className="font-medium text-blue-600 hover:underline whitespace-nowrap">
                        {quote.quote_id || "--"}
                      </div>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <div className="break-words">{quote.deal_name || "--"}</div>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <div className="text-sm text-gray-700 break-words">
                        {quote.account?.name || "--"}
                      </div>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <div>
                        {quote.contact
                          ? `${quote.contact.first_name} ${quote.contact.last_name}`
                          : "--"}
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
                        {formatDate(quote.validity_date) || "--"}
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
        pageSize={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPrev={handlePrevPage}
        onNext={handleNextPage}
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
          onClick={closeModal}
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
          <InputField
            label="Deal Name"
            name="deal_name"
            value={formData.deal_name}
            onChange={handleInputChange}
            placeholder="Deal name"
            required
            disabled={isSubmitting}
            className="md:col-span-2"
          />
          <SelectField
            label="Created By"
            name="created_by_id"
            value={formData.created_by_id}
            onChange={handleInputChange}
            options={[
              { value: "", label: "Select user" },
              ...users.map((user) => ({
                value: String(user.id),
                label: `${user.first_name} ${user.last_name} (${user.role})`,
              })),
            ]}
            required
            disabled={isSubmitting || users.length === 0}
          />
          <SelectField
            label="Contact"
            name="contact_id"
            value={formData.contact_id}
            onChange={handleInputChange}
            options={[
              { value: "", label: "Select contact" },
              ...contacts.map((contact) => ({
                value: String(contact.id),
                label: `${contact.first_name} ${contact.last_name}`,
              })),
            ]}
            disabled={isSubmitting || contacts.length === 0}
          />
          <InputField
            label="Amount"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleInputChange}
            placeholder="0.00"
            disabled={isSubmitting}
          />
          <InputField
            label="Total Amount"
            name="total_amount"
            type="number"
            value={formData.total_amount}
            onChange={handleInputChange}
            placeholder="0.00"
            required
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
            label="Validity Date"
            name="validity_date"
            type="date"
            value={formData.validity_date}
            onChange={handleInputChange}
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
          />
          <SelectField
            label="Assigned To"
            name="assigned_to"
            value={formData.assigned_to}
            onChange={handleInputChange}
            options={[
              { value: "", label: "Select assignee" },
              ...users.map((user) => ({
                value: String(user.id),
                label: `${user.first_name} ${user.last_name} (${user.role})`,
              })),
            ]}
            disabled={isSubmitting || users.length === 0}
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
              onClick={closeModal}
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
}) {
  return (
    <div className={className}>
      <label className="block text-gray-700 font-medium mb-1 text-sm">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100"
      />
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
  // Ensure value is a string and matches one of the option values
  const stringValue = value !== null && value !== undefined ? String(value) : "";
  const hasValidValue = options.some(opt => String(opt.value) === stringValue);
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
          <option key={option.value ?? option.label} value={String(option.value ?? "")}>
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

function DetailRow({ label, value }) {
  const hasValue = value !== undefined && value !== null && value !== "";
  return (
    <p>
      <span className="font-semibold">{label}:</span> <br />
      <span className="break-words">{hasValue ? value : "--"}</span>
    </p>
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
