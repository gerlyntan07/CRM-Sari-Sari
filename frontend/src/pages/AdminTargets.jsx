import React, { useCallback, useEffect, useMemo, useState } from "react";
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
   MAIN COMPONENT
====================================================== */
export default function AdminTargets() {
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

        <div className="flex items-center justify-between mb-6">
          <h1 className="flex items-center text-xl sm:text-2xl font-semibold">
            <FiTarget className="mr-2 text-blue-600" /> Targets
          </h1>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center bg-black text-white px-4 py-2 rounded-md"
          >
            <FiPlus className="mr-2" /> Add Target
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <MetricCard title="Total Targets" value={targets.length} />
          <MetricCard
            title="Total Target Amount"
            value={`₱${totalTargetAmount.toLocaleString()}`}
          />
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex items-center">
          <FiSearch className="text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search targets"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 rounded-lg bg-white shadow-sm text-sm">
            <thead className="bg-gray-100 font-semibold text-gray-600">
              <tr>
                <th className="py-3 px-4 text-left">User</th>
                <th className="py-3 px-4">Target Amount</th>
                <th className="py-3 px-4">Start Date</th>
                <th className="py-3 px-4">End Date</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTargets.map((t) => (
                <tr
                  key={t.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedTarget(t)}
                >
                  <td className="py-3 px-4">
                    {t.user
                      ? `${t.user.first_name} ${t.user.last_name}`
                      : "Unknown"}
                  </td>
                  <td className="py-3 px-4">
                    ₱{Number(t.target_amount).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">{t.start_date}</td>
                  <td className="py-3 px-4">{t.end_date}</td>
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
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl">
        <div className="bg-tertiary p-3 rounded-t-xl text-white relative">
          <h1 className="text-xl font-semibold text-center">Target</h1>
          <button
            onClick={onClose}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <HiX size={22} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-2 gap-4 text-sm">
          <p>
            <b>User:</b>
            <br />
            {target.user?.first_name} {target.user?.last_name}
          </p>
          <p>
            <b>Target Amount:</b>
            <br />₱{Number(target.target_amount).toLocaleString()}
          </p>
          <p>
            <b>Start Date:</b>
            <br />
            {target.start_date}
          </p>
          <p>
            <b>End Date:</b>
            <br />
            {target.end_date}
          </p>
        </div>

        <div className="flex justify-end gap-3 p-6">
          <button
            onClick={onEdit}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            <FiEdit className="inline mr-2" /> Edit
          </button>
          <button
            onClick={onDelete}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            <FiTrash2 className="inline mr-2" /> Delete
          </button>
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
      <div className="bg-white w-full max-w-xl rounded-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4">
          <FiX size={22} />
        </button>

        <h2 className="text-xl font-semibold text-center mb-6">
          {isEditing ? "Edit Target" : "Add New Target"}
        </h2>

        <form onSubmit={onSubmit} className="grid gap-4 text-sm">
          <select
            name="user_id"
            value={formData.user_id}
            onChange={onChange}
            required
            className="border rounded p-2"
          >
            <option value="">Select user</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.first_name} {u.last_name}
              </option>
            ))}
          </select>

          <input
            type="number"
            name="target_amount"
            placeholder="Target Amount"
            value={formData.target_amount}
            onChange={onChange}
            required
            className="border rounded p-2"
          />

          <input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={onChange}
            required
            className="border rounded p-2"
          />

          <input
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={onChange}
            required
            className="border rounded p-2"
          />

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-red-400 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-tertiary text-white px-4 py-2 rounded"
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
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm mt-2">{message}</p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border rounded"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-white rounded ${
              variant === "danger" ? "bg-red-500" : "bg-tertiary"
            }`}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
