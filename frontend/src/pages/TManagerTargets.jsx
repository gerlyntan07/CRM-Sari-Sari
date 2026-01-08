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
  FiTarget,
  FiDollarSign,
  FiX,
} from "react-icons/fi";
import { HiX } from "react-icons/hi";
import { toast } from "react-toastify";
import PaginationControls from "../components/PaginationControls.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import api from "../api";

/* ======================================================
   CONSTANTS
====================================================== */
const ITEMS_PER_PAGE = 10;

const INITIAL_FORM_STATE = {
  user_id: "",
  start_date: "",
  end_date: "",
  target_amount: "",
};

/* ======================================================
   SEARCHABLE SELECT COMPONENT
====================================================== */
function SearchableSelect({
  name,
  items = [],
  value = "",
  onChange,
  getLabel,
  placeholder = "Search...",
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);

  const selectedItem = items.find((i) => String(i.id) === String(value));
  const selectedLabel = selectedItem ? getLabel(selectedItem) : "";

  const filtered = useMemo(() => {
    const query = q.toLowerCase();
    return query
      ? items.filter((i) => getLabel(i).toLowerCase().includes(query))
      : items;
  }, [items, q, getLabel]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative flex justify-center w-full">
      <input
        value={open ? q : selectedLabel}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        className="w-full max-w-md border text-gray-500 border-gray-300 rounded-lg p-1 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
      />

      {open && (
<div className="absolute top-full left-0 z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.length ? (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChange({ target: { name, value: String(item.id) } });
                  setOpen(false);
                  setQ("");
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
              >
                {getLabel(item)}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ======================================================
   MAIN COMPONENT
====================================================== */
export default function TManagerTargets() {
  useEffect(() => {
    document.title = "Targets | Sari-Sari CRM";
  }, []);

  const [targets, setTargets] = useState([]);
  const [users, setUsers] = useState([]);
  const [targetsLoading, setTargetsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTargetId, setCurrentTargetId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  const [selectedTarget, setSelectedTarget] = useState(null);
  const [confirmModalData, setConfirmModalData] = useState(null);
  const [confirmProcessing, setConfirmProcessing] = useState(false);

  /* ======================================================
     FETCH DATA
  ====================================================== */
  const fetchTargets = useCallback(async () => {
    setTargetsLoading(true);
    try {
      const res = await api.get("/targets/admin/fetch-all");
      setTargets(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load targets.");
    } finally {
      setTargetsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get("/targets/admin/get-users");
      console.log("Users from API:", res.data); // STEP 1: Check structure
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users.");
    }
  }, []);

  useEffect(() => {
    fetchTargets();
    fetchUsers();
  }, [fetchTargets, fetchUsers]);

  /* ======================================================
     METRICS
  ====================================================== */
  const totalTargetAmount = useMemo(
    () => targets.reduce((sum, t) => sum + (Number(t.target_amount) || 0), 0),
    [targets]
  );

  /* ======================================================
     SEARCH + PAGINATION
  ====================================================== */
  const filteredTargets = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return targets.filter((t) => {
      const userName = t.user
        ? `${t.user.first_name} ${t.user.last_name}`.toLowerCase()
        : "";
      return (
        userName.includes(q) ||
        t.start_date?.includes(q) ||
        t.end_date?.includes(q)
      );
    });
  }, [targets, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTargets.length / ITEMS_PER_PAGE)
  );

  const paginatedTargets = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTargets.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTargets, currentPage]);

  /* ======================================================
     HANDLERS
  ====================================================== */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleOpenAddModal = () => {
    setFormData(INITIAL_FORM_STATE);
    setIsEditing(false);
    setCurrentTargetId(null);
    setShowModal(true);
  };

  const handleEditClick = (target) => {
    setFormData({
      user_id: target.user?.id ? String(target.user.id) : "",
      start_date: target.start_date || "",
      end_date: target.end_date || "",
      target_amount: target.target_amount?.toString() || "",
    });
    setIsEditing(true);
    setCurrentTargetId(target.id);
    setShowModal(true);
    setSelectedTarget(null);
  };

  const handleDelete = (target) => {
    const userName = target.user
      ? `${target.user.first_name} ${target.user.last_name}`
      : "Unknown";

    setConfirmModalData({
      title: "Delete Target",
      message: (
        <span>
          Are you sure you want to delete the target for{" "}
          <span className="font-semibold">{userName}</span>?
        </span>
      ),
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      variant: "danger",
      action: async () => {
        await api.delete(`/targets/admin/${target.id}`);
        toast.success("Target deleted successfully.");
        fetchTargets();
        setSelectedTarget(null);
      },
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.user_id ||
      !formData.start_date ||
      !formData.end_date ||
      !formData.target_amount
    ) {
      toast.error("All fields are required.");
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      toast.error("End date must be after start date.");
      return;
    }

    const payload = {
      user_id: Number(formData.user_id),
      target_amount: Number(formData.target_amount),
      start_date: formData.start_date,
      end_date: formData.end_date,
    };

    const actionLabel = isEditing ? "Update Target" : "Create Target";

    setConfirmModalData({
      title: actionLabel,
      message: "Are you sure you want to proceed?",
      confirmLabel: actionLabel,
      cancelLabel: "Cancel",
      variant: "primary",
      action: async () => {
        setIsSubmitting(true);
        try {
          if (isEditing) {
            await api.put(`/targets/admin/${currentTargetId}`, payload);
            toast.success("Target updated successfully.");
          } else {
            await api.post("/targets/admin/create", payload);
            toast.success("Target created successfully.");
          }
          setShowModal(false);
          fetchTargets();
        } catch (err) {
          console.error(err);
          toast.error("Operation failed.");
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  /* ======================================================
     RENDER
  ====================================================== */
  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 font-inter relative">
        {targetsLoading && <LoadingSpinner message="Loading targets..." />}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
          <h1 className="flex items-center text-xl sm:text-2xl font-semibold">
            <FiTarget className="mr-2 text-blue-600" /> Targets
          </h1>
          <div className="flex justify-center lg:justify-end w-full sm:w-auto">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center bg-black text-white px-3 sm:px-4 py-2 my-1 lg:my-0 rounded-md hover:bg-gray-800 text-sm sm:text-base mx-auto sm:ml-auto cursor-pointer"
            >
              <FiPlus className="mr-2" /> Add Target
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <MetricCard title="Total Targets" value={targets.length} />
          <MetricCard
            title="Total Target Amount"
            value={`₱${totalTargetAmount.toLocaleString()}`}
          />
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex flex-col lg:flex-row items-center justify-between gap-3 w-full">
          <div className="flex items-center border border-gray-300 rounded-lg px-4 h-11 w-full lg:w-4/4 focus-within:ring-2 focus-within:ring-indigo-500 transition">
            <FiSearch className="text-gray-400 mr-3" />
            <input
              type="text"
              placeholder="Search targets"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 rounded-lg bg-white shadow-sm text-sm">
            <thead className="bg-gray-100 font-semibold text-gray-600">
              <tr>
                <th className="py-3 px-4 text-left">User</th>
                <th className="py-3 px-4 text-left">Target Amount</th>
                <th className="py-3 px-4 text-left">Start Date</th>
                <th className="py-3 px-4 text-left">End Date</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTargets.map((t) => (
                <tr
                  key={t.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedTarget(t)}
                >
                  <td className="py-3 px-4 text-left">
                    {t.user
                      ? `${t.user.first_name} ${t.user.last_name}`
                      : "Unknown"}
                  </td>
                  <td className="py-3 px-4 text-left">
                    ₱{Number(t.target_amount).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-left">{t.start_date}</td>
                  <td className="py-3 px-4 text-left">{t.end_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <PaginationControls
          className="mt-4"
          totalItems={filteredTargets.length}
          pageSize={ITEMS_PER_PAGE}
          currentPage={currentPage}
          onPrev={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          onNext={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          label="targets"
        />
      </div>

      {/* ================= MODALS ================= */}
      {selectedTarget && (
        <DetailModal
          target={selectedTarget}
          onClose={() => setSelectedTarget(null)}
          onEdit={() => handleEditClick(selectedTarget)}
          onDelete={() => handleDelete(selectedTarget)}
        />
      )}

      {showModal && (
        <FormModal
          formData={formData}
          users={users}
          isEditing={isEditing}
          isSubmitting={isSubmitting}
          onChange={handleInputChange}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}

      {confirmModalData && (
        <ConfirmationModal
          {...confirmModalData}
          loading={confirmProcessing}
          onConfirm={async () => {
            setConfirmProcessing(true);
            await confirmModalData.action();
            setConfirmProcessing(false);
            setConfirmModalData(null);
          }}
          onCancel={() => setConfirmModalData(null)}
        />
      )}
    </>
  );
}

/* ======================================================
   REUSABLE COMPONENTS
====================================================== */
function MetricCard({ title, value }) {
  return (
    <div className="flex items-center p-4 bg-white rounded-xl shadow-md border border-gray-200">
      <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
        <FiDollarSign size={22} />
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function DetailModal({ target, onClose, onEdit, onDelete }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[92vh] overflow-y-auto hide-scrollbar animate-scale-in font-inter relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 🔵 Top Header */}
        <div className="bg-tertiary w-full flex items-center justify-between p-3 lg:p-4 rounded-t-xl">
          <h1 className="lg:text-3xl text-xl text-white font-semibold text-center w-full">
            Target
          </h1>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition cursor-pointer"
          >
            <HiX size={25} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="p-6 lg:p-4">
         <div className="flex flex-col md:flex-row md:justify-between lg:flex-row lg:items-center lg:justify-between mt-3 gap-2 px-2 md:items-center lg:gap-4 md:mx-7 lg:mx-7">
  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
    <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
                {target.user &&
                  `${target.user.first_name} ${target.user.last_name}`}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                className="inline-flex items-center justify-center w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                onClick={onEdit}
              >
                <FiEdit className="mr-2" />
                Edit
              </button>
              <button
                className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 rounded-md text-sm bg-red-500 text-white hover:bg-red-600 transition focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer"
                onClick={onDelete}
              >
                <FiTrash2 className="mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 my-5"></div>

        {/* Overview Content */}
        <div className="p-4 lg:p-6">
          <div className="flex w-full bg-[#6A727D] text-white overflow-x-auto">
            <button className="flex-1 min-w-[90px] px-4 py-2 lg:text-lg text-sm font-medium text-center text-white">
              Overview
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm sm:p-6 lg:p-5 border border-gray-200 text-sm text-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <p className="font-semibold">User:</p>
                <p>
                  {target.user
                    ? `${target.user.first_name} ${target.user.last_name}`
                    : "Unknown"}
                </p>
              </div>
              <div>
                <p className="font-semibold">Target Amount:</p>
                <p>₱{Number(target.target_amount).toLocaleString()}</p>
              </div>
              <div>
                <p className="font-semibold">Start Date:</p>
                <p>{target.start_date}</p>
              </div>
              <div>
                <p className="font-semibold">End Date:</p>
                <p>{target.end_date}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormModal({
  formData,
  users,
  isEditing,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
 <div className="bg-white w-full max-w-md rounded-2xl p-8 relative overflow-y-auto min-h-[50vh]">
          <button onClick={onClose} className="absolute top-5 right-5">
          <FiX size={24} />
        </button>

        <h2 className="text-2xl font-semibold text-center mb-8">
          {isEditing ? "Edit Target" : "Add New Target"}
        </h2>

        <form onSubmit={onSubmit} className="grid gap-5 text-base">
           <div className="flex flex-col gap-1 relative">
            <label className="text-sm font-medium text-gray-700">
              Assign User
            </label>

            <SearchableSelect
              name="user_id"
              items={users.filter((u) => u.role?.toLowerCase() === "manager")}
              value={formData.user_id}
              onChange={onChange}
              getLabel={(u) => `${u.first_name} ${u.last_name}`}
              placeholder="Search manager..."
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 text-left">
              Target Amount
            </label>
            <div className="flex justify-center w-full">
              <input
                type="number"
                name="target_amount"
                placeholder="0.00"
                value={formData.target_amount}
                onChange={onChange}
                required
                className="w-full max-w-md border text-gray-500 border-gray-300 rounded-lg p-1 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 text-left">
              Start Date
            </label>
            <div className="flex justify-center w-full">
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={onChange}
                required
                className="w-full max-w-md border text-gray-500 border-gray-300 text-gray-500 rounded-lg p-1 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 text-left">
              End Date
            </label>
            <div className="flex justify-center w-full">
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={onChange}
                required
                className="w-full max-w-md border text-gray-500 border-gray-300 text-gray-500 rounded-lg p-1 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-red-400 text-white px-5 py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-tertiary text-white px-5 py-2 rounded-lg"
            >
              {isSubmitting ? "Saving..." : "Save Target"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmationModal({
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant,
  loading,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">
          {message}
        </p>

        <div className="mt-6 flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-2 sm:space-y-0">
          <button
            onClick={onCancel}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition disabled:opacity-70"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`w-full sm:w-auto px-4 py-2 rounded-md text-white transition disabled:opacity-70 ${
              variant === "danger"
                ? "bg-red-500 hover:bg-red-600 border border-red-400"
                : "bg-tertiary hover:bg-secondary border border-tertiary"
            }`}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
