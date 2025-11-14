import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiShield,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiUserPlus,
  FiX,
} from "react-icons/fi";
import { HiArrowLeft } from "react-icons/hi";
import { toast } from "react-toastify";
import api from "../api";
import useFetchUser from "../hooks/useFetchUser";
import PaginationControls from "../components/PaginationControls.jsx";

const ROLE_OPTIONS = [
  { value: "CEO", label: "CEO" },
  { value: "Group Manager", label: "Group Manager" },
  { value: "Manager", label: "Manager" },
  { value: "Marketing", label: "Marketing" },
  { value: "Sales", label: "Sales" },
];

const INITIAL_FORM_STATE = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "",
};

const ROLE_BADGE_CLASS = {
  CEO: "bg-purple-100 text-purple-700",
  ADMIN: "bg-purple-100 text-purple-700",
  GROUP_MANAGER: "bg-indigo-100 text-indigo-700",
  MANAGER: "bg-blue-100 text-blue-700",
  MARKETING: "bg-yellow-100 text-yellow-700",
  SALES: "bg-green-100 text-green-700",
};

const normalizeRoleValue = (role) => {
  if (!role) return "";
  return role
    .toString()
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/\s+/g, "_")
    .toUpperCase();
};

const resolveRoleValue = (role) => {
  const normalized = normalizeRoleValue(role);
  if (normalized === "ADMIN") return "CEO";
  const option = ROLE_OPTIONS.find(
    (opt) => normalizeRoleValue(opt.value) === normalized
  );
  return option ? option.value : role || "";
};

const formatRoleLabel = (role) => {
  const normalized = normalizeRoleValue(role);
  if (normalized === "ADMIN") return "CEO";
  const match = ROLE_OPTIONS.find(
    (option) => normalizeRoleValue(option.value) === normalized
  );
  if (match) return match.label;
  if (typeof role === "string") {
    return role.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  }
  return "--";
};

const formatDateTime = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date
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

const renderRoleBadge = (role, { size = "sm" } = {}) => {
  const roleKey = normalizeRoleValue(role);
  const badgeClass = ROLE_BADGE_CLASS[roleKey] || "bg-gray-100 text-gray-700";
  const sizeClasses =
    size === "lg"
      ? "px-3 py-1 text-sm"
      : size === "md"
      ? "px-2.5 py-1 text-sm"
      : "px-2 py-1 text-xs";
  return (
    <span
      className={`${sizeClasses} font-semibold rounded-md inline-flex items-center justify-center ${badgeClass}`}
    >
      {formatRoleLabel(role)}
    </span>
  );
};

const ITEMS_PER_PAGE = 10;

const getUserInitials = (firstName, lastName) => {
  const first = firstName?.trim()?.[0] ?? "";
  const last = lastName?.trim()?.[0] ?? "";
  const initials = `${first}${last}`.toUpperCase();
  return initials || "U";
};

const sortUsers = (list) =>
  [...list].sort((a, b) => {
    const nameA = `${a.first_name || ""} ${a.last_name || ""}`
      .trim()
      .toLowerCase();
    const nameB = `${b.first_name || ""} ${b.last_name || ""}`
      .trim()
      .toLowerCase();
    return nameA.localeCompare(nameB);
  });

