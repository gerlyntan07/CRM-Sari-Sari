import React, { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { FiClock, FiPhone, FiEdit2, FiTrash2 } from "react-icons/fi";
import api from "../api.js";

export default function SalesMyTasks() {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [salesList, setSalesList] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "Call",
    priority: "MEDIUM",
    status: "To Do",
    dueDate: "",
    assignedTo: "",
    relatedTo: "",
    notes: "",
  });
  const [isDeleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isUpdateConfirmationOpen, setUpdateConfirmationOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All Tasks");
  const [isStatusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const today = new Date();

  // Check if task is overdue
  const isTaskOverdue = (task) => {
    return (
      task.dueDate &&
      new Date(task.dueDate) < today &&
      task.status !== "Completed"
    );
  };

  // ✅ Fetch tasks
  const fetchTasks = async () => {
    try {
      const res = await api.get("/tasks/assigned");

      // Sort tasks by dueDate descending (most recent first)
      const sortedTasks = res.data.sort((a, b) => {
        const dateA = new Date(a.dueDate || a.dateAssigned);
        const dateB = new Date(b.dueDate || b.dateAssigned);
        return dateB - dateA; // descending
      });

      setTasks(sortedTasks);
      setFilteredTasks(sortedTasks); // initialize filtered list
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  // ✅ Fetch sales representatives
  const fetchSales = async () => {
    try {
      const res = await api.get("/sales"); // Adjust endpoint if needed
      setSalesList(res.data);
    } catch (error) {
      console.error("Error fetching sales list:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchSales();
  }, []);

  // ✅ Filter tasks by status
  const handleFilterStatus = (status) => {
    setFilterStatus(status);
    if (status === "All Tasks") {
      setFilteredTasks(tasks);
    } else {
      const filtered = tasks.filter((task) => task.status === status);
      setFilteredTasks(filtered);
    }
    setStatusDropdownOpen(false);
  };

  // ✅ Edit
  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title || "",
      description: task.description || "",
      type: task.type || "Call",
      priority: task.priority || "MEDIUM",
      status: task.status || "To Do",
      dueDate: task.dueDate || "",
      assignedTo: task.assignedTo || "",
      relatedTo: task.relatedTo || "",
      notes: task.notes || "",
    });
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Open confirmation before updating
  const handleUpdateClick = (e) => {
    e.preventDefault();
    setUpdateConfirmationOpen(true);
  };

  // ✅ Actual update after confirmation
  const handleConfirmUpdate = async () => {
    try {
      await api.put(`/tasks/${editingTask.id}`, formData);
      fetchTasks();
      setEditingTask(null);
      setUpdateConfirmationOpen(false);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  // ✅ Delete
  const handleDelete = async () => {
    try {
      await api.delete(`/tasks/${taskToDelete.id}`);
      fetchTasks();
      setDeleteConfirmationOpen(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // ✅ Priority Colors
  const priorityColors = {
    HIGH: "bg-orange-100 text-orange-700",
    MEDIUM: "bg-yellow-100 text-yellow-700",
    LOW: "bg-green-100 text-green-700",
  };

  const statusOptions = ["All Tasks", "To Do", "In Progress", "Completed"];

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 min-h-[80vh] p-6 rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2 text-blue-700">
          <FiClock className="text-blue-600" /> My Tasks & Follow-ups
        </h2>

        {/* Status Dropdown */}
        <div className="relative w-full max-w-3xs">
          <div
            className="flex items-center w-full gap-2 bg-white shadow-sm border rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50"
            onClick={() => setStatusDropdownOpen(!isStatusDropdownOpen)}
          >
            <span className="text-sm text-gray-700">{filterStatus} ▾</span>
          </div>

          {isStatusDropdownOpen && (
            <div className="absolute mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-md z-10">
              {statusOptions.map((status) => (
                <div
                  key={status}
                  className="px-3 py-2 hover:bg-gray-100 w-full cursor-pointer text-sm text-gray-700"
                  onClick={() => handleFilterStatus(status)}
                >
                  {status}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {Array.isArray(filteredTasks) && filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`rounded-xl shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition
                ${
                  isTaskOverdue(task)
                    ? "bg-red-50 border border-red-200"
                    : "bg-white border border-gray-100"
                }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <FiPhone className="text-blue-600 text-xl" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      {task.title}
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          isTaskOverdue(task)
                            ? "bg-red-100 text-red-700"
                            : priorityColors[task.priority]
                        }`}
                      >
                        {task.priority}
                      </span>
                    </h3>
                    <p className="text-gray-600 text-sm">{task.description}</p>
                  </div>
                </div>

                <div className="flex gap-3 text-lg text-gray-500">
                  <button
                    className="hover:text-blue-600"
                    onClick={() => handleEdit(task)}
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    className="hover:text-red-600"
                    onClick={() => {
                      setTaskToDelete(task);
                      setDeleteConfirmationOpen(true);
                    }}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <p
                  className={`flex items-center gap-1 ${
                    isTaskOverdue(task)
                      ? "text-red-600 font-medium"
                      : "text-gray-500"
                  }`}
                >
                  📅 {task.dueDate?.split("T")[0]}
                </p>
                <p className="text-gray-500 flex items-center gap-1">
                  👤 {task.assignedTo}
                </p>
                <p className="text-gray-500 flex items-center gap-1">
                  📞 {task.type}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm text-center">
            No tasks assigned yet.
          </p>
        )}
      </div>

      {/* ====================== */}
      {/* Edit Task Modal */}
      {/* ====================== */}
      <Transition appear show={!!editingTask} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setEditingTask(null)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-xl rounded-2xl bg-white shadow-2xl ring-1 ring-gray-100 p-6 text-left align-middle transform transition-all max-h-[90vh] flex flex-col">
                  {/* Header */}
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Edit Task
                      </h3>
                    </div>
                    <button
                      onClick={() => setEditingTask(null)}
                      aria-label="Close modal"
                      className="text-gray-400 hover:text-gray-600 transition text-xl leading-none"
                    >
                      &times;
                    </button>
                  </div>

                  {/* Scrollable Form */}
                  <form
                    onSubmit={handleUpdateClick} // open confirmation first
                    className="space-y-5 overflow-y-auto pr-2"
                  >
                    {/* Title */}
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleFormChange}
                        required
                        placeholder="Enter task title"
                        className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleFormChange}
                        placeholder="Enter task description"
                        rows={2}
                        className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Type / Priority */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Type
                        </label>
                        <select
                          name="type"
                          value={formData.type}
                          onChange={handleFormChange}
                          className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option>Call</option>
                          <option>Meeting</option>
                          <option>Email</option>
                          <option>Follow-up</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Priority
                        </label>
                        <select
                          name="priority"
                          value={formData.priority}
                          onChange={handleFormChange}
                          className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option>Low</option>
                          <option>Medium</option>
                          <option>High</option>
                        </select>
                      </div>
                    </div>

                    {/* Status / Due Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Status
                        </label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleFormChange}
                          className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option>To Do</option>
                          <option>In Progress</option>
                          <option>Completed</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Due Date *
                        </label>
                        <input
                          type="datetime-local"
                          name="dueDate"
                          value={formData.dueDate}
                          onChange={handleFormChange}
                          required
                          className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Assign To */}
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Assign To
                      </label>
                      <select
                        name="assignedTo"
                        value={formData.assignedTo}
                        onChange={handleFormChange}
                        className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select sales representative</option>
                        {salesList.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.first_name} {user.last_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Related To */}
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Related To
                      </label>
                      <select
                        name="relatedTo"
                        value={formData.relatedTo}
                        onChange={handleFormChange}
                        className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select type</option>
                        <option>Lead</option>
                        <option>Opportunity</option>
                        <option>Customer</option>
                      </select>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Notes
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleFormChange}
                        placeholder="Additional notes..."
                        rows={2}
                        className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                      <button
                        type="button"
                        onClick={() => setEditingTask(null)}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 transition"
                      >
                        Update Task
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Update Confirmation Modal */}
      <Transition appear show={isUpdateConfirmationOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setUpdateConfirmationOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-sm rounded-2xl bg-white shadow-2xl ring-1 ring-gray-100 p-6 text-center transform transition-all">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Confirm Update
                </h3>
                <p className="text-gray-600 text-sm mb-6">
                  Are you sure you want to update this task?
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setUpdateConfirmationOpen(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmUpdate}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                  >
                    Confirm
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Confirmation Modal */}
      <Transition appear show={isDeleteConfirmationOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setDeleteConfirmationOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-sm rounded-2xl bg-white shadow-2xl ring-1 ring-gray-100 p-6 text-center transform transition-all">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Delete Task
                </h3>
                <p className="text-gray-600 text-sm mb-6">
                  Are you sure you want to delete this task? <br />
                  This action cannot be undone.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setDeleteConfirmationOpen(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
