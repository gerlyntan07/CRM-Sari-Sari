import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiSearch,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiPhone,
  FiUsers,
  FiUser,
  FiX,
  FiMail,
  FiBriefcase,
  FiCalendar,
  FiSmartphone,
  FiCheckSquare
} from "react-icons/fi";
import { HiX } from "react-icons/hi";
import { BsBuilding } from "react-icons/bs";
import api from "../api.js";
import { toast } from "react-toastify";
import PaginationControls from "../components/PaginationControls.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { useNavigate } from "react-router-dom";

const ITEMS_PER_PAGE = 10;

const STATUS_OPTIONS = [
  { value: "CUSTOMER", label: "Customer" },
  { value: "PROSPECT", label: "Prospect" },
  { value: "PARTNER", label: "Partner" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "FORMER", label: "Former" },
];

const normalizeStatus = (status) => (status ? status.toUpperCase() : "");

const formatStatusLabel = (status) => {
  if (!status) return "--";
  return status
    .toString()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const INITIAL_FORM_STATE = {
  first_name: "",
  last_name: "",
  account_id: "",
  title: "",
  department: "",
  email: "",
  work_phone: "",
  mobile_phone_1: "",
  mobile_phone_2: "",
  notes: "",
  assigned_to: "",
  status: "",
};

const getContactFullName = (contact) =>
  [contact?.first_name, contact?.last_name].filter(Boolean).join(" ").trim();

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

export default function AdminContacts() {
     const navigate = useNavigate();
     
  useEffect(() => {
    document.title = "Contacts | Sari-Sari CRM";
  }, []);
  const renderAccountStatusBadge = (status) => {
    if (!status) return null;

    const normalized = status.toString().toLowerCase();
    const label = normalized.replace(/\b\w/g, (char) => char.toUpperCase());

    const badgeClass = (() => {
      switch (normalized) {
        case "customer":
          return "bg-green-100 text-green-700";
        case "prospect":
          return "bg-purple-100 text-purple-700";
        case "partner":
          return "bg-pink-100 text-pink-700";
        case "active":
          return "bg-blue-100 text-blue-700";
        case "inactive":
          return "bg-gray-200 text-gray-700";
        case "former":
          return "bg-orange-100 text-orange-700";
        default:
          return "bg-gray-100 text-gray-700";
      }
    })();

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badgeClass}`}
      >
        {label}
      </span>
    );
  };

  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState(null);
  const [confirmProcessing, setConfirmProcessing] = useState(false);
  const [currentContactId, setCurrentContactId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [searchQuery, setSearchQuery] = useState("");
  const [accountFilter, setAccountFilter] = useState("Filter by Accounts");
  const [deletingId, setDeletingId] = useState(null);
  const [activeTab, setActiveTab] = useState("Overview");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchContacts = useCallback(
    async (preserveSelectedId = null) => {
      setContactsLoading(true);
      try {
        const res = await api.get(`/contacts/admin/fetch-all`);
        const data = Array.isArray(res.data) ? res.data : [];
        const sorted = [...data].sort((a, b) => {
          const aDate = a?.created_at || a?.updated_at || 0;
          const bDate = b?.created_at || b?.updated_at || 0;
          return new Date(bDate) - new Date(aDate);
        });
        setContacts(sorted);
        console.log(res.data)
        if (preserveSelectedId) {
          const updatedSelection = sorted.find(
            (contact) => contact.id === preserveSelectedId
          );
          setSelectedContact(updatedSelection || null);
        }
      } catch (err) {
        console.error(err);
        setContacts([]);
        if (err.response?.status === 403) {
          toast.error(
            "Permission denied. Only CEO, Admin, or Group Manager can access this page."
          );
        } else {
          toast.error("Failed to fetch contacts. Please try again later.");
        }
      } finally {
        setContactsLoading(false);
      }
    },
    [setSelectedContact]
  );

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await api.get(`/accounts/admin/fetch-all`);
      const data = Array.isArray(res.data) ? res.data : [];
      const sorted = [...data].sort((a, b) =>
        (a?.name || "").localeCompare(b?.name || "")
      );
      setAccounts(sorted);
    } catch (err) {
      console.error(err);
      setAccounts([]);
      if (err.response?.status === 403) {
        toast.warn("Unable to load accounts (permission denied).");
      }
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get(`/users/all`);
      const data = Array.isArray(res.data) ? res.data : [];
      const sorted = [...data].sort((a, b) =>
        getContactFullName(a).localeCompare(getContactFullName(b))
      );
      setUsers(sorted);
    } catch (err) {
      console.error(err);
      setUsers([]);
      if (err.response?.status === 403) {
        toast.warn("Unable to load users for assignment (permission denied).");
      }
    }
  }, []);

  useEffect(() => {
    fetchContacts();
    fetchAccounts();
    fetchUsers();
  }, [fetchContacts, fetchAccounts, fetchUsers]);

  // Sync selectedStatus with selectedContact account status
  useEffect(() => {
    if (selectedContact?.account?.status) {
      setSelectedStatus(normalizeStatus(selectedContact.account.status) || "PROSPECT");
    } else {
      setSelectedStatus("PROSPECT");
    }
  }, [selectedContact]);

  // Sync formData status when account_id changes in edit form
  useEffect(() => {
    if (isEditing && formData.account_id && accounts.length > 0) {
      const selectedAccount = accounts.find(
        (acc) => String(acc.id) === formData.account_id
      );
      if (selectedAccount?.status) {
        const accountStatus = normalizeStatus(selectedAccount.status) || "PROSPECT";
        setFormData((prev) => {
          // Only update if status is empty or different to avoid unnecessary updates
          if (!prev.status || normalizeStatus(prev.status) !== accountStatus) {
            return {
              ...prev,
              status: accountStatus,
            };
          }
          return prev;
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.account_id, isEditing]);

  const accountOptions = useMemo(() => {
    const map = new Map();
    accounts.forEach((acc) => {
      if (acc?.id && acc?.name) {
        map.set(String(acc.id), acc.name);
      }
    });
    contacts.forEach((contact) => {
      if (contact?.account_id && contact?.account?.name) {
        map.set(String(contact.account_id), contact.account.name);
      }
    });
    const options = Array.from(map.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }));
    return [{ value: "Filter by Accounts", label: "Filter by Accounts" }, ...options];
  }, [accounts, contacts]);

  const filteredContacts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const normalizedFilter = accountFilter.trim();

    return contacts.filter((contact) => {
      const searchFields = [
        contact?.first_name,
        contact?.last_name,
        contact?.email,
        contact?.title,
        contact?.department,
        contact?.account?.name,
        contact?.account?.status,
        contact?.work_phone,
        contact?.mobile_phone_1,
        contact?.mobile_phone_2,
        contact?.assigned_contact?.first_name,
        contact?.assigned_contact?.last_name,
        contact?.contact_creator?.first_name,
        contact?.contact_creator?.last_name,
        contact?.notes,
        formattedDateTime(contact?.created_at),
        formattedDateTime(contact?.updated_at),
      ];

      const matchesSearch =
        normalizedQuery === "" ||
        searchFields.some((field) => {
          if (field === null || field === undefined) return false;
          return field.toString().toLowerCase().includes(normalizedQuery);
        });

      const matchesAccount =
        normalizedFilter === "Filter by Accounts" ||
        String(contact.account_id) === normalizedFilter;

      return matchesSearch && matchesAccount;
    });
  }, [contacts, searchQuery, accountFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredContacts.length / ITEMS_PER_PAGE) || 1
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, accountFilter]);

  useEffect(() => {
    setCurrentPage((prev) => {
      const maxPage = Math.max(
        1,
        Math.ceil(filteredContacts.length / ITEMS_PER_PAGE) || 1
      );
      return prev > maxPage ? maxPage : prev;
    });
  }, [filteredContacts.length]);

  const paginatedContacts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredContacts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredContacts, currentPage]);

  const pageStart =
    filteredContacts.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const pageEnd = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredContacts.length
  );

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const closeModal = useCallback(() => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentContactId(null);
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
    setCurrentContactId(null);
    setShowModal(true);
  };

  const handleEditClick = (contact) => {
    if (!contact) return;
    setFormData({
      first_name: contact.first_name || "",
      last_name: contact.last_name || "",
      account_id: contact.account_id ? String(contact.account_id) : "",
      title: contact.title || "",
      department: contact.department || "",
      email: contact.email || "",
      work_phone: contact.work_phone || "",
      mobile_phone_1: contact.mobile_phone_1 || "",
      mobile_phone_2: contact.mobile_phone_2 || "",
      notes: contact.notes || "",
      assigned_to: contact.assigned_to ? String(contact.assigned_to) : "",
      status: normalizeStatus(contact.account?.status) || "PROSPECT",
    });
    setIsEditing(true);
    setCurrentContactId(contact.id);
    setShowModal(true);
    // Close the contact details modal
    setSelectedContact(null);
  };

  const handleDelete = (contact) => {
    if (!contact) return;
    const name = getContactFullName(contact) || "this contact";
    setConfirmModalData({
      title: "Delete Contact",
      message: (
        <span>
          Are you sure you want to permanently delete{" "}
          <span className="font-semibold">{name}</span>? This action cannot be
          undone.
        </span>
      ),
      confirmLabel: "Delete Contact",
      cancelLabel: "Cancel",
      variant: "danger",
      action: {
        type: "delete",
        targetId: contact.id,
        name,
      },
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedFirstName = formData.first_name.trim();
    const trimmedLastName = formData.last_name.trim();
    if (!trimmedFirstName || !trimmedLastName) {
      toast.error("First name and last name are required.");
      return;
    }

    if (!formData.account_id) {
      toast.error("Account is required.");
      return;
    }

    const payload = {
      first_name: trimmedFirstName,
      last_name: trimmedLastName,
      account_id: Number(formData.account_id),
      title: formData.title?.trim() || null,
      department: formData.department?.trim() || null,
      email: formData.email?.trim().toLowerCase() || null,
      work_phone: formData.work_phone?.trim() || null,
      mobile_phone_1: formData.mobile_phone_1?.trim() || null,
      mobile_phone_2: formData.mobile_phone_2?.trim() || null,
      notes: formData.notes?.trim() || null,
      assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
    };

    const actionType = isEditing && currentContactId ? "update" : "create";
    const contactName = `${trimmedFirstName} ${trimmedLastName}`.trim();

    // Get the original contact to check if status changed
    const originalContact = isEditing ? contacts.find(c => c.id === currentContactId) : null;
    const originalAccountStatus = originalContact?.account?.status;
    const newStatus = formData.status ? normalizeStatus(formData.status) : null;
    const statusChanged = isEditing && originalContact?.account?.id && 
      newStatus && normalizeStatus(originalAccountStatus) !== newStatus;

    setConfirmModalData({
      title: actionType === "create" ? "Confirm New Contact" : "Confirm Update",
      message:
        actionType === "create" ? (
          <span>
            Are you sure you want to add{" "}
            <span className="font-semibold">{contactName}</span> to your
            contacts?
          </span>
        ) : (
          <span>
            Save changes to <span className="font-semibold">{contactName}</span>
            ?
          </span>
        ),
      confirmLabel:
        actionType === "create" ? "Create Contact" : "Update Contact",
      cancelLabel: "Cancel",
      variant: "primary",
      action: {
        type: actionType,
        payload,
        targetId: currentContactId || null,
        name: contactName,
      },
      accountStatusUpdate: statusChanged ? newStatus : null,
      accountId: isEditing && originalContact?.account?.id ? originalContact.account.id : (payload.account_id || null),
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
        await api.post(`/contacts/admin`, payload);
        toast.success(`Contact "${name}" created successfully.`);
        const preserveId = selectedContact?.id || null;
        closeModal();
        await fetchContacts(preserveId);
      } else if (type === "update") {
        if (!targetId) {
          throw new Error("Missing contact identifier for update.");
        }
        setIsSubmitting(true);
        await api.put(`/contacts/admin/${targetId}`, payload);
        
        // Update account status if it was changed in the form
        if (confirmModalData.accountStatusUpdate && confirmModalData.accountId) {
          try {
            await api.put(`/accounts/admin/${confirmModalData.accountId}`, {
              status: normalizeStatus(confirmModalData.accountStatusUpdate),
            });
            toast.success(`Account status updated to ${formatStatusLabel(confirmModalData.accountStatusUpdate)}`);
          } catch (err) {
            console.error("Failed to update account status:", err);
            toast.warn("Contact updated but failed to update account status.");
          }
        }
        
        toast.success(`Contact "${name}" updated successfully.`);
        const preserveId =
          selectedContact?.id && selectedContact.id === targetId
            ? targetId
            : selectedContact?.id || null;
        closeModal();
        await fetchContacts(preserveId);
        // Ensure list view is shown to see table changes
        if (selectedContact?.id === targetId) {
          setSelectedContact(null);
        }
      } else if (type === "delete") {
        if (!targetId) {
          throw new Error("Missing contact identifier for deletion.");
        }
        const currentSelectedId = selectedContact?.id;
        setDeletingId(targetId);
        await api.delete(`/contacts/admin/${targetId}`);
        toast.success(`Contact "${name}" deleted successfully.`);
        const preserveId =
          currentSelectedId && currentSelectedId !== targetId
            ? currentSelectedId
            : null;
        await fetchContacts(preserveId);
        if (currentSelectedId === targetId) {
          setSelectedContact(null);
        }
      }
    } catch (err) {
      console.error(err);
      const defaultMessage =
        type === "create"
          ? "Failed to create contact. Please review the details and try again."
          : type === "update"
            ? "Failed to update contact. Please review the details and try again."
            : "Failed to delete contact. Please try again.";
      const message = err.response?.data?.detail || defaultMessage;
      toast.error(message);
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

  const handleContactClick = (contact) => {
    setSelectedContact(contact);
    setActiveTab("Overview");
  };

  const handleStatusUpdate = async () => {
    if (!selectedContact?.account?.id || !selectedStatus) return;

    const normalizedNewStatus = normalizeStatus(selectedStatus);
    const normalizedCurrentStatus = normalizeStatus(selectedContact?.account?.status);

    // Don't update if status hasn't changed
    if (normalizedNewStatus === normalizedCurrentStatus) {
      return;
    }

    setUpdatingStatus(true);
    try {
      await api.put(`/accounts/admin/${selectedContact.account.id}`, {
        status: normalizedNewStatus,
      });
      
      toast.success(`Account status updated to ${formatStatusLabel(normalizedNewStatus)}`);
      
      // Update contacts list in real-time without reloading
      setContacts((prevContacts) => {
        return prevContacts.map((contact) => {
          if (contact.account_id === selectedContact.account.id) {
            return {
              ...contact,
              account: {
                ...contact.account,
                status: normalizedNewStatus,
              },
            };
          }
          return contact;
        });
      });
      
      // Close the details view popup
      setSelectedContact(null);
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.detail || "Failed to update account status. Please try again.";
      toast.error(message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleBackToList = () => setSelectedContact(null);

  const handleContactModalBackdropClick = (e) => {
    if (e.target.id === "contactModalBackdrop" && !confirmProcessing) {
      handleBackToList();
    }
  };

  const deleteActionTargetId =
    confirmModalData?.action?.type === "delete"
      ? confirmModalData.action.targetId
      : null;

  const selectedContactDeleteDisabled =
    selectedContact &&
    (deletingId === selectedContact.id ||
      deleteActionTargetId === selectedContact.id);

  const selectedContactDeleting =
    selectedContact && deletingId === selectedContact.id;

  const detailView = selectedContact ? (
    <div
      id="contactModalBackdrop"
      onClick={handleContactModalBackdropClick}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
    >
      <div
      className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[92vh] overflow-y-auto hide-scrollbar animate-scale-in font-inter relative"
        onClick={(e) => e.stopPropagation()}
      >
         {/* 🔵 ONLY TOP */}
        <div className="bg-tertiary w-full rounded-t-xl relative p-3 lg:p-3">
          <h1 className="lg:text-3xl text-xl text-white font-semibold text-center w-full">
            Contact
          </h1>
          {/* Close Button */}
          <button
            onClick={handleBackToList}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
          >
            <HiX size={25} />
          </button>
        </div>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mt-4 gap-2 px-2 lg:gap-4 lg:mx-7">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
              {getContactFullName(selectedContact) || "Unnamed contact"}
            </h1>
            {renderAccountStatusBadge(selectedContact.account?.status)}
          </div>

          <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
            <button
              className="inline-flex items-center justify-center w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-70 transition text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={() => handleEditClick(selectedContact)}
              disabled={
                confirmProcessing ||
                (confirmModalData?.action?.type === "update" &&
                  confirmModalData.action.targetId === selectedContact.id)
              }
            >
              <FiEdit className="mr-2" />
              Edit
            </button>
            <button
              className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 rounded-md text-sm bg-red-500 text-white hover:bg-red-600 transition focus:outline-none focus:ring-2 focus:ring-red-400"
              onClick={() => handleDelete(selectedContact)}
              disabled={Boolean(selectedContactDeleteDisabled)}
            >
              {selectedContactDeleting ? (
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

         <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 px-2 lg:gap-4 lg:mx-7">
          <p className="text-sm text-gray-500">
              {selectedContact.account?.name || "No associated account"}
            </p>
         </div>
        <div className="border-b border-gray-200 my-5"></div>

        {/* TABS */}
        <div className="p-6 lg:p-4">
        <div className="flex w-full bg-[#6A727D] text-white mt-1 overflow-x-auto mb-6">
          {["Overview", "Notes", "Activities"].map((tab) => (
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
                    <p className="font-semibold">Contact Name:</p>
                    <p>{getContactFullName(selectedContact) || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Title:</p>
                    <p>{selectedContact.title || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Email:</p>
                    <p>
                      {selectedContact.email ? (
                        <a
                          href={`mailto:${selectedContact.email}`}
                          className="text-blue-600 hover:underline break-all"
                        >
                          {selectedContact.email}
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">Department:</p>
                    <p>{selectedContact.department || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Work Phone:</p>
                    <p>{selectedContact.work_phone || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Mobile Phone 1:</p>
                    <p>{selectedContact.mobile_phone_1 || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Mobile Phone 2:</p>
                    <p>{selectedContact.mobile_phone_2 || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Assigned To:</p>
                    <p>
                      {selectedContact.assigned_contact
                        ? `${selectedContact.assigned_contact.first_name} ${selectedContact.assigned_contact.last_name}`
                        : "Unassigned"}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">Created By:</p>
                    <p>
                      {selectedContact.contact_creator
                        ? `${selectedContact.contact_creator.first_name} ${selectedContact.contact_creator.last_name}`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">Created At:</p>
                    <p>{formattedDateTime(selectedContact.created_at) || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Last Updated:</p>
                    <p>{formattedDateTime(selectedContact.updated_at) || "N/A"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ------- Notes ------ */}
              {activeTab === "Notes" && (
                  <div className="mt-4 w-full">
                <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                  <h3 className="text-lg font-semibold text-gray-800 break-words">Contact Note</h3>
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
                         {selectedContact.notes || "No notes available."}
                      </div>
                    </div>
                </div>
              )}


            {/* ACTIVITIES */}
            {activeTab === "Activities" && (
              <div className="mt-4 space-y-4 w-full">
                <h3 className="text-lg font-semibold text-gray-800 break-words">Recent Activities</h3>

                {[{
                  icon: FiPhone,
                  title: "Schedule Call",
                  desc: "Discuss implementation timeline and pricing",
                  user: "Lester James",
                  date: "December 12, 2025 at 8:00 AM",
                }, {
                  icon: FiCalendar,
                  title: "Meeting regarding Enterprise Software License",
                  desc: "Discuss implementation timeline and pricing",
                  user: "Lester James",
                  date: "December 12, 2025 at 8:00 AM",
                }].map((act, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row justify-between items-start border border-gray-200 rounded-lg p-4 shadow-sm bg-white w-full break-words">
                    <div className="flex gap-4 mb-2 sm:mb-0 flex-1 min-w-0">
                      <div className="text-gray-600 mt-1">
                        <act.icon size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 break-words">{act.title}</h4>
                        <p className="text-sm text-gray-500 break-words">{act.desc}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0"></div>
                          <p className="text-sm text-gray-700 break-words">{act.user}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 break-words">{act.date}</p>
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

      {/* --- SCHEDULE CALL BUTTON (updated) --- */}
      <button
        onClick={() =>
          navigate("/admin/calls", {
            state: {
              openCallModal: true,      // <-- this triggers your form
              initialCallData: {
                relatedType1: "Contact", // <-- your custom default
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
  type="button"
  onClick={() => {
    if (!selectedContact?.email) {
      alert("No email address available");
      return;
    }

    const to = encodeURIComponent(selectedContact.email);
    const subject = encodeURIComponent("");
    const body = encodeURIComponent("");

    // Gmail web compose URL
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;

    // Open Gmail in a new tab
    window.open(gmailUrl, "_blank");
  }}
  className="flex items-center gap-2 border border-gray-100 rounded-md py-1.5 px-2 sm:px-3 hover:bg-gray-50 transition text-sm"
>
  <FiMail className="text-gray-600 w-4 h-4" />
  Send E-mail
</button>


     <button
       className="flex items-center gap-2 border border-gray-100 rounded-md py-1.5 px-2 sm:px-3 hover:bg-gray-50 transition text-sm"
        onClick={() =>
        navigate("/admin/meetings", {
           state: {
            openMeetingModal: true,
              initialMeetingData: {
                relatedType: "Contact",
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
                      relatedTo: "Contact",
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
                value={selectedStatus || normalizeStatus(selectedContact?.account?.status) || "PROSPECT"}
                onChange={(e) => setSelectedStatus(e.target.value)}
                disabled={updatingStatus || !selectedContact?.account?.id}
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
                  !selectedContact?.account?.id ||
                  normalizeStatus(selectedStatus) === normalizeStatus(selectedContact?.account?.status)
                }
                className={`w-full py-1.5 rounded-md text-sm transition focus:outline-none focus:ring-2 ${
                  updatingStatus ||
                  !selectedStatus ||
                  !selectedContact?.account?.id ||
                  normalizeStatus(selectedStatus) === normalizeStatus(selectedContact?.account?.status)
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
      {contactsLoading && <LoadingSpinner message="Loading contacts..." />}
   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0 w-full">
  <h2 className="flex items-center text-xl sm:text-2xl font-semibold text-gray-800">
    <FiUsers className="mr-2 text-blue-600" /> Contacts Management
  </h2>

  <button
    onClick={handleOpenAddModal}
    className="flex items-center bg-black text-white px-3 sm:px-4 py-2 rounded-md hover:bg-gray-800 text-sm sm:text-base self-end sm:self-auto cursor-pointer"
  >
    <FiPlus className="mr-2" /> Add Contact
  </button>
</div>

      <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex flex-col lg:flex-row items-center justify-between gap-3 w-full">
        <div className="flex items-center border border-gray-300 rounded-lg px-4 h-11 w-full lg:w-3/4 focus-within:ring-2 focus-within:ring-indigo-500 transition">
          <FiSearch size={20} className="text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search contacts"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="focus:outline-none text-base w-full"
          />
        </div>
        <div className="w-full lg:w-1/4">
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 h-11 text-sm text-gray-600 bg-white w-full focus:ring-2 focus:ring-indigo-500 transition"
          >
            {accountOptions.map((option) => (
              <option key={option.value ?? option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border border-gray-200 rounded-lg bg-white shadow-sm text-sm">
          <thead className="bg-gray-100 text-left text-gray-600 text-sm tracking-wide font-semibold">
            <tr>
              <th className="py-3 px-4 truncate">Contact</th>
              <th className="py-3 px-4">Account</th>
              <th className="py-3 px-4 truncate">Contact Info</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Assigned To</th>
              <th className="py-3 px-4">Created</th>
            </tr>
          </thead>
          <tbody>
            {contactsLoading ? (
              <tr>
                <td
                  className="py-4 px-4 text-center text-sm text-gray-500"
                  colSpan={6}
                >
                  Loading contacts...
                </td>
              </tr>
            ) : filteredContacts.length > 0 ? (
              paginatedContacts.map((contact) => {
                const contactInfoItems = [
                  { Icon: FiMail, value: contact.email, key: "email" },
                  {
                    Icon: FiPhone,
                    value: contact.work_phone,
                    key: "work_phone",
                  },
                  {
                    Icon: FiSmartphone,
                    value: contact.mobile_phone_1,
                    key: "mobile_phone_1",
                  },
                  {
                    Icon: FiSmartphone,
                    value: contact.mobile_phone_2,
                    key: "mobile_phone_2",
                  },
                ].filter((item) => Boolean(item.value));

                return (
                  <tr
                    key={contact.id}
                    className="hover:bg-gray-50 text-sm cursor-pointer transition"
                    onClick={() => handleContactClick(contact)}
                  >
                    <td className="py-3 px-4 align-top">
                      <div className="font-medium text-blue-600 hover:underline break-all text-sm">
                        {getContactFullName(contact) || "--"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {contact.title || "No title"}
                      </div>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <BsBuilding className="text-gray-500 flex-shrink-0" />
                        <span className="break-words">
                          {contact.account?.name || "--"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 align-top">
                      {contactInfoItems.length > 0 ? (
                        <div className="space-y-1 text-gray-700">
                          {contactInfoItems.map(({ Icon, value, key }) => (
                            <div
                              key={key}
                              className="flex items-center space-x-2 break-all text-sm"
                            >
                              <Icon className="text-gray-500 flex-shrink-0" />
                              <span>{value}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">--</span>
                      )}
                    </td>
                    <td className="py-3 px-4 align-top">
                      <div className="flex items-center space-x-2 text-gray-700 text-sm">
                        <FiBriefcase className="text-gray-500 flex-shrink-0" />
                        <span>{contact.department || "--"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <div className="flex items-center space-x-2 text-sm">
                        <FiUser className="text-gray-500 flex-shrink-0" />
                        <span>
                          {contact.assigned_contact
                            ? `${contact.assigned_contact.first_name} ${contact.assigned_contact.last_name}`
                            : "Unassigned"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <div className="flex items-center space-x-2 text-gray-500">
                        <FiCalendar className="text-gray-500 flex-shrink-0" />
                        <span className="text-xs">
                          {formattedDateTime(contact.created_at) || "--"}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  className="py-4 px-4 text-center text-sm text-gray-500"
                  colSpan={6}
                >
                  No contacts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <PaginationControls
        className="mt-4"
        totalItems={filteredContacts.length}
        pageSize={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPrev={handlePrevPage}
        onNext={handleNextPage}
        label="contacts"
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
          {isEditing ? "Edit Contact" : "Add New Contact"}
        </h2>

        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
          onSubmit={handleSubmit}
        >
          <InputField
            label="First Name"
            name="first_name"
            value={formData.first_name}
            onChange={handleInputChange}
            placeholder="First name"
            required
            disabled={isSubmitting}
          />
          <InputField
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={handleInputChange}
            placeholder="Last name"
            required
            disabled={isSubmitting}
          />
          <SelectField
            label="Account"
            name="account_id"
            value={formData.account_id}
            onChange={handleInputChange}
            options={[
              { value: "", label: "Select account" },
              ...accounts.map((acc) => ({
                value: String(acc.id),
                label: acc.name,
              })),
            ]}
            required
            disabled={isSubmitting || accounts.length === 0}
          />
          {isEditing && formData.account_id ? (
            <SelectField
              label="Status"
              name="status"
              value={formData.status || normalizeStatus(
                accounts.find((acc) => String(acc.id) === formData.account_id)
                  ?.status || ""
              ) || "PROSPECT"}
              onChange={handleInputChange}
              options={STATUS_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              disabled={isSubmitting || !formData.account_id}
            />
          ) : (
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
          )}
          {isEditing && (
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
          )}
          <InputField
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Job title"
            disabled={isSubmitting}
          />
          <InputField
            label="Department"
            name="department"
            value={formData.department}
            onChange={handleInputChange}
            placeholder="Department"
            disabled={isSubmitting}
          />
          <InputField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="example@email.com"
            disabled={isSubmitting}
          />
          <InputField
            label="Work Phone"
            name="work_phone"
            value={formData.work_phone}
            onChange={handleInputChange}
            placeholder="09xx xxx xxxx"
            disabled={isSubmitting}
          />
          <InputField
            label="Mobile Phone 1"
            name="mobile_phone_1"
            value={formData.mobile_phone_1}
            onChange={handleInputChange}
            placeholder="09xx xxx xxxx"
            disabled={isSubmitting}
          />
          <InputField
            label="Mobile Phone 2"
            name="mobile_phone_2"
            value={formData.mobile_phone_2}
            onChange={handleInputChange}
            placeholder="09xx xxx xxxx"
            disabled={isSubmitting}
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
                  ? "Update Contact"
                  : "Save Contact"}
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

function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  disabled = false,
}) {
  return (
    <div>
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
