import React, { useState, useEffect } from "react";
import {
  FiClock,
  FiActivity,
  FiCheckCircle,
  FiAlertCircle,
  FiStar,
  FiSearch,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";
import TaskModal from "../components/TaskModal";
import api from "../api"; // Make sure api.js has axios with baseURL = "http://localhost:8000/api"

export default function AdminTask() {
  const [view, setView] = useState("board");
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterUser, setFilterUser] = useState("All");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "Call",
    priority: "Low",
    status: "To Do",
    dueDate: "",
    assignedTo: "",
    relatedTo: "",
    notes: "",
  });

  // Fetch tasks on load
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get("/tasks/all");
      setTasks(res.data);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTask = async (newTask) => {
    try {
      if (selectedTask) {
        // Update existing
        const res = await api.put(`/tasks/${selectedTask.id}`, newTask);
        setTasks((prev) =>
          prev.map((t) => (t.id === selectedTask.id ? res.data : t))
        );
      } else {
        // Create new
        const res = await api.post("/tasks/createtask", newTask);
        setTasks((prev) => [...prev, res.data]);
      }
      setShowModal(false);
      setSelectedTask(null);
      setFormData({
        title: "",
        description: "",
        type: "Call",
        priority: "Low",
        status: "To Do",
        dueDate: "",
        assignedTo: "",
        relatedTo: "",
        notes: "",
      });
    } catch (error) {
      console.error("Failed to save task:", error);
      alert("Failed to save task. Check console for details.");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const handleOpenModal = (task = null) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  // Apply filters
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      (task.description &&
        task.description.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus =
      filterStatus === "All" || task.status === filterStatus;
    const matchesPriority =
      filterPriority === "All" || task.priority === filterPriority;
    const matchesUser = filterUser === "All" || task.assigned_to === filterUser;
    return matchesSearch && matchesStatus && matchesPriority && matchesUser;
  });

  const summaryCards = [
    {
      label: "To Do",
      count: tasks.filter((t) => t.status === "To Do").length,
      icon: <FiClock />,
      color: "border-blue-500 text-blue-600",
    },
    {
      label: "In Progress",
      count: tasks.filter((t) => t.status === "In Progress").length,
      icon: <FiActivity />,
      color: "border-purple-500 text-purple-600",
    },
    {
      label: "Completed",
      count: tasks.filter((t) => t.status === "Completed").length,
      icon: <FiCheckCircle />,
      color: "border-green-500 text-green-600",
    },
    {
      label: "Overdue",
      count: 0,
      icon: <FiAlertCircle />,
      color: "border-red-500 text-red-600",
    },
    {
      label: "High Priority",
      count: tasks.filter((t) => t.priority === "High").length,
      icon: <FiStar />,
      color: "border-orange-500 text-orange-600",
    },
  ];

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FiActivity className="text-blue-600" /> Task Board
          </h1>
          <p className="text-gray-500 text-sm">
            Manage and assign tasks to your sales team
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 gap-1"
        >
          <FiPlus /> Create Task
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {summaryCards.map((card, index) => (
          <div
            key={index}
            className={`flex items-center justify-between bg-white border ${card.color} rounded-xl p-4 shadow-sm`}
          >
            <div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold text-gray-800">{card.count}</p>
            </div>
            <div className={`text-3xl opacity-80 ${card.color}`}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex items-center w-full lg:w-1/3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <FiSearch className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent outline-none text-sm text-gray-700"
          />
        </div>
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600"
          >
            <option>All</option>
            <option>To Do</option>
            <option>In Progress</option>
            <option>Review</option>
            <option>Completed</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600"
          >
            <option>All</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600"
          >
            <option>All</option>
            {[...new Set(tasks.map((t) => t.assigned_to))].map(
              (user, index) =>
                user && (
                  <option key={index} value={user}>
                    {user}
                  </option>
                )
            )}
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

      {/* Loading */}
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
                      className="border border-gray-100 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition cursor-pointer flex justify-between items-center"
                    >
                      <div onClick={() => handleOpenModal(task)}>
                        <p className="font-medium text-gray-800 text-sm">
                          {task.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Priority: {task.priority}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Assigned To: {task.assigned_to}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Date: {task.date_assigned?.split("T")[0]}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FiTrash2 />
                      </button>
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
                  className="border-b border-gray-100 hover:bg-gray-50"
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
                    {task.assigned_to}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {task.date_assigned?.split("T")[0]}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDeleteTask(task.id)}
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
        }}
        onSave={handleSaveTask}
        task={selectedTask}
        setFormData={setFormData}
        formData={formData}
      />
    </div>
  );
}
