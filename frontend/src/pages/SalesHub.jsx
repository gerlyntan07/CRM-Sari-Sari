import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  FiPlus,
  FiActivity,
  FiTarget,
  FiDollarSign,
} from "react-icons/fi";
import CreateTaskModal from "../components/CreateTaskModal";

export default function SalesHub() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  

  return (
    <div className="p-6 min-h-screen hide-scrollbar">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FiTarget className="text-blue-600" /> Sales Dashboard
          </h1>
          <p className="text-gray-600 text-sm">
            Manage your leads, tasks, and sales activities
          </p>
        </div>

        <div className="flex gap-3">
          {/* ✅ Opens Create Task Modal */}
          <button
            onClick={() => setIsModalOpen(true)}
          className="flex items-center bg-black text-white px-3 sm:px-4 py-2 rounded-md hover:bg-gray-800 text-sm sm:text-base ml-auto sm:ml-0 cursor-pointer"          >
            <FiPlus className="text-lg" /> New Task
          </button>

          <button className="flex items-center bg-black text-white px-3 sm:px-4 py-2 rounded-md hover:bg-gray-800 text-sm sm:text-base ml-auto sm:ml-0 cursor-pointer">
            <FiActivity className="text-lg" /> Log Activity
          </button>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-white rounded-xl shadow-md border-l-4 border-blue-500">
          <p className="text-gray-500 text-sm mb-2">Target Progress</p>
          <h2 className="text-2xl font-bold">0%</h2>
          <div className="mt-2 w-full bg-gray-200 h-2 rounded-full">
            <div className="bg-blue-500 h-2 rounded-full w-0"></div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl shadow-md border-l-4 border-green-500">
          <p className="text-gray-500 text-sm mb-2">Revenue (Won)</p>
          <h2 className="text-2xl font-bold flex items-center gap-1">
            <FiDollarSign /> 0
          </h2>
          <p className="text-sm text-gray-400">0 won deals</p>
        </div>

        <div className="p-4 bg-white rounded-xl shadow-md border-l-4 border-purple-500">
          <p className="text-gray-500 text-sm mb-2">Active Deals</p>
          <h2 className="text-2xl font-bold">2</h2>
          <p className="text-sm text-gray-400">2 leads in pipeline</p>
        </div>

        <div className="p-4 bg-white rounded-xl shadow-md border-l-4 border-orange-500">
          <p className="text-gray-500 text-sm mb-2">Tasks Today</p>
          <h2 className="text-2xl font-bold">0</h2>
          <p className="text-sm text-gray-400">1 pending task</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex space-x-3 mb-6">
        <NavLink
          to="/sales/hub/mytasks"
          className={({ isActive }) =>
            `px-4 py-2 rounded-full text-sm font-medium ${
              isActive
                ? "bg-tertiary text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`
          }
        >
          My Tasks
        </NavLink>

        <NavLink
          to="/sales/hub/activities"
          className={({ isActive }) =>
            `px-4 py-2 rounded-full text-sm font-medium ${
              isActive
                ? "bg-tertiary text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`
          }
        >
          Activities
        </NavLink>

        <NavLink
          to="/sales/hub/pipeline"
          className={({ isActive }) =>
            `px-4 py-2 rounded-full text-sm font-medium ${
              isActive
                ? "bg-tertiary text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`
          }
        >
          My Pipeline
        </NavLink>

        <NavLink
          to="/sales/hub/performance"
          className={({ isActive }) =>
            `px-4 py-2 rounded-full text-sm font-medium ${
              isActive
                ? "bg-tertiary text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`
          }
        >
          Performance
        </NavLink>
      </div>

      {/* Dynamic Section */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <Outlet />
      </div>

      {/* ✅ Create Task Modal */}
      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
