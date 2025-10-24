import React, { useState } from "react";
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

export default function AdminTask() {
  const [view, setView] = useState("board");
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Prepare monthly report",
      status: "To Do",
      priority: "High",
      assignedTo: "John",
      dateAssigned: "2025-10-21",
    },
    {
      id: 2,
      title: "Follow up with client",
      status: "In Progress",
      priority: "Medium",
      assignedTo: "Sarah",
      dateAssigned: "2025-10-20",
    },
    {
      id: 3,
      title: "Review sales data",
      status: "Review",
      priority: "Low",
      assignedTo: "John",
      dateAssigned: "2025-10-19",
    },
  ]);

  const summaryCards = [
    { label: "To Do", count: tasks.filter(t => t.status === "To Do").length, icon: <FiClock />, color: "border-blue-500 text-blue-600" },
    { label: "In Progress", count: tasks.filter(t => t.status === "In Progress").length, icon: <FiActivity />, color: "border-purple-500 text-purple-600" },
    { label: "Completed", count: tasks.filter(t => t.status === "Completed").length, icon: <FiCheckCircle />, color: "border-green-500 text-green-600" },
    { label: "Overdue", count: 0, icon: <FiAlertCircle />, color: "border-red-500 text-red-600" },
    { label: "High Priority", count: tasks.filter(t => t.priority === "High").length, icon: <FiStar />, color: "border-orange-500 text-orange-600" },
  ];

  const handleSaveTask = (newTask) => {
    if (selectedTask) {
      setTasks(prev =>
        prev.map(t => (t.id === selectedTask.id ? { ...t, ...newTask } : t))
      );
    } else {
      setTasks(prev => [
        ...prev,
        { id: prev.length + 1, ...newTask }
      ]);
    }
    setSelectedTask(null);
    setShowModal(false);
  };

  const handleDeleteTask = (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleOpenModal = (task = null) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
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
          className="flex items-center bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 gap-1 w-full sm:w-auto justify-center"
        >
          <FiPlus /> Create Task
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {summaryCards.map((card, index) => (
          <div
            key={index}
            className={`flex items-center justify-between bg-white border ${card.color} rounded-xl p-4 sm:p-5 shadow-sm`}
          >
            <div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold text-gray-800">{card.count}</p>
            </div>
            <div className={`text-3xl opacity-80 ${card.color}`}>{card.icon}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between w-full">
        <div className="flex items-center w-full md:w-1/3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <FiSearch className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search by title or description..."
            className="w-full bg-transparent outline-none text-sm text-gray-700"
          />
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 w-full md:w-auto">
            <option>All Status</option>
            <option>To Do</option>
            <option>In Progress</option>
            <option>Completed</option>
          </select>
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 w-full md:w-auto">
            <option>All Users</option>
            <option>John</option>
            <option>Sarah</option>
          </select>
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 w-full md:w-auto">
            <option>All Priorities</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
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

      {/* Board View */}
      {view === "board" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {["To Do", "In Progress", "Review", "Completed"].map((col) => (
            <div
              key={col}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">{col}</h3>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500">
                  {tasks.filter((t) => t.status === col).length}
                </span>
              </div>
              <div className="space-y-3">
                {tasks
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
                          Assigned To: {task.assignedTo}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Date: {task.dateAssigned}
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
                {tasks.filter((t) => t.status === col).length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No tasks
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
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
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td
                    className="py-3 px-4 text-gray-800 text-sm font-medium"
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
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {task.dateAssigned}
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
      />
    </div>
  );
}
