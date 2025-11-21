import React, { useEffect, useMemo, useState } from "react";
import {
  FiUser,
  FiPlus,
  FiX,
  FiCalendar,
  FiSearch,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import { toast } from "react-toastify";
import PaginationControls from "../components/PaginationControls.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

const INITIAL_TERRITORY_STATE = {
  name: "",
  description: "",
  user_id: "",
  company_id: "",
};

const STATUS_FILTER_OPTIONS = [
  { label: "Filter by Status", value: "" },
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
];

const BOARD_PAGE_SIZE = 12;
const TABLE_PAGE_SIZE = 10;

export default function AdminTerritory() {
  useEffect(() => {
    document.title = "Territory | Sari-Sari CRM";
  }, []);

  const navigate = useNavigate();
  const { id } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [territoryList, setTerritoryList] = useState([]);
  const [territoryLoading, setTerritoryLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [territoryData, setTerritoryData] = useState(INITIAL_TERRITORY_STATE);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTerritoryId, setCurrentTerritoryId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewMode, setViewMode] = useState("board");
  const [confirmModalData, setConfirmModalData] = useState(null);
  const [confirmProcessing, setConfirmProcessing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (id && territoryList.length > 0) {
      const found = territoryList.find((t) => t.id === parseInt(id));
      if (found) setSelectedTerritory(found);
    }
  }, [id, territoryList]);

  const filteredTerritories = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const normalizedStatus = statusFilter.trim().toLowerCase();
    const normalizedUser = userFilter.trim();

    const sortedList = [...territoryList].sort((a, b) => {
      const aDate = a?.created_at ? new Date(a.created_at) : 0;
      const bDate = b?.created_at ? new Date(b.created_at) : 0;
      return bDate - aDate;
    });

    return sortedList.filter((territory) => {
      const name = territory.name?.toLowerCase() || "";
      const description = territory.description?.toLowerCase() || "";
      const managerName = territory.managed_by
        ? `${territory.managed_by.first_name} ${territory.managed_by.last_name}`.toLowerCase()
        : "";
      const statusText = territory.status?.toString().toLowerCase() || "";
      const createdDateText = territory.created_at
        ? new Date(territory.created_at)
            .toLocaleDateString("en-US", {
              month: "numeric",
              day: "numeric",
              year: "numeric",
            })
            .toLowerCase()
        : "";

      const searchFields = [
        name,
        description,
        managerName,
        statusText,
        createdDateText,
      ];

      const matchesSearch =
        normalizedQuery === "" ||
        searchFields.some((field) => field && field.includes(normalizedQuery));

      const matchesStatus =
        normalizedStatus === "" || statusText === normalizedStatus;

      const matchesUser =
        normalizedUser === "" ||
        String(territory.managed_by?.id || "") === normalizedUser;

      return matchesSearch && matchesStatus && matchesUser;
    });
  }, [territoryList, searchQuery, statusFilter, userFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, userFilter]);

  useEffect(() => {
    setCurrentPage((prev) => {
      const maxPage = Math.max(
        1,
        Math.ceil(
          filteredTerritories.length /
            (viewMode === "board" ? BOARD_PAGE_SIZE : TABLE_PAGE_SIZE)
        ) || 1
      );
      return prev > maxPage ? maxPage : prev;
    });
  }, [filteredTerritories.length, viewMode]);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users/sales/read");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchTerritories = async () => {
    setTerritoryLoading(true);
    try {
      const response = await api.get("/territories/fetch");
      const data = Array.isArray(response.data) ? response.data : [];
      setTerritoryList(data);
      return data;
    } catch (error) {
      console.error("Error fetching territories:", error);
      return [];
    } finally {
      setTerritoryLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTerritories();
  }, []);

  const handleTerritoryChange = (e) => {
    const { name, value } = e.target;
    setTerritoryData((prevData) => {
      const updatedData = {
        ...prevData,
        [name]: value,
      };

      if (name === "user_id") {
        const parsedId = value ? parseInt(value, 10) : null;
        const user =
          users.find((candidate) => candidate.id === parsedId) || null;
        setSelectedUser(user);
        return {
          ...updatedData,
          company_id: user?.company?.id ? String(user.company.id) : "",
        };
      }

      return updatedData;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedName = territoryData.name.trim();
    if (!trimmedName) {
      toast.error("Territory name is required.");
      return;
    }

    const selectedUserId = territoryData.user_id
      ? Number(territoryData.user_id)
      : null;

    if (!isEditing && selectedUserId === null) {
      toast.error("Please assign a user to the territory.");
      return;
    }

    const derivedCompanyId = selectedUser
      ? selectedUser.company?.id ?? null
      : territoryData.company_id
      ? Number(territoryData.company_id)
      : null;

    const existingTerritory =
      isEditing && currentTerritoryId
        ? territoryList.find((territory) => territory.id === currentTerritoryId)
        : null;

    const finalCompanyId =
      derivedCompanyId ?? existingTerritory?.company_id ?? null;

    if (!isEditing && finalCompanyId === null) {
      toast.error(
        "Company information is missing for the selected user. Please choose another user."
      );
      return;
    }

    const payload = {
      name: trimmedName,
      description: territoryData.description?.trim() || "",
    };

    payload.user_id = selectedUserId;
    payload.company_id = finalCompanyId;

    const actionType = isEditing && currentTerritoryId ? "update" : "create";

    setConfirmModalData({
      title:
        actionType === "create" ? "Confirm New Territory" : "Confirm Update",
      message:
        actionType === "create" ? (
          <span>
            Are you sure you want to create the territory{" "}
            <span className="font-semibold">{trimmedName}</span>?
          </span>
        ) : (
          <span>
            Save changes to the territory{" "}
            <span className="font-semibold">{trimmedName}</span>?
          </span>
        ),
      confirmLabel:
        actionType === "create" ? "Create Territory" : "Update Territory",
      cancelLabel: "Cancel",
      variant: "primary",
      action: {
        type: actionType,
        payload,
        targetId: currentTerritoryId || null,
        name: trimmedName,
      },
    });
  };

  const handleOpenCreateModal = () => {
    setTerritoryData(INITIAL_TERRITORY_STATE);
    setSelectedUser(null);
    setIsEditing(false);
    setCurrentTerritoryId(null);
    setShowFormModal(true);
  };

  const handleCloseFormModal = (restoreDetail = true) => {
    const editingId = restoreDetail && isEditing ? currentTerritoryId : null;
    setShowFormModal(false);
    setIsEditing(false);
    setCurrentTerritoryId(null);
    setTerritoryData(INITIAL_TERRITORY_STATE);
    setSelectedUser(null);
    if (editingId) {
      const existing = territoryList.find(
        (territory) => territory.id === editingId
      );
      setSelectedTerritory(existing || null);
    }
  };

  const handleEditTerritory = (territory) => {
    if (!territory) return;

    const managedById = territory.managed_by?.id
      ? String(territory.managed_by.id)
      : "";

    const matchedUser =
      managedById !== ""
        ? users.find((user) => user.id === territory.managed_by.id) || null
        : null;

    setTerritoryData({
      name: territory.name || "",
      description: territory.description || "",
      user_id: managedById,
      company_id: territory.company_id ? String(territory.company_id) : "",
    });
    setSelectedUser(matchedUser);
    setIsEditing(true);
    setCurrentTerritoryId(territory.id);
    setSelectedTerritory(null);
    setShowFormModal(true);
  };

  const handleDelete = (territory) => {
    if (!territory) return;

    setConfirmModalData({
      title: "Delete Territory",
      message: (
        <span>
          Are you sure you want to permanently delete the territory{" "}
          <span className="font-semibold">{territory.name}</span>? This action
          cannot be undone.
        </span>
      ),
      confirmLabel: "Delete Territory",
      cancelLabel: "Cancel",
      variant: "danger",
      action: {
        type: "delete",
        targetId: territory.id,
        name: territory.name,
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
        await api.post(`/territories/assign`, {
          ...payload,
          user_id:
            payload.user_id !== null && payload.user_id !== undefined
              ? Number(payload.user_id)
              : null,
          company_id:
            payload.company_id !== null && payload.company_id !== undefined
              ? Number(payload.company_id)
              : null,
        });
        toast.success(`Territory "${name}" created successfully.`);
        await fetchTerritories();
        await fetchUsers();
        handleCloseFormModal(false);
      } else if (type === "update") {
        if (!targetId) {
          throw new Error("Missing territory identifier for update.");
        }
        setIsSubmitting(true);
        const response = await api.put(`/territories/${targetId}`, {
          ...payload,
          user_id:
            payload.user_id !== null && payload.user_id !== undefined
              ? Number(payload.user_id)
              : null,
          company_id:
            payload.company_id !== null && payload.company_id !== undefined
              ? Number(payload.company_id)
              : null,
        });
        toast.success(`Territory "${name}" updated successfully.`);
        const updatedTerritory = response.data;

        handleCloseFormModal(false);
        setSelectedTerritory(null);

        setTerritoryList((prevList) => {
          if (!Array.isArray(prevList)) return prevList;
          const nextList = prevList.map((territory) =>
            territory.id === targetId ? updatedTerritory : territory
          );

          // If the territory was not in the previous list (e.g. due to filtering),
          // append it to ensure it's available without a reload.
          const exists = prevList.some(
            (territory) => territory.id === targetId
          );
          return exists ? nextList : [updatedTerritory, ...prevList];
        });

        await fetchTerritories();
        await fetchUsers();
      } else if (type === "delete") {
        if (!targetId) {
          throw new Error("Missing territory identifier for deletion.");
        }
        setDeletingId(targetId);
        await api.delete(`/territories/${targetId}`);
        toast.success(`Territory "${name}" deleted successfully.`);
        const selectedId = selectedTerritory?.id;
        await fetchTerritories();
        if (selectedId === targetId) {
          setSelectedTerritory(null);
        }
        await fetchUsers();
      }
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        (type === "create"
          ? "Failed to create territory. Please try again."
          : type === "update"
          ? "Failed to update territory. Please review the details and try again."
          : "Failed to delete territory. Please try again.");
      console.error(error);
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

  const selectedTerritoryDeleting =
    Boolean(selectedTerritory) && deletingId === selectedTerritory?.id;

  const paginatedTerritories = useMemo(() => {
    const pageSize = viewMode === "board" ? BOARD_PAGE_SIZE : TABLE_PAGE_SIZE;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTerritories.slice(startIndex, startIndex + pageSize);
  }, [filteredTerritories, currentPage, viewMode]);

  const hasResults = filteredTerritories.length > 0;

  // Helper function for status badges in list view
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700";
      case "Inactive":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) =>
      Math.min(
        prev + 1,
        Math.max(
          1,
          Math.ceil(
            filteredTerritories.length /
              (viewMode === "board" ? BOARD_PAGE_SIZE : TABLE_PAGE_SIZE)
          ) || 1
        )
      )
    );

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
      <div className="p-4 sm:p-6 lg:p-8 min-h-screen font-inter relative">
        {territoryLoading && <LoadingSpinner message="Loading territories..." />}
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 mb-7">
          {/* Title */}
          <h2 className="flex items-center text-2xl font-semibold text-gray-800">
            <FiUser className="mr-2 text-blue-600" /> Territory
          </h2>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:ml-auto">
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center justify-center bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 cursor-pointer w-full sm:w-auto gap-2"
            >
              <FiPlus /> Create Territory
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mt-6 mb-4 flex flex-col lg:flex-row items-center justify-between gap-2 w-full">
          <div className="flex items-center border border-gray-300 rounded-lg px-4 h-11 w-full lg:w-3/4 focus-within:ring-2 focus-within:ring-indigo-500 transition">
            <FiSearch size={20} className="text-gray-400 mr-3" />
            <input
              type="text"
              placeholder="Search territory"
              className="focus:outline-none text-base w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row w-full lg:w-1/2 gap-2">
            <select
              className="border border-gray-300 rounded-lg px-3 h-11 text-sm text-gray-600 bg-white w-full focus:ring-2 focus:ring-indigo-500 transition"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className="border border-gray-300 rounded-lg px-3 h-11 text-sm text-gray-600 bg-white w-full focus:ring-2 focus:ring-indigo-500 transition"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            >
              <option value="">Filter by Users</option>
              {Array.isArray(users) &&
                users.map((user) => (
                  <option key={user.id} value={String(user.id)}>
                    {user.first_name} {user.last_name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setViewMode("board")}
            className={`px-4 py-2 rounded-full text-sm ${
              viewMode === "board"
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Board View
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 rounded-full text-sm ${
              viewMode === "list"
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            List View
          </button>
        </div>

        {/* Cards Grid */}
        {viewMode === "board" &&
          (hasResults ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 rounded-md">
              {paginatedTerritories.map((territory) => (
                <div
                  key={territory.id}
                  onClick={() => {
                    setSelectedTerritory(territory);
                    navigate(`/admin/territory/${territory.id}`);
                  }}
                  className="bg-white p-4 shadow border border-gray-200 flex flex-col justify-between relative cursor-pointer hover:shadow-md transition"
                >
                  {/* Top horizontal line */}
                  <div className="absolute top-0 left-0 w-full h-5 bg-secondary rounded-t-md" />

                  <h3 className="font-medium text-gray-900 mb-2 pt-7">
                    {territory.name}
                  </h3>

                  {territory.description && (
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {territory.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <FiUser />{" "}
                    {territory.managed_by
                      ? `${territory.managed_by.first_name} ${territory.managed_by.last_name}`
                      : "Unassigned"}
                  </div>

                  <div className="h-px bg-gray-200 w-full" />

                  <div className="flex items-center justify-between text-sm p-1">
                    <div className="text-gray-400">
                      {territory.created_at
                        ? new Date(territory.created_at)
                            .toLocaleString("en-US", {
                              month: "numeric",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })
                            .replace(",", "")
                        : "—"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl py-10 text-center text-sm text-gray-500">
              No territories found.
            </div>
          ))}

        {viewMode === "list" && (
          <div className="bg-white rounded-md shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-600 text-left">
                  <tr>
                    <th className="py-3 px-4 font-medium">
                      Territory
                    </th>
                    <th className="py-3 px-4 font-medium">
                      Assigned To
                    </th>
                    <th className="py-3 px-4 font-medium">
                      Status
                    </th>
                    <th className="py-3 px-4 font-medium">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {hasResults ? (
                    paginatedTerritories.map((territory) => (
                      <tr
                        key={territory.id}
                        className="hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                        onClick={() => {
                          setSelectedTerritory(territory);
                          navigate(`/admin/territory/${territory.id}`);
                        }}
                      >
                        <td className="py-3 px-4 text-gray-700 whitespace-nowrap font-medium">
                          {territory.name}
                        </td>
                        <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                          {territory.managed_by
                            ? `${territory.managed_by.first_name} ${territory.managed_by.last_name}`
                            : "Unassigned"}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusBadgeClass(
                              territory.status || "Inactive"
                            )}`}
                          >
                            {territory.status || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                          {territory.created_at
                            ? new Date(territory.created_at).toLocaleDateString(
                                "en-US"
                              )
                            : "—"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-3 px-4 text-center text-sm text-gray-500"
                      >
                        No territories found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Details Popup Modal */}
        {selectedTerritory && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-8 relative">
              {/* Top horizontal line */}
              <div className="absolute top-0 left-0 w-full h-10 bg-secondary rounded-t-md flex justify-end items-center px-4">
                <button
                  className="text-white hover:text-gray-200 transition"
                  onClick={() => {
                    setSelectedTerritory(null);
                    navigate(`/admin/territory`);
                  }}
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* Header */}
              <div className="flex items-center justify-between mb-4 pt-10">
                <h2 className="text-3xl font-semibold text-gray-900">
                  {selectedTerritory.name}
                </h2>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  {selectedTerritory.status || "—"}
                  {selectedTerritory.status && (
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        selectedTerritory.status === "Active"
                          ? "bg-green-500"
                          : "bg-yellow-500"
                      }`}
                    ></span>
                  )}
                </div>
              </div>
              <div className="h-px bg-gray-200 w-full mb-4" />

              {/* Assigned user & date */}
              <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
                <div>
                  <p className="text-gray-500">Assigned To</p>
                  <div className="flex items-center gap-2 text-gray-800 font-medium mt-1">
                    <FiUser />{" "}
                    {selectedTerritory.managed_by
                      ? `${selectedTerritory.managed_by.first_name} ${selectedTerritory.managed_by.last_name}`
                      : "Unassigned"}
                  </div>
                </div>
                <div>
                  <p className="text-gray-500">Created Date</p>
                  <div className="flex items-center gap-2 text-gray-800 font-medium mt-1">
                    <FiCalendar />{" "}
                    {selectedTerritory.created_at
                      ? new Date(selectedTerritory.created_at)
                          .toLocaleString("en-US", {
                            month: "numeric",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })
                          .replace(",", "")
                      : "—"}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-gray-500 mb-1">Description</p>
                <div className="max-h-[150px] overflow-y-auto hide-scrollbar">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {selectedTerritory.description || "—"}
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0 mt-6 sm:justify-end">
                <button
                  className="inline-flex items-center justify-center w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  onClick={() => handleEditTerritory(selectedTerritory)}
                >
                  <FiEdit2 className="mr-2" />
                  Edit
                </button>
                <button
                  className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 rounded-md text-sm bg-red-500 text-white hover:bg-red-600 transition focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-70"
                  onClick={() => handleDelete(selectedTerritory)}
                  disabled={
                    selectedTerritoryDeleting ||
                    (confirmProcessing &&
                      confirmModalData?.action?.type === "delete" &&
                      confirmModalData.action.targetId ===
                        selectedTerritory?.id)
                  }
                >
                  <FiTrash2 className="mr-2" />
                  {selectedTerritoryDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create / Edit Territory Modal */}
        {showFormModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-xl p-6 relative border border-gray-200">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
                onClick={() => handleCloseFormModal()}
                disabled={isSubmitting || confirmProcessing}
              >
                <FiX size={22} />
              </button>

              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {isEditing ? "Edit Territory" : "Create Territory"}
                </h2>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <InputField
                  label="Territory Name"
                  name="name"
                  value={territoryData.name}
                  onChange={handleTerritoryChange}
                  placeholder="e.g. North Luzon Enterprise"
                  required
                  disabled={isSubmitting || confirmProcessing}
                />

                <SelectField
                  label="Assigned To"
                  name="user_id"
                  value={territoryData.user_id}
                  onChange={handleTerritoryChange}
                  options={[
                    {
                      value: "",
                      label: isEditing ? "Unassign Territory" : "Assign User",
                    },
                    ...users.map((user) => ({
                      value: String(user.id),
                      label: `${user.first_name} ${user.last_name}`,
                    })),
                  ]}
                  disabled={
                    isSubmitting || confirmProcessing || users.length === 0
                  }
                />

                <TextareaField
                  label="Description"
                  name="description"
                  value={territoryData.description}
                  onChange={handleTerritoryChange}
                  placeholder="Add Territory Description"
                  rows={4}
                  disabled={isSubmitting || confirmProcessing}
                />

                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleCloseFormModal()}
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
                    {isSubmitting || confirmProcessing
                      ? "Saving..."
                      : isEditing
                      ? "Update Territory"
                      : "Save Territory"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <PaginationControls
          className="mt-4"
          totalItems={filteredTerritories.length}
          pageSize={viewMode === "board" ? BOARD_PAGE_SIZE : TABLE_PAGE_SIZE}
          currentPage={currentPage}
          onPrev={handlePrevPage}
          onNext={handleNextPage}
          label="territories"
        />
      </div>
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
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none disabled:bg-gray-100"
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
        disabled={disabled}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-gray-400 outline-none disabled:bg-gray-100"
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

function TextareaField({
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled = false,
}) {
  return (
    <div>
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
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none disabled:bg-gray-100"
      />
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
