// frontend/src/pages/AdminTerritory.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  FiUser,
  FiPlus,
  FiX,
  FiCalendar,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiChevronDown,
  FiCheckSquare,
  FiArchive,
} from "react-icons/fi";
import { LuMapPin } from "react-icons/lu";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import { toast } from "react-toastify";
import PaginationControls from "../components/PaginationControls.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { IoIosInformationCircleOutline } from "react-icons/io";
import useAuth from "../hooks/useAuth.js";

const INITIAL_TERRITORY_STATE = {
  name: "",
  description: "",
  manager_id: "",
  user_ids: [], // Stores multiple user IDs
  company_id: "",
};

const STATUS_FILTER_OPTIONS = [
  { label: "Filter by Status", value: "" },
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
];

// --- NEW COMPONENT: Searchable Multi-Select ---
function SearchableMultiSelect({
  label,
  options,
  selectedValues,
  onChange,
  disabled = false,
  placeholder = "Select users...",
  isSubmitted = false,
  required = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (value) => {
    const isSelected = selectedValues.includes(value);
    let newValues;
    if (isSelected) {
      newValues = selectedValues.filter((v) => v !== value);
    } else {
      newValues = [...selectedValues, value];
    }
    onChange(newValues);
  };

  const removeTag = (e, value) => {
    e.stopPropagation();
    onChange(selectedValues.filter((v) => v !== value));
  };

  const selectedLabels = options.filter(o => selectedValues.includes(o.value));

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-gray-700 font-medium mb-1 text-sm">{label}</label>
      
      {/* Trigger / Input Area */}
     <div
  onClick={() => !disabled && setIsOpen(!isOpen)}
  className={`w-full border ${
  required && isSubmitted && selectedValues.length === 0
    ? 'border-red-500 ring-red-500'
    : isOpen ? 'border-gray-500 ring-1 ring-gray-400' : 'border-gray-300'
} 
  rounded-md px-3 py-2 text-sm bg-white cursor-pointer min-h-[38px] flex flex-wrap items-center gap-2
  ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
>
        {selectedValues.length === 0 && (
          <span className="text-gray-400 select-none">{placeholder}</span>
        )}
        
        {selectedLabels.map((opt) => (
          <span key={opt.value} className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs flex items-center gap-1 border border-indigo-200">
            {opt.label}
            {!disabled && (
              <FiX 
                className="cursor-pointer hover:text-indigo-900" 
                onClick={(e) => removeTag(e, opt.value)}
              />
            )}
          </span>
        ))}
        
        <div className="ml-auto text-gray-400">
          <FiChevronDown />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
            <div className="flex items-center px-2 py-1 bg-gray-50 rounded border border-gray-200">
              <FiSearch className="text-gray-400 mr-2" />
              <input
                type="text"
                className="bg-transparent outline-none w-full text-sm"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          
          {/* Options List */}
          <div className="overflow-y-auto flex-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <div
                    key={option.value}
                    onClick={() => toggleOption(option.value)}
                    className={`px-4 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-gray-50 
                      ${isSelected ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'}`}
                  >
                    <span>{option.label}</span>
                    {isSelected && <FiCheck className="text-indigo-600" />}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const justUpdatedRef = useRef(false);
  const createSubmittedRef = useRef(false);  // Prevent duplicate create submissions
  const {userRole} = useAuth();

  // Helper function to determine role for navigation
  const getRoleForNavigation = () => {
    if (userRole.toLowerCase() === 'ceo' || userRole.toLowerCase() === 'admin') {
      return 'admin';
    } else if (userRole.toLowerCase() === 'group manager' || userRole.toLowerCase() === 'group_manager') {
      return 'group-manager';
    } else if (userRole.toLowerCase() === 'manager') {
      return 'manager';
    } else {
      return 'sales';
    }
  };

  // Grouping territories logic
  const groupedTerritories = useMemo(() => {
    // 1. Group by Name + Manager + Description
    // Because the backend returns separate rows per user, we need to merge them for display
    const groupedMap = new Map();

    territoryList.forEach(t => {
        // Create a unique key for grouping. 
        // We use name and manager_id. If description varies, you might want to include it too.
        const key = `${t.name}-${t.manager_id || 'no-manager'}`; 
        
        if (!groupedMap.has(key)) {
            // Create a "virtual" grouped object. 
            // We use the first entry's ID as the main ID for routing/editing logic initially
            groupedMap.set(key, {
                ...t, 
                // Track all territory IDs in this group for bulk operations
                territory_ids: [t.id],
                // We create an array 'assigned_users_list' to hold all users from the split rows
                assigned_users_list: t.assigned_to ? [t.assigned_to] : [] 
            });
        } else {
            // If entry exists, just push the user to the array if they exist
            const existing = groupedMap.get(key);
            // Track all territory IDs
            existing.territory_ids.push(t.id);
            if (t.assigned_to) {
                // Avoid duplicates if data is somehow messy
                if (!existing.assigned_users_list.some(u => u.id === t.assigned_to.id)) {
                    existing.assigned_users_list.push(t.assigned_to);
                }
            }
        }
    });

    return Array.from(groupedMap.values());
  }, [territoryList]);

  // Filtering and Searching Logic
  const filteredTerritories = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const normalizedStatus = statusFilter.trim().toLowerCase();
    const normalizedUser = userFilter.trim();

    const sortedList = [...groupedTerritories].sort((a, b) => {
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
      
      // Build string of assigned users for search
      const assignedUsersString = territory.assigned_users_list
        .map(u => `${u.first_name} ${u.last_name}`.toLowerCase())
        .join(" ");

      const searchFields = [
        name,
        description,
        managerName,
        statusText,
        assignedUsersString
      ];

      const matchesSearch =
        normalizedQuery === "" ||
        searchFields.some((field) => field && field.includes(normalizedQuery));

      const matchesStatus =
        normalizedStatus === "" || statusText === normalizedStatus;

      // Check if filtered user is EITHER the manager OR one of the assigned users
      const matchesUser =
        normalizedUser === "" ||
        String(territory.managed_by?.id || "") === normalizedUser ||
        territory.assigned_users_list.some(u => String(u.id) === normalizedUser);

      return matchesSearch && matchesStatus && matchesUser;
    });
  }, [groupedTerritories, searchQuery, statusFilter, userFilter]);

  // Popup Logic
  useEffect(() => {
    if (justUpdatedRef.current) {
      justUpdatedRef.current = false;
      return;
    }
    
    // Logic to find the correct grouped territory when opening via URL ID
    if (id && groupedTerritories.length > 0 && !isEditing && !showFormModal && !isSubmitting) {
      // Because we grouped them, the ID in the URL might point to one row, but we want the group.
      // We look for any group that contains a sub-territory with this ID, OR matches the main group ID.
      const found = groupedTerritories.find(t => t.id === parseInt(id)); 
      // Note: If you need to find it by a sub-id (since IDs are unique per row), you'd need logic here.
      // For now, assuming clicking the card passes the 'id' of the representative row.
      
      if (found) setSelectedTerritory(found);
    }
    if (!id && !isEditing && !showFormModal) {
      setSelectedTerritory(null);
    }
  }, [id, groupedTerritories, isEditing, showFormModal, isSubmitting]);

  // ... (Pagination effects remain same) ...
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, userFilter]);

  useEffect(() => {
    setCurrentPage((prev) => {
      const maxPage = Math.max(
        1,
        Math.ceil(filteredTerritories.length / itemsPerPage) || 1
      );
      return prev > maxPage ? maxPage : prev;
    });
  }, [filteredTerritories.length, itemsPerPage]);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users/read/territory");
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
      console.log(response.data);
    } catch (error) {
      console.error("Error fetching territories:", error);
    } finally {
      setTerritoryLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get("/auth/me");
      setCurrentUser(response.data);
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTerritories();
    fetchCurrentUser();
  }, []);

  // Helper function to check if current user can delete/select a territory
  const canDeleteTerritory = (territory) => {
    if (userRole.toLowerCase() === 'ceo' || userRole.toLowerCase() === 'admin') {
      return true; // CEO/Admin can delete any territory
    }
    if (userRole.toLowerCase() === 'group_manager' || userRole.toLowerCase() === 'group manager') {
      return currentUser && territory.territory_creator?.id === currentUser.id; // Group Manager can only delete their own
    }
    return false; // Other roles cannot delete
  };

  const isGroupManagerArchiving = () => {
    return userRole.toLowerCase() === 'group_manager' || userRole.toLowerCase() === 'group manager';
  };

  const handleTerritoryChange = (e) => {
    const { name, value } = e.target;
    setTerritoryData((prev) => ({ ...prev, [name]: value }));
  };

  // Handler for MultiSelect
  const handleAssignedUsersChange = (newValues) => {
    setTerritoryData((prev) => ({ ...prev, user_ids: newValues }));
  };

  const handleOpenCreateModal = () => {
    setTerritoryData(INITIAL_TERRITORY_STATE);
    setIsEditing(false);
    setCurrentTerritoryId(null);
    setShowFormModal(true);
  };

  const handleCloseFormModal = (restoreDetail = true) => {
    setShowFormModal(false);
    setIsEditing(false);
    setCurrentTerritoryId(null);
    setTerritoryData(INITIAL_TERRITORY_STATE);
    // Restore detail view if needed (optional logic here)
  };

  const handleEditTerritory = (territoryGroup) => {
    if (!territoryGroup) return;

    // We extract all user IDs from the grouped object
    const assignedUserIds = territoryGroup.assigned_users_list 
        ? territoryGroup.assigned_users_list.map(u => String(u.id))
        : [];

    setTerritoryData({
      name: territoryGroup.name || "",
      description: territoryGroup.description || "",
      manager_id: territoryGroup.managed_by ? String(territoryGroup.managed_by.id) : "",
      user_ids: assignedUserIds, // Pre-fill multi-select
      company_id: territoryGroup.company_id ? String(territoryGroup.company_id) : "",
    });
    
    setIsEditing(true);
    // Note: We use the ID of the representative row as the 'targetId' for update logic,
    // though the backend might delete/recreate rows based on Name+Company.
    // Ideally, the backend update endpoint should handle "Update all rows with Name X and Company Y".
    // Or you simply use CREATE mode logic to overwrite. 
    // Given the backend logic: The user likely deletes old rows or updates logic is complex.
    // For this frontend code, we will assume we pass the representative ID.
    setCurrentTerritoryId(territoryGroup.id);
    
    setSelectedTerritory(null);
    setShowFormModal(true);
  };

    //validation
