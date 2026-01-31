import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  FiCheckSquare,
  FiFileText,
  FiChevronDown,
  FiChevronRight,
} from "react-icons/fi";
import { HiX } from "react-icons/hi";
import { BsBuilding } from "react-icons/bs";
import api from "../api.js";
import { toast } from "react-toastify";
import PaginationControls from "../components/PaginationControls.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { useLocation, useNavigate } from "react-router-dom";

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
};

const getContactFullName = (contact) =>
  [contact?.first_name, contact?.last_name].filter(Boolean).join(" ").trim();

const formattedDateTime = (datetime) => {
  if (!datetime) return "";
  return new Date(datetime)
    .toLocaleString("en-US", {
      month: "short",
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
  const location = useLocation();

  useEffect(() => {
    document.title = "Contacts | Sari-Sari CRM";
  }, []);

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
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [relatedActs, setRelatedActs] = useState({});
  const [expandedSection, setExpandedSection] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [pendingContactId, setPendingContactId] = useState(null);

  useEffect(() => {
    const contactIdFromState = location.state?.contactID;
    if (contactIdFromState) {
      // If contactID is passed from another page (e.g., AdminAccounts), store it
      setPendingContactId(contactIdFromState);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (pendingContactId && contacts.length > 0 && !contactsLoading) {
      const foundContact = contacts.find(
        (contact) => contact.id === pendingContactId,
      );
      if (foundContact) {
        setSelectedContact(foundContact); // Open in view mode
      } else {
        toast.error("Contact not found.");
      }
      setPendingContactId(null); // Clear pending contact ID
    }
  }, [pendingContactId, contacts, contactsLoading]);

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
        if (preserveSelectedId) {
          const updatedSelection = sorted.find(
            (contact) => contact.id === preserveSelectedId,
          );
          setSelectedContact(updatedSelection || null);
        }
      } catch (err) {
        console.error(err);
        setContacts([]);
        if (err.response?.status === 403) {
          toast.error(
            "Permission denied. Only CEO, Admin, or Group Manager can access this page.",
          );
        } else {
          toast.error("Failed to fetch contacts. Please try again later.");
        }
      } finally {
        setContactsLoading(false);
      }
    },
    [setSelectedContact],
  );

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await api.get(`/accounts/admin/fetch-all`);
      const data = Array.isArray(res.data) ? res.data : [];
      const sorted = [...data].sort((a, b) =>
        (a?.name || "").localeCompare(b?.name || ""),
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
        getContactFullName(a).localeCompare(getContactFullName(b)),
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

  const fetchRelatedActivities = useCallback(async (contact_id) => {
    try {
      const res = await api.get(`/activities/contact/${contact_id}`);
      setRelatedActs(res.data && typeof res.data === "object" ? res.data : {});
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) {
        console.warn("No activities found for this account.");
        setRelatedActs({});
      }
    }
  }, []);

  useEffect(() => {
    fetchContacts();
    fetchAccounts();
    fetchUsers();
  }, [fetchContacts, fetchAccounts, fetchUsers]);

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
    return [
      { value: "Filter by Accounts", label: "Filter by Accounts" },
      ...options,
    ];
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
    Math.ceil(filteredContacts.length / itemsPerPage) || 1,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, accountFilter, itemsPerPage]);

  useEffect(() => {
    setCurrentPage((prev) => {
      const maxPage = Math.max(
        1,
        Math.ceil(filteredContacts.length / itemsPerPage) || 1,
      );
      return prev > maxPage ? maxPage : prev;
    });
  }, [filteredContacts.length, itemsPerPage]);

  const paginatedContacts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredContacts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredContacts, currentPage, itemsPerPage]);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = paginatedContacts.map((c) => c.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleCheckboxChange = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((prevId) => prevId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    setConfirmModalData({
      title: "Delete Contacts",
      message: (
        <span>
          Are you sure you want to delete{" "}
          <span className="font-semibold">{selectedIds.length}</span> selected
          contacts? This action cannot be undone.
        </span>
      ),
      confirmLabel: `Delete ${selectedIds.length} Contact(s)`,
      cancelLabel: "Cancel",
      variant: "danger",
      action: {
        type: "bulk-delete",
        contact_ids: selectedIds,
      },
    });
  };

  const closeModal = useCallback(() => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentContactId(null);
    setFormData(INITIAL_FORM_STATE);
    setIsSubmitting(false);
    setIsSubmitted(false);
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

  //validation
  const [isSubmitted, setIsSubmitted] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);

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
    const assignedTo = formData.assigned_to;
    if (!assignedTo) {
      toast.error("Assigned To is required.");
      return;
    }

    const email = formData.email?.trim();

    if (!email) {
      toast.error("Email is required.");
      return;
    }

    if (!email.includes("@")) {
      toast.error("Email must contain '@'.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    };
    
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
      } else if (type === "bulk-delete") {
        const contactIds = action.contact_ids;
        await api.delete("/contacts/admin/bulk-delete", {
          data: { contact_ids: contactIds },
        });
        toast.success(`Successfully deleted ${contactIds.length} contacts`);
        setSelectedIds([]);
        await fetchContacts();
      }
    } catch (err) {
      console.error(err);
      const defaultMessage =
        type === "create"
          ? "Failed to create contact. Please review the details and try again."
          : type === "update"
            ? "Failed to update contact. Please review the details and try again."
            : type === "bulk-delete"
              ? "Failed to delete selected contacts."
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
        <div className="flex flex-col md:flex-row md:justify-between lg:flex-row lg:items-center lg:justify-between mt-3 gap-2 px-2 md:items-center lg:gap-4 md:mx-7 lg:mx-7">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
              {getContactFullName(selectedContact) || "Unnamed contact"}
            </h1>
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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 px-2 lg:gap-4 md:mx-7 lg:mx-7">
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
                      <p>
                        {formattedDateTime(selectedContact.created_at) || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">Last Updated:</p>
                      <p>
                        {formattedDateTime(selectedContact.updated_at) || "N/A"}
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
                      Contact Note
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
                      {selectedContact.notes || "No notes available."}
                    </div>
                  </div>
                </div>
              )}

              {/* ACTIVITIES */}
              {activeTab === "Activities" && (
                <div className="space-y-2 w-full h-full max-h-[50dvh] overflow-y-auto bg-gray-50 p-2 hide-scrollbar rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 break-words border-b border-gray-300 py-2">
                    Related Activities
                  </h3>

                  <div className="space-y-2 text-sm">
                    {/* TASKS */}
                    {relatedActs.tasks && relatedActs.tasks.length > 0 && (
                      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedSection(
                              expandedSection === "tasks" ? null : "tasks",
                            )
                          }
                          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <FiCheckSquare className="text-blue-600" />
                            <span className="font-semibold text-gray-700">
                              Tasks ({relatedActs.tasks.length})
                            </span>
                          </div>
                          {expandedSection === "tasks" ? (
                            <FiChevronDown className="text-gray-500" />
                          ) : (
                            <FiChevronRight className="text-gray-500" />
                          )}
                        </button>
                        {expandedSection === "tasks" && (
                          <div className="border-t border-gray-200 p-2 space-y-2 max-h-60 overflow-y-auto hide-scrollbar">
                            {relatedActs.tasks.map((task, idx) => (
                              <div
                                key={`task-${idx}`}
                                className="flex flex-col sm:flex-row justify-between items-start border border-gray-100 rounded-lg p-3 bg-gray-50 w-full break-words cursor-pointer"
                                onClick={() =>
                                  navigate(`/admin/tasks`, {
                                    state: { taskID: task.id },
                                  })
                                }
                              >
                                <div className="flex gap-3 mb-2 sm:mb-0 flex-1 min-w-0">
                                  <div className="text-blue-600 mt-1">
                                    <FiCheckSquare size={20} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-blue-600 break-words text-sm">
                                      {task.subject || task.title || "Task"}
                                    </h4>
                                    <p className="text-gray-500 break-words text-xs">
                                      {task.description || "No description"}
                                    </p>
                                    {task.assigned_to && (
                                      <p className="text-xs text-gray-600 mt-1">
                                        Assigned: {task.assigned_to.first_name}{" "}
                                        {task.assigned_to.last_name}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 break-words">
                                  {formattedDateTime(
                                    task.due_date || task.created_at,
                                  )}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* MEETINGS */}
                    {relatedActs.meetings &&
                      relatedActs.meetings.length > 0 && (
                        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedSection(
                                expandedSection === "meetings"
                                  ? null
                                  : "meetings",
                              )
                            }
                            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <FiCalendar className="text-green-600" />
                              <span className="font-semibold text-gray-700">
                                Meetings ({relatedActs.meetings.length})
                              </span>
                            </div>
                            {expandedSection === "meetings" ? (
                              <FiChevronDown className="text-gray-500" />
                            ) : (
                              <FiChevronRight className="text-gray-500" />
                            )}
                          </button>
                          {expandedSection === "meetings" && (
                            <div className="border-t border-gray-200 p-2 space-y-2 max-h-60 overflow-y-auto hide-scrollbar">
                              {relatedActs.meetings.map((meeting, idx) => (
                                <div
                                  key={`meeting-${idx}`}
                                  className="flex flex-col sm:flex-row justify-between items-start border border-gray-100 rounded-lg p-3 bg-gray-50 w-full break-words cursor-pointer" onClick={() => navigate(`/admin/meetings`, { state: { meetingID: meeting.id } })}
                                >
                                  <div className="flex gap-3 mb-2 sm:mb-0 flex-1 min-w-0">
                                    <div className="text-green-600 mt-1">
                                      <FiCalendar size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-blue-600 break-words text-sm">
                                        {meeting.subject ||
                                          meeting.title ||
                                          "Meeting"}
                                      </h4>
                                      <p className="text-gray-500 break-words text-xs">
                                        {meeting.description ||
                                          meeting.location ||
                                          "No description"}
                                      </p>
                                      {meeting.host && (
                                        <p className="text-xs text-gray-600 mt-1">
                                          Host: {meeting.host.first_name}{" "}
                                          {meeting.host.last_name}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-500 break-words">
                                    {formattedDateTime(
                                      meeting.start_time || meeting.created_at,
                                    )}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                    {/* CALLS */}
                    {relatedActs.calls && relatedActs.calls.length > 0 && (
                      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedSection(
                              expandedSection === "calls" ? null : "calls",
                            )
                          }
                          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <FiPhone className="text-purple-600" />
                            <span className="font-semibold text-gray-700">
                              Calls ({relatedActs.calls.length})
                            </span>
                          </div>
                          {expandedSection === "calls" ? (
                            <FiChevronDown className="text-gray-500" />
                          ) : (
                            <FiChevronRight className="text-gray-500" />
                          )}
                        </button>
                        {expandedSection === "calls" && (
                          <div className="border-t border-gray-200 p-2 space-y-2 max-h-60 overflow-y-auto hide-scrollbar">
                            {relatedActs.calls.map((call, idx) => (
                              <div
                                key={`call-${idx}`}
                                className="flex flex-col sm:flex-row justify-between items-start border border-gray-100 rounded-lg p-3 bg-gray-50 w-full break-words cursor-pointer" onClick={() => navigate(`/admin/calls`, { state: { callID: call.id } })}
                              >
                                <div className="flex gap-3 mb-2 sm:mb-0 flex-1 min-w-0">
                                  <div className="text-purple-600 mt-1">
                                    <FiPhone size={20} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-blue-600 break-words text-sm">
                                      {call.subject || call.title || "Call"}
                                    </h4>
                                    <p className="text-gray-500 break-words text-xs">
                                      {call.direction || ""}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 break-words">
                                  {formattedDateTime(
                                    call.call_time || call.created_at,
                                  )}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* DEALS */}
                    {relatedActs.deals && relatedActs.deals.length > 0 && (
                      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedSection(
                              expandedSection === "deals" ? null : "deals",
                            )
                          }
                          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <FiBriefcase className="text-indigo-600" />
                            <span className="font-semibold text-gray-700">
                              Deals ({relatedActs.deals.length})
                            </span>
                          </div>
                          {expandedSection === "deals" ? (
                            <FiChevronDown className="text-gray-500" />
                          ) : (
                            <FiChevronRight className="text-gray-500" />
                          )}
                        </button>
                        {expandedSection === "deals" && (
                          <div className="border-t border-gray-200 p-2 space-y-2 max-h-60 overflow-y-auto hide-scrollbar">
                            {relatedActs.deals.map((deal, idx) => (
                              <div
                                key={`deal-${idx}`}
                                className="flex flex-col sm:flex-row justify-between items-start border border-gray-100 rounded-lg p-3 bg-gray-50 w-full break-words cursor-pointer" onClick={() => navigate(`/admin/deals`, { state: { dealID: deal.id } })}
                              >
                                <div className="flex gap-3 mb-2 sm:mb-0 flex-1 min-w-0">
                                  <div className="text-indigo-600 mt-1">
                                    <FiBriefcase size={20} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-blue-600 break-words text-sm">
                                      {deal.deal_id
                                        ? deal.deal_id.replace(
                                            /D(\d+)-\d+-/,
                                            "D$1-",
                                          )
                                        : "--"}{" "}
                                      {deal.name || deal.title || "Deal"}
                                    </h4>
                                    <p className="text-xs text-gray-500 break-words capitalize">
                                      {deal.stage ||
                                        deal.description ||
                                        "No description"}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 break-words">
                                  {formattedDateTime(
                                    deal.close_date || deal.created_at,
                                  )}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* QUOTES */}
                    {relatedActs.quotes && relatedActs.quotes.length > 0 && (
                      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedSection(
                              expandedSection === "quotes" ? null : "quotes",
                            )
                          }
                          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <FiFileText className="text-orange-600" />
                            <span className="font-semibold text-gray-700">
                              Quotes ({relatedActs.quotes.length})
                            </span>
                          </div>
                          {expandedSection === "quotes" ? (
                            <FiChevronDown className="text-gray-500" />
                          ) : (
                            <FiChevronRight className="text-gray-500" />
                          )}
                        </button>
                        {expandedSection === "quotes" && (
                          <div className="border-t border-gray-200 p-2 space-y-2 max-h-60 overflow-y-auto hide-scrollbar">
                            {relatedActs.quotes.map((quote, idx) => (
                              <div
                                key={`quote-${idx}`}
                                className="flex flex-col sm:flex-row justify-between items-start border border-gray-100 rounded-lg p-3 bg-gray-50 w-full break-words cursor-pointer" onClick={() => navigate(`/admin/quotes`, { state: { quoteID: quote.id } })}
                              >
                                <div className="flex gap-3 mb-2 sm:mb-0 flex-1 min-w-0">
                                  <div className="text-orange-600 mt-1">
                                    <FiFileText size={20} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-blue-600 break-words text-sm">
                                      {(quote.quote_id
                                        ? quote.quote_id.replace(
                                            /Q(\d+)-\d+-/,
                                            "Q$1-",
                                          )
                                        : "--") || "Quote"}
                                    </h4>
                                    <p className="text-xs text-gray-500 break-words">
                                      {quote.status || ""}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 break-words">
                                  {formattedDateTime(quote.presented_date) ||
                                    ""}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* No activities message */}
                    {(!relatedActs ||
                      ((!relatedActs.tasks || relatedActs.tasks.length === 0) &&
                        (!relatedActs.meetings ||
                          relatedActs.meetings.length === 0) &&
                        (!relatedActs.calls ||
                          relatedActs.calls.length === 0) &&
                        (!relatedActs.quotes ||
                          relatedActs.quotes.length === 0) &&
                        (!relatedActs.deals ||
                          relatedActs.deals.length === 0) &&
                        (!relatedActs.contacts ||
                          relatedActs.contacts.length === 0))) && (
                      <div className="text-center py-8 text-gray-500">
                        <p>No related activities found for this account.</p>
                      </div>
                    )}
                  </div>
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
                          openCallModal: true,
                          initialCallData: {
                            subject: `Call with ${getContactFullName(selectedContact) || ""}`.trim(),
                            relatedType1: "Account",
                            relatedTo1: selectedContact?.account_id
                              ? String(selectedContact.account_id)
                              : selectedContact?.account?.id
                                ? String(selectedContact.account.id)
                                : "",
                            relatedType2: "Contact",
                            relatedTo2: selectedContact?.id
                              ? String(selectedContact.id)
                              : "",
                            assigned_to: selectedContact?.assigned_contact?.id
                              ? String(selectedContact.assigned_contact.id)
                              : "",
                            direction: "Outgoing",
                            status: "Planned",
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

                      const mailtoUrl = `mailto:${to}?subject=${subject}&body=${body}`;

                      // Opens user's default email client
                      window.location.href = mailtoUrl;
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
                            subject: `Meeting with ${getContactFullName(selectedContact) || ""}`.trim(),
                            relatedType1: "Account",
                            relatedTo1: selectedContact?.account_id
                              ? String(selectedContact.account_id)
                              : selectedContact?.account?.id
                                ? String(selectedContact.account.id)
                                : "",
                            relatedType2: "Contact",
                            relatedTo2: selectedContact?.id
                              ? String(selectedContact.id)
                              : "",
                            assignedTo: selectedContact?.assigned_contact?.id
                              ? String(selectedContact.assigned_contact.id)
                              : "",
                            status: "Planned",
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
                            subject: `Task for ${getContactFullName(selectedContact) || ""}`.trim(),
                            relatedType1: "Account",
                            relatedTo1: selectedContact?.account_id
                              ? String(selectedContact.account_id)
                              : selectedContact?.account?.id
                                ? String(selectedContact.account.id)
                                : "",
                            relatedType2: "Contact",
                            relatedTo2: selectedContact?.id
                              ? String(selectedContact.id)
                              : "",
                            assignedTo: selectedContact?.assigned_contact?.id
                              ? String(selectedContact.assigned_contact.id)
                              : "",
                            priority: "NORMAL",
                            status: "Not Started",
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
        <div className="flex justify-center lg:justify-end w-full sm:w-auto">
          <button
            onClick={() => {
              handleOpenAddModal(); // open the modal
              setIsSubmitted(false); // reset all error borders
            }}
            className="flex items-center bg-black text-white px-3 sm:px-4 py-2 rounded-md hover:bg-gray-800 text-sm sm:text-base self-end sm:self-auto cursor-pointer"
          >
            <FiPlus className="mr-2" /> Add Contact
          </button>
        </div>
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
              <th className="py-3 px-4 text-center w-12">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  checked={
                    paginatedContacts.length > 0 &&
                    selectedIds.length === paginatedContacts.length
                  }
                  onChange={handleSelectAll}
                />
              </th>
              <th className="py-3 px-4 truncate">Contact</th>
              <th className="py-3 px-4">Account</th>
              <th className="py-3 px-4 truncate">Contact Info</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Assigned To</th>
              <th className="py-3 px-4">Created</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-center w-24">
                {selectedIds.length > 0 ? (
                  <button
                    onClick={handleBulkDelete}
                    className="text-red-600 hover:text-red-800 transition p-1 rounded-full hover:bg-red-50"
                    title={`Delete ${selectedIds.length} selected items`}
                  >
                    <FiTrash2 size={18} />
                  </button>
                ) : (
                  ""
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {contactsLoading ? (
              <tr>
                <td
                  className="py-4 px-4 text-center text-sm text-gray-500"
                  colSpan={9}
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
                    onClick={(e) => {
                      // Prevent row click when clicking checkbox or action buttons
                      if (
                        e.target.closest('input[type="checkbox"]') ||
                        e.target.closest("button")
                      ) {
                        return;
                      }
                      handleContactClick(contact);
                      fetchRelatedActivities(contact.id);
                    }}
                  >
                    <td className="py-3 px-4 text-center align-top">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={selectedIds.includes(contact.id)}
                        onChange={() => handleCheckboxChange(contact.id)}
                      />
                    </td>
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
                          {contactInfoItems.map(({ Icon, value, key }) => {
                            const iconNode = React.createElement(Icon, {
                              className: "text-gray-500 flex-shrink-0",
                            });

                            return (
                              <div
                                key={key}
                                className="flex items-center space-x-2 break-all text-sm"
                              >
                                {iconNode}
                                <span>{value}</span>
                              </div>
                            );
                          })}
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
                    <td className="py-3 px-4 align-top">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          contact.status === "Inactive"
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {contact.status || "Active"}
                      </span>
                    </td>
                    <td className="py-3 px-4 align-top"></td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  className="py-4 px-4 text-center text-sm text-gray-500"
                  colSpan={9}
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
        pageSize={itemsPerPage}
        currentPage={currentPage}
        onPrev={handlePrevPage}
        onNext={handleNextPage}
        onPageSizeChange={(newSize) => {
          setItemsPerPage(newSize);
          setCurrentPage(1);
        }}
        pageSizeOptions={[10, 20, 30, 40, 50]}
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
          onClick={() => {
            closeModal(); // close the modal
            setIsSubmitted(false); // reset validation errors
          }}
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
          noValidate
        >
          <InputField
            label="First Name"
            name="first_name"
            value={formData.first_name}
            onChange={handleInputChange}
            placeholder="First name"
            required
            isSubmitted={isSubmitted}
          />

          <InputField
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={handleInputChange}
            placeholder="Last name"
            required
            isSubmitted={isSubmitted}
          />

          <SearchableSelectField
            label="Account"
            value={formData.account_id}
            onChange={(newId) =>
              setFormData((prev) => ({
                ...prev,
                account_id: newId,
              }))
            }
            items={accounts || []}
            getLabel={(item) => item?.name ?? ""}
            placeholder="Search account..."
            required={true} // <-- use required directly
            isSubmitted={isSubmitted}
            disabled={isSubmitting || accounts.length === 0}
          />

          <SearchableSelectField
            label="Assigned To"
            value={formData.assigned_to}
            onChange={(newId) =>
              setFormData((prev) => ({
                ...prev,
                assigned_to: newId,
              }))
            }
            items={users || []}
            getLabel={(item) =>
              `${item?.first_name ?? ""} ${item?.last_name ?? ""} (${item?.role ?? ""})`.trim()
            }
            placeholder="Search assignee..."
            required={true} // <-- use required directly
            isSubmitted={isSubmitted}
            disabled={isSubmitting || users.length === 0}
          />

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
            required
            isSubmitted={isSubmitted}
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
              onClick={() => {
                closeModal(); // close the modal
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
  isSubmitted = false,
  className = "", // <-- add this line
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
          ${
            hasError
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:ring-blue-400"
          }
          ${className}
        `}
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
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
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
          ${
            hasError
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:ring-blue-400"
          }`}
      />

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
          <div className="max-h-56 overflow-y-auto">
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