export default function AdminUser() {
  const { user: currentUser, loading: userLoading } = useFetchUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState(null);
  const [confirmProcessing, setConfirmProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const normalizedUserRole = normalizeRoleValue(currentUser?.role);
  const isAuthorized = ["ADMIN", "CEO"].includes(normalizedUserRole);
  const shouldShowContent = !userLoading && isAuthorized;

  const roleFilterOptions = useMemo(() => {
    const otherRoles = ROLE_OPTIONS.filter((option) => {
      const normalizedValue = normalizeRoleValue(option.value);
      return normalizedValue !== "CEO";
    });

    return [
      { label: "All Roles", value: "" },
      { label: "CEO", value: "CEO" },
      ...otherRoles,
    ];
  }, []);

  const flashHighlight = useCallback((userId) => {
    if (!userId) return;
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, highlight: true } : user
      )
    );
    setTimeout(() => {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, highlight: false } : user
        )
      );
    }, 2000);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/users/all");
      const data = Array.isArray(res.data) ? res.data : [];
      const sorted = sortUsers(data);
      setUsers(sorted);
      setSelectedUser((prev) => {
        if (!prev) return prev;
        const updated = sorted.find((user) => user.id === prev.id);
        return updated || null;
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      const message =
        error.response?.data?.detail ||
        "Failed to load users. Please try again later.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userLoading && !isAuthorized && currentUser) {
      toast.error("You are not authorized to access User Management.");
    }
  }, [isAuthorized, userLoading, currentUser]);

  useEffect(() => {
    if (userLoading || !isAuthorized) return;
    fetchUsers();
  }, [userLoading, isAuthorized, fetchUsers]);

  useEffect(() => {
    document.title = "User Management | Sari-Sari CRM";
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const normalizedFilter = normalizeRoleValue(roleFilter);
    return sortUsers(
      users.filter((user) => {
        if (user?.is_active === false) return false;
        const matchesSearch =
          normalizedQuery === "" ||
          [
            user.first_name,
            user.last_name,
            `${user.first_name || ""} ${user.last_name || ""}`,
            user.email,
            formatRoleLabel(user.role),
          ]
            .filter(Boolean)
            .some((field) =>
              field.toString().toLowerCase().includes(normalizedQuery)
            );
        const matchesRole =
          normalizedFilter === "" ||
          (normalizedFilter === "CEO" &&
            ["CEO", "ADMIN"].includes(normalizeRoleValue(user.role))) ||
          normalizeRoleValue(user.role) === normalizedFilter;
        return matchesSearch && matchesRole;
      })
    );
  }, [users, searchQuery, roleFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) || 1
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);

  useEffect(() => {
    setCurrentPage((prev) => {
      const maxPage = Math.max(
        1,
        Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) || 1
      );
      return prev > maxPage ? maxPage : prev;
    });
  }, [filteredUsers.length]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const pageStart =
    filteredUsers.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  if (userLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 font-inter">
        <p className="text-sm text-gray-500">Loading user information...</p>
      </div>
    );
  }

  if (!shouldShowContent) {
    return null;
  }

  const handleOpenCreate = () => {
    setFormData(INITIAL_FORM_STATE);
    setIsEditing(false);
    setCurrentUserId(null);
    setShowFormModal(true);
  };

  const handleRowClick = (user) => {
    setSelectedUser(user);
  };

  const handleBackToList = () => {
    setSelectedUser(null);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGeneratePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 10; i += 1) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    handleFormChange("password", pass);
  };

  const handleCloseFormModal = () => {
    if (isSubmitting || confirmProcessing) return;
    setShowFormModal(false);
    setFormData(INITIAL_FORM_STATE);
    setCurrentUserId(null);
    setIsEditing(false);
  };

  const handleEditClick = (user) => {
    setFormData({
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      email: user.email || "",
      password: "",
      role: resolveRoleValue(user.role),
    });
    setIsEditing(true);
    setCurrentUserId(user.id);
    setShowFormModal(true);
  };

  const handleDeleteClick = (user) => {
    setConfirmModalData({
      title: "Delete User",
      message: (
        <span>
          Are you sure you want to delete{" "}
          <span className="font-semibold">
            {user.first_name} {user.last_name}
          </span>
          ? This action cannot be undone.
        </span>
      ),
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      variant: "danger",
      action: {
        type: "delete",
        targetId: user.id,
        name:
          `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
          user.email ||
          "user",
      },
    });
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    const trimmedFirst = formData.firstName.trim();
    const trimmedLast = formData.lastName.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedPassword = formData.password.trim();
    const selectedRole = formData.role;
    const isCreating = !(isEditing && currentUserId);

    if (!trimmedFirst || !trimmedEmail || !selectedRole) {
      toast.warn("Please fill in all required fields.");
      return;
    }

    if (isCreating && !trimmedPassword) {
      toast.warn("Please fill in all required fields.");
      return;
    }

    if (trimmedPassword && trimmedPassword.length < 6) {
      toast.warn("Password should be at least 6 characters long.");
      return;
    }

    const payload = {
      first_name: trimmedFirst,
      last_name: trimmedLast,
      email: trimmedEmail,
      role: selectedRole,
    };

    if (isCreating || trimmedPassword) {
      payload.password = trimmedPassword;
    }

    const fullName = `${trimmedFirst} ${trimmedLast}`.trim();
    const actionType = isCreating ? "create" : "update";

    setConfirmModalData({
      title:
        actionType === "create" ? "Confirm New User" : "Confirm User Update",
      message:
        actionType === "create" ? (
          <span>
            Create user <span className="font-semibold">{fullName}</span> with
            role{" "}
            <span className="font-semibold">
              {formatRoleLabel(selectedRole)}
            </span>
            ?
          </span>
        ) : (
          <span>
            Save changes for{" "}
            <span className="font-semibold">{fullName || trimmedEmail}</span>?
          </span>
        ),
      confirmLabel: actionType === "create" ? "Create User" : "Update User",
      cancelLabel: "Cancel",
      variant: "primary",
      action: {
        type: actionType,
        payload,
        targetId: currentUserId,
        name: fullName || trimmedEmail,
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
    if (type === "create" || type === "update") {
      setIsSubmitting(true);
    }

    try {
      if (type === "create") {
        const res = await api.post("/users/createuser", payload);
        const createdUser = res.data;
        await fetchUsers();
        flashHighlight(createdUser.id);
        toast.success(`User "${name}" created successfully.`);
        setShowFormModal(false);
        setFormData(INITIAL_FORM_STATE);
        setCurrentUserId(null);
        setIsEditing(false);
      } else if (type === "update") {
        if (!targetId) {
          throw new Error("Missing user identifier for update.");
        }
        const res = await api.put(`/users/updateuser/${targetId}`, payload);
        const updatedUser = res.data;
        await fetchUsers();
        setSelectedUser(null);
        flashHighlight(updatedUser.id);
        toast.success(`User "${name}" updated successfully.`);
        setShowFormModal(false);
        setFormData(INITIAL_FORM_STATE);
        setCurrentUserId(null);
        setIsEditing(false);
      } else if (type === "delete") {
        if (!targetId) {
          throw new Error("Missing user identifier for deletion.");
        }
        await api.delete(`/users/deleteuser/${targetId}`);
        await fetchUsers();
        setSelectedUser((prevSelected) =>
          prevSelected && prevSelected.id === targetId ? null : prevSelected
        );
        toast.success(`User "${name}" deactivated successfully.`);
      }
    } catch (error) {
      console.error("User management error:", error);
      const defaultMessage =
        type === "create"
          ? "Failed to create user. Please review the details and try again."
          : type === "update"
          ? "Failed to update user. Please review the details and try again."
          : "Failed to delete user. Please try again.";
      const message = error.response?.data?.detail || defaultMessage;
      toast.error(message);
    } finally {
      if (type === "create" || type === "update") {
        setIsSubmitting(false);
      }
      setConfirmProcessing(false);
      setConfirmModalData(null);
    }
  };

  const handleCancelConfirm = () => {
    if (confirmProcessing) return;
    setConfirmModalData(null);
  };

  const listView = (
    <div className="p-4 sm:p-6 lg:p-8 font-inter">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="flex items-center text-xl sm:text-2xl font-semibold text-gray-800">
          <FiShield className="mr-2 text-blue-600" />
          User Management
        </h1>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 text-sm sm:text-base"
        >
          <FiUserPlus className="mr-2" /> Add User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6 flex flex-col lg:flex-row items-center justify-between gap-3 w-full">
        <div className="flex items-center border border-gray-300 rounded-lg px-4 h-11 w-full lg:w-3/4 focus-within:ring-2 focus-within:ring-indigo-500 transition">
          <FiSearch size={20} className="text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="focus:outline-none text-base w-full"
          />
        </div>
        <div className="w-full lg:w-1/4">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 h-11 text-sm text-gray-600 bg-white w-full focus:ring-2 focus:ring-indigo-500 transition"
          >
            {roleFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
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
              <th className="py-3 px-4">Fullname</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Role</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  className="py-4 px-4 text-center text-sm text-gray-500"
                  colSpan={3}
                >
                  Loading users...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td
                  className="py-4 px-4 text-center text-sm text-gray-400"
                  colSpan={3}
                >
                  No users found.
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => {
                return (
                  <tr
                    key={user.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      user.highlight ? "bg-green-50" : ""
                    }`}
                  >
                    <td
                      className="py-3 px-4 cursor-pointer"
                      onClick={() => handleRowClick(user)}
                    >
                      <div className="font-medium text-blue-600 hover:underline">
                        {user.first_name} {user.last_name}
                      </div>
                    </td>
                    <td
                      className="py-3 px-4 cursor-pointer"
                      onClick={() => handleRowClick(user)}
                    >
                      {user.email}
                    </td>
                    <td
                      className="py-3 px-4 cursor-pointer"
                      onClick={() => handleRowClick(user)}
                    >
                      {renderRoleBadge(user.role)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <PaginationControls
        className="mt-4"
        totalItems={filteredUsers.length}
        pageSize={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPrev={handlePrevPage}
        onNext={handleNextPage}
        label="users"
      />
    </div>
  );

  const detailView = selectedUser ? (
    <div className="p-4 sm:p-6 lg:p-8 font-inter">
      <button
        onClick={handleBackToList}
        className="inline-flex items-center text-sm sm:text-base text-gray-500 hover:text-gray-700 transition mb-4 sm:mb-6 cursor-pointer"
      >
        <HiArrowLeft className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
        Back
      </button>
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            {selectedUser.profile_picture ? (
              <img
                src={selectedUser.profile_picture}
                alt={`${selectedUser.first_name} ${selectedUser.last_name}`}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border border-gray-200 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xl sm:text-2xl font-semibold border border-gray-200 shadow-sm">
                {getUserInitials(
                  selectedUser.first_name,
                  selectedUser.last_name
                )}
              </div>
            )}
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
                  {selectedUser.first_name} {selectedUser.last_name}
                </h2>
                {renderRoleBadge(selectedUser.role, { size: "md" })}
              </div>
              <p className="text-sm text-gray-500 break-all mt-1">
                {selectedUser.email}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
            <button
              type="button"
              className="inline-flex items-center justify-center w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={() => handleEditClick(selectedUser)}
            >
              <FiEdit2 className="mr-2" />
              Edit
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 rounded-md text-sm bg-red-500 text-white hover:bg-red-600 transition focus:outline-none focus:ring-2 focus:ring-red-400"
              onClick={() => handleDeleteClick(selectedUser)}
            >
              <FiTrash2 className="mr-2" />
              Delete
            </button>
          </div>
        </div>
        <div className="mt-6 border-t.border-gray-200 pt-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
            User Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
            <DetailRow label="Email" value={selectedUser.email} />
            <DetailRow
              label="Role"
              value={renderRoleBadge(selectedUser.role, { size: "sm" })}
            />
            <DetailRow
              label="Status"
              value={selectedUser.is_active ? "Active" : "Inactive"}
            />
            <DetailRow
              label="Auth Provider"
              value={
                selectedUser.auth_provider
                  ? selectedUser.auth_provider
                      .toString()
                      .replace(/\b\w/g, (char) => char.toUpperCase())
                  : "--"
              }
            />
            <DetailRow
              label="Phone Number"
              value={selectedUser.phone_number || "--"}
            />
            <DetailRow
              label="Company"
              value={selectedUser.company?.company_name || "--"}
            />
            <DetailRow
              label="Company Number"
              value={selectedUser.company?.company_number || "--"}
            />
            <DetailRow
              label="Related to Company ID"
              value={
                selectedUser.related_to_company !== null &&
                selectedUser.related_to_company !== undefined
                  ? selectedUser.related_to_company
                  : "--"
              }
            />
            <DetailRow
              label="Related to CEO ID"
              value={
                selectedUser.related_to_CEO !== null &&
                selectedUser.related_to_CEO !== undefined
                  ? selectedUser.related_to_CEO
                  : "--"
              }
            />
            <DetailRow
              label="Created At"
              value={formatDateTime(selectedUser.created_at)}
            />
            <DetailRow
              label="Last Login"
              value={
                selectedUser.last_login
                  ? formatDateTime(selectedUser.last_login)
                  : "Never"
              }
            />
            <DetailRow
              label="Profile Picture"
              value={
                selectedUser.profile_picture ? (
                  <a
                    href={selectedUser.profile_picture}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    View image
                  </a>
                ) : (
                  "--"
                )
              }
            />
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {selectedUser ? detailView : listView}
      <UserFormModal
        open={showFormModal}
        isEditing={isEditing}
        isSubmitting={isSubmitting}
        confirmProcessing={confirmProcessing}
        formData={formData}
        onClose={handleCloseFormModal}
        onSubmit={handleFormSubmit}
        onChange={handleFormChange}
        onGeneratePassword={handleGeneratePassword}
      />
      <ConfirmationModal
        open={Boolean(confirmModalData)}
        title={confirmModalData?.title}
        message={confirmModalData?.message}
        confirmLabel={confirmModalData?.confirmLabel}
        cancelLabel={confirmModalData?.cancelLabel}
        variant={confirmModalData?.variant}
        loading={confirmProcessing}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelConfirm}
      />
    </>
  );
}

function DetailRow({ label, value }) {
  const displayValue =
    value === null || value === undefined || value === "" ? "--" : value;

  const renderValue = React.isValidElement(displayValue) ? (
    <span className="break-words inline-flex flex-wrap gap-1">
      {displayValue}
    </span>
  ) : (
    <span className="break-words">{displayValue}</span>
  );

  return (
    <p className="text-sm text-gray-700">
      <span className="font-semibold text-gray-800">{label}:</span>
      <br />
      {renderValue}
    </p>
  );
}

function UserFormModal({
  open,
  isEditing,
  isSubmitting,
  confirmProcessing,
  formData,
  onClose,
  onSubmit,
  onChange,
  onGeneratePassword,
}) {
  if (!open) return null;
  const disabled = isSubmitting || confirmProcessing;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 relative overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-black transition disabled:opacity-60"
          disabled={disabled}
        >
          <FiX size={22} />
        </button>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6 text-center">
          {isEditing ? "Edit User" : "Add New User"}
        </h2>
        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
          onSubmit={onSubmit}
        >
          <FormInput
            label="First Name"
            value={formData.firstName}
            onChange={(value) => onChange("firstName", value)}
            placeholder="John"
            required
            disabled={disabled}
          />
          <FormInput
            label="Last Name"
            value={formData.lastName}
            onChange={(value) => onChange("lastName", value)}
            placeholder="Doe"
            required
            disabled={disabled}
          />
          <FormInput
            label="Email"
            type="email"
            value={formData.email}
            onChange={(value) => onChange("email", value)}
            placeholder="john.doe@company.com"
            required
            disabled={disabled || isEditing}
          />
          <FormInput
            label="Role"
            type="select"
            value={formData.role}
            onChange={(value) => onChange("role", value)}
            options={[{ value: "", label: "Select role" }, ...ROLE_OPTIONS]}
            required
            disabled={disabled}
          />
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-medium mb-1 text-sm">
              Password{isEditing ? "" : " "}
              {!isEditing && <span className="text-red-500">*</span>}
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="text"
                value={formData.password}
                onChange={(event) => onChange("password", event.target.value)}
                placeholder={
                  isEditing
                    ? "Leave blank to keep current password"
                    : "Enter or generate password"
                }
                required={!isEditing}
                disabled={disabled}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100"
              />
              <button
                type="button"
                onClick={onGeneratePassword}
                className="flex items-center justify-center px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition disabled:opacity-60"
                disabled={disabled}
              >
                Generate
              </button>
            </div>
            {isEditing ? (
              <p className="text-xs text-gray-500 mt-1">
                Setting a password will reset the user&apos;s credentials; leave
                it blank to keep the current password.
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 6 characters long.
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 md:col-span-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-white bg-red-400 border border-red-300 rounded hover:bg-red-500 transition disabled:opacity-70"
              disabled={disabled}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 text-white border border-tertiary bg-tertiary rounded hover:bg-secondary transition disabled:opacity-70"
              disabled={disabled}
            >
              {isSubmitting
                ? "Saving..."
                : isEditing
                ? "Update User"
                : "Save User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormInput({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  options = [],
  required = false,
  disabled = false,
}) {
  return (
    <div>
      <label className="block text-gray-700 font-medium mb-1 text-sm">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      {type === "select" ? (
        <select
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          disabled={disabled}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100"
        />
      )}
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
      : "bg-black hover:bg-gray-800 border border-black";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className="text-sm text-gray-600 mt-2 whitespace-pre-line">
          {message}
        </div>
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
