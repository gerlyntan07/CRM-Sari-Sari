import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiSearch,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiPhone,
  FiUsers,
  FiUserCheck,
  FiUserPlus,
  FiUser,
  FiUserX,
  FiX,
  FiCheckSquare,
} from "react-icons/fi";
import { HiX } from "react-icons/hi";
import { FiMail, FiCalendar } from "react-icons/fi";
import api from "../api.js";
import { toast } from "react-toastify";
import PaginationControls from "../components/PaginationControls.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { useNavigate } from "react-router-dom";

const STATUS_OPTIONS = [
  { value: "CUSTOMER", label: "Customer" },
  { value: "PROSPECT", label: "Prospect" },
  { value: "PARTNER", label: "Partner" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "FORMER", label: "Former" },
];

const INITIAL_FORM_STATE = {
  name: "",
  website: "",
  phone_number: "",
  billing_address: "",
  shipping_address: "",
  industry: "",
  status: "PROSPECT",
  territory_id: "",
  assigned_to: "",
};

const normalizeStatus = (status) => (status ? status.toUpperCase() : "");

const formatStatusLabel = (status) => {
  if (!status) return "--";
  return status
    .toString()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getDetailBadgeClass = (status) => {
  switch (normalizeStatus(status)) {
    case "CUSTOMER":
      return "bg-green-600 text-white";
    case "PROSPECT":
      return "bg-purple-600 text-white";
    case "PARTNER":
      return "bg-pink-600 text-white";
    case "ACTIVE":
      return "bg-blue-600 text-white";
    case "INACTIVE":
      return "bg-gray-600 text-white";
    case "FORMER":
      return "bg-orange-600 text-white";
    default:
      return "bg-gray-500 text-white";
  }
};

const getTableBadgeClass = (status) => {
  switch (normalizeStatus(status)) {
    case "CUSTOMER":
      return "bg-green-100 text-green-700";
    case "PROSPECT":
      return "bg-purple-100 text-purple-700";
    case "PARTNER":
      return "bg-pink-100 text-pink-700";
    case "ACTIVE":
      return "bg-blue-100 text-blue-700";
    case "INACTIVE":
      return "bg-gray-200 text-gray-700";
    case "FORMER":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const ITEMS_PER_PAGE = 10;

export default function AdminAccounts() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Accounts | Sari-Sari CRM";
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [currentAccountId, setCurrentAccountId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [territories, setTerritories] = useState([]);
  const [stageFilter, setStageFilter] = useState("Filter by Status");
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmModalData, setConfirmModalData] = useState(null);
  const [confirmProcessing, setConfirmProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchAccounts = useCallback(
    async (preserveSelectedId = null) => {
      setAccountsLoading(true);
      try {
        const res = await api.get(`/accounts/admin/fetch-all`);
        const data = Array.isArray(res.data) ? res.data : [];
        const sortedData = [...data].sort((a, b) => {
          const aDate = a?.created_at || a?.updated_at || 0;
          const bDate = b?.created_at || b?.updated_at || 0;
          return new Date(bDate) - new Date(aDate);
        });
        setAccounts(sortedData);
        console.log("Fetch from backend: ", res.data);

        if (preserveSelectedId) {
          const updatedSelection = sortedData.find(
            (acc) => acc.id === preserveSelectedId
          );
          setSelectedAccount(updatedSelection || null);
        }
      } catch (err) {
        console.error(err);
        setAccounts([]);
        if (err.response?.status === 403) {
          toast.error(
            "Permission denied. Only CEO, Admin, or Group Manager can access this page."
          );
        } else {
          toast.error("Failed to fetch accounts. Please try again later.");
        }
      } finally {
        setAccountsLoading(false);
      }
    },
    [setSelectedAccount]
  );

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

  const fetchTerritories = useCallback(async () => {
    try {
      const res = await api.get(`/territories/fetch`);
      setTerritories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        toast.warn("Unable to load territories (permission denied).");
      }
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
    fetchUsers();
    fetchTerritories();
  }, [fetchAccounts, fetchUsers, fetchTerritories]);

  // Sync selectedStatus with selectedAccount status
  useEffect(() => {
    if (selectedAccount) {
      setSelectedStatus(normalizeStatus(selectedAccount.status) || "PROSPECT");
    }
  }, [selectedAccount]);

  const total = accounts.length;
  const customers = useMemo(
    () =>
      accounts.filter((acc) => acc.status?.toLowerCase() === "customer").length,
    [accounts]
  );
  const prospects = useMemo(
    () =>
      accounts.filter((acc) => acc.status?.toLowerCase() === "prospect").length,
    [accounts]
  );
  const partners = useMemo(
    () =>
      accounts.filter((acc) => acc.status?.toLowerCase() === "partner").length,
    [accounts]
  );
  const active = useMemo(
    () =>
      accounts.filter((acc) => acc.status?.toLowerCase() === "active").length,
    [accounts]
  );
  const inactive = useMemo(
    () =>
      accounts.filter((acc) => acc.status?.toLowerCase() === "inactive").length,
    [accounts]
  );
  const former = useMemo(
    () =>
      accounts.filter((acc) => acc.status?.toLowerCase() === "former").length,
    [accounts]
  );

  const metricCards = useMemo(
    () => [
      {
        title: "Total",
        value: total,
        icon: FiUsers,
        color: "text-slate-600",
        bgColor: "bg-slate-100",
      },
      {
        title: "Customers",
        value: customers,
        icon: FiUserCheck,
        color: "text-green-600",
        bgColor: "bg-green-100",
      },
      {
        title: "Prospects",
        value: prospects,
        icon: FiUserPlus,
        color: "text-purple-600",
        bgColor: "bg-purple-100",
      },
      {
        title: "Partners",
        value: partners,
        icon: FiUser,
        color: "text-pink-600",
        bgColor: "bg-pink-100",
      },
      {
        title: "Active",
        value: active,
        icon: FiUserCheck,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      },
      {
        title: "Inactive",
        value: inactive,
        icon: FiUserX,
        color: "text-gray-600",
        bgColor: "bg-gray-100",
      },
      {
        title: "Former",
        value: former,
        icon: FiUserX,
        color: "text-orange-600",
        bgColor: "bg-orange-100",
      },
    ],
    [total, customers, prospects, partners, active, inactive, former]
  );

  const filteredAccounts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const normalizedFilter = stageFilter.trim().toUpperCase();

    return accounts.filter((acc) => {
      const searchFields = [
        acc?.name,
        acc?.website,
        acc?.industry,
        acc?.territory?.name,
        acc?.phone_number,
      ];

      const matchesSearch =
        normalizedQuery === "" ||
        searchFields.some((field) => {
          if (field === null || field === undefined) return false;
          return field.toString().toLowerCase().includes(normalizedQuery);
        });

      const matchesStage =
        normalizedFilter === "FILTER BY STATUS" ||
        normalizeStatus(acc.status) === normalizedFilter;

      return matchesSearch && matchesStage;
    });
  }, [accounts, searchQuery, stageFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAccounts.length / ITEMS_PER_PAGE) || 1
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, stageFilter]);

  useEffect(() => {
    setCurrentPage((prev) => {
      const maxPage = Math.max(
        1,
        Math.ceil(filteredAccounts.length / ITEMS_PER_PAGE) || 1
      );
      return prev > maxPage ? maxPage : prev;
    });
  }, [filteredAccounts.length]);

  const paginatedAccounts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAccounts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAccounts, currentPage]);

  const pageStart =
    filteredAccounts.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const pageEnd = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredAccounts.length
  );

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleAccountClick = (acc) => {
    setSelectedAccount(acc);
    setActiveTab("Overview");
    setSelectedStatus(normalizeStatus(acc?.status) || "PROSPECT");
  };

  const handleBackToList = () => setSelectedAccount(null);

  const handleAccountModalBackdropClick = (e) => {
    if (e.target.id === "accountModalBackdrop" && !confirmProcessing) {
      handleBackToList();
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentAccountId(null);
    setFormData(INITIAL_FORM_STATE);
    setIsSubmitting(false);
    setSelectedUser(null);
  };

  const handleBackdropClick = (e) => {
    if (e.target.id === "modalBackdrop") closeModal();
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
    setCurrentAccountId(null);
    setShowModal(true);
  };

  const handleEditClick = (account) => {
    // Close the account details modal
    setSelectedAccount(null);
    console.log("edit: ", account);
    
    // Set the selected user if the account has an assigned user
    if (account.assigned_accs) {
      setSelectedUser(account.assigned_accs);
    } else {
      setSelectedUser(null);
    }
    
    setFormData({
      name: account.name || "",
      website: account.website || "",
      phone_number: account.phone_number || "",
      billing_address: account.billing_address || "",
      shipping_address: account.shipping_address || "",
      industry: account.industry || "",
      status: normalizeStatus(account.status) || "PROSPECT",
      territory_id: account.territory?.id ? String(account.territory.id) : "",
      assigned_to: account.assigned_accs?.id
        ? String(account.assigned_accs.id)
        : "",
    });
    setIsEditing(true);
    setCurrentAccountId(account.id);
    setShowModal(true);
  };

  const handleDelete = (account) => {
    if (!account) return;

    setConfirmModalData({
      title: "Delete Account",
      message: (
        <span>
          Are you sure you want to permanently delete the account{" "}
          <span className="font-semibold">{account.name}</span>? This action
          cannot be undone.
        </span>
      ),
      confirmLabel: "Delete Account",
      cancelLabel: "Cancel",
      variant: "danger",
      action: {
        type: "delete",
        targetId: account.id,
        name: account.name,
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
        const response = await api.post(`/accounts/admin`, payload);
        toast.success(`Account "${name}" created successfully.`);

        const preserveId = selectedAccount?.id || null;
        closeModal();
        await fetchAccounts(preserveId);

        // After fetching, highlight the newly created account in detail view if requested later.
        if (!selectedAccount && response.data?.id) {
          // no-op: leave list view without auto-select
        }
      } else if (type === "update") {
        if (!targetId) {
          throw new Error("Missing account identifier for update.");
        }
        setIsSubmitting(true);
        await api.put(`/accounts/admin/${targetId}`, payload);
        toast.success(`Account "${name}" updated successfully.`);

        const preserveId =
          selectedAccount?.id && selectedAccount.id === targetId
            ? targetId
            : null;
        closeModal();
        await fetchAccounts(preserveId);
        // Ensure list view is shown to see table changes
        if (selectedAccount?.id === targetId) {
          setSelectedAccount(null);
        }
      } else if (type === "delete") {
        if (!targetId) {
          throw new Error("Missing account identifier for deletion.");
        }
        const currentSelectedId = selectedAccount?.id;
        setDeletingId(targetId);
        await api.delete(`/accounts/admin/${targetId}`);
        toast.success(`Account "${name}" deleted successfully.`);

        const preserveId =
          currentSelectedId && currentSelectedId !== targetId
            ? currentSelectedId
            : null;
        await fetchAccounts(preserveId);

        if (currentSelectedId === targetId) {
          setSelectedAccount(null);
        }
      }
    } catch (err) {
      console.error(err);
      const defaultMessage =
        type === "create"
          ? "Failed to create account. Please review the details and try again."
          : type === "update"
          ? "Failed to update account. Please review the details and try again."
          : "Failed to delete account. Please try again.";

      const message = err.response?.data?.detail || defaultMessage;
      toast.error(message);

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

  const handleStatusUpdate = async () => {
    if (!selectedAccount || !selectedStatus) return;

    const normalizedNewStatus = normalizeStatus(selectedStatus);
    const normalizedCurrentStatus = normalizeStatus(selectedAccount.status);

    // Don't update if status hasn't changed
    if (normalizedNewStatus === normalizedCurrentStatus) {
      return;
    }

    setUpdatingStatus(true);
    try {
      await api.put(`/accounts/admin/${selectedAccount.id}`, {
        status: normalizedNewStatus,
      });

      toast.success(
        `Account status updated to ${formatStatusLabel(normalizedNewStatus)}`
      );

      // Update accounts list in real-time without reloading
      setAccounts((prevAccounts) => {
        return prevAccounts.map((account) => {
          if (account.id === selectedAccount.id) {
            return {
              ...account,
              status: normalizedNewStatus,
            };
          }
          return account;
        });
      });

      // Close the details view popup
      setSelectedAccount(null);
    } catch (err) {
      console.error(err);
      const message =
        err.response?.data?.detail ||
        "Failed to update account status. Please try again.";
      toast.error(message);
    } finally {
      setUpdatingStatus(false);
    }
  };

   //validation
const [isSubmitted, setIsSubmitted] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);   

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      toast.error("Account name is required.");
      return;
    }

      const assignedTo = formData.assigned_to;
  if (!assignedTo) {
    toast.error("Assigned To is required.");
    return;
  }

    const payload = {
      name: trimmedName,
      website: formData.website?.trim() || null,
      phone_number: formData.phone_number?.trim() || null,
      billing_address: formData.billing_address?.trim() || null,
      shipping_address: formData.shipping_address?.trim() || null,
      industry: formData.industry?.trim() || null,
      status: formData.status || "PROSPECT",
      territory_id: formData.territory_id
        ? Number(formData.territory_id)
        : null,
      assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
    };

    const actionType = isEditing && currentAccountId ? "update" : "create";

    setConfirmModalData({
      title: actionType === "create" ? "Confirm New Account" : "Confirm Update",
      message:
        actionType === "create" ? (
          <span>
            Are you sure you want to create the account{" "}
            <span className="font-semibold">{trimmedName}</span>?
          </span>
        ) : (
          <span>
            Save changes to the account{" "}
            <span className="font-semibold">{trimmedName}</span>?
          </span>
        ),
      confirmLabel:
        actionType === "create" ? "Create Account" : "Update Account",
      cancelLabel: "Cancel",
      variant: actionType === "create" ? "primary" : "primary",
      action: {
        type: actionType,
        payload,
        targetId: currentAccountId || null,
        name: trimmedName,
      },
    });
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

  const selectedAccountDeleteDisabled =
    selectedAccount &&
    (deletingId === selectedAccount.id ||
      deleteActionTargetId === selectedAccount.id);

  const selectedAccountDeleting =
    selectedAccount && deletingId === selectedAccount.id;

  const detailStatusBadge = selectedAccount
    ? getDetailBadgeClass(selectedAccount.status)
    : "";

  const detailView = selectedAccount ? (
    <div
      id="accountModalBackdrop"
      onClick={handleAccountModalBackdropClick}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[92vh] overflow-y-auto hide-scrollbar animate-scale-in font-inter relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 🔵 ONLY TOP */}
        <div className="bg-tertiary w-full rounded-t-xl flex items-center justify-between p-3 lg:p-3">
          <h1 className="lg:text-3xl text-xl text-white font-semibold text-center w-full">
            Account
          </h1>
          <button
            onClick={handleBackToList}
            className="text-gray-400 hover:text-white cursor-pointer"
          >
            <HiX size={25} />
          </button>
        </div>

        {/* Header */}
       <div className="flex flex-col md:flex-row md:justify-between lg:flex-row lg:items-center lg:justify-between mt-3 gap-2 px-2 md:items-center lg:gap-4 md:mx-7 lg:mx-7">
  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
    <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
              {selectedAccount.name}
            </h1>
            <span
              className={`text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full whitespace-nowrap ${detailStatusBadge}`}
            >
              {formatStatusLabel(selectedAccount.status)}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
            <button
              className="inline-flex items-center justify-center w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-70 transition text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={() => handleEditClick(selectedAccount)}
              disabled={
                confirmModalData?.action?.type === "update" &&
                confirmModalData.action.targetId === selectedAccount.id
              }
            >
              <FiEdit className="mr-2" />
              Edit
            </button>
            <button
              className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 rounded-md text-sm bg-red-500 text-white hover:bg-red-600 transition focus:outline-none focus:ring-2 focus:ring-red-400"
              onClick={() => handleDelete(selectedAccount)}
              disabled={Boolean(selectedAccountDeleteDisabled)}
            >
              {selectedAccountDeleting ? (
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
        <div className="p-6 lg:p-4">
          <div className="flex w-full bg-[#6A727D] text-white mt-1 overflow-x-auto mb-6">
            {["Overview", "Activities"].map((tab) => (
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

          {/* TAB CONTENT */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            <div className="lg:col-span-3">
              {activeTab === "Overview" && (
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8 border border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6 text-sm text-gray-700">
                    <div>
                      <p className="font-semibold">Website:</p>
                      <p>
                        {selectedAccount.website ? (
                          <a
                            href={selectedAccount.website}
                            className="text-blue-600 hover:underline break-all"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {selectedAccount.website}
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">Industry:</p>
                      <p>{selectedAccount.industry || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Territory:</p>
                      <p>{selectedAccount.territory?.name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Phone Number:</p>
                      <p>{selectedAccount.phone_number || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Billing Address:</p>
                      <p>{selectedAccount.billing_address || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Shipping Address:</p>
                      <p>{selectedAccount.shipping_address || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Assigned To:</p>
                      <p>
                        {selectedAccount.assigned_accs
                          ? `${selectedAccount.assigned_accs.first_name} ${selectedAccount.assigned_accs.last_name}`
                          : "Unassigned"}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">Created By:</p>
                      <p>
                        {selectedAccount.acc_creator
                          ? `${selectedAccount.acc_creator.first_name} ${selectedAccount.acc_creator.last_name}`
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">Created At:</p>
                      <p>
                        {formattedDateTime(selectedAccount.created_at) || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">Last Updated:</p>
                      <p>
                        {formattedDateTime(selectedAccount.updated_at) || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ------- Notes ------ */}
              {activeTab === "Notes" && (
                <div className="mt-4 w-full">
                  <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                    <h3 className="text-lg font-semibold text-gray-800 break-words">
                      Account Note
                    </h3>
                  </div>

                  <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm break-words">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800 break-words">
                          Note
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-700 whitespace-pre-wrap break-words">
                      {accounts.notes || "No notes available."}
                    </div>
                  </div>
                </div>
              )}

              {/* ACTIVITIES */}
              {activeTab === "Activities" && (
                <div className="mt-4 space-y-4 w-full">
                  <h3 className="text-lg font-semibold text-gray-800 break-words">
                    Recent Activities
                  </h3>

                  {[
                    {
                      icon: FiPhone,
                      title: "Schedule Call",
                      desc: "Discuss implementation timeline and pricing",
                      user: "Lester James",
                      date: "December 12, 2025 at 8:00 AM",
                    },
                    {
                      icon: FiCalendar,
                      title: "Meeting regarding Enterprise Software License",
                      desc: "Discuss implementation timeline and pricing",
                      user: "Lester James",
                      date: "December 12, 2025 at 8:00 AM",
                    },
                  ].map((act, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row justify-between items-start border border-gray-200 rounded-lg p-4 shadow-sm bg-white w-full break-words"
                    >
                      <div className="flex gap-4 mb-2 sm:mb-0 flex-1 min-w-0">
                        <div className="text-gray-600 mt-1">
                          <act.icon size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 break-words">
                            {act.title}
                          </h4>
                          <p className="text-sm text-gray-500 break-words">
                            {act.desc}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0"></div>
                            <p className="text-sm text-gray-700 break-words">
                              {act.user}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 break-words">
                        {act.date}
                      </p>
                    </div>
                  ))}
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
                  <button
                    onClick={() =>
                      navigate("/admin/calls", {
                        state: {
                          openCallModal: true, // <-- this triggers your form
                          initialCallData: {
                            relatedType1: "Account", // <-- your custom default
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
                            relatedType: "Account",
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
                            relatedTo: "Account",
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
                  value={
                    selectedStatus ||
                    normalizeStatus(selectedAccount?.status) ||
                    "PROSPECT"
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
                    updatingStatus ||
                    !selectedStatus ||
                    normalizeStatus(selectedStatus) ===
                      normalizeStatus(selectedAccount?.status)
                  }
                  className={`w-full py-1.5 rounded-md text-sm transition focus:outline-none focus:ring-2 ${
                    updatingStatus ||
                    !selectedStatus ||
                    normalizeStatus(selectedStatus) ===
                      normalizeStatus(selectedAccount?.status)
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : "bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-400"
                  }`}
                >
                  {updatingStatus ? "Updating..." : "Update"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  const listView = (
    <div className="p-4 sm:p-6 lg:p-8 font-inter relative">
      {accountsLoading && <LoadingSpinner message="Loading accounts..." />}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <h2 className="flex items-center text-xl sm:text-2xl font-semibold text-gray-800">
          <FiUsers className="mr-2 text-blue-600" />
          Accounts Management
        </h2>
          
     <div className="flex justify-center lg:justify-end w-full sm:w-auto">
        <button
         onClick={() => {
          handleOpenAddModal();  // open the modal
          setIsSubmitted(false); // reset all error borders
        }}
        className="flex items-center bg-black text-white px-3 sm:px-4 py-2 my-1 lg:my-0 rounded-md hover:bg-gray-800 text-sm sm:text-base mx-auto sm:ml-auto cursor-pointer"
      >
        <FiPlus className="mr-2" /> Add Account
      </button>
      </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6 w-full break-words overflow-hidden lg:overflow-visible">
        {metricCards.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex flex-col lg:flex-row items-center justify-between gap-3 w-full">
        <div className="flex items-center border border-gray-300 rounded-lg px-4 h-11 w-full lg:w-3/4 focus-within:ring-2 focus-within:ring-indigo-500 transition">
          <FiSearch size={20} className="text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search accounts"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="focus:outline-none text-base w-full"
          />
        </div>
        <div className="w-full lg:w-1/4">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
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
        <table className="w-full min-w-[500px] border border-gray-200 rounded-lg bg-white shadow-sm text-sm">
          <thead className="bg-gray-100 text-left text-gray-600 text-sm tracking-wide font-semibold">
            <tr>
              <th className="py-3 px-4 truncate">Account</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Industry</th>
              <th className="py-3 px-4">Territory</th>
              <th className="py-3 px-4">Phone</th>
            </tr>
          </thead>
          <tbody>
            {accountsLoading ? (
              <tr>
                <td
                  className="py-4 px-4 text-center text-sm text-gray-500"
                  colSpan={5}
                >
                  Loading accounts...
                </td>
              </tr>
            ) : filteredAccounts.length > 0 ? (
              paginatedAccounts.map((acc) => {
                return (
                  <tr
                    key={acc.id}
                    className="hover:bg-gray-50 text-xs cursor-pointer"
                    onClick={() => handleAccountClick(acc)}
                  >
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-blue-600 hover:underline break-all text-sm">
                          {acc.name}
                        </div>
                        <div className="text-gray-500 text-xs break-all">
                          {acc.website || "--"}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getTableBadgeClass(
                          acc.status
                        )}`}
                      >
                        {formatStatusLabel(acc.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {acc.industry || "--"}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {acc.territory?.name || "--"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <FiPhone className="text-gray-500" />
                        <span>{acc.phone_number || "--"}</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  className="py-4 px-4 text-center text-sm text-gray-500"
                  colSpan={5}
                >
                  No accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <PaginationControls
        className="mt-4"
        totalItems={filteredAccounts.length}
        pageSize={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPrev={handlePrevPage}
        onNext={handleNextPage}
        label="accounts"
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
        className="bg-white w-full max-w-full sm:max-w-3xl rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 relative border border-gray-200 overflow-y-auto hide-scrollbar max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
           onClick={() => {
                closeModal();          // close the modal
                setIsSubmitted(false); // reset validation errors
              }}
          className="absolute top-4 right-4 text-gray-500 hover:text-black transition"
          disabled={isSubmitting || confirmProcessing}
        >
          <FiX size={22} />
        </button>

        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center justify-center">
          {isEditing ? "Edit Account" : "Add New Account"}
        </h2>

        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="md:col-span-2">
          <InputField
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Company name"
            required
            disabled={isSubmitting}
          isSubmitted={isSubmitted}   
          />
          </div>

          <InputField
            label="Website"
            name="website"
            value={formData.website}
            onChange={handleInputChange}
            placeholder="https://example.com"
            disabled={isSubmitting}
          />
          <InputField
            label="Phone Number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleInputChange}
            placeholder="09xx xxx xxxx"
            type="tel"
            disabled={isSubmitting}
          />
          <InputField
            label="Industry"
            name="industry"
            value={formData.industry}
            onChange={handleInputChange}
            placeholder="Industry"
            disabled={isSubmitting}
          />
          <InputField
            label="Billing Address"
            name="billing_address"
            value={formData.billing_address}
            onChange={handleInputChange}
            placeholder="Billing address"
            disabled={isSubmitting}
          />
          <InputField
            label="Shipping Address"
            name="shipping_address"
            value={formData.shipping_address}
            onChange={handleInputChange}
            placeholder="Shipping address"
            disabled={isSubmitting}
          />
          <SelectField
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            options={[{ value: "", label: "Select status" }, ...STATUS_OPTIONS]}
            required
            disabled={isSubmitting}
          />
          <SearchableSelectField
            label="Assigned To"
            value={formData.assigned_to}
            onChange={(newId) => {
              const user = users.find((u) => String(u.id) === String(newId));
              setSelectedUser(user);

              // Auto-select territory if user has exactly one, otherwise reset
              let newTerritoryId = null;
              if (user && user.assigned_territory && user.assigned_territory.length === 1) {
                newTerritoryId = user.assigned_territory[0].id;
              }

              setFormData((prev) => ({
                ...prev,
                assigned_to: newId,
                territory_id: newTerritoryId, // Reset or Auto-select
              }));
            }}
            items={users || []}
            getLabel={(item) =>
              `${item?.first_name ?? ""} ${item?.last_name ?? ""} (${item?.role ?? ""})`.trim()
            }
            placeholder="Search assignee..."
           required={true}               // <-- use required directly
          isSubmitted={isSubmitted}     
          disabled={isSubmitting || users.length === 0}  
        />
        
          <SelectField
            label="Territory"
            name="territory_id"
            value={formData.territory_id || ""}
            onChange={handleInputChange}
            options={[
              { value: "", label: !selectedUser ? "Select a user first" : (selectedUser.assigned_territory && selectedUser.assigned_territory.length > 0) ? "Select Territory" : "No territories assigned to this user" },
              ...(selectedUser &&
                selectedUser.assigned_territory &&
                selectedUser.assigned_territory.map((t) => ({
                  value: String(t.id),
                  label: t.name,
                }))) || [],
            ]}
            disabled={isSubmitting || !selectedUser || !selectedUser.assigned_territory || selectedUser.assigned_territory.length === 0}
          />

          <div className="flex flex-col sm:flex-row justify-end sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2 col-span-1 md:col-span-2 mt-4 w-full">
            <button
              type="button"
                 onClick={() => {
                    closeModal();       // close the modal
                    setIsSubmitted(false); // reset validation errors
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
                ? "Update Account"
                : "Save Account"}
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
      {listView}
      {detailView}
      {formModal}
      {confirmationModal}
    </>
  );
}

function MetricCard({
  icon: Icon,
  title,
  value,
  color = "text-blue-600",
  bgColor = "bg-blue-100",
  onClick,
}) {
  const handleClick = () => {
    if (typeof onClick === "function") {
      onClick();
    } else {
      console.log(`Clicked: ${title}`);
    }
  };

  return (
    <div
      className="flex items-center p-4 bg-white rounded-xl shadow-md border border-gray-200 transition-all duration-300"
      onClick={handleClick}
    >
      <div
        className={`flex-shrink-0 p-3 rounded-full ${bgColor} ${color} mr-4`}
      >
        {Icon ? <Icon size={22} /> : null}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 uppercase">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
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
  isSubmitted = false,       // <-- new prop
}) {
  const hasError = isSubmitted && !value?.trim();

  return (
      <div>
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

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
}) {
  return (
    <div>
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
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
      ? items.filter((it) => (getLabel(it) || "").toLowerCase().includes(query))
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
          }`}
                />

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

function DetailRow({ label, value }) {
  return (
    <p>
      <span className="font-semibold">{label}:</span> <br />
      <span className="break-words">{value || "--"}</span>
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
