import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiSearch,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiTarget,
  FiCheckCircle,
  FiDollarSign,
  FiTrendingUp,
  FiX,
  FiUser,
} from "react-icons/fi";
import { HiArrowLeft } from "react-icons/hi";
import { toast } from "react-toastify";
import PaginationControls from "../components/PaginationControls.jsx";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const INITIAL_FORM_STATE = {
  user_id: "",
  period: "",
  target_amount: "",
  achieved: "",
  status: "ACTIVE",
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
    case "ACTIVE":
      return "bg-green-600 text-white";
    case "INACTIVE":
      return "bg-gray-600 text-white";
    default:
      return "bg-gray-500 text-white";
  }
};

const getTableBadgeClass = (status) => {
  switch (normalizeStatus(status)) {
    case "ACTIVE":
      return "bg-green-100 text-green-700";
    case "INACTIVE":
      return "bg-gray-200 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const ITEMS_PER_PAGE = 10;

export default function AdminTargets() {
  useEffect(() => {
    document.title = "Targets | Sari-Sari CRM";
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [currentTargetId, setCurrentTargetId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [targets, setTargets] = useState([]);
  const [targetsLoading, setTargetsLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [statusFilter, setStatusFilter] = useState("Filter by Status");
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmModalData, setConfirmModalData] = useState(null);
  const [confirmProcessing, setConfirmProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Mock data for demonstration
  const [mockTargets, setMockTargets] = useState([
    {
      id: 1,
      user: {
        id: 1,
        first_name: "Jane",
        last_name: "Sales",
        role: "Sales Rep",
      },
      period: "2025-10",
      target_amount: 100000,
      achieved: 80000,
      status: "ACTIVE",
      created_at: "2025-09-15T10:00:00",
      updated_at: "2025-10-01T14:30:00",
    },
    {
      id: 2,
      user: {
        id: 2,
        first_name: "John",
        last_name: "Doe",
        role: "Sales Manager",
      },
      period: "2025-10",
      target_amount: 150000,
      achieved: 120000,
      status: "ACTIVE",
      created_at: "2025-09-15T10:00:00",
      updated_at: "2025-10-01T14:30:00",
    },
    {
      id: 3,
      user: {
        id: 3,
        first_name: "Maria",
        last_name: "Santos",
        role: "Sales Rep",
      },
      period: "2025-09",
      target_amount: 75000,
      achieved: 45000,
      status: "INACTIVE",
      created_at: "2025-08-15T10:00:00",
      updated_at: "2025-09-30T14:30:00",
    },
  ]);

  const fetchTargets = useCallback(
    async (preserveSelectedId = null) => {
      setTargetsLoading(true);
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const sortedData = [...mockTargets].sort((a, b) => {
        const aDate = a?.created_at || a?.updated_at || 0;
        const bDate = b?.created_at || b?.updated_at || 0;
        return new Date(bDate) - new Date(aDate);
      });
      setTargets(sortedData);

      if (preserveSelectedId) {
        const updatedSelection = sortedData.find(
          (t) => t.id === preserveSelectedId
        );
        setSelectedTarget(updatedSelection || null);
      }
      setTargetsLoading(false);
    },
    [mockTargets]
  );

  const fetchUsers = useCallback(async () => {
    // Mock users data
    const mockUsers = [
      {
        id: 1,
        first_name: "Jane",
        last_name: "Sales",
        role: "Sales Rep",
      },
      {
        id: 2,
        first_name: "John",
        last_name: "Doe",
        role: "Sales Manager",
      },
      {
        id: 3,
        first_name: "Maria",
        last_name: "Santos",
        role: "Sales Rep",
      },
      {
        id: 4,
        first_name: "Pedro",
        last_name: "Cruz",
        role: "Sales Rep",
      },
    ];
    setUsers(mockUsers);
  }, []);

  useEffect(() => {
    fetchTargets();
    fetchUsers();
  }, [fetchTargets, fetchUsers]);

  const total = targets.length;
  const active = useMemo(
    () =>
      targets.filter((t) => normalizeStatus(t.status) === "ACTIVE").length,
    [targets]
  );
  const inactive = useMemo(
    () =>
      targets.filter((t) => normalizeStatus(t.status) === "INACTIVE").length,
    [targets]
  );

  const totalTarget = useMemo(() => {
    return targets.reduce((sum, t) => sum + (Number(t.target_amount) || 0), 0);
  }, [targets]);

  const totalAchieved = useMemo(() => {
    return targets.reduce((sum, t) => sum + (Number(t.achieved) || 0), 0);
  }, [targets]);

  const overallAchievement = useMemo(() => {
    if (totalTarget === 0) return 0;
    return Math.round((totalAchieved / totalTarget) * 100);
  }, [totalTarget, totalAchieved]);

  const metricCards = useMemo(
    () => [
      {
        title: "Active Targets",
        value: active,
        icon: FiCheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-100",
      },
      {
        title: "Total Target",
        value: `₱${totalTarget.toLocaleString()}`,
        icon: FiDollarSign,
        color: "text-purple-600",
        bgColor: "bg-purple-100",
      },
      {
        title: "Total Achieved",
        value: `₱${totalAchieved.toLocaleString()}`,
        icon: FiTrendingUp,
        color: "text-pink-600",
        bgColor: "bg-pink-100",
      },
      {
        title: "Overall Achievement",
        value: `${overallAchievement}%`,
        icon: FiTarget,
        color: "text-orange-600",
        bgColor: "bg-orange-100",
      },
    ],
    [active, totalTarget, totalAchieved, overallAchievement]
  );

  const filteredTargets = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const normalizedFilter = statusFilter.trim().toUpperCase();

    return targets.filter((t) => {
      const userFullName = t.user
        ? `${t.user.first_name || ""} ${t.user.last_name || ""}`.trim()
        : "";
      const searchFields = [
        userFullName,
        t.period,
        t.target_amount?.toString(),
        t.achieved?.toString(),
        t.status,
      ];

      const matchesSearch =
        normalizedQuery === "" ||
        searchFields.some((field) => {
          if (field === null || field === undefined) return false;
          return field.toString().toLowerCase().includes(normalizedQuery);
        });

      const matchesStage =
        normalizedFilter === "FILTER BY STATUS" ||
        normalizeStatus(t.status) === normalizedFilter;

      return matchesSearch && matchesStage;
    });
  }, [targets, searchQuery, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTargets.length / ITEMS_PER_PAGE) || 1
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    setCurrentPage((prev) => {
      const maxPage = Math.max(
        1,
        Math.ceil(filteredTargets.length / ITEMS_PER_PAGE) || 1
      );
      return prev > maxPage ? maxPage : prev;
    });
  }, [filteredTargets.length]);

  const paginatedTargets = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTargets.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTargets, currentPage]);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleTargetClick = (t) => setSelectedTarget(t);

  const handleBackToList = () => setSelectedTarget(null);

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentTargetId(null);
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
    setCurrentTargetId(null);
              setShowModal(true);
  };

  const handleEditClick = (target) => {
    const periodMonth = target.period ? target.period.substring(0, 7) : "";
    setFormData({
      user_id: target.user?.id ? String(target.user.id) : "",
      period: periodMonth,
      target_amount: target.target_amount?.toString() || "",
      achieved: target.achieved?.toString() || "",
      status: normalizeStatus(target.status) || "ACTIVE",
    });
    setIsEditing(true);
    setCurrentTargetId(target.id);
    setShowModal(true);
  };

  const handleDelete = (target) => {
    if (!target) return;

    const userName = target.user
      ? `${target.user.first_name} ${target.user.last_name}`
      : "Unknown";

    setConfirmModalData({
      title: "Delete Target",
      message: (
        <span>
          Are you sure you want to permanently delete the target for{" "}
          <span className="font-semibold">{userName}</span> ({target.period})?
          This action cannot be undone.
        </span>
      ),
      confirmLabel: "Delete Target",
      cancelLabel: "Cancel",
      variant: "danger",
      action: {
        type: "delete",
        targetId: target.id,
        name: userName,
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
        // Find user data
        const user = users.find((u) => u.id === payload.user_id);
        
        // Create new target
        const newTarget = {
          id: Math.max(...mockTargets.map((t) => t.id), 0) + 1,
          user: user || { id: payload.user_id, first_name: "Unknown", last_name: "", role: "" },
          period: payload.period,
          target_amount: payload.target_amount,
          achieved: payload.achieved || 0,
          status: payload.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setMockTargets((prev) => [...prev, newTarget]);
        toast.success(`Target for "${name}" created successfully.`);

        const preserveId = selectedTarget?.id || null;
        closeModal();
        await fetchTargets(preserveId);
      } else if (type === "update") {
        if (!targetId) {
          throw new Error("Missing target identifier for update.");
        }
        setIsSubmitting(true);
        
        // Find user data
        const user = users.find((u) => u.id === payload.user_id);
        
        // Update target
        setMockTargets((prev) =>
          prev.map((t) =>
            t.id === targetId
              ? {
                  ...t,
                  user: user || t.user,
                  period: payload.period,
                  target_amount: payload.target_amount,
                  achieved: payload.achieved || 0,
                  status: payload.status,
                  updated_at: new Date().toISOString(),
                }
              : t
          )
        );

        toast.success(`Target for "${name}" updated successfully.`);

        const preserveId =
          selectedTarget?.id && selectedTarget.id === targetId
            ? targetId
            : null;
        closeModal();
        await fetchTargets(preserveId);
        if (selectedTarget?.id === targetId) {
          setSelectedTarget(null);
        }
      } else if (type === "delete") {
        if (!targetId) {
          throw new Error("Missing target identifier for deletion.");
        }
        const currentSelectedId = selectedTarget?.id;
        setDeletingId(targetId);
        
        // Delete target
        setMockTargets((prev) => prev.filter((t) => t.id !== targetId));

        toast.success(`Target for "${name}" deleted successfully.`);

        const preserveId =
          currentSelectedId && currentSelectedId !== targetId
            ? currentSelectedId
            : null;
        await fetchTargets(preserveId);

        if (currentSelectedId === targetId) {
          setSelectedTarget(null);
        }
      }
    } catch (err) {
      console.error(err);
      const defaultMessage =
        type === "create"
          ? "Failed to create target. Please review the details and try again."
          : type === "update"
          ? "Failed to update target. Please review the details and try again."
          : "Failed to delete target. Please try again.";

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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.user_id) {
      toast.error("User is required.");
      return;
    }

    if (!formData.period) {
      toast.error("Target period is required.");
      return;
    }

    if (!formData.target_amount || Number(formData.target_amount) <= 0) {
      toast.error("Target amount must be greater than 0.");
      return;
    }

    const userName = users.find((u) => String(u.id) === formData.user_id);
    const displayName = userName
      ? `${userName.first_name} ${userName.last_name}`
      : "Unknown";

    const payload = {
      user_id: Number(formData.user_id),
      period: formData.period,
      target_amount: Number(formData.target_amount),
      achieved: formData.achieved ? Number(formData.achieved) : 0,
      status: formData.status || "ACTIVE",
    };

    const actionType = isEditing && currentTargetId ? "update" : "create";

    setConfirmModalData({
      title: actionType === "create" ? "Confirm New Target" : "Confirm Update",
      message:
        actionType === "create" ? (
          <span>
            Are you sure you want to create a target for{" "}
            <span className="font-semibold">{displayName}</span>?
          </span>
        ) : (
          <span>
            Save changes to the target for{" "}
            <span className="font-semibold">{displayName}</span>?
          </span>
        ),
      confirmLabel:
        actionType === "create" ? "Create Target" : "Update Target",
      cancelLabel: "Cancel",
      variant: "primary",
      action: {
        type: actionType,
        payload,
        targetId: currentTargetId || null,
        name: displayName,
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

  const selectedTargetDeleteDisabled =
    selectedTarget &&
    (deletingId === selectedTarget.id ||
      deleteActionTargetId === selectedTarget.id);

  const selectedTargetDeleting =
    selectedTarget && deletingId === selectedTarget.id;

  const detailStatusBadge = selectedTarget
    ? getDetailBadgeClass(selectedTarget.status)
    : "";

  const detailView = selectedTarget ? (
    <div className="p-4 sm:p-6 lg:p-8 font-inter">
      <button
        onClick={handleBackToList}
        className="inline-flex items-center text-sm sm:text-base text-gray-500 hover:text-gray-700 transition mb-4 sm:mb-6 cursor-pointer"
      >
        <HiArrowLeft className="mr-1 w-4 h-4 sm:w-5 sm:h-5" /> Back
      </button>

      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm space-y-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-2">
            {selectedTarget.user
              ? `${selectedTarget.user.first_name} ${selectedTarget.user.last_name}`
              : "Unknown User"}
            <span
              className={`inline-block text-xs px-2 py-0.5 rounded ${detailStatusBadge}`}
            >
              {formatStatusLabel(selectedTarget.status)}
            </span>
          </h1>

          <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
            <button
              className="inline-flex items-center justify-center w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-70"
              onClick={() => handleEditClick(selectedTarget)}
              disabled={
                confirmModalData?.action?.type === "update" &&
                confirmModalData.action.targetId === selectedTarget.id
              }
            >
              <FiEdit className="mr-2" />
              Edit
            </button>
            <button
              className="inline-flex items-center justify-center w-full sm:w-auto bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 disabled:opacity-70"
              onClick={() => handleDelete(selectedTarget)}
              disabled={Boolean(selectedTargetDeleteDisabled)}
            >
              {selectedTargetDeleting ? (
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
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">
            Target Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
            <DetailRow
              label="User"
              value={
                selectedTarget.user
                  ? `${selectedTarget.user.first_name} ${selectedTarget.user.last_name}`
                  : "--"
              }
            />
            <DetailRow label="Period" value={selectedTarget.period || "--"} />
            <DetailRow
              label="Target Amount"
              value={
                selectedTarget.target_amount
                  ? `₱${Number(selectedTarget.target_amount).toLocaleString()}`
                  : "--"
              }
            />
            <DetailRow
              label="Achieved"
              value={
                selectedTarget.achieved
                  ? `₱${Number(selectedTarget.achieved).toLocaleString()}`
                  : "--"
              }
            />
            <DetailRow
              label="Achievement %"
              value={
                selectedTarget.target_amount &&
                selectedTarget.achieved &&
                selectedTarget.target_amount > 0
                  ? `${Math.round(
                      (Number(selectedTarget.achieved) /
                        Number(selectedTarget.target_amount)) *
                        100
                    )}%`
                  : "--"
              }
            />
            <DetailRow
              label="Status"
              value={formatStatusLabel(selectedTarget.status)}
            />
            <DetailRow
              label="Created At"
              value={formattedDateTime(selectedTarget.created_at) || "--"}
            />
            <DetailRow
              label="Last Updated"
              value={formattedDateTime(selectedTarget.updated_at) || "--"}
            />
          </div>
        </div>
        </div>
        </div>
  ) : null;

  const listView = (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <h1 className="flex items-center text-xl sm:text-2xl font-semibold text-gray-800">
          <FiTarget className="mr-2 text-blue-600" />
          Targets
        </h1>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center bg-black text-white px-3 sm:px-4 py-2 rounded-md hover:bg-gray-800 text-sm sm:text-base ml-auto sm:ml-0"
        >
          <FiPlus className="mr-2" /> Add Target
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
            placeholder="Search targets"
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
        <table className="w-full min-w-[500px] border border-gray-200 rounded-lg bg-white shadow-sm text-sm">
          <thead className="bg-gray-100 text-left text-gray-600 text-sm tracking-wide font-semibold">
            <tr>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Period</th>
              <th className="py-3 px-4">Target Amount</th>
              <th className="py-3 px-4">Achieved</th>
              <th className="py-3 px-4">Achievement %</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {targetsLoading ? (
              <tr>
                <td
                  className="py-4 px-4 text-center text-sm text-gray-500"
                  colSpan={6}
                >
                  Loading targets...
                </td>
              </tr>
            ) : filteredTargets.length > 0 ? (
              paginatedTargets.map((t) => {
                const userName = t.user
                  ? `${t.user.first_name} ${t.user.last_name}`
                  : "Unknown";
                const achievement =
                  t.target_amount && t.achieved && t.target_amount > 0
                    ? Math.round((Number(t.achieved) / Number(t.target_amount)) * 100)
                    : 0;

                return (
                  <tr
                    key={t.id}
                    className="hover:bg-gray-50 text-xs cursor-pointer"
                    onClick={() => handleTargetClick(t)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-blue-600 hover:underline break-all">
                        {userName}
                      </div>
                    </td>
                    <td className="py-3 px-4">{t.period || "--"}</td>
                    <td className="py-3 px-4">
                      {t.target_amount
                        ? `₱${Number(t.target_amount).toLocaleString()}`
                        : "--"}
                    </td>
                    <td className="py-3 px-4">
                      {t.achieved
                        ? `₱${Number(t.achieved).toLocaleString()}`
                        : "--"}
                    </td>
                    <td className="py-3 px-4 text-green-600 font-semibold">
                      {achievement}%
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getTableBadgeClass(
                          t.status
                        )}`}
                      >
                        {formatStatusLabel(t.status)}
                      </span>
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
                  No targets found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <PaginationControls
        className="mt-4"
        totalItems={filteredTargets.length}
        pageSize={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPrev={handlePrevPage}
        onNext={handleNextPage}
        label="targets"
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
        className="bg-white w-full max-w-xl rounded-2xl shadow-lg p-6 relative border border-gray-200"
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
              {isEditing ? "Edit Target" : "Add New Target"}
            </h2>

        <form
          className="grid grid-cols-1 gap-4 text-sm"
          onSubmit={handleSubmit}
        >
          <SelectField
            label="User"
            name="user_id"
            value={formData.user_id}
            onChange={handleInputChange}
            options={[
              { value: "", label: "Select user" },
              ...users.map((user) => ({
                value: String(user.id),
                label: `${user.first_name} ${user.last_name} (${user.role})`,
              })),
            ]}
            required
            disabled={isSubmitting}
          />
          <InputField
            label="Target Period"
            name="period"
            type="month"
            value={formData.period}
            onChange={handleInputChange}
            placeholder="YYYY-MM"
            required
            disabled={isSubmitting}
          />
          <InputField
            label="Target Amount"
            name="target_amount"
            type="number"
            value={formData.target_amount}
            onChange={handleInputChange}
            placeholder="0.00"
            required
            disabled={isSubmitting}
          />
          <InputField
            label="Achieved"
            name="achieved"
            type="number"
            value={formData.achieved}
            onChange={handleInputChange}
            placeholder="0.00"
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

          <div className="flex flex-col sm:flex-row justify-end sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-4 w-full">
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
                ? "Update Target"
                : "Save Target"}
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
      {selectedTarget ? detailView : listView}
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
