import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiShield,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiUserPlus,
  FiX,
  FiPhone,
  FiMail,
  FiCalendar,
} from "react-icons/fi";
import { HiX } from "react-icons/hi";
import { toast } from "react-toastify";
import api from "../api";
import useFetchUser from "../hooks/useFetchUser";
import PaginationControls from "../components/PaginationControls.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

const ROLE_OPTIONS = [
  { value: "CEO", label: "CEO" },
  { value: "Admin", label: "Admin" },
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
  const option = ROLE_OPTIONS.find(
    (opt) => normalizeRoleValue(opt.value) === normalized
  );
  return option ? option.value : role || "";
};

const formatRoleLabel = (role) => {
  const normalized = normalizeRoleValue(role);
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

const getUserInitials = (firstName, lastName) => {
  const first = firstName?.trim()?.[0] ?? "";
  const last = lastName?.trim()?.[0] ?? "";
  const initials = `${first}${last}`.toUpperCase();
  return initials || "U";
};

const sortUsers = (list) =>
  [...list].sort((a, b) => {
    // Sort by created_at descending (most recent first)
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA; // Descending order (newest first)
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
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const normalizedUserRole = normalizeRoleValue(currentUser?.role);
  const isAuthorized = ["ADMIN", "CEO", "GROUP MANAGER", "MANAGER"].includes(normalizedUserRole);
  const shouldShowContent = !userLoading && isAuthorized;

  const roleFilterOptions = useMemo(() => {
    const otherRoles = ROLE_OPTIONS.filter((option) => {
      const normalizedValue = normalizeRoleValue(option.value);
      return normalizedValue !== "CEO";
    });

    return [
      { label: "Filter by Roles", value: "" },
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
      console.log(res.data)
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
    document.title = "Users | Sari-Sari CRM";
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const normalizedFilter = normalizeRoleValue(roleFilter);
    return sortUsers(
      users.filter((user) => {
        // Show all users (both active and inactive) - don't filter out inactive users
        if (!user) return false;
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
    Math.ceil(filteredUsers.length / itemsPerPage) || 1
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);

  useEffect(() => {
    setCurrentPage((prev) => {
      const maxPage = Math.max(
        1,
        Math.ceil(filteredUsers.length / itemsPerPage) || 1
      );
      return prev > maxPage ? maxPage : prev;
    });
  }, [filteredUsers.length]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const pageStart =
    filteredUsers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const pageEnd = Math.min(currentPage * itemsPerPage, filteredUsers.length);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleOpenCreate = () => {
    setFormData(INITIAL_FORM_STATE);
    setIsEditing(false);
    setCurrentUserId(null);
    setShowFormModal(true);
  };

  const handleRowClick = (user) => {
    console.log(user)
    setSelectedUser(user);
    setActiveTab("Overview");
    setSelectedStatus(user?.is_active ? "Active" : "Inactive");
  };

  const handleUserModalBackdropClick = (e) => {
    if (e.target.id === "userModalBackdrop" && !confirmProcessing) {
      handleBackToList();
    }
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
    // Close the user details modal
    setSelectedUser(null);
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
    const selectedRole = 'Sales';
    const isCreating = !(isEditing && currentUserId);

    if (!trimmedFirst || !trimmedEmail || !selectedRole) {
      toast.warn("Please fill in all required fields.");
      return;
    }

    if (isCreating && !trimmedPassword) {
      toast.warn("Please fill in all required fields.");
      return;
    }

    if (trimmedPassword && trimmedPassword.length < 8) {
      toast.warn("Password should be at least 8 characters long.");
      return;
    }

    const payload = {
      first_name: trimmedFirst,
      last_name: trimmedLast,
      email: trimmedEmail,
      role: selectedRole,
    };

    console.log(payload);

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
        // Update user in the array to mark as inactive (don't remove from list)
        setUsers((prev) =>
          prev.map((user) =>
            user.id === targetId ? { ...user, is_active: false } : user
          )
        );
        // Close the modal if the deleted user is currently selected
        if (selectedUser && selectedUser.id === targetId) {
          setSelectedUser(null);
          setSelectedStatus("");
        }
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

  const handleStatusUpdate = async () => {
    if (!selectedUser || !selectedStatus) return;
    
    // Don't update if status hasn't changed
    const currentStatus = selectedUser.is_active ? "Active" : "Inactive";
    if (selectedStatus === currentStatus) return;

    const newIsActive = selectedStatus === "Active";
    
    setUpdatingStatus(true);
    try {
      const res = await api.put(`/users/updateuser/${selectedUser.id}`, {
        is_active: newIsActive,
      });
      
      const updatedUser = res.data;
      
      // Update the users list state (keep user in list even if inactive)
      setUsers((prev) =>
        prev.map((user) =>
          user.id === updatedUser.id ? updatedUser : user
        )
      );
      
      // Close the modal after status update
      setSelectedUser(null);
      setSelectedStatus("");
      
      toast.success(`User status updated to ${selectedStatus}`);
    } catch (error) {
      console.error("Failed to update user status:", error);
      const message =
        error.response?.data?.detail ||
        "Failed to update user status. Please try again.";
      toast.error(message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const listView = (
    <div className="p-4 sm:p-6 lg:p-8 font-inter relative">
      {(loading || userLoading || !shouldShowContent) && <LoadingSpinner />}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <h1 className="flex items-center text-xl sm:text-2xl font-semibold text-gray-800">
          <FiShield className="mr-2 text-blue-600" />
          User Management
        </h1>
        <div className="flex justify-center lg:justify-end w-full sm:w-auto">
        <button
          type="button"
          onClick={handleOpenCreate}
             className="flex items-center bg-black text-white px-3 sm:px-4 py-2 rounded-md hover:bg-gray-800 text-sm sm:text-base self-end sm:self-auto cursor-pointer"
        >
          <FiUserPlus className="mr-2" /> Add User
        </button>
      </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6 flex flex-col lg:flex-row items-center justify-between gap-3 w-full">
        <div className="flex items-center border border-gray-300 rounded-lg px-4 h-11 w-full lg:w-3/4 focus-within:ring-2 focus-within:ring-indigo-500 transition">
          <FiSearch size={20} className="text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search users"
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
              <th className="py-3 px-4">Status</th>
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
                  colSpan={4}
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
                    } ${
                      !user.is_active ? "opacity-60 bg-gray-50" : ""
                    }`}
                  >
                    <td
                      className="py-3 px-4 cursor-pointer"
                      onClick={() => handleRowClick(user)}
                    >
                      <div className="font-medium text-blue-600 hover:underline text-sm">
                        {user.first_name} {user.last_name}
                      </div>
                    </td>
                    <td
                      className="py-3 px-4 cursor-pointer text-sm"
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
                    <td
                      className="py-3 px-4 cursor-pointer"
                      onClick={() => handleRowClick(user)}
                    >
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-md ${
                          user.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
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
        pageSize={itemsPerPage}
        currentPage={currentPage}
        onPrev={handlePrevPage}
        onNext={handleNextPage}
        onPageSizeChange={(newSize) => {
          setItemsPerPage(newSize);
          setCurrentPage(1);
        }}
        pageSizeOptions={[10, 20, 30, 40, 50]}
        label="users"
      />
    </div>
  );

  const detailView = selectedUser ? (
    <div
      id="userModalBackdrop"
      onClick={handleUserModalBackdropClick}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[92vh] overflow-y-auto hide-scrollbar animate-scale-in p-4 sm:p-6 md:p-8 font-inter relative">
        {/* Close Button */}
        <div className="flex justify-end w-full">
          <button
            onClick={handleBackToList}
            className="text-gray-500 hover:text-gray-700 transition mb-5 cursor-pointer"
          >
            <HiX size={30} />
          </button>
        </div>

        {/* Header */}
 <div className="flex flex-col md:flex-row md:justify-between lg:flex-row lg:items-center lg:justify-between mt-3 gap-2 px-2 md:items-center lg:gap-4 md:mx-7 lg:mx-7 mb-4 lg:mb-6 md:mb-4">         
   <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-3">
              {selectedUser.profile_picture ? (
                <img
                  src={selectedUser.profile_picture}
                  alt={`${selectedUser.first_name} ${selectedUser.last_name}`}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border border-gray-200 shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-lg sm:text-xl font-semibold border border-gray-200 shadow-sm">
                  {getUserInitials(
                    selectedUser.first_name,
                    selectedUser.last_name
                  )}
                </div>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
                  {selectedUser.first_name} {selectedUser.last_name}
                </h1>
                <p className="text-sm text-gray-500 break-all">
                  {selectedUser.email}
                </p>
              </div>
            </div>
            {renderRoleBadge(selectedUser.role, { size: "md" })}
          </div>

          {!['CEO', 'ADMIN', 'GROUP MANAGER', 'GROUP_MANAGER'].includes(selectedUser.role.toUpperCase()) && (
            <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
            <button
              type="button"
              className="inline-flex items-center justify-center w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-70 transition text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={() => handleEditClick(selectedUser)}
              disabled={confirmProcessing}
            >
              <FiEdit2 className="mr-2" />
              Edit
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 rounded-md text-sm bg-red-500 text-white hover:bg-red-600 transition focus:outline-none focus:ring-2 focus:ring-red-400"
              onClick={() => handleDeleteClick(selectedUser)}
              disabled={confirmProcessing}
            >
              <FiTrash2 className="mr-2" />
              Delete
            </button>
          </div>
          )}          
        </div>
        <div className="border-b border-gray-200 mb-6"></div>

        {/* TABS */}
        <div className="flex w-full bg-[#6A727D] text-white mt-1 overflow-x-auto mb-6">
          {["Overview"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[90px] px-4 py-2.5 text-xs sm:text-sm font-medium text-center transition-all duration-200 border-b-2
        ${activeTab === tab
                  ? "bg-[#5c636d] text-white border-white"
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
                    <p className="font-semibold">Email:</p>
                    <p>{selectedUser.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Role:</p>
                    <p>{renderRoleBadge(selectedUser.role, { size: "sm" })}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Status:</p>
                    <p>{selectedUser.is_active ? "Active" : "Inactive"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Auth Provider:</p>
                    <p>
                      {selectedUser.auth_provider
                        ? selectedUser.auth_provider
                            .toString()
                            .replace(/\b\w/g, (char) => char.toUpperCase())
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">Phone Number:</p>
                    <p>{selectedUser.phone_number || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Company:</p>
                    <p>{selectedUser.company?.company_name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Company Number:</p>
                    <p>{selectedUser.company?.company_number || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Related to CEO:</p>
                    <p>
                      {selectedUser.manager ? `${selectedUser.manager.first_name} ${selectedUser.manager.last_name}` : `N/A`}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">Created At:</p>
                    <p>{formatDateTime(selectedUser.created_at) || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Last Login:</p>
                    <p>
                      {selectedUser.last_login
                        ? formatDateTime(selectedUser.last_login)
                        : "Never"}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">Profile Picture:</p>
                    <p>
                      {selectedUser.profile_picture ? (
                        <a
                          href={selectedUser.profile_picture}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          View image
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </p>
                  </div>
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

                            <button
                                  type="button"
                                  onClick={() => {
                                    if (!selectedUser.email) {
                                      alert("No email address available");
                                      return;
                                    }

                                    const to = encodeURIComponent(selectedUser.email);
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

        
                                 </div>
                               </div>
            {/* STATUS */}
            <div className="bg-white border border-gray-100 rounded-lg p-3 sm:p-4 shadow-sm w-full">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">
                Status
              </h4>
              <select
                className="border border-gray-200 rounded-md px-2 sm:px-3 py-1.5 w-full text-sm mb-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={selectedStatus || (selectedUser.is_active ? "Active" : "Inactive")}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <button
                onClick={handleStatusUpdate}
                disabled={
                  updatingStatus ||
                  selectedStatus === (selectedUser.is_active ? "Active" : "Inactive")
                }
                className={`w-full py-1.5 rounded-md text-sm transition focus:outline-none focus:ring-2 ${
                  updatingStatus ||
                  selectedStatus === (selectedUser.is_active ? "Active" : "Inactive")
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
  ) : null;

  return (
    <>
      {listView}
      {detailView}
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
            disabled
            value={'Sales'}
            onChange={(value) => onChange("role", value)}
            options={[{ value: "", label: "Select role" }, ...ROLE_OPTIONS]}
            required
          />
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-medium mb-1 text-sm">
              Password
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
                Password must be at least 8 characters long.
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
        {label}
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
