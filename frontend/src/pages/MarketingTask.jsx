import React, { useState, useEffect, Fragment } from "react";
import {
  FiClock,
  FiActivity,
  FiCheckCircle,
  FiAlertCircle,
  FiStar,
  FiEdit2,
  FiSearch,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";
import { Dialog, Transition } from "@headlessui/react";
import TaskModal from "../components/TaskModal";

export default function MarketingTask() {
  useEffect(() => {
    document.title = "Tasks | Sari-Sari CRM";
  }, []);

  const [view, setView] = useState("board");
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Statuses");
  const [filterPriority, setFilterPriority] = useState("All Priorities");

  const METRICS = React.useMemo(() => {
    const today = new Date();
    return [
      {
        icon: FiClock,
        title: "To Do",
        value: tasks.filter((t) => t.status === "To Do").length,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      },
      {
        icon: FiActivity,
        title: "In Progress",
        value: tasks.filter((t) => t.status === "In Progress").length,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      },
      {
        icon: FiCheckCircle,
        title: "Completed",
        value: tasks.filter((t) => t.status === "Completed").length,
        color: "text-green-600",
        bgColor: "bg-green-50",
      },
      {
        icon: FiAlertCircle,
        title: "Overdue",
        value: tasks.filter(
          (t) =>
            t.dueDate && new Date(t.dueDate) < today && t.status !== "Completed"
        ).length,
        color: "text-red-600",
        bgColor: "bg-red-50",
      },
      {
        icon: FiStar,
        title: "High Priority",
        value: tasks.filter((t) => t.priority === "High").length,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
      },
    ];
  }, [tasks]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "Campaign",
    priority: "Low",
    status: "To Do",
    dueDate: "",
    assignedTo: "",
    relatedTo: "",
    notes: "",
  });

  const [users, setUsers] = useState([]);
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isUpdateConfirmOpen, setUpdateConfirmOpen] = useState(false);

  // Load mock data
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const mockUsers = ["Allen", "Joyce", "Jerald", "Christian", "Donna"];
      const mockTasks = [
        {
          id: 1,
          title: "Launch Social Media Campaign",
          description: "Plan and execute Instagram ad campaign",
          type: "Campaign",
          priority: "High",
          status: "In Progress",
          dueDate: "2025-11-05",
          dateAssigned: "2025-10-25",
          assignedTo: "Allen",
          relatedTo: "Social Media",
          notes: "Use carousel ads for better engagement",
        },
        {
          id: 2,
          title: "Prepare Email Newsletter",
          description: "Monthly newsletter content and graphics",
          type: "Email",
          priority: "Medium",
          status: "To Do",
          dueDate: "2025-11-10",
          dateAssigned: "2025-10-29",
          assignedTo: "Joyce",
          relatedTo: "Email Marketing",
          notes: "Coordinate with graphics team",
        },
        {
          id: 3,
          title: "Analyze Conversion Rates",
          description: "Generate performance reports",
          type: "Analytics",
          priority: "Low",
          status: "Completed",
          dueDate: "2025-10-20",
          dateAssigned: "2025-10-15",
          assignedTo: "Jerald",
          relatedTo: "Reporting",
          notes: "Prepare slides for meeting",
        },
      ];
      setUsers(mockUsers);
      setTasks(mockTasks);
      setLoading(false);
    }, 1000);
  }, []);

  // Modal open handler
  const handleOpenModal = (task = null) => {
    setSelectedTask(task);
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        type: task.type,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
        assignedTo: task.assignedTo,
        relatedTo: task.relatedTo,
        notes: task.notes,
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleSaveTask = (newTask) => {
    setFormData(newTask);
    setUpdateConfirmOpen(true);
  };

  const handleConfirmUpdate = () => {
    if (selectedTask) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === selectedTask.id ? { ...selectedTask, ...formData } : t
        )
      );
    } else {
      const newTask = {
        ...formData,
        id: Date.now(),
        dateAssigned: new Date().toISOString(),
      };
      setTasks((prev) => [newTask, ...prev]);
    }
    setShowModal(false);
    setUpdateConfirmOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "Campaign",
      priority: "Low",
      status: "To Do",
      dueDate: "",
      assignedTo: "",
      relatedTo: "",
      notes: "",
    });
  };

  const handleDeleteTask = (task) => {
    setTaskToDelete(task);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteTask = () => {
    setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
    setDeleteConfirmOpen(false);
  };

  // Filtering
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      (task.description &&
        task.description.toLowerCase().includes(search.toLowerCase())) ||
      (task.assignedTo &&
        task.assignedTo.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus =
      filterStatus === "All Statuses" || task.status === filterStatus;
    const matchesPriority =
      filterPriority === "All Priorities" || task.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const today = new Date();

  const MetricCard = ({ icon: Icon, title, value, color, bgColor }) => (
    <div
      className="flex items-center p-4 bg-white rounded-xl shadow-lg transition duration-300 hover:shadow-xl hover:ring-2 hover:ring-blue-500 cursor-pointer"
      onClick={() => console.log(`Clicked metric card: ${title}`)}
    >
      <div className={`p-3 rounded-full ${bgColor} ${color} mr-4`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );

  const isTaskOverdue = (task) =>
    task.dueDate &&
    new Date(task.dueDate) < today &&
    task.status !== "Completed";

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FiActivity className="text-blue-600" /> Tasks and Reminders
          </h1>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 gap-1"
        >
          <FiPlus /> Create Task
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-5 md:grid-cols-3 gap-4 mt-6">
        {METRICS.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm mt-6 mb-4 flex flex-col lg:flex-row items-center justify-between gap-3 w-full">
        <div className="flex items-center border border-gray-300 rounded-lg px-4 h-11 w-full lg:w-3/4 focus-within:ring-2 focus-within:ring-indigo-500 transition">
          <FiSearch size={20} className="text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search by title, description, or assigned user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="focus:outline-none text-base w-full"
          />
        </div>

        <div className="flex gap-3 w-full lg:w-1/2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 h-11 text-sm text-gray-600 bg-white w-full focus:ring-2 focus:ring-indigo-500 transition"
          >
            <option>All Statuses</option>
            <option>To Do</option>
            <option>In Progress</option>
            <option>Review</option>
            <option>Completed</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 h-11 text-sm text-gray-600 bg-white w-full focus:ring-2 focus:ring-indigo-500 transition"
          >
            <option>All Priorities</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setView("board")}
          className={`px-4 py-2 rounded-full text-sm ${
            view === "board"
              ? "bg-gray-800 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Board View
        </button>
        <button
          onClick={() => setView("list")}
          className={`px-4 py-2 rounded-full text-sm ${
            view === "list"
              ? "bg-gray-800 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          List View
        </button>
      </div>

      {loading && <p className="text-gray-500">Loading tasks...</p>}

      {/* Board View */}
      {!loading && view === "board" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {["To Do", "In Progress", "Review", "Completed"].map((col) => (
            <div
              key={col}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">{col}</h3>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500">
                  {filteredTasks.filter((t) => t.status === col).length}
                </span>
              </div>
              <div className="space-y-3">
                {filteredTasks
                  .filter((task) => task.status === col)
                  .map((task) => (
                    <div
                      key={task.id}
                      className={`border border-gray-100 rounded-lg p-3 flex justify-between items-center ${
                        isTaskOverdue(task)
                          ? "bg-red-50 hover:bg-red-100"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div
                        onClick={() => handleOpenModal(task)}
                        className="cursor-pointer"
                      >
                        <p className="font-medium text-gray-800 text-sm">
                          {task.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Priority: {task.priority}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Assigned To: {task.assignedTo}
                        </p>
                        <p className="text-xs mt-1">
                          Date:{" "}
                          <span
                            className={
                              isTaskOverdue(task)
                                ? "text-red-600"
                                : "text-gray-500"
                            }
                          >
                            {task.dateAssigned?.split("T")[0]}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleOpenModal(task)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))}
                {filteredTasks.filter((t) => t.status === col).length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No tasks
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {!loading && view === "list" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="text-left text-gray-600 border-b border-gray-200 text-sm">
                <th className="py-3 px-4 font-medium">Task</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Priority</th>
                <th className="py-3 px-4 font-medium">Assigned To</th>
                <th className="py-3 px-4 font-medium">Date Assigned</th>
                <th className="py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr
                  key={task.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 ${
                    isTaskOverdue(task) ? "bg-red-50 hover:bg-red-100" : ""
                  }`}
                >
                  <td
                    className="py-3 px-4 text-gray-800 text-sm font-medium cursor-pointer"
                    onClick={() => handleOpenModal(task)}
                  >
                    {task.title}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {task.status}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {task.priority}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {task.assignedTo}
                  </td>
                  <td
                    className={`py-3 px-4 text-sm ${
                      isTaskOverdue(task) ? "text-red-600" : "text-gray-600"
                    }`}
                  >
                    {task.dateAssigned?.split("T")[0]}
                  </td>
                  <td className="py-3 px-4 flex items-center gap-3">
                    <button
                      onClick={() => handleOpenModal(task)}
                      className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
                    >
                      <FiEdit2 /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task)}
                      className="text-red-500 hover:text-red-700 flex items-center gap-1"
                    >
                      <FiTrash2 /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedTask(null);
          resetForm();
        }}
        onSave={handleSaveTask}
        task={selectedTask}
        setFormData={setFormData}
        formData={formData}
        users={users}
      />

      {/* Confirm Update */}
      <Transition appear show={isUpdateConfirmOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setUpdateConfirmOpen(false)}
        >
          <div className="fixed inset-0 bg-black/50" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-sm rounded-2xl bg-white shadow-2xl ring-1 ring-gray-100 p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Confirm {selectedTask ? "Update" : "Create"}
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                Are you sure you want to {selectedTask ? "update" : "create"}{" "}
                this task?
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setUpdateConfirmOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmUpdate}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Confirm
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>

      {/* Confirm Delete */}
      <Transition appear show={isDeleteConfirmOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setDeleteConfirmOpen(false)}
        >
          <div className="fixed inset-0 bg-black/50" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-sm rounded-2xl bg-white shadow-2xl ring-1 ring-gray-100 p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Delete Task
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                Are you sure you want to delete this task? This action cannot be
                undone.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteTask}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