const [isSubmitted, setIsSubmitted] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Prevent form submission if already processing
    if (isSubmitting || confirmModalData) {
      return;
    }
    
    setIsSubmitted(true);  

    const trimmedName = territoryData.name.trim();
    if (!trimmedName) {
      toast.error("Territory name is required.");
      return;
    }

    if (!territoryData.manager_id) {
  toast.error("Territory manager is required.");
  return;
}

    if (territoryData.user_ids.length === 0) {
      toast.error("Please assign at least one user.");
      return;
    }

    // Determine Company ID
    let finalCompanyId = territoryData.company_id ? Number(territoryData.company_id) : null;
    if (!finalCompanyId && territoryData.user_ids.length > 0) {
        const firstUserId = territoryData.user_ids[0];
        const userObj = users.find(u => String(u.id) === String(firstUserId));
        if (userObj && userObj.company) {
            finalCompanyId = userObj.company.id;
        }
    }

    // Deduplicate user_ids to prevent creating duplicate territories
    const uniqueUserIds = [...new Set(territoryData.user_ids.map(id => Number(id)))];

    const payload = {
      name: trimmedName,
      description: territoryData.description?.trim() || "",
      manager_id: territoryData.manager_id ? Number(territoryData.manager_id) : null,
      user_ids: uniqueUserIds, // Send deduplicated Array
      company_id: finalCompanyId
    };

    const actionType = isEditing && currentTerritoryId ? "update" : "create";

    setConfirmModalData({
      title: actionType === "create" ? "Confirm New Territory" : "Confirm Update",
      message: (
        <span>
          {actionType === "create" ? "Create" : "Update"} territory <span className="font-semibold">{trimmedName}</span> with {payload.user_ids.length} assigned users?
        </span>
      ),
      confirmLabel: actionType === "create" ? "Create" : "Update",
      cancelLabel: "Cancel",
      variant: "primary",
      action: { type: actionType, payload, targetId: currentTerritoryId, name: trimmedName },
    });
  };

  const handleDelete = (territoryGroup) => {
    if (!territoryGroup) return;
    
    const isGroupManager = userRole.toLowerCase() === 'group_manager' || userRole.toLowerCase() === 'group manager';
    const actionLabel = isGroupManager ? 'Archive' : 'Delete';
    const actionMessage = isGroupManager 
      ? `Are you sure you want to archive <span class="font-semibold">${territoryGroup.name}</span>? 
          <br/><span class="text-xs text-orange-500">This will archive assignments for all ${territoryGroup.assigned_users_list.length} users in this group.</span>`
      : `Are you sure you want to delete <span class="font-semibold">${territoryGroup.name}</span>? 
          <br/><span class="text-xs text-red-500">This will remove assignments for all ${territoryGroup.assigned_users_list.length} users in this group.</span>`;
    
    // Both GROUP MANAGER and ADMIN/CEO use bulk-delete to handle entire groups
    const actionConfig = { 
      type: "bulk-delete", 
      territory_ids: territoryGroup.territory_ids, 
      name: territoryGroup.name 
    };
    
    setConfirmModalData({
      title: `${actionLabel} Territory Group`,
      message: (
        <span dangerouslySetInnerHTML={{ __html: actionMessage }} />
      ),
      confirmLabel: actionLabel,
      cancelLabel: "Cancel",
      variant: isGroupManager ? "warning" : "danger",
      action: actionConfig,
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const isGroupManager = userRole.toLowerCase() === 'group_manager' || userRole.toLowerCase() === 'group manager';
    const actionLabel = isGroupManager ? 'Archive' : 'Delete';
    const actionMessage = isGroupManager
      ? `Are you sure you want to archive <span class="font-semibold">${selectedIds.length}</span> selected territories? This action cannot be undone.`
      : `Are you sure you want to delete <span class="font-semibold">${selectedIds.length}</span> selected territories? This action cannot be undone.`;

    setConfirmModalData({
      title: `${actionLabel} Territories`,
      message: (
        <span dangerouslySetInnerHTML={{ __html: actionMessage }} />
      ),
      confirmLabel: `${actionLabel} ${selectedIds.length} Territory(ies)`,
      cancelLabel: "Cancel",
      variant: isGroupManager ? "warning" : "danger",
      action: {
        type: "bulk-delete",
        territory_ids: selectedIds,
      },
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const selectableIds = paginatedTerritories
        .filter((t) => canDeleteTerritory(t))
        .flatMap((t) => {
          // Expand all territory IDs in each group for both GROUP MANAGER and ADMIN/CEO
          return t.territory_ids ? t.territory_ids : [t.id];
        });
      setSelectedIds(selectableIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleCheckboxChange = (territoryOrId) => {
    // Handle both single ID and territory object with territory_ids array
    let idsToToggle = [];
    if (typeof territoryOrId === 'object' && territoryOrId.territory_ids) {
      // It's a grouped territory - select all IDs in the group for both GROUP MANAGER and ADMIN/CEO
      idsToToggle = territoryOrId.territory_ids;
    } else if (typeof territoryOrId === 'object' && territoryOrId.id) {
      // It's a territory object - extract its ID
      idsToToggle = [territoryOrId.id];
    } else {
      // It's a single ID
      idsToToggle = [territoryOrId];
    }
    
    setSelectedIds((prev) => {
      // Check if all IDs are already selected
      const allSelected = idsToToggle.every((id) => prev.includes(id));
      
      if (allSelected) {
        // Remove all these IDs
        return prev.filter((id) => !idsToToggle.includes(id));
      } else {
        // Add all these IDs
        return [...prev, ...idsToToggle.filter((id) => !prev.includes(id))];
      }
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmModalData?.action) { setConfirmModalData(null); return; }
    const { action } = confirmModalData;
    const { type, payload, targetId, name } = action;

    // Prevent duplicate create submissions
    if (type === "create" && createSubmittedRef.current) {
      return;
    }
    if (type === "create") {
      createSubmittedRef.current = true;
    }

    setConfirmProcessing(true);

    try {
      if (type === "create") {
        setIsSubmitting(true);
        // Note: Backend router expects user_ids array
        await api.post(`/territories/assign`, payload); 
        toast.success(`Territory "${name}" created.`);
        await fetchTerritories();
        await fetchUsers();
        handleCloseFormModal(false);
      } else if (type === "update") {
        setIsSubmitting(true);
        // Use PUT endpoint to update the territory
        await api.put(`/territories/${targetId}`, payload);
        
        toast.success(`Territory "${name}" updated.`);
        justUpdatedRef.current = true;
        handleCloseFormModal(false);
        setSelectedTerritory(null);
        if (id) navigate("/admin/territory");
        await fetchTerritories();
        await fetchUsers();
      } else if (type === "delete") {
        // Since rows are split, we might need to delete by Name? 
        // Or if backend deletes only ID, we might leave orphans.
        // Assuming backend deletes by ID. To delete the GROUP, we might need to loop 
        // or send a delete-group endpoint.
        // For this specific frontend request, we keep it simple:
        setDeletingId(targetId);
        await api.delete(`/territories/${targetId}`); 
        
        const actionLabel = isGroupManagerArchiving() ? 'archived' : 'deleted';
        toast.success(`Territory "${name}" ${actionLabel}.`);
        await fetchTerritories();
        if (selectedTerritory?.id === targetId) setSelectedTerritory(null);
        // Close all modals after successful delete
        setShowFormModal(false);
      } else if (type === "bulk-delete") {
        await api.delete("/territories/admin/bulk-delete", {
          data: { territory_ids: action.territory_ids },
        });
        const actionLabel = isGroupManagerArchiving() ? 'archived' : 'deleted';
        // If name is provided (from handleDelete), show territory name; otherwise show count
        const message = name 
          ? `Territory "${name}" ${actionLabel} (${action.territory_ids.length} user(s)).`
          : `Successfully ${actionLabel} ${action.territory_ids.length} territories`;
        toast.success(message);
        setSelectedIds([]);
        await fetchTerritories();
        // Close all modals after successful bulk delete
        setSelectedTerritory(null);
        setShowFormModal(false);
      }
    } catch (error) {
       console.error(error);
       toast.error("An error occurred.");
    } finally {
       setIsSubmitting(false);
      setIsSubmitted(false);
       setDeletingId(null);
       setConfirmProcessing(false);
       setConfirmModalData(null);
       if (type === "create") {
         createSubmittedRef.current = false;  // Reset for next create
       }
    }
  };

  const handleCancelConfirm = () => { if(!confirmProcessing) setConfirmModalData(null); };

  const paginatedTerritories = useMemo(() => {
    if (viewMode === "board") {
      return filteredTerritories;
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTerritories.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTerritories, currentPage, itemsPerPage, viewMode]);

  const hasResults = filteredTerritories.length > 0;

  const getStatusBadgeClass = (status) => {
    return status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700";
  };

  const handlePrevPage = () => setCurrentPage(p => Math.max(p - 1, 1));
  const handleNextPage = () => setCurrentPage(p => Math.min(p + 1, Math.ceil(filteredTerritories.length / itemsPerPage) || 1));

  // Helper to display user list in UI
  const renderAssignedUsers = (userList) => {
      if (!userList || userList.length === 0) return "Unassigned";
      if (userList.length === 1) return `${userList[0].first_name} ${userList[0].last_name}`;
      return `${userList[0].first_name} ${userList[0].last_name} +${userList.length - 1} more`;
  };

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 min-h-screen font-inter relative">
        {territoryLoading && <LoadingSpinner message="Loading territories..." />}
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 mb-7">
           <h2 className="flex items-center text-2xl font-semibold text-gray-800">
             <LuMapPin className="mr-2 text-blue-600" /> Territory
           </h2>
           <div className="flex justify-center lg:justify-end md:justify-end w-full">
            {(['ceo', 'admin', 'group manager', 'group_manager'].includes(userRole.toLowerCase())) &&
              (Array.isArray(users) && users.length > 0 ? (
             <button onClick={handleOpenCreateModal} 
             className="flex items-center bg-black text-white px-3 py-2 rounded-md hover:bg-gray-800 text-sm">
               <FiPlus /> Create Territory
             </button>
           ) : (
             <div className="text-xs bg-red-50 p-2 rounded-lg ring ring-red-300 text-red-700 flex items-center gap-1">
               <IoIosInformationCircleOutline /> Add users to assign territories
             </div>
           ))
            }           
        </div>
        </div>
        

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mt-6 mb-4 flex flex-col md:flex-row items-center gap-2">
           <div className="flex items-center border border-gray-300 rounded-lg px-4 h-11 w-full md:w-4/4">
             <FiSearch className="text-gray-400 mr-3" />
             <input 
                type="text" placeholder="Search territory" className="focus:outline-none w-full"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
             />
           </div>
           
           {userRole.toLowerCase() !== 'sales' && (
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-1/2">                  
             <select className="border border-gray-300 rounded-lg px-3 h-11 w-full text-sm" value={userFilter} onChange={e => setUserFilter(e.target.value)}>
                <option value="">Filter by Users</option>
                {users.map(u => <option key={u.id} value={String(u.id)}>{u.first_name} {u.last_name}</option>)}
             </select>
           </div>
           )}      
        </div>

        <div className="flex items-center gap-3 mb-6">
           <button onClick={() => setViewMode("board")} className={`px-4 py-2 rounded-full text-sm ${viewMode === "board" ? "bg-gray-800 text-white" : "bg-gray-100"}`}>Board View</button>
           <button onClick={() => setViewMode("list")} className={`px-4 py-2 rounded-full text-sm ${viewMode === "list" ? "bg-gray-800 text-white" : "bg-gray-100"}`}>List View</button>
        </div>

        {viewMode === "board" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {hasResults ? paginatedTerritories.map(t => (
                 <div key={t.id} onClick={() => { 
                  setSelectedTerritory(t);
                  const role = getRoleForNavigation();
                  navigate(`/${role}/territory/${t.id}`); }} 
                      className={`relative flex flex-col cursor-pointer transition p-4 border shadow ${
                        t.status === 'Inactive'
                          ? 'bg-gray-50 border-gray-300'
                          : 'bg-white border-gray-200 hover:shadow-md'
                      }`}>
                    <div className={`absolute top-0 left-0 w-full h-5 rounded-t-md ${
                      t.status === 'Inactive' ? 'bg-gray-400' : 'bg-secondary'
                    }`} />
                    {t.status === 'Inactive' && (
                      <span className="absolute top-2 right-2 bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded">
                        Inactive
                      </span>
                    )}
                    <h3 className="font-medium text-gray-900 mb-2 pt-7">{t.name}</h3>
                    {t.description && <p className="text-xs text-gray-600 mb-2 line-clamp-2">{t.description}</p>}
                    
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                       <FiUser /> {renderAssignedUsers(t.assigned_users_list)}
                    </div>

                    <div className="h-px bg-gray-200 w-full mb-2" />
                    <div className="text-gray-400 text-xs text-right">
                       {t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}
                    </div>
                 </div>
              )) : <div className="col-span-4 text-center py-10 text-gray-500 border border-dashed rounded-xl">No territories found.</div>}
            </div>
        )}

        {viewMode === "list" && (
           <div className="bg-white rounded-md shadow-sm overflow-hidden">
             <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-600 text-left">
                  <tr>
                    {!['sales', 'manager'].includes(userRole.toLowerCase()) && (
                      <th className="py-3 px-4 w-10">
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-blue-600"
                          checked={(() => {
                            const selectableTerritory = paginatedTerritories.filter((t) => canDeleteTerritory(t));
                            if (selectableTerritory.length === 0) return false;
                            
                            // For both GROUP MANAGER and ADMIN/CEO, check if all territory_ids in all groups are selected
                            return selectableTerritory.every((t) =>
                              t.territory_ids && t.territory_ids.every((id) => selectedIds.includes(id))
                            );
                          })()}
                          onChange={handleSelectAll}
                        />
                      </th>
                    )}
                    <th className="py-3 px-4">Territory</th>
                    <th className="py-3 px-4">Assigned To</th>
                    <th className="py-3 px-4">Manager</th>
                    {!['sales', 'manager'].includes(userRole.toLowerCase()) && (
                      <th className="py-3 px-4 text-center w-24">
                        {selectedIds.length > 0 ? (
                          <button
                            onClick={handleBulkDelete}
                            className={`${ 
                              userRole.toLowerCase() === 'group_manager' || userRole.toLowerCase() === 'group manager'
                                ? 'text-orange-600 hover:text-orange-800 hover:bg-orange-50'
                                : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                            } transition p-1 rounded-full`}
                            title={`${
                              userRole.toLowerCase() === 'group_manager' || userRole.toLowerCase() === 'group manager'
                                ? 'Archive'
                                : 'Delete'
                            } ${selectedIds.length} selected territories`}
                          >
                            {userRole.toLowerCase() === 'group_manager' || userRole.toLowerCase() === 'group manager' ? (
                              <FiArchive size={18} />
                            ) : (
                              <FiTrash2 size={18} />
                            )}
                          </button>
                        ) : (
                          ""
                        )}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {hasResults ? paginatedTerritories.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => { 
                      setSelectedTerritory(t);
                      const role = getRoleForNavigation();
                      navigate(`/${role}/territory/${t.id}`); 
                    }}>
                      {!['sales', 'manager'].includes(userRole.toLowerCase()) && (
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          {canDeleteTerritory(t) ? (
                            <input
                              type="checkbox"
                              className="w-4 h-4 accent-blue-600"
                              checked={
                                // For both GROUP MANAGER and ADMIN/CEO, check if ANY territory ID in group is selected
                                t.territory_ids && t.territory_ids.some((id) => selectedIds.includes(id))
                              }
                              onChange={() => handleCheckboxChange(t)}
                            />
                          ) : (
                            <div className="w-4 h-4"></div>
                          )}
                        </td>
                      )}
                      <td className="py-3 px-4 font-medium">
                        <div className="flex items-center gap-2">
                          {t.name}
                          {t.status === 'Inactive' && (
                            <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">{renderAssignedUsers(t.assigned_users_list)}</td>
                      <td className="py-3 px-4">{t.managed_by ? `${t.managed_by.first_name}` : "—"}</td>
                      <td></td>
                    </tr>
                  )) : <tr><td colSpan={5} className="text-center py-4 text-gray-500">No territories found.</td></tr>}
                </tbody>
             </table>
           </div>
        )}

        {selectedTerritory && (
           <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
             <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-8 relative">
               <button className="absolute top-2 right-4 text-gray-500 hover:text-black" onClick={() => { 
                setSelectedTerritory(null); 
                const role = getRoleForNavigation();
                navigate(`/${role}/territory`); }}>
                 <FiX size={24} />
               </button>
               <h2 className="text-3xl font-semibold mb-1">
                {selectedTerritory.name}
                {selectedTerritory.status === 'Inactive' && (
                  <span className="ml-3 inline-block bg-red-100 text-red-700 text-sm font-semibold px-3 py-1 rounded">
                    Inactive
                  </span>
                )}
               </h2>
               <div className="h-px bg-gray-200 w-full mb-4" />

               <p className="text-gray-500 mb-1">Description</p>
               <p className="text-gray-700 text-sm mb-6">{selectedTerritory.description || "—"}</p>
               
               <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
                <div>
                    <p className="text-gray-500">Manager</p>
                    <div className="font-medium">{selectedTerritory.managed_by ? `${selectedTerritory.managed_by.first_name} ${selectedTerritory.managed_by.last_name}` : "Unassigned"}</div>
                 </div>
                 <div>
                    <p className="text-gray-500">Assigned To</p>
                    <div className="flex flex-col gap-1 mt-1 max-h-32 overflow-y-auto">
                        {selectedTerritory.assigned_users_list && selectedTerritory.assigned_users_list.length > 0 ? (
                           selectedTerritory.assigned_users_list.map(u => (
                             <div key={u.id} className="flex items-center gap-2 text-gray-800 font-medium">
                                <FiUser /> {u.first_name} {u.last_name}
                             </div>
                           ))
                        ) : "Unassigned"}
                    </div>
                 </div>                 
               </div>                             
               
               {(
                 (userRole.toLowerCase() === 'ceo' || userRole.toLowerCase() === 'admin') ||
                 ((userRole.toLowerCase() === 'group_manager' || userRole.toLowerCase() === 'group manager') && currentUser && selectedTerritory?.territory_creator?.id === currentUser.id)
               ) && (
                <div className="flex justify-end gap-2">
                 <button onClick={() => handleEditTerritory(selectedTerritory)} className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2"><FiEdit2 /> Edit</button>
                 <button 
                   onClick={() => handleDelete(selectedTerritory)} 
                   className={`${ 
                     userRole.toLowerCase() === 'group_manager' || userRole.toLowerCase() === 'group manager'
                       ? 'bg-orange-500 hover:bg-orange-600'
                       : 'bg-red-500 hover:bg-red-600'
                   } text-white px-4 py-2 rounded flex items-center gap-2`}
                 >
                   {userRole.toLowerCase() === 'group_manager' || userRole.toLowerCase() === 'group manager' ? (
                     <>
                       <FiArchive /> Archive
                     </>
                   ) : (
                     <>
                       <FiTrash2 /> Delete
                     </>
                   )}
                 </button>
               </div>
               )}               
             </div>
           </div>
        )}

        {showFormModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
             <div className="bg-white rounded-2xl shadow-lg w-full max-w-xl p-6 relative">
                <button className="absolute top-4 right-4"  onClick={() => {
                          handleCloseFormModal();
                          setIsSubmitted(false); // reset validation borders
                        }}
                      ><FiX size={22} /> </button>
     <h2 className="text-xl font-semibold text-center mb-6">{isEditing ? "Edit Territory" : "Create Territory"}</h2>
                
               <form className="space-y-4" onSubmit={handleSubmit} noValidate>
  <InputField label="Territory Name" name="name" value={territoryData.name} onChange={handleTerritoryChange} required isSubmitted={isSubmitted}/>
  
  <SelectField label="Territory Manager" name="manager_id" value={territoryData.manager_id} onChange={handleTerritoryChange}
    options={[{value: "", label: "Assign Manager"}, ...users.map(u => ({value: String(u.id), label: `${u.first_name} ${u.last_name}`}))]} 
    required isSubmitted={isSubmitted}
  />

 <SearchableMultiSelect 
  label={
    <>
      Assign Users <span className="text-red-600 font-semibold">*</span>
    </>
  }
    placeholder="Search and select users..."
    options={users.map(u => ({value: String(u.id), label: `${u.first_name} ${u.last_name}`}))}
    selectedValues={territoryData.user_ids}
    onChange={handleAssignedUsersChange}
    required
    isSubmitted={isSubmitted}
  />

  <TextareaField label="Description" name="description" value={territoryData.description} onChange={handleTerritoryChange} />
  
  <div className="flex justify-end gap-2 pt-2">

<button
  type="button"
  onClick={() => {
    handleCloseFormModal(); 
    setIsSubmitted(false);  
  }}
  className="px-4 py-2 bg-red-400 text-white rounded"
>
  Cancel
</button>

    <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-tertiary text-white rounded">{isSubmitting ? "Saving..." : "Save Territory"}</button>
  </div>
</form>
             </div>
          </div>
        )}

        {viewMode === "list" && (
          <PaginationControls 
            className="mt-4" 
            totalItems={filteredTerritories.length} 
            pageSize={itemsPerPage} 
            currentPage={currentPage} 
            onPrev={handlePrevPage} 
            onNext={handleNextPage} 
            onPageSizeChange={(newSize) => {
              setItemsPerPage(newSize);
              setCurrentPage(1);
            }}
            label="territories" 
          />
        )}
        
        {confirmModalData && (
          <ConfirmationModal open title={confirmModalData.title} message={confirmModalData.message} confirmLabel={confirmModalData.confirmLabel} cancelLabel={confirmModalData.cancelLabel} variant={confirmModalData.variant} onConfirm={handleConfirmAction} onCancel={handleCancelConfirm} loading={confirmProcessing} />
        )}
      </div>
    </>
  );
}

function InputField({ label, name, value, onChange, placeholder, type = "text", required = false, disabled = false,
    isSubmitted = false, 
  className = "",
}) {
  const hasError = isSubmitted && required && !value?.trim();

  return (
    <div>
      <label className="block text-gray-700 font-medium mb-1 text-sm">
          {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input type={type} name={name} value={value ?? ""} onChange={onChange} placeholder={placeholder} required={required} disabled={disabled}
className={`w-full rounded-md px-2 py-1.5 text-sm outline-none border focus:ring-2 disabled:bg-gray-100 ${
  hasError
    ? "border-red-500 focus:ring-red-500"
    : "border-gray-300 focus:ring-blue-400"
}
${className}
`}/>     
</div>
  );
}

function SelectField({ label, name, value, onChange, options, disabled = false, required = false, isSubmitted = false }) {
  const hasError = isSubmitted && required && !value;

  return (
    <div>
      <label className="block text-gray-700 font-medium mb-1 text-sm">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select name={name} value={value ?? ""} onChange={onChange} disabled={disabled}
        className={`w-full border rounded-md px-3 py-2 text-sm bg-white focus:ring-2 outline-none disabled:bg-gray-100 ${
          hasError
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:ring-gray-400"
        }`}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}


function TextareaField({ label, name, value, onChange, placeholder, rows = 3, disabled = false }) {
  return (
    <div>
      <label className="block text-gray-700 font-medium mb-1 text-sm">{label}</label>
      <textarea name={name} value={value ?? ""} onChange={onChange} placeholder={placeholder} rows={rows} disabled={disabled}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none disabled:bg-gray-100" />
    </div>
  );
}

function ConfirmationModal({ open, title, message, confirmLabel, cancelLabel = "Cancel", variant = "primary", loading = false, onConfirm, onCancel }) {
  const [isClicked, setIsClicked] = useState(false);
  
  if (!open) {
    setIsClicked(false);  // Reset when modal closes
    return null;
  }
  
  let confirmClasses;
  if (variant === "danger") {
    confirmClasses = "bg-red-500 hover:bg-red-600 border border-red-400";
  } else if (variant === "warning") {
    confirmClasses = "bg-orange-500 hover:bg-orange-600 border border-orange-400";
  } else {
    confirmClasses = "bg-tertiary hover:bg-secondary border border-tertiary";
  }
  
  const handleConfirmClick = () => {
    if (isClicked || loading) return;  // Prevent double-click
    setIsClicked(true);
    onConfirm();
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{message}</p>
        <div className="mt-6 flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-2 sm:space-y-0">
          <button type="button" onClick={onCancel} className="w-full sm:w-auto px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition disabled:opacity-70" disabled={loading || isClicked}>{cancelLabel}</button>
          <button type="button" onClick={handleConfirmClick} className={`w-full sm:w-auto px-4 py-2 rounded-md text-white transition disabled:opacity-70 ${confirmClasses}`} disabled={loading || isClicked}>{loading ? "Processing..." : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}