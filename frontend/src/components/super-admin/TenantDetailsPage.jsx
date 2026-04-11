import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiEdit,
  FiTrash2,
  FiSlash,
  FiCheckCircle,
  FiPlus,
  FiKey,
  FiActivity,
  FiBell,
  FiArrowLeft,
  FiToggleLeft,
  FiToggleRight,
  FiX,
} from "react-icons/fi";
import api from "../../api";
import { toast } from "react-toastify";
import ConfirmationModal from "../ConfirmationModal";
import AddTenantForm from "./TenantForm";
import SubscriptionForm from "./SubscriptionForm";
import UserDetailsModal from "./UserDetailsModal";
import AddUserForm from "./UserForm";
import ActivityLogsModal from "./ActivityLogsModal";
import LoadingSpinner from "../LoadingSpinner";

const TenantDetailsPage = () => {
  const { tenantId } = useParams();
  const navigate = useNavigate();

  // Tenant data
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit / Delete modals
  const [editTenant, setEditTenant] = useState(null);
  const [deleteTenantModal, setDeleteTenantModal] = useState({
    open: false,
    tenant: null,
    loading: false,
  });

  // Subscription modals
  const [subscriptionModal, setSubscriptionModal] = useState({
    open: false,
    tenantId: null,
    isActive: true,
    loading: false,
  });
  const [showEditSubscription, setShowEditSubscription] = useState(false);

  // User management
  const [searchUserTerm, setSearchUserTerm] = useState("");
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [editUserData, setEditUserData] = useState(null);
  const [resetPasswordUserData, setResetPasswordUserData] = useState(null);

  // User action modals
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [toggleUserStatusModal, setToggleUserStatusModal] = useState({
    open: false,
    user: null,
    newStatus: null,
    loading: false,
  });
  const [deleteUserModal, setDeleteUserModal] = useState({
    open: false,
    user: null,
    loading: false,
  });
  const [showActivityLogsModal, setShowActivityLogsModal] = useState(false);
  const [activityLogsUser, setActivityLogsUser] = useState(null);

  // Delete all users modal
  const [deleteAllUsersModal, setDeleteAllUsersModal] = useState({
    open: false,
    tenantId: null,
    tenantName: "",
    loading: false,
  });

  // Fetch tenant details
  const fetchTenantDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/tenants/${tenantId}`);
      setSelectedTenant(response.data);
    } catch (error) {
      console.error("Error fetching tenant details:", error);
      toast.error("Failed to load tenant details");
      navigate("/super-admin/dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchTenantDetails();
    }
  }, [tenantId]);

  // Filter users
  const excludedRoles = ["Admin", "Technical Support", "Marketing Admin"];
  const filteredUsers =
    selectedTenant && selectedTenant.users
      ? selectedTenant.users
          .filter((user) => !excludedRoles.includes(user.role))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      : [];

  const searchedUsers = filteredUsers.filter((user) =>
    `${user.first_name} ${user.last_name} ${user.email}`
      .toLowerCase()
      .includes(searchUserTerm.toLowerCase()),
  );

  // User action handlers
  const handleToggleUserStatus = (user) => {
    setToggleUserStatusModal({
      open: true,
      user,
      newStatus: !user.is_active,
      loading: false,
    });
  };

  const handleConfirmToggleUserStatus = async () => {
    setToggleUserStatusModal((modal) => ({ ...modal, loading: true }));
    try {
      const newStatus = toggleUserStatusModal.newStatus;
      await api.put(`/users/updateuser/${toggleUserStatusModal.user.id}`, {
        is_active: newStatus,
      });
      setToggleUserStatusModal({
        open: false,
        user: null,
        newStatus: null,
        loading: false,
      });
      fetchTenantDetails();
      toast.success(
        `User ${newStatus ? "reactivated" : "deactivated"} successfully!`,
      );
    } catch (error) {
      setToggleUserStatusModal((modal) => ({ ...modal, loading: false }));
      toast.error(
        error.response?.data?.detail || "Failed to update user status",
      );
    }
  };

  const handleDeleteUser = (user) => {
    setDeleteUserModal({ open: true, user, loading: false });
  };

  const handleConfirmDeleteUser = async () => {
    setDeleteUserModal((modal) => ({ ...modal, loading: true }));
    try {
      await api.delete(`/users/harddeleteuser/${deleteUserModal.user.id}`);
      setDeleteUserModal({ open: false, user: null, loading: false });
      fetchTenantDetails();
      toast.success("User deleted successfully!");
    } catch (error) {
      setDeleteUserModal((modal) => ({ ...modal, loading: false }));
      toast.error(error.response?.data?.detail || "Failed to delete user");
    }
  };

  const handleDeleteAllUsers = () => {
    setDeleteAllUsersModal({
      open: true,
      tenantId: selectedTenant.id,
      tenantName: selectedTenant.company_name,
      loading: false,
    });
  };

  const handleConfirmDeleteAllUsers = async () => {
    setDeleteAllUsersModal((modal) => ({ ...modal, loading: true }));
    try {
      await api.delete(`/users/admin/tenants/${selectedTenant.id}/users/delete-all`);
      setDeleteAllUsersModal({
        open: false,
        tenantId: null,
        tenantName: "",
        loading: false,
      });
      fetchTenantDetails();
      toast.success("All users deleted successfully!");
    } catch (error) {
      setDeleteAllUsersModal((modal) => ({ ...modal, loading: false }));
      toast.error(error.response?.data?.detail || "Failed to delete users");
    }
  };

  const handleSendNotification = (user) => {
    toast.info(`Ivan, ikaw na maglagay function, please. Hindi ko alam paano mo ginagawa eh.`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!selectedTenant) {
    toast.error("Tenant not found");
    navigate("/super-admin/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 font-inter">
      {/* Main content card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Card Header with Close Button */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {selectedTenant.company_name} Details
            </h1>
            {/* Tenant Number Display */}
            {selectedTenant.tenant_number && (
              <p className="text-sm text-gray-700 mt-2">
                Tenant Number:{" "}
                <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-sm font-mono font-semibold">
                  {selectedTenant.tenant_number}
                </span>
              </p>
            )}
          </div>
          <button
            onClick={() => navigate("/super-admin/dashboard")}
            className="p-2 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
            title="Close"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="w-full mb-4 border-t border-gray-200"></div>

        {/* Company Information Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold">Company Information</h4>
            <div className="flex gap-2">
              <button
                className="p-2 rounded hover:bg-gray-200 text-blue-600 cursor-pointer"
                title="Edit Company Information"
                style={{ cursor: "pointer" }}
                onClick={() => setEditTenant(selectedTenant)}
              >
                <FiEdit size={20} />
              </button>
              {editTenant && (
                <AddTenantForm
                  editMode={true}
                  initialData={editTenant}
                  onClose={() => setEditTenant(null)}
                  onSuccess={async () => {
                    setEditTenant(null);
                    await fetchTenantDetails();
                  }}
                />
              )}
              <button
                className="p-2 rounded hover:bg-gray-200 text-red-600 cursor-pointer"
                title="Delete Tenant"
                style={{ cursor: "pointer" }}
                onClick={() =>
                  setDeleteTenantModal({
                    open: true,
                    tenant: selectedTenant,
                    loading: false,
                  })
                }
              >
                <FiTrash2 size={20} />
              </button>
              <ConfirmationModal
                open={deleteTenantModal.open}
                title={`Delete Tenant: ${deleteTenantModal.tenant?.company_name || ""}`}
                message={`Are you sure you want to delete this tenant? This action cannot be undone.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                variant="danger"
                loading={deleteTenantModal.loading}
                onCancel={() =>
                  setDeleteTenantModal({
                    open: false,
                    tenant: null,
                    loading: false,
                  })
                }
                onConfirm={async () => {
                  setDeleteTenantModal((modal) => ({
                    ...modal,
                    loading: true,
                  }));
                  try {
                    await api.delete(
                      `/admin/tenants/${deleteTenantModal.tenant.id}`,
                    );
                    setDeleteTenantModal({
                      open: false,
                      tenant: null,
                      loading: false,
                    });
                    toast.success("Tenant deleted successfully!");
                    navigate("/super-admin/dashboard");
                  } catch (error) {
                    setDeleteTenantModal((modal) => ({
                      ...modal,
                      loading: false,
                    }));
                    toast.error(
                      error.response?.data?.detail || "Failed to delete tenant",
                    );
                  }
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-2 sm:p-4 rounded-lg">
            <div>
              <p className="text-sm text-gray-500">Company Name</p>
              <p className="font-medium text-base">
                {selectedTenant.company_name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Company Number</p>
              <p className="font-medium text-base">
                {selectedTenant.company_number}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Slug</p>
              <p className="font-medium text-base">
                {selectedTenant.slug || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Website</p>
              <p className="font-medium text-base break-all">
                {selectedTenant.company_website || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium text-base">
                {selectedTenant.address || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Currency</p>
              <p className="font-medium text-base">{selectedTenant.currency}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tax Rate</p>
              <p className="font-medium text-base">
                {selectedTenant.tax_rate || 0}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">VAT Registration Number</p>
              <p className="font-medium text-base">
                {selectedTenant.vat_registration_number || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tax ID Number</p>
              <p className="font-medium text-base">
                {selectedTenant.tax_id_number || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Territories</p>
              <p className="font-medium text-base">
                {selectedTenant.territories_count || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fiscal Year Start</p>
              <p className="font-medium text-base">
                {selectedTenant.quota_period || "January"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Calendar Start Day</p>
              <p className="font-medium text-base">
                {selectedTenant.calendar_start_day || "Monday"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Backup Reminder</p>
              <p className="font-medium text-base">
                {selectedTenant.backup_reminder || "Daily"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created At</p>
              <p className="font-medium text-base">
                {selectedTenant.created_at
                  ? new Date(selectedTenant.created_at).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="font-medium text-base">
                {selectedTenant.updated_at
                  ? new Date(selectedTenant.updated_at).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>

        <div className="w-full mt-2 mb-4 border-t border-gray-200"></div>

        {/* Subscription Section */}
        {selectedTenant.subscription && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-lg font-semibold">Subscription</h4>
              <div className="flex items-center gap-2">
                <button
                  className="p-2 rounded hover:bg-gray-200 text-blue-600 cursor-pointer"
                  title="Edit Subscription"
                  style={{ cursor: "pointer" }}
                  onClick={() => setShowEditSubscription(true)}
                >
                  <FiEdit size={20} />
                </button>
                {showEditSubscription && selectedTenant?.subscription && (
                  <SubscriptionForm
                    editMode={true}
                    initialData={selectedTenant.subscription}
                    onClose={() => setShowEditSubscription(false)}
                    onSuccess={() => {
                      setShowEditSubscription(false);
                      fetchTenantDetails();
                    }}
                  />
                )}
                <button
                  onClick={() => {
                    const subscriptionId = selectedTenant.id;
                    setSubscriptionModal({
                      open: true,
                      tenantId: subscriptionId,
                      isActive: selectedTenant.is_subscription_active,
                      loading: false,
                    });
                  }}
                  className={`p-2 rounded hover:bg-gray-200 ${
                    selectedTenant.is_subscription_active
                      ? "text-red-600"
                      : "text-green-600"
                  } cursor-pointer`}
                  title={
                    selectedTenant.is_subscription_active
                      ? "Suspend Subscription"
                      : "Reactivate Subscription"
                  }
                  style={{ cursor: "pointer" }}
                >
                  {selectedTenant.is_subscription_active ? (
                    <FiSlash size={20} />
                  ) : (
                    <FiCheckCircle size={20} />
                  )}
                </button>
                <ConfirmationModal
                  open={subscriptionModal.open}
                  title={
                    subscriptionModal.isActive
                      ? "Suspend Subscription?"
                      : "Reactivate Subscription?"
                  }
                  message={
                    subscriptionModal.isActive
                      ? "Are you sure you want to suspend this subscription?"
                      : "Are you sure you want to reactivate this subscription?"
                  }
                  confirmLabel={
                    subscriptionModal.isActive ? "Suspend" : "Reactivate"
                  }
                  cancelLabel="Cancel"
                  variant={subscriptionModal.isActive ? "danger" : "primary"}
                  loading={subscriptionModal.loading}
                  onCancel={() =>
                    setSubscriptionModal({
                      open: false,
                      tenantId: null,
                      isActive: true,
                      loading: false,
                    })
                  }
                  onConfirm={async () => {
                    setSubscriptionModal((modal) => ({
                      ...modal,
                      loading: true,
                    }));
                    try {
                      let response;
                      if (subscriptionModal.isActive) {
                        response = await api.post(
                          `/admin/companies/${subscriptionModal.tenantId}/suspend`,
                        );
                      } else {
                        response = await api.post(
                          `/admin/companies/${subscriptionModal.tenantId}/reactivate`,
                        );
                      }
                      setSubscriptionModal({
                        open: false,
                        tenantId: null,
                        isActive: true,
                        loading: false,
                      });
                      fetchTenantDetails();
                      toast.success(response.data.message);
                    } catch (error) {
                      setSubscriptionModal((modal) => ({
                        ...modal,
                        loading: false,
                      }));
                      toast.error(
                        error.response?.data?.detail ||
                          "Failed to update subscription",
                      );
                    }
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-2 sm:p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Plan</p>
                <p className="font-medium">
                  {selectedTenant.subscription.plan_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span
                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    selectedTenant.subscription.status === "Active"
                      ? "bg-green-100 text-green-800"
                      : selectedTenant.subscription.status === "Cancelled"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {selectedTenant.subscription.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Days Remaining</p>
                <p
                  className={`font-medium ${(() => {
                    const days = Math.ceil(
                      (new Date(selectedTenant.subscription.end_date) -
                        new Date()) /
                        (1000 * 60 * 60 * 24),
                    );
                    return days <= 0
                      ? "text-red-600"
                      : days <= 7
                        ? "text-orange-600"
                        : "text-green-600";
                  })()}`}
                >
                  {(() => {
                    const days = Math.ceil(
                      (new Date(selectedTenant.subscription.end_date) -
                        new Date()) /
                        (1000 * 60 * 60 * 24),
                    );
                    return days <= 0 ? "Expired" : `${days} days`;
                  })()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium">
                  {selectedTenant.subscription.start_date
                    ? new Date(
                        selectedTenant.subscription.start_date,
                      ).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">End Date</p>
                <p className="font-medium">
                  {selectedTenant.subscription.end_date
                    ? new Date(
                        selectedTenant.subscription.end_date,
                      ).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="w-full mt-2 mb-4 border-t border-gray-200"></div>

        {/* Users Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold">
              Users ({searchedUsers.length})
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditUserData(null);
                  setShowAddUserForm(true);
                }}
                className="p-2 rounded hover:bg-gray-200 text-green-600 cursor-pointer"
                title="Add User"
                style={{ cursor: "pointer" }}
              >
                <FiPlus size={20} />
              </button>
              {(showAddUserForm || resetPasswordUserData) && (
                <AddUserForm
                  tenantId={selectedTenant?.id}
                  editMode={!!editUserData}
                  initialData={editUserData || resetPasswordUserData}
                  initialResetPasswordMode={!!resetPasswordUserData}
                  onClose={() => {
                    if (resetPasswordUserData) {
                      setResetPasswordUserData(null);
                    } else {
                      setShowAddUserForm(false);
                      setEditUserData(null);
                    }
                  }}
                  onSuccess={async () => {
                    if (resetPasswordUserData) {
                      setResetPasswordUserData(null);
                    } else {
                      setShowAddUserForm(false);
                      setEditUserData(null);
                    }
                    await fetchTenantDetails();
                  }}
                />
              )}
              <button
                onClick={handleDeleteAllUsers}
                className="p-2 rounded hover:bg-gray-200 text-red-600 cursor-pointer"
                title="Delete All Users"
                style={{ cursor: "pointer" }}
              >
                <FiTrash2 size={20} />
              </button>
            </div>
          </div>
          <div className="mb-3">
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Search users..."
              value={searchUserTerm}
              onChange={(e) => setSearchUserTerm(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            {searchedUsers.length === 0 ? (
              <div className="text-center text-gray-400 py-6">
                No users found.
              </div>
            ) : (
              searchedUsers.map((user) => (
                <div
                  key={user.id}
                  className="relative flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedUser(user);
                    setShowUserDetailsModal(true);
                  }}
                >
                  <div className="flex-1 min-w-0 pr-0 sm:pr-0">
                    <div className="flex flex-col">
                      <p className="font-medium">
                        {user.first_name} {user.last_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {user.role}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${user.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{user.email}</p>
                      <span className="text-xs text-gray-500 mt-1">
                        Last login:{" "}
                        {user.last_login
                          ? new Date(user.last_login).toLocaleDateString()
                          : "—"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0 ml-0 sm:ml-2 absolute right-2 top-2 sm:relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleUserStatus(user);
                      }}
                      className={`p-2 rounded hover:bg-gray-200 ${user.is_active ? "text-orange-500" : "text-green-600"} cursor-pointer`}
                      title={
                        user.is_active ? "Deactivate User" : "Reactivate User"
                      }
                      style={{ cursor: "pointer" }}
                    >
                      {user.is_active ? (
                        <FiToggleLeft size={20} />
                      ) : (
                        <FiToggleRight size={20} />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditUserData(user);
                        setShowAddUserForm(true);
                      }}
                      className="p-2 rounded hover:bg-gray-200 text-blue-600 cursor-pointer"
                      title="Edit User"
                      style={{ cursor: "pointer" }}
                    >
                      <FiEdit size={20} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteUser(user);
                      }}
                      className="p-2 rounded hover:bg-gray-200 text-red-600 cursor-pointer"
                      title="Delete User"
                      style={{ cursor: "pointer" }}
                    >
                      <FiTrash2 size={20} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setResetPasswordUserData(user);
                      }}
                      className="p-2 rounded hover:bg-gray-200 text-yellow-600 cursor-pointer"
                      title="Reset Password"
                      style={{ cursor: "pointer" }}
                    >
                      <FiKey size={20} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivityLogsUser(user);
                        setShowActivityLogsModal(true);
                      }}
                      className="p-2 rounded hover:bg-gray-200 text-purple-600 cursor-pointer"
                      title="View Activity"
                      style={{ cursor: "pointer" }}
                    >
                      <FiActivity size={20} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendNotification(user);
                      }}
                      className="p-2 rounded hover:bg-gray-200 text-pink-600 cursor-pointer"
                      title="Send Notification"
                      style={{ cursor: "pointer" }}
                    >
                      <FiBell size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <UserDetailsModal
        open={showUserDetailsModal}
        user={selectedUser}
        onClose={() => setShowUserDetailsModal(false)}
      />

      <ActivityLogsModal
        open={showActivityLogsModal}
        user={activityLogsUser}
        onClose={() => setShowActivityLogsModal(false)}
      />

      <ConfirmationModal
        open={deleteAllUsersModal.open}
        title="Delete All Users?"
        message={
          <span>
            Are you sure you want to delete all users from{" "}
            <span className="font-semibold">
              {deleteAllUsersModal.tenantName}
            </span>
            ? This will permanently delete all user records and related data.
            This action cannot be undone.
          </span>
        }
        confirmLabel="Delete All Users"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleteAllUsersModal.loading}
        onCancel={() =>
          setDeleteAllUsersModal({
            open: false,
            tenantId: null,
            tenantName: "",
            loading: false,
          })
        }
        onConfirm={handleConfirmDeleteAllUsers}
      />

      <ConfirmationModal
        open={toggleUserStatusModal.open}
        title={
          toggleUserStatusModal.newStatus
            ? `Reactivate ${toggleUserStatusModal.user?.first_name} ${toggleUserStatusModal.user?.last_name}?`
            : `Deactivate ${toggleUserStatusModal.user?.first_name} ${toggleUserStatusModal.user?.last_name}?`
        }
        message={
          toggleUserStatusModal.newStatus
            ? `Are you sure you want to reactivate ${toggleUserStatusModal.user?.first_name}? They will be able to login again.`
            : `Are you sure you want to deactivate ${toggleUserStatusModal.user?.first_name}? They will be unable to login.`
        }
        confirmLabel={
          toggleUserStatusModal.newStatus ? "Reactivate" : "Deactivate"
        }
        cancelLabel="Cancel"
        variant={toggleUserStatusModal.newStatus ? "primary" : "warning"}
        loading={toggleUserStatusModal.loading}
        onCancel={() =>
          setToggleUserStatusModal({
            open: false,
            user: null,
            newStatus: null,
            loading: false,
          })
        }
        onConfirm={handleConfirmToggleUserStatus}
      />

      <ConfirmationModal
        open={deleteUserModal.open}
        title={`Delete ${deleteUserModal.user?.first_name} ${deleteUserModal.user?.last_name}?`}
        message={
          <span>
            Are you sure you want to delete{" "}
            <span className="font-semibold">
              {deleteUserModal.user?.first_name}{" "}
              {deleteUserModal.user?.last_name}
            </span>
            ? This will permanently delete the user record and related data.
            This action cannot be undone.
          </span>
        }
        confirmLabel="Delete User"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleteUserModal.loading}
        onCancel={() =>
          setDeleteUserModal({ open: false, user: null, loading: false })
        }
        onConfirm={handleConfirmDeleteUser}
      />
    </div>
  );
};

export default TenantDetailsPage;
