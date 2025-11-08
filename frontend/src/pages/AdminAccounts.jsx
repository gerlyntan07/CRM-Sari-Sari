import React, { useCallback, useEffect, useMemo, useState } from "react";
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
} from "react-icons/fi";
import { HiArrowLeft } from "react-icons/hi";
import api from "../api.js";
import { toast } from "react-toastify";

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

export default function AdminAccounts() {
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
  const [territories, setTerritories] = useState([]);
  const [stageFilter, setStageFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmModalData, setConfirmModalData] = useState(null);
  const [confirmProcessing, setConfirmProcessing] = useState(false);

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
        normalizedFilter === "" ||
        normalizeStatus(acc.status) === normalizedFilter;

      return matchesSearch && matchesStage;
    });
  }, [accounts, searchQuery, stageFilter]);

  const handleAccountClick = (acc) => setSelectedAccount(acc);

  const handleBackToList = () => setSelectedAccount(null);

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentAccountId(null);
    setFormData(INITIAL_FORM_STATE);
    setIsSubmitting(false);
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

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      toast.error("Account name is required.");
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
    { label: "All Statuses", value: "" },
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
    <div className="p-4 sm:p-6 lg:p-8 font-inter">
      <div className="mb-6">
        <button
          onClick={handleBackToList}
          className="inline-flex items-center text-sm sm:text-base text-gray-500 hover:text-gray-700 transition mb-4 sm:mb-6 cursor-pointer"
        >
          <HiArrowLeft className="mr-1 w-4 h-4 sm:w-5 sm:h-5" /> Back
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-2">
              {selectedAccount.name}
              <span
                className={`inline-block text-xs px-2 py-0.5 rounded ${detailStatusBadge}`}
              >
                {formatStatusLabel(selectedAccount.status)}
              </span>
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0 mt-3 sm:mt-0">
            <button
              className="inline-flex items-center justify-center w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-70"
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
              className="inline-flex items-center justify-center w-full sm:w-auto bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 disabled:opacity-70"
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
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm overflow-x-auto">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">
          Account Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
          <DetailRow
            label="Website"
            value={
              selectedAccount.website ? (
                <a
                  href={selectedAccount.website}
                  className="text-blue-600 hover:underline break-all"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {selectedAccount.website}
                </a>
              ) : (
                "--"
              )
            }
          />
          <DetailRow
            label="Industry"
            value={selectedAccount.industry || "--"}
          />
          <DetailRow
            label="Territory"
            value={selectedAccount.territory?.name || "--"}
          />
          <DetailRow
            label="Phone Number"
            value={selectedAccount.phone_number || "--"}
          />
          <DetailRow
            label="Billing Address"
            value={selectedAccount.billing_address || "--"}
          />
          <DetailRow
            label="Shipping Address"
            value={selectedAccount.shipping_address || "--"}
          />
          <DetailRow
            label="Assigned To"
            value={
              selectedAccount.assigned_accs
                ? `${selectedAccount.assigned_accs.first_name} ${selectedAccount.assigned_accs.last_name}`
                : "Unassigned"
            }
          />
          <DetailRow
            label="Created By"
            value={
              selectedAccount.acc_creator
                ? `${selectedAccount.acc_creator.first_name} ${selectedAccount.acc_creator.last_name}`
                : "--"
            }
          />
          <DetailRow
            label="Created At"
            value={formattedDateTime(selectedAccount.created_at) || "--"}
          />
          <DetailRow
            label="Last Updated"
            value={formattedDateTime(selectedAccount.updated_at) || "--"}
          />
        </div>
      </div>
    </div>
  ) : null;

  const listView = (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <h1 className="flex items-center text-xl sm:text-2xl font-semibold text-gray-800">
          <FiUsers className="mr-2 text-blue-600" />
          Accounts Management
        </h1>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center bg-black text-white px-3 sm:px-4 py-2 rounded-md hover:bg-gray-800 text-sm sm:text-base ml-auto sm:ml-0"
        >
          <FiPlus className="mr-2" /> Add Account
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
        {metricCards.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex flex-col lg:flex-row items-center justify-between gap-3 w-full">
        <div className="flex items-center border border-gray-300 rounded-lg px-4 h-11 w-full lg:w-3/4 focus-within:ring-2 focus-within:ring-indigo-500 transition">
          <FiSearch size={20} className="text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search by company, website, industry, territory, or phone..."
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
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr>
              <th className="py-3 px-4">Account</th>
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
              filteredAccounts.map((acc) => {
                return (
                  <tr
                    key={acc.id}
                    className="hover:bg-gray-50 text-xs cursor-pointer"
                    onClick={() => handleAccountClick(acc)}
                  >
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-blue-600 hover:underline break-all">
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
                    <td className="py-3 px-4">{acc.industry || "--"}</td>
                    <td className="py-3 px-4">{acc.territory?.name || "--"}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
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
    </div>
  );

  const formModal = showModal ? (
    <div
      id="modalBackdrop"
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
    >
      <div
        className="bg-white w-full max-w-full sm:max-w-3xl rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 relative border border-gray-200 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeModal}
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
        >
          <InputField
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Company name"
            required
            disabled={isSubmitting}
          />
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
          <SelectField
            label="Territory"
            name="territory_id"
            value={formData.territory_id}
            onChange={handleInputChange}
            options={[
              { value: "", label: "No Territory" },
              ...territories.map((territory) => ({
                value: String(territory.id),
                label: territory.name,
              })),
            ]}
            disabled={isSubmitting || territories.length === 0}
          />

          <div className="flex flex-col sm:flex-row justify-end sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2 col-span-1 md:col-span-2 mt-4 w-full">
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
      {selectedAccount ? detailView : listView}
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
      className="flex items-center p-4 bg-white rounded-xl shadow-md hover:shadow-lg hover:ring-2 hover:ring-blue-500 cursor-pointer transition-all duration-300"
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
