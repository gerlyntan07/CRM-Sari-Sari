import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiSearch,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiFileText,
  FiX,
} from "react-icons/fi";
import { HiArrowLeft } from "react-icons/hi";
import { toast } from "react-toastify";
import PaginationControls from "../components/PaginationControls.jsx";

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

const normalizeStatus = (status) => (status ? status.toString() : "");

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

  // Mock data for demonstration
  const [mockQuotes, setMockQuotes] = useState([
    {
      id: 1,
      quote_id: "Q-2025-001",
      deal_name: "Website Revamp Project",
      account: { id: 1, name: "Innovate Co." },
      contact: { id: 1, first_name: "John", last_name: "Doe" },
      total_amount: 125000,
      presented_date: "2025-10-01",
      validity_date: "2025-10-15",
      expiry_date: "2025-10-10",
      status: "Presented",
      assigned_to: { id: 1, first_name: "Joshua", last_name: "Vergara" },
      created_by: { id: 2, first_name: "Jane", last_name: "Doe" },
      notes:
        "Client requested initial pricing breakdown and additional feature estimation. Follow-up scheduled next week.",
      created_at: "2025-09-15T10:00:00",
      updated_at: "2025-10-01T14:30:00",
    },
    {
      id: 2,
      quote_id: "Q-2025-002",
      deal_name: "E-commerce Integration",
      account: { id: 2, name: "Tech Solutions Inc." },
      contact: { id: 2, first_name: "Maria", last_name: "Santos" },
      total_amount: 250000,
      presented_date: "2025-09-20",
      validity_date: "2025-10-05",
      expiry_date: "2025-10-05",
      status: "Accepted",
      assigned_to: { id: 1, first_name: "Joshua", last_name: "Vergara" },
      created_by: { id: 2, first_name: "Jane", last_name: "Doe" },
      notes: "Client approved the proposal. Proceeding with contract signing.",
      created_at: "2025-09-10T10:00:00",
      updated_at: "2025-09-25T14:30:00",
    },
    {
      id: 3,
      quote_id: "Q-2025-003",
      deal_name: "Mobile App Development",
      account: { id: 3, name: "Startup Hub" },
      contact: { id: 3, first_name: "Pedro", last_name: "Cruz" },
      total_amount: 500000,
      presented_date: "2025-08-15",
      validity_date: "2025-09-01",
      expiry_date: "2025-09-01",
      status: "Rejected",
      assigned_to: { id: 3, first_name: "Maria", last_name: "Garcia" },
      created_by: { id: 2, first_name: "Jane", last_name: "Doe" },
      notes: "Client declined due to budget constraints.",
      created_at: "2025-08-01T10:00:00",
      updated_at: "2025-09-02T14:30:00",
    },
  ]);

  const fetchQuotes = useCallback(
    async (preserveSelectedId = null) => {
      setQuotesLoading(true);
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      const sortedData = [...mockQuotes].sort((a, b) => {
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
      setQuotesLoading(false);
    },
    [mockQuotes]
  );

  const fetchAccounts = useCallback(async () => {
    // Mock accounts data
    const mockAccounts = [
      { id: 1, name: "Innovate Co." },
      { id: 2, name: "Tech Solutions Inc." },
      { id: 3, name: "Startup Hub" },
    ];
    setAccounts(mockAccounts);
  }, []);

  const fetchContacts = useCallback(async () => {
    // Mock contacts data
    const mockContacts = [
      { id: 1, first_name: "John", last_name: "Doe" },
      { id: 2, first_name: "Maria", last_name: "Santos" },
      { id: 3, first_name: "Pedro", last_name: "Cruz" },
    ];
    setContacts(mockContacts);
  }, []);

  const fetchUsers = useCallback(async () => {
    // Mock users data
    const mockUsers = [
      { id: 1, first_name: "Joshua", last_name: "Vergara", role: "Sales Manager" },
      { id: 2, first_name: "Jane", last_name: "Doe", role: "Sales Rep" },
      { id: 3, first_name: "Maria", last_name: "Garcia", role: "Sales Rep" },
    ];
    setUsers(mockUsers);
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
        q.assigned_to?.first_name,
        q.assigned_to?.last_name,
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

  const handleQuoteClick = (quote) => setSelectedQuote(quote);

  const handleBackToList = () => setSelectedQuote(null);

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

  const handleEditClick = (quote) => {
    if (!quote) return;
    setFormData({
      deal_name: quote.deal_name || "",
      created_by_id: quote.created_by?.id ? String(quote.created_by.id) : "",
      contact_id: quote.contact?.id ? String(quote.contact.id) : "",
      amount: quote.amount?.toString() || "",
      total_amount: quote.total_amount?.toString() || "",
      presented_date: quote.presented_date || "",
      validity_date: quote.validity_date || "",
      status: normalizeStatus(quote.status) || "Draft",
      assigned_to: quote.assigned_to?.id ? String(quote.assigned_to.id) : "",
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

    const payload = {
      deal_name: formData.deal_name.trim(),
      created_by_id: Number(formData.created_by_id),
      contact_id: formData.contact_id ? Number(formData.contact_id) : null,
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

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      if (type === "create") {
        setIsSubmitting(true);
        // Find created by, contact data
        const createdBy = users.find((u) => u.id === payload.created_by_id);
        const contact = payload.contact_id
          ? contacts.find((c) => c.id === payload.contact_id)
          : null;
        const assignedUser = payload.assigned_to
          ? users.find((u) => u.id === payload.assigned_to)
          : null;

        // Create new quote
        const newQuote = {
          id: Math.max(...mockQuotes.map((q) => q.id), 0) + 1,
          quote_id: `Q-2025-${String(Math.max(...mockQuotes.map((q) => q.id), 0) + 1).padStart(3, "0")}`,
          deal_name: payload.deal_name,
          account: mockQuotes[0]?.account || { id: 1, name: "Unknown" }, // Keep account for backward compatibility
          contact: contact || null,
          amount: payload.amount,
          total_amount: payload.total_amount,
          presented_date: payload.presented_date,
          validity_date: payload.validity_date,
          status: payload.status,
          assigned_to: assignedUser || null,
          created_by: createdBy || users[0],
          notes: payload.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setMockQuotes((prev) => [...prev, newQuote]);
        toast.success(`Quote "${name}" created successfully.`);

        const preserveId = selectedQuote?.id || null;
        closeModal();
        await fetchQuotes(preserveId);
      } else if (type === "update") {
        if (!targetId) {
          throw new Error("Missing quote identifier for update.");
        }
        setIsSubmitting(true);

        // Find created by, contact data
        const createdBy = users.find((u) => u.id === payload.created_by_id);
        const contact = payload.contact_id
          ? contacts.find((c) => c.id === payload.contact_id)
          : null;
        const assignedUser = payload.assigned_to
          ? users.find((u) => u.id === payload.assigned_to)
          : null;

        // Update quote
        setMockQuotes((prev) =>
          prev.map((q) =>
            q.id === targetId
              ? {
                  ...q,
                  deal_name: payload.deal_name,
                  contact: contact || null,
                  amount: payload.amount,
                  total_amount: payload.total_amount,
                  presented_date: payload.presented_date,
                  validity_date: payload.validity_date,
                  status: payload.status,
                  assigned_to: assignedUser || null,
                  created_by: createdBy || q.created_by,
                  notes: payload.notes,
                  updated_at: new Date().toISOString(),
                }
              : q
          )
        );

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

        // Delete quote
        setMockQuotes((prev) => prev.filter((q) => q.id !== targetId));

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
    <div className="p-4 sm:p-6 lg:p-8 font-inter">
      <button
        onClick={handleBackToList}
        className="inline-flex items-center text-sm sm:text-base text-gray-500 hover:text-gray-700 transition mb-4 sm:mb-6 cursor-pointer"
      >
        <HiArrowLeft className="mr-1 w-4 h-4 sm:w-5 sm:h-5" /> Back
      </button>

      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm space-y-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
                {selectedQuote.deal_name || "Untitled Quote"}
              </h1>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                  selectedQuote.status
                )}`}
              >
                {formatStatusLabel(selectedQuote.status)}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {selectedQuote.quote_id || "No quote ID"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
            <button
              className="inline-flex items-center justify-center w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-70"
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
              className="inline-flex items-center justify-center w-full sm:w-auto bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 disabled:opacity-70"
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

        <div className="overflow-x-auto">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
            Quote Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
            <DetailRow
              label="Quote ID"
              value={selectedQuote.quote_id || "--"}
            />
            <DetailRow
              label="Deal Name"
              value={selectedQuote.deal_name || "--"}
            />
            <DetailRow
              label="Account"
              value={selectedQuote.account?.name || "--"}
            />
            <DetailRow
              label="Contact"
              value={
                selectedQuote.contact
                  ? `${selectedQuote.contact.first_name} ${selectedQuote.contact.last_name}`
                  : "--"
              }
            />
            <DetailRow
              label="Total Amount"
              value={
                selectedQuote.total_amount
                  ? `₱${Number(selectedQuote.total_amount).toLocaleString()}`
                  : "--"
              }
            />
            <DetailRow
              label="Presented Date"
              value={formatDate(selectedQuote.presented_date) || "--"}
            />
            <DetailRow
              label="Validity Date"
              value={formatDate(selectedQuote.validity_date) || "--"}
            />
            <DetailRow
              label="Created By"
              value={
                selectedQuote.created_by
                  ? `${selectedQuote.created_by.first_name} ${selectedQuote.created_by.last_name}`
                  : "--"
              }
            />
            <DetailRow
              label="Created At"
              value={formattedDateTime(selectedQuote.created_at) || "--"}
            />
            <DetailRow
              label="Last Updated"
              value={formattedDateTime(selectedQuote.updated_at) || "--"}
            />
            <DetailRow
              label="Status"
              value={formatStatusLabel(selectedQuote.status)}
            />
            <DetailRow
              label="Assigned To"
              value={
                selectedQuote.assigned_to
                  ? `${selectedQuote.assigned_to.first_name} ${selectedQuote.assigned_to.last_name}`
                  : "Unassigned"
              }
            />
          </div>

          <div className="mt-6 border-t border-gray-200 pt-4">
            <h3 className="text-md sm:text-lg font-semibold text-gray-800 mb-2">
              Notes
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {selectedQuote.notes
                ? selectedQuote.notes
                : "No additional notes were provided for this quote."}
            </p>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  const listView = (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <h2 className="flex items-center text-xl sm:text-2xl font-semibold text-gray-800">
          <FiFileText className="mr-2 text-blue-600" /> Quotes Management
        </h2>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center bg-black text-white px-3 sm:px-4 py-2 rounded-md hover:bg-gray-800 text-sm sm:text-base"
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
                        {quote.assigned_to
                          ? `${quote.assigned_to.first_name} ${quote.assigned_to.last_name}`
                          : "Unassigned"}
                      </div>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <div className="text-gray-500 text-xs">
                        {formatDate(quote.expiry_date) || "--"}
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
            label="Assign To"
            name="assigned_to"
            value={formData.assigned_to}
            onChange={handleInputChange}
            options={[
              { value: "", label: "Unassigned" },
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
  return (
    <div className={className}>
      <label className="block text-gray-700 font-medium mb-1 text-sm">
        {label}
      </label>
      <select
        name={name}
        value={value ?? ""}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100"
      >
        {options.map((option) => (
          <option key={option.value ?? option.label} value={option.value}>
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
