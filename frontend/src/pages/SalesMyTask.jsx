import React from "react";
import { FiClock, FiPhone, FiEdit2, FiTrash2 } from "react-icons/fi";

export default function SalesMyTasks() {
  const tasks = [
    {
      id: 1,
      title: "Follow up with TechStart Inc",
      priority: "HIGH",
      description: "Discuss cloud migration proposal feedback",
      date: "10/13/2025",
      assignee: "Robert Davis",
      type: "Call",
    },
    {
      id: 2,
      title: "Schedule demo for Apex Co.",
      priority: "MEDIUM",
      description: "Arrange product demo for new CRM module",
      date: "10/14/2025",
      assignee: "Sophia Martinez",
      type: "Call",
    },
  ];

  const priorityColors = {
    HIGH: "bg-orange-100 text-orange-700",
    MEDIUM: "bg-yellow-100 text-yellow-700",
    LOW: "bg-green-100 text-green-700",
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 min-h-[80vh] p-6 rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2 text-blue-700">
          <FiClock className="text-blue-600" /> My Tasks & Follow-ups
        </h2>

        <div className="flex items-center gap-2 bg-white shadow-sm border rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50">
          <span className="text-sm text-gray-700">All Tasks ▾</span>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex flex-col gap-3 hover:shadow-md transition"
          >
            {/* Header Row */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <FiPhone className="text-blue-600 text-xl" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    {task.title}
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityColors[task.priority]}`}
                    >
                      {task.priority}
                    </span>
                  </h3>
                  <p className="text-gray-600 text-sm">{task.description}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 text-lg text-gray-500">
                <button className="hover:text-blue-600">
                  <FiEdit2 />
                </button>
                <button className="hover:text-red-600">
                  <FiTrash2 />
                </button>
              </div>
            </div>

            {/* Footer Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <p className="flex items-center gap-1">📅 {task.date}</p>
              <p className="flex items-center gap-1">👤 {task.assignee}</p>
              <p className="flex items-center gap-1">📞 {task.type}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
